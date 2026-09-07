# Code Quality Results

_Run date: 2026-09-07 · Branch: `main` · Commit: `6272d53` · Toolchain: JDK 17, Maven 3.9.9_

## SonarQube status — NOT executed in this environment

The SonarQube **analysis itself was not run**, because it requires a SonarQube **server** that is not available here:
- **No Docker** on this machine (can't run a local `sonarqube` container).
- **No SonarCloud token / organization** configured.

Everything is wired and ready (`jacoco` + `sonar-maven-plugin` + `it` profile in `Backend/pom.xml`, and `.github/workflows/ci.yml`). To produce the actual Sonar dashboard, run **one** command against a server (see `Docs/SonarQube_Setup.md`), e.g.:

```
mvn -Pit verify sonar:sonar "-Dsonar.host.url=http://localhost:9000" "-Dsonar.token=<token>"
```
…or set the `SONAR_TOKEN` secret in the GitHub repo and the CI workflow runs it automatically on every push.

## Test results (executed locally)

| Suite | Result |
|---|---|
| Unit tests (`CandidateServiceTest`, `CandidateControllerTest`, `CandidateRequestValidationTest`) | **66 passed, 0 failed** |
| Integration tests — full candidate suite (9 `*IT` classes, run earlier vs. local MySQL) | **57 passed, 0 failed** |

## Coverage (JaCoCo) — unit-test run

Measured from `mvn clean verify` (unit tests only; no database required). Report: `Backend/target/site/jacoco/index.html`.

**Overall backend**

| Metric | Coverage |
|---|---|
| Instructions | 20.0% (1331 / 6651) |
| Lines | 21.6% (236 / 1094) |
| Branches | 18.4% (52 / 282) |
| Methods | 23.0% (79 / 344) |
| Classes | 25.0% (26 / 104) |

**Candidate module (line coverage)**

| Package | Line coverage |
|---|---|
| `candidate.dto` | 100.0% |
| `candidate.service` | 91.1% |
| `candidate.controller` | 50.0% |

### How to read this
- The candidate **service (91%) and DTOs (100%)** are well covered by unit tests.
- **Overall backend coverage is low (~20%)** by design: only the **candidate module** has tests so far — the other modules (job, application, interview, offer, aimatch, dashboard, notification, admin, reports) have **no tests yet**, which drags the aggregate down.
- `candidate.controller` shows 50% here because the numbers above are **unit-only**. The 57 integration tests exercise the controller, repository and security end-to-end; a coverage run **with the integration profile** (`mvn -Pit verify`, needs MySQL/Docker) raises candidate controller/repository/security substantially. That run is pending a live database.

## Next steps to get the real SonarQube report
1. **Provide a Sonar server** — a SonarCloud token, or enable Docker so a local `sonarqube` container can be started.
2. Run `mvn -Pit verify sonar:sonar ...` (with MySQL up so the integration tests contribute coverage).
3. Review the Sonar **Quality Gate**, bugs, code smells, vulnerabilities, and duplications on the dashboard.
