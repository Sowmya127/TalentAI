package com.talentai.candidate.integration.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentai.auth.dto.RegisterRequest;
import com.talentai.auth.service.AuthService;
import com.talentai.candidate.dto.CandidateDtos.CreateCandidateRequest;
import com.talentai.candidate.repository.CandidateRepository;
import com.talentai.candidate.service.CandidateService;
import com.talentai.common.enums.RoleName;
import com.talentai.user.entity.Role;
import com.talentai.user.entity.User;
import com.talentai.user.entity.UserRole;
import com.talentai.user.repository.RoleRepository;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.UUID;

/**
 * Base for every Candidate-module integration test.
 *
 * <p>Boots the FULL Spring context ({@link SpringBootTest}) against a real MySQL
 * instance managed by Testcontainers — no H2. Flyway runs V1..V29 to create the
 * schema and Hibernate {@code ddl-auto: validate} checks the entities against it,
 * so the whole stack (controller → Spring Security/JWT → service → repository →
 * MySQL) is exercised exactly as in production.
 *
 * <p>The container is a JVM-wide singleton (started once, reused by every
 * subclass) for speed; Ryuk tears it down at JVM exit. Datasource, JWT secret
 * and the resume upload path are injected via {@link DynamicPropertySource}.
 *
 * <p><b>Requires Docker</b> to be running on the machine executing the tests.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
// Each test runs in a transaction that is rolled back at the end, so the suite
// leaves NO rows behind — safe to run against a shared/local database (e.g. the
// dev `talentai` schema) as well as a throwaway Testcontainer.
@Transactional
public abstract class IntegrationTestBase {

    /** >= 32 bytes so Keys.hmacShaKeyFor accepts it; shared with {@link JwtTestFactory}. */
    protected static final String JWT_SECRET = "talentai-integration-test-secret-key-0123456789-abcdefghij";
    protected static final long JWT_EXPIRATION_MS = 3_600_000L;

    /**
     * "No-Docker" escape hatch: pass {@code -Dit.jdbc.url=...} (plus
     * {@code -Dit.jdbc.username} / {@code -Dit.jdbc.password}) to run every IT
     * against an already-running local MySQL instead of a Testcontainer. When the
     * property is absent (the default), a MySQL 8.0 Testcontainer is used.
     */
    private static String cfg(String sysProp, String envVar) {
        String v = System.getProperty(sysProp);
        if (v == null || v.isBlank()) {
            v = System.getenv(envVar);
        }
        return v;
    }

    private static final String LOCAL_JDBC_URL = cfg("it.jdbc.url", "IT_JDBC_URL");
    private static final String LOCAL_JDBC_USERNAME = cfg("it.jdbc.username", "IT_JDBC_USERNAME");
    private static final String LOCAL_JDBC_PASSWORD = cfg("it.jdbc.password", "IT_JDBC_PASSWORD");
    private static final boolean USE_LOCAL_DB = LOCAL_JDBC_URL != null && !LOCAL_JDBC_URL.isBlank();

    @SuppressWarnings("resource")
    protected static final MySQLContainer<?> MYSQL = USE_LOCAL_DB ? null
            : new MySQLContainer<>(DockerImageName.parse("mysql:8.0"))
                    .withDatabaseName("talentai_test")
                    .withUsername("talentai")
                    .withPassword("talentai")
                    // Flyway V28 creates triggers; a non-SUPER user needs this when binlog is on.
                    .withCommand("--log-bin-trust-function-creators=1");

    static {
        if (MYSQL != null) {
            MYSQL.start();
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        if (USE_LOCAL_DB) {
            registry.add("spring.datasource.url", () -> LOCAL_JDBC_URL);
            registry.add("spring.datasource.username", () -> LOCAL_JDBC_USERNAME != null ? LOCAL_JDBC_USERNAME : "root");
            registry.add("spring.datasource.password", () -> LOCAL_JDBC_PASSWORD != null ? LOCAL_JDBC_PASSWORD : "");
            registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        } else {
            registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
            registry.add("spring.datasource.username", MYSQL::getUsername);
            registry.add("spring.datasource.password", MYSQL::getPassword);
            registry.add("spring.datasource.driver-class-name", MYSQL::getDriverClassName);
        }
        registry.add("jwt.secret", () -> JWT_SECRET);
        registry.add("jwt.expiration-ms", () -> JWT_EXPIRATION_MS);
        registry.add("file.upload-path", () -> System.getProperty("java.io.tmpdir") + "/talentai-it-uploads");
    }

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
    @Autowired protected AuthService authService;
    @Autowired protected CandidateService candidateService;
    @Autowired protected CandidateRepository candidateRepository;
    @Autowired protected UserRepository userRepository;
    @Autowired protected RoleRepository roleRepository;
    @Autowired protected UserRoleRepository userRoleRepository;

    // ---------------------------------------------------------------------
    // Identity / data helpers (reusable across all IT classes)
    // ---------------------------------------------------------------------

    /** A registered user plus (optionally) their candidate profile. */
    public record Seeded(long userId, long candidateId) {
    }

    protected String uniqueEmail() {
        return "it_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + "@test.local";
    }

    /** Registers a fresh Candidate-role user via the real auth flow; returns the user id. */
    protected long registerUser() {
        RegisterRequest req = new RegisterRequest();
        req.setFirstName("Test");
        req.setLastName("Candidate");
        req.setEmail(uniqueEmail());
        req.setPassword("Password@123");
        req.setPhoneNumber("+91-9000000000");
        return authService.register(req).userId();
    }

    /** Registers a user and creates their candidate profile; returns both ids. */
    protected Seeded seedCandidate() {
        long userId = registerUser();
        long candidateId = candidateService
                .createProfile(new CreateCandidateRequest(userId, "+91-9000000000", "Bengaluru"), userId)
                .candidateId();
        return new Seeded(userId, candidateId);
    }

    /** Grants an additional role to a user so role-specific identities (Recruiter, HR Admin, …) can be tested. */
    protected void grantRole(long userId, RoleName roleName) {
        User user = userRepository.findById(userId).orElseThrow();
        Role role = roleRepository.findByRoleName(roleName.getDbValue()).orElseThrow();
        if (!userRoleRepository.existsByUser_UserIdAndRole_RoleId(userId, role.getRoleId())) {
            userRoleRepository.save(UserRole.builder().user(user).role(role).createdBy(userId).build());
        }
    }

    // ---------------------------------------------------------------------
    // JWT helpers — mint tokens signed with the same secret the app verifies.
    // ---------------------------------------------------------------------

    protected String bearer(long userId) {
        return "Bearer " + JwtTestFactory.validToken(userId, JWT_SECRET, JWT_EXPIRATION_MS);
    }

    protected String expiredBearer(long userId) {
        return "Bearer " + JwtTestFactory.expiredToken(userId, JWT_SECRET);
    }
}
