package com.talentai.ui;

import com.talentai.ui.pages.RegisterPage;
import com.talentai.ui.support.ApiSeeder;
import com.talentai.ui.support.UiTestBase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/** Selenium UI tests for candidate registration (/register) — positive + negative. */
@DisplayName("RegisterUiTest")
class RegisterUiTest extends UiTestBase {

    private static final AtomicInteger SEQ = new AtomicInteger();

    private static String uniqueEmail() {
        return "ui_reg_" + System.nanoTime() + "_" + SEQ.incrementAndGet() + "@test.local";
    }

    @Test
    @DisplayName("UI-REG-01 shouldRegister_WhenValidDetails")
    void shouldRegister_WhenValidDetails() {
        RegisterPage page = new RegisterPage(driver);
        openRegister();

        page.fill("Ada", "Lovelace", uniqueEmail(), "+91-9000000000", "Password@123", "Password@123").submit();

        // Success routes to /login for sign-in.
        assertThat(page.waitUrlContains("/login")).as("redirect to /login after register").isTrue();
    }

    @Test
    @DisplayName("UI-REG-02 shouldShowRequiredErrors_WhenFormEmpty")
    void shouldShowRequiredErrors_WhenFormEmpty() {
        RegisterPage page = new RegisterPage(driver);
        openRegister();

        page.submit();

        assertThat(page.fieldError("firstName")).isEqualTo("First name is required");
        assertThat(page.fieldError("lastName")).isEqualTo("Last name is required");
        assertThat(page.fieldError("email")).isEqualTo("Email is required");
        assertThat(page.fieldError("password")).isEqualTo("Password must be at least 8 characters");
        assertThat(page.fieldError("confirmPassword")).isEqualTo("Please confirm your password");
        assertThat(page.currentUrl()).contains("/register");
    }

    @Test
    @DisplayName("UI-REG-03 shouldRejectInvalidEmailFormat")
    void shouldRejectInvalidEmailFormat() {
        RegisterPage page = new RegisterPage(driver);
        openRegister();

        page.fill("Ada", "Lovelace", "not-an-email", "", "Password@123", "Password@123").submit();

        assertThat(page.fieldError("email")).isEqualTo("Enter a valid email address");
        assertThat(page.currentUrl()).contains("/register");
    }

    @Test
    @DisplayName("UI-REG-04 shouldRejectShortPassword")
    void shouldRejectShortPassword() {
        RegisterPage page = new RegisterPage(driver);
        openRegister();

        page.fill("Ada", "Lovelace", uniqueEmail(), "", "short", "short").submit();

        assertThat(page.fieldError("password")).isEqualTo("Password must be at least 8 characters");
        assertThat(page.currentUrl()).contains("/register");
    }

    @Test
    @DisplayName("UI-REG-05 shouldRejectMismatchedPasswords")
    void shouldRejectMismatchedPasswords() {
        RegisterPage page = new RegisterPage(driver);
        openRegister();

        page.fill("Ada", "Lovelace", uniqueEmail(), "", "Password@123", "Different@123").submit();

        assertThat(page.fieldError("confirmPassword")).isEqualTo("Passwords do not match");
        assertThat(page.currentUrl()).contains("/register");
    }

    @Test
    @DisplayName("UI-REG-06 shouldRejectDuplicateEmail")
    void shouldRejectDuplicateEmail() {
        String email = uniqueEmail();
        // Pre-create the account through the API so the UI attempt is a true duplicate.
        ApiSeeder.registerCandidate(API_URL, "Existing", "User", email, "Password@123");

        RegisterPage page = new RegisterPage(driver);
        openRegister();
        page.fill("Ada", "Lovelace", email, "", "Password@123", "Password@123").submit();

        assertThat(page.toastContains("A user with this email already exists.")).isTrue();
        assertThat(page.currentUrl()).contains("/register");
    }
}
