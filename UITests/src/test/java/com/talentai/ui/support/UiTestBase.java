package com.talentai.ui.support;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

import java.time.Duration;

/**
 * Base for the Selenium UI tests.
 *
 * <p>Drives Chrome (headless by default) against the running React app. The
 * browser is created once per test class and each test starts from a clean,
 * logged-out state (cookies + web storage cleared) so tests don't leak auth
 * into one another.
 *
 * <p>Config via system properties:
 * <ul>
 *   <li>{@code -Dbase.url}  (default {@code http://localhost:4200}) — the frontend</li>
 *   <li>{@code -Dapi.url}   (default {@code http://localhost:8080/api/v1}) — backend, for seeding</li>
 *   <li>{@code -Dheadless}  (default {@code true}) — set {@code false} to watch the run</li>
 * </ul>
 *
 * <p><b>Prerequisites:</b> frontend (4200), backend (8080) and MySQL (3306) must be running,
 * and Chrome must be installed. Selenium Manager downloads the matching chromedriver.
 */
public abstract class UiTestBase {

    protected static final String BASE_URL = System.getProperty("base.url", "http://localhost:4200");
    protected static final String API_URL = System.getProperty("api.url", "http://localhost:8080/api/v1");
    private static final boolean HEADLESS = Boolean.parseBoolean(System.getProperty("headless", "true"));

    protected static ChromeDriver driver;

    @BeforeAll
    static void startBrowser() {
        ChromeOptions options = new ChromeOptions();
        if (HEADLESS) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                "--window-size=1400,1000", "--remote-allow-origins=*");
        driver = new ChromeDriver(options);
        driver.manage().timeouts().implicitlyWait(Duration.ofMillis(500));
    }

    @AfterAll
    static void stopBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    /** Log out and clear all client state before each test. */
    @BeforeEach
    void resetState() {
        driver.get(BASE_URL + "/login");
        try {
            ((JavascriptExecutor) driver).executeScript(
                    "window.localStorage.clear(); window.sessionStorage.clear();");
        } catch (RuntimeException ignored) {
            // storage may be inaccessible on some pages — safe to ignore
        }
        driver.manage().deleteAllCookies();
    }

    protected void openLogin() {
        driver.get(BASE_URL + "/login");
    }

    protected void openRegister() {
        driver.get(BASE_URL + "/register");
    }
}
