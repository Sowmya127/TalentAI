package com.talentai.ui;

import com.talentai.ui.pages.LoginPage;
import com.talentai.ui.support.ApiSeeder;
import com.talentai.ui.support.UiTestBase;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Selenium UI tests for candidate login (/login) — positive + negative. */
@DisplayName("LoginUiTest")
class LoginUiTest extends UiTestBase {

    private static final String PASSWORD = "Password@123";
    private static String candidateEmail;

    @BeforeAll
    static void seedCandidate() {
        // Known candidate to authenticate with, created straight through the backend API.
        candidateEmail = "ui_login_" + System.nanoTime() + "@test.local";
        int status = ApiSeeder.registerCandidate(API_URL, "Log", "In", candidateEmail, PASSWORD);
        assertThat(status).as("seed candidate via API (201 created or 409 exists)").isIn(200, 201, 409);
    }

    @Test
    @DisplayName("UI-LOG-01 shouldLogin_WhenValidCredentials")
    void shouldLogin_WhenValidCredentials() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.login(candidateEmail, PASSWORD);

        assertThat(page.waitUrlContains("/candidate")).as("lands on candidate area").isTrue();
    }

    @Test
    @DisplayName("UI-LOG-02 shouldShowRequiredErrors_WhenFormEmpty")
    void shouldShowRequiredErrors_WhenFormEmpty() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.submit();

        assertThat(page.fieldError("email")).isEqualTo("Email is required");
        assertThat(page.fieldError("password")).isEqualTo("Password is required");
        assertThat(page.currentUrl()).contains("/login");
    }

    @Test
    @DisplayName("UI-LOG-03 shouldRejectInvalidEmailFormat")
    void shouldRejectInvalidEmailFormat() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.login("not-an-email", "whatever");

        assertThat(page.fieldError("email")).isEqualTo("Enter a valid email address");
        assertThat(page.currentUrl()).contains("/login");
    }

    @Test
    @DisplayName("UI-LOG-04 shouldRejectWrongPassword")
    void shouldRejectWrongPassword() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.login(candidateEmail, "WrongPassword999");

        assertThat(page.toastContains("Invalid email or password.")).isTrue();
        assertThat(page.currentUrl()).contains("/login");
    }

    @Test
    @DisplayName("UI-LOG-05 shouldRejectUnregisteredEmail")
    void shouldRejectUnregisteredEmail() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.login("nobody_" + System.nanoTime() + "@test.local", PASSWORD);

        assertThat(page.toastContains("Invalid email or password.")).isTrue();
        assertThat(page.currentUrl()).contains("/login");
    }

    @Test
    @DisplayName("UI-LOG-06 shouldNavigateToRegister")
    void shouldNavigateToRegister() {
        LoginPage page = new LoginPage(driver);
        openLogin();

        page.clickRegisterLink();

        assertThat(page.waitUrlContains("/register")).isTrue();
    }
}
