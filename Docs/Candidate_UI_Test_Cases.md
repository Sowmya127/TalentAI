# Candidate UI Test Cases — Registration & Login (Selenium)

UI/E2E tests driven with **Selenium WebDriver (Java + JUnit 5)** against the running React app
(`http://localhost:4200`), which talks to the real backend + MySQL. Covers the candidate
**Create account** (`/register`) and **Login** (`/login`) flows, positive and negative.

- **Automated by:** `UITests/` Maven project — `RegisterUiTest`, `LoginUiTest` (Page Object Model)
- **Prereqs to run:** frontend (4200), backend (8080), MySQL (3306) all up; Chrome installed
- Priority: **P1** critical · **P2** high · **P3** medium

## Registration (`/register`)

| TC ID | Scenario | Type | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| UI-REG-01 | Register with valid details | + | Fill first/last name, unique email, password (≥8) + matching confirm → Create account | Success toast "Registration successful. Please sign in."; redirected to `/login` | P1 |
| UI-REG-02 | Submit empty form | – | Leave all fields blank → Create account | Field errors: "First name is required", "Last name is required", "Email is required", "Password must be at least 8 characters", "Please confirm your password"; stays on `/register` | P1 |
| UI-REG-03 | Invalid email format | – | Valid names, email `not-an-email`, valid pwd+confirm → submit | Field error "Enter a valid email address"; no navigation | P2 |
| UI-REG-04 | Password too short | – | Password `short` (<8) + matching confirm → submit | Field error "Password must be at least 8 characters" | P1 |
| UI-REG-05 | Passwords do not match | – | Password `Password@123`, confirm `Different@123` → submit | Field error "Passwords do not match" on confirm field | P1 |
| UI-REG-06 | Duplicate email | – | Register with an email that already exists → submit | Error toast "A user with this email already exists."; stays on `/register` | P1 |
| UI-REG-07 | Phone is optional | + | Valid details, leave phone blank → submit | Registers successfully (phone not required) | P3 |

## Login (`/login`)

| TC ID | Scenario | Type | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| UI-LOG-01 | Login with valid candidate | + | Enter registered email + correct password → Sign in | Redirected to candidate area (`/candidate`) | P1 |
| UI-LOG-02 | Submit empty form | – | Leave email + password blank → Sign in | Field errors "Email is required", "Password is required"; stays on `/login` | P1 |
| UI-LOG-03 | Invalid email format | – | Email `not-an-email`, any password → Sign in | Field error "Enter a valid email address"; no request sent | P2 |
| UI-LOG-04 | Wrong password | – | Registered email + wrong password → Sign in | Error toast "Invalid email or password."; stays on `/login` | P1 |
| UI-LOG-05 | Unregistered email | – | Never-registered email + any password → Sign in | Error toast "Invalid email or password."; stays on `/login` | P1 |
| UI-LOG-06 | Navigate to register | + | Click "Register as a candidate" | Navigates to `/register` | P3 |

## Latest run
Executed 2026-09-07 with headless Chrome against the live stack (frontend 4200, backend 8080, MySQL 3306):

```
LoginUiTest    — Tests run: 6, Failures: 0, Errors: 0
RegisterUiTest — Tests run: 6, Failures: 0, Errors: 0
Total          — 12 passed, 0 failed
```

### How to run
Start the app (MySQL, backend, frontend), then:
```
cd D:\TalentAI\UITests
mvn test                       # headless Chrome (default)
mvn test "-Dheadless=false"    # watch it drive the browser
```
Overrides: `-Dbase.url` (frontend, default http://localhost:4200), `-Dapi.url` (backend, default http://localhost:8080/api/v1).

## Notes
- Client-side (Zod) validation blocks submit for empty/format errors and shows messages inline under each field (MUI helper text).
- Server-side errors (duplicate email on register, bad credentials on login) surface as toast notifications (notistack).
- Registration does **not** auto-login — on success it routes to `/login` for the user to sign in.
