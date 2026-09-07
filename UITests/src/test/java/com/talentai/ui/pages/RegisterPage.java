package com.talentai.ui.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Page Object for the candidate Registration screen (/register). */
public class RegisterPage extends BasePage {

    private final By firstName = By.name("firstName");
    private final By lastName = By.name("lastName");
    private final By email = By.name("email");
    private final By phoneNumber = By.name("phoneNumber");
    private final By password = By.name("password");
    private final By confirmPassword = By.name("confirmPassword");
    private final By createAccountButton = By.xpath("//button[normalize-space()='Create account']");

    public RegisterPage(WebDriver driver) {
        super(driver);
    }

    public RegisterPage fill(String first, String last, String emailValue, String phone,
                             String pwd, String confirmPwd) {
        type(firstName, first);
        type(lastName, last);
        type(email, emailValue);
        type(phoneNumber, phone);
        type(password, pwd);
        type(confirmPassword, confirmPwd);
        return this;
    }

    public RegisterPage submit() {
        click(createAccountButton);
        return this;
    }
}
