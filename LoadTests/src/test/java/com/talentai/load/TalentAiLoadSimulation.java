package com.talentai.load;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.PopulationBuilder;
import io.gatling.javaapi.core.ScenarioBuilder;
import io.gatling.javaapi.core.Simulation;
import io.gatling.javaapi.http.HttpProtocolBuilder;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

/**
 * Load/performance test for the TalentAI backend APIs.
 *
 * <p>Targets the highest-traffic, most performance-sensitive flows:
 * <ul>
 *   <li><b>Public job browsing</b> — {@code GET /public/jobs} (unauthenticated landing-page traffic)</li>
 *   <li><b>Authenticated reads</b> — {@code POST /auth/login} then {@code GET /jobs} + {@code GET /dashboard/summary}</li>
 *   <li><b>Registration</b> — {@code POST /auth/register} (write path; note: inserts users)</li>
 * </ul>
 *
 * <p>Configurable via system properties (all optional):
 * <pre>
 *   -DbaseUrl=http://localhost:8080   backend origin (context-path /api added here)
 *   -Dprofile=smoke|load|stress|spike|soak   load shape (default: smoke)
 *   -Dusers=20        base user count the profiles scale from
 *   -Dramp=15         ramp-up seconds
 *   -Dduration=30     steady-state seconds
 *   -DloginEmail / -DloginPassword   credentials for the authenticated scenario
 * </pre>
 *
 * <p>Run: {@code mvn gatling:test -Dprofile=load -Dusers=50}. An HTML report is written to
 * {@code target/gatling/<simulation>-<timestamp>/index.html}. Requires the backend + MySQL up.
 * SLA assertions (p95 &lt; 2s, error rate &lt; 1%) make the run pass/fail.
 */
public class TalentAiLoadSimulation extends Simulation {

    private static final String BASE_URL = System.getProperty("baseUrl", "http://localhost:8080");
    private static final String PROFILE = System.getProperty("profile", "smoke");
    private static final int USERS = Integer.getInteger("users", 20);
    private static final int RAMP = Integer.getInteger("ramp", 15);
    private static final int DURATION = Integer.getInteger("duration", 30);
    private static final String LOGIN_EMAIL = System.getProperty("loginEmail", "admin@talentai.local");
    private static final String LOGIN_PASSWORD = System.getProperty("loginPassword", "Password@123");

    private final HttpProtocolBuilder httpProtocol = http
            .baseUrl(BASE_URL)
            .acceptHeader("application/json")
            .contentTypeHeader("application/json")
            .userAgentHeader("Gatling/TalentAI-LoadTest");

    // --- Scenarios -------------------------------------------------------

    private final ScenarioBuilder publicBrowse = scenario("Public job browsing")
            .exec(http("GET /public/jobs")
                    .get("/api/v1/public/jobs?page=1&size=10")
                    .check(status().is(200)))
            .pause(Duration.ofMillis(500), Duration.ofSeconds(2))
            .exec(http("GET /public/jobs (page 2)")
                    .get("/api/v1/public/jobs?page=2&size=10")
                    .check(status().is(200)));

    private final ScenarioBuilder authReads = scenario("Authenticated reads")
            .exec(http("POST /auth/login")
                    .post("/api/v1/auth/login")
                    .body(StringBody("{\"email\":\"" + LOGIN_EMAIL + "\",\"password\":\"" + LOGIN_PASSWORD + "\"}"))
                    .check(status().is(200))
                    .check(jsonPath("$.token").saveAs("token")))
            .pause(Duration.ofMillis(300))
            .exec(http("GET /jobs (published)")
                    .get("/api/v1/jobs?status=Published&page=1&size=10")
                    .header("Authorization", "Bearer #{token}")
                    .check(status().is(200)))
            .pause(Duration.ofMillis(300))
            .exec(http("GET /dashboard (summary)")
                    .get("/api/v1/dashboard")
                    .header("Authorization", "Bearer #{token}")
                    .check(status().is(200)));

    private final ScenarioBuilder registration = scenario("Candidate registration")
            .exec(session -> session.set("email", "load_" + UUID.randomUUID() + "@test.local"))
            .exec(http("POST /auth/register")
                    .post("/api/v1/auth/register")
                    .body(StringBody("{\"firstName\":\"Load\",\"lastName\":\"Test\",\"email\":\"#{email}\",\"password\":\"Password@123\"}"))
                    // 201 created, or 409 if a rerun collides — both are non-error for the endpoint.
                    .check(status().in(201, 409)));

    // --- Load profiles ---------------------------------------------------

    private List<PopulationBuilder> populations() {
        double perSec = Math.max(1.0, USERS / 10.0);
        switch (PROFILE) {
            case "load":
                return List.of(
                        publicBrowse.injectOpen(
                                rampUsers(USERS).during(Duration.ofSeconds(RAMP)),
                                constantUsersPerSec(perSec).during(Duration.ofSeconds(DURATION))),
                        authReads.injectOpen(
                                rampUsers(Math.max(1, USERS / 2)).during(Duration.ofSeconds(RAMP)),
                                constantUsersPerSec(Math.max(1.0, perSec / 2)).during(Duration.ofSeconds(DURATION))),
                        registration.injectOpen(
                                rampUsers(Math.min(USERS, 15)).during(Duration.ofSeconds(RAMP))));
            case "stress":
                return List.of(
                        publicBrowse.injectOpen(rampUsers(USERS * 3).during(Duration.ofSeconds(RAMP))),
                        authReads.injectOpen(rampUsers(USERS).during(Duration.ofSeconds(RAMP))));
            case "spike":
                return List.of(
                        publicBrowse.injectOpen(nothingFor(Duration.ofSeconds(5)), atOnceUsers(USERS * 2)),
                        authReads.injectOpen(nothingFor(Duration.ofSeconds(5)), atOnceUsers(USERS)));
            case "soak":
                return List.of(
                        publicBrowse.injectOpen(constantUsersPerSec(perSec).during(Duration.ofSeconds(DURATION * 3L))),
                        authReads.injectOpen(constantUsersPerSec(Math.max(1.0, perSec / 2)).during(Duration.ofSeconds(DURATION * 3L))));
            case "smoke":
            default:
                return List.of(
                        publicBrowse.injectOpen(atOnceUsers(3)),
                        authReads.injectOpen(atOnceUsers(2)),
                        registration.injectOpen(atOnceUsers(1)));
        }
    }

    {
        setUp(populations())
                .protocols(httpProtocol)
                .assertions(
                        global().responseTime().percentile(95.0).lt(2000),
                        global().failedRequests().percent().lt(1.0));
    }
}
