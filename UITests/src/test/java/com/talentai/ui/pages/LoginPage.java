package com.talentai.ui.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page Object for the Login screen (/login). */
public class LoginPage extends BasePage {

    private final By email = By.name("email");
    private final By password = By.name("password");
    private final By signInButton = By.xpath("//button[normalize-space()='Sign in']");
    private final By registerLink = By.xpath("//a[normalize-space()='Register as a candidate']");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public LoginPage enterEmail(String value) {
        type(email, value);
        return this;
    }

    public LoginPage enterPassword(String value) {
        type(password, value);
        return this;
    }

    public LoginPage submit() {
        click(signInButton);
        return this;
    }

    public LoginPage login(String emailValue, String passwordValue) {
        return enterEmail(emailValue).enterPassword(passwordValue).submit();
    }

    public void clickRegisterLink() {
        click(registerLink);
    }
}
