# SonarQube Code-Quality Integration

Static analysis + test coverage for the TalentAI backend, wired through Maven and CI.

## What was added
- **JaCoCo** (`jacoco-maven-plugin`) — instruments tests and writes `Backend/target/site/jacoco/jacoco.xml`, which SonarQube reads for coverage. HTML report: `Backend/target/site/jacoco/index.html`.
- **Sonar scanner** (`sonar-maven-plugin`) — run analysis with `mvn sonar:sonar`.
- **Sonar settings** in `Backend/pom.xml` `<properties>`: `sonar.projectKey`, `sonar.coverage.jacoco.xmlReportPaths`, `sonar.junit.reportPaths`, `sonar.java.source=17`, and light exclusions (bootstrap class, DTOs, entities).
- **`it` Maven profile** — runs the `*IT` integration suite (via Testcontainers or a local MySQL) so coverage includes it.
- **`.github/workflows/ci.yml`** — builds, tests (unit + integration) and runs Sonar on every push/PR to `main`.

## Prerequisite for running Maven locally
`mvn` needs JDK 17 + Maven on PATH (same toolchain as `start-backend.ps1`). In PowerShell:
```powershell
$env:JAVA_HOME='C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$env:Path="C:\dev-tools\apache-maven-3.9.9\bin;$env:JAVA_HOME\bin;$env:Path"
cd D:\TalentAI\Backend
```

## Generate coverage
- Unit tests only (no Docker/DB needed):
  ```
  mvn verify
  ```
- Include the integration suite (needs Docker, **or** a local MySQL):
  ```
  mvn -Pit verify                              # uses a MySQL Testcontainer (Docker)
  ```
  Without Docker, point the ITs at a local MySQL via env vars, then:
  ```
  mvn -Pit verify                              # with IT_JDBC_URL / IT_JDBC_USERNAME / IT_JDBC_PASSWORD set
  ```
Coverage report: `Backend/target/site/jacoco/index.html`.

## Run SonarQube analysis

### Option A — SonarCloud (hosted)
1. Sign in at https://sonarcloud.io with GitHub, create an **organization** and a **project**; note the *project key* and *organization key*.
2. Create a token (My Account → Security).
3. Run:
   ```
   mvn -Pit verify sonar:sonar "-Dsonar.host.url=https://sonarcloud.io" "-Dsonar.organization=<your-org>" "-Dsonar.projectKey=<your-key>" "-Dsonar.token=<your-token>"
   ```

### Option B — Local SonarQube (Docker)
1. Start a server (needs Docker):
   ```
   docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
   ```
2. Open http://localhost:9000 (login `admin` / `admin`, set a new password), then **My Account → Security → Generate token**.
3. Run:
   ```
   mvn -Pit verify sonar:sonar "-Dsonar.host.url=http://localhost:9000" "-Dsonar.token=<your-token>"
   ```
   View results at http://localhost:9000.

## CI (automatic on GitHub)
`.github/workflows/ci.yml` runs on push/PR to `main`. To enable Sonar there, add under
**Settings → Secrets and variables → Actions**:
- **Secrets:** `SONAR_TOKEN` (required); `SONAR_HOST_URL` (only for self-hosted SonarQube — omit for SonarCloud).
- **Variables:** `SONAR_PROJECT_KEY`, and `SONAR_ORGANIZATION` (SonarCloud only).

If `SONAR_TOKEN` is not set, the workflow still builds and tests but skips the analysis step. GitHub's Ubuntu runners include Docker, so the `-Pit` integration tests run against a Testcontainer automatically — no DB setup needed in CI.
