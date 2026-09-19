package com.talentai.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("LoginRateLimitFilter")
class LoginRateLimitFilterTest {

    // findAndRegisterModules() picks up jackson-datatype-jsr310 (for ErrorResponse's Instant),
    // matching the Spring-managed ObjectMapper the filter gets at runtime.
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private MockHttpServletRequest login(String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        req.setRequestURI("/api/v1/auth/login");
        req.setRemoteAddr(ip);
        return req;
    }

    private boolean passedThrough(LoginRateLimitFilter filter, MockHttpServletRequest req) throws Exception {
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(req, new MockHttpServletResponse(), chain);
        return chain.getRequest() != null; // set only if the chain was actually invoked
    }

    @Test
    @DisplayName("shouldAllowUpToLimitThenReturn429")
    void shouldAllowUpToLimitThenReturn429() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(objectMapper, true, 3, 60);

        for (int i = 1; i <= 3; i++) {
            assertThat(passedThrough(filter, login("1.2.3.4"))).as("attempt %d", i).isTrue();
        }

        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(login("1.2.3.4"), res, chain);

        assertThat(chain.getRequest()).isNull();          // blocked — chain not invoked
        assertThat(res.getStatus()).isEqualTo(429);
        assertThat(res.getContentAsString()).contains("RATE_LIMITED");
    }

    @Test
    @DisplayName("shouldTrackEachIpIndependently")
    void shouldTrackEachIpIndependently() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(objectMapper, true, 2, 60);
        assertThat(passedThrough(filter, login("10.0.0.1"))).isTrue();
        assertThat(passedThrough(filter, login("10.0.0.1"))).isTrue();
        assertThat(passedThrough(filter, login("10.0.0.1"))).isFalse();  // 3rd from same IP blocked
        assertThat(passedThrough(filter, login("10.0.0.2"))).isTrue();   // different IP unaffected
    }

    @Test
    @DisplayName("shouldNotLimitNonLoginRequests")
    void shouldNotLimitNonLoginRequests() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(objectMapper, true, 2, 60);
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/candidates/search");
            req.setRequestURI("/api/v1/candidates/search");
            req.setRemoteAddr("1.2.3.4");
            assertThat(passedThrough(filter, req)).isTrue();
        }
    }

    @Test
    @DisplayName("shouldNeverLimitWhenDisabled")
    void shouldNeverLimitWhenDisabled() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(objectMapper, false, 1, 60);
        for (int i = 0; i < 5; i++) {
            assertThat(passedThrough(filter, login("1.2.3.4"))).isTrue();
        }
    }
}
