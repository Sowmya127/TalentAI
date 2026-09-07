package com.talentai.ui.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/** Shared Page Object helpers: typing, clicking, MUI field errors, notistack toasts, URL waits. */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(12));
    }

    protected void type(By locator, String value) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(locator));
        el.clear();
        if (value != null && !value.isEmpty()) {
            el.sendKeys(value);
        }
    }

    protected void click(By locator) {
        wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
    }

    /** The MUI validation helper text shown under the field with the given name, or "" if none appears. */
    public String fieldError(String fieldName) {
        By locator = By.xpath("//input[@name='" + fieldName + "']"
                + "/ancestor::div[contains(@class,'MuiFormControl-root')][1]"
                + "//p[contains(@class,'Mui-error')]");
        try {
            return wait.until(ExpectedConditions.visibilityOfElementLocated(locator)).getText().trim();
        } catch (TimeoutException | NoSuchElementException e) {
            return "";
        }
    }

    /** Waits for a toast/snackbar (or any element) whose text contains the given message. */
    public boolean toastContains(String message) {
        By locator = By.xpath("//*[contains(normalize-space(text()),\"" + message + "\")]");
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
            return true;
        } catch (TimeoutException e) {
            return false;
        }
    }

    public boolean waitUrlContains(String fragment) {
        try {
            return wait.until(ExpectedConditions.urlContains(fragment));
        } catch (TimeoutException e) {
            return false;
        }
    }

    public String currentUrl() {
        return driver.getCurrentUrl();
    }
}
