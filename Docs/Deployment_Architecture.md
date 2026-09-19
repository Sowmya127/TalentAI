# TalentAI — Deployment Architecture

UML/deployment view of the **as-built** TalentAI platform. It reflects the real implementation, not a
conceptual model.

**Accuracy notes (as-built vs. brief):**
- Runtime is **Java 17** (`pom.xml` `<java.version>17</java.version>`), Spring Boot **3.3.5**, MySQL **8.4**.
- The backend serves under context path **`/api`**, controllers under **`/v1/**`**, default port **8080**.
- **Notifications are in-app** (rows in the `notification` table); an SMTP server is *configured via env vars but
  not yet wired* (no mail starter on the classpath). SMTP is therefore shown as an **optional/planned** node.
- **AI Matching is an in-process deterministic heuristic** (no external LLM call); `AI_PROVIDER_BASE_URL` /
  `OPENAI_API_KEY` exist as env vars but are currently unused.
- **Nginx reverse proxy** is used in Production to terminate TLS and serve the React build; in Development the
  frontend runs on the **Vite dev server (4200)** and calls the backend directly.

---

## 1 & 2. UML Deployment Diagram / Production Deployment Architecture (Mermaid)

```mermaid
flowchart TB
    subgraph CLIENT["💻 Client Device"]
        BROWSER["Web Browser<br/>(React SPA runtime)"]
    end

    NET(["🌐 Internet"])

    subgraph EDGE["Node: Web Server / Reverse Proxy — Nginx (TLS 443)"]
        STATIC["React Frontend<br/>(static build: React 19, TS, MUI, Axios)"]
        PROXY["Reverse proxy<br/>/api → app:8080"]
    end

    subgraph APP["Node: Application Server — Spring Boot JAR (JVM 17, :8080, context /api)"]
        REST["REST API Layer<br/>@RestController /v1/**"]
        SEC["Authentication Module<br/>Spring Security + JwtAuthenticationFilter + @PreAuthorize"]
        SVC["Business Services<br/>Candidate · Recruiter · Hiring Manager · Interviewer · HR · Admin ·<br/>Auth · Registration-Approval · Company · AI Matching (heuristic) ·<br/>Interview Scheduling · Offer · Job · Application · Notification · Reporting · Audit"]
        REPO["Repository Layer<br/>Spring Data JPA"]
        HIB["Hibernate ORM"]
        POOL["HikariCP connection pool"]
        FLY["Flyway migrations V1–V34<br/>(run on startup)"]
        ACT["Actuator /api/actuator<br/>health · info · metrics"]
        DOC["Swagger UI /v1/swagger-ui.html"]
    end

    subgraph DATA["Node: Database Server"]
        MYSQL[("MySQL 8.4<br/>schema: talentai")]
    end

    subgraph FILES["Node: File Storage"]
        RESUMES["Resume uploads<br/>FILE_UPLOAD_PATH (disk volume)"]
    end

    SMTP["✉️ SMTP / Email Server<br/>(optional — not yet wired)"]
    MON["📈 Monitoring<br/>(scrapes /actuator/metrics — optional)"]

    BROWSER -->|"HTTPS 443"| NET
    NET -->|"HTTPS 443"| EDGE
    STATIC -.->|"served to browser"| BROWSER
    PROXY -->|"HTTP 8080 (REST/JSON, Bearer JWT)"| REST
    REST --> SEC --> SVC --> REPO --> HIB --> POOL
    POOL -->|"JDBC 3306 (SSL)"| MYSQL
    FLY -->|"JDBC (DDL on boot)"| MYSQL
    SVC -->|"read/write files"| RESUMES
    SVC -. "SMTP 587 (planned)" .-> SMTP
    MON -. "HTTP scrape" .-> ACT
```

---

## 3. Component Placement

| Component | Deployed on node | Artifact |
|---|---|---|
| React SPA (Candidate/Recruiter/HM/Interviewer/HR/Admin UIs) | Nginx (static) / browser runtime | `dist/` static bundle |
| REST API, Security/JWT, all business services, JPA repos, Hibernate, Hikari, Flyway, Actuator, Swagger | Spring Boot Application Server | `talentai-backend-*.jar` |
| Relational data (users, roles, candidates, jobs, applications, interviews, offers, notifications, audit, registration requests, company, approval history) | Database Server | MySQL schema `talentai` |
| Resume files | File Storage node | Disk volume at `FILE_UPLOAD_PATH` |
| In-app notifications | Database Server | `notification` table |
| Email delivery | SMTP node (optional/planned) | — |
| Metrics/health | Application Server (exposed), Monitoring node (scrapes) | Actuator endpoints |

---

## 4. Communication Protocols

| From → To | Protocol / Port | Notes |
|---|---|---|
| Browser → Nginx | HTTPS / 443 | TLS terminated at proxy |
| Nginx → React static | HTTPS | SPA assets |
| Nginx → Spring Boot | HTTP / 8080 | `location /api` reverse proxy (internal network) |
| React (Axios) → REST API | HTTPS REST / JSON | `Authorization: Bearer <JWT>` on protected calls |
| Repository → MySQL | JDBC / 3306 | via HikariCP, `useSSL` per env |
| Flyway → MySQL | JDBC / 3306 | schema migrate + validate on boot |
| Services → File storage | Filesystem I/O | resume read/write |
| Services → SMTP | SMTP+STARTTLS / 587 | optional/planned |
| Monitoring → Actuator | HTTP | `/api/actuator/metrics`, `/health` |

---

## 5. Deployment Explanation

The platform is a **two-tier deployable** (SPA + stateless API) over a relational store. In **Production**,
**Nginx** terminates TLS, serves the compiled React bundle, and reverse-proxies `/api/**` to the Spring Boot
JAR so the browser sees a single origin (no CORS needed in prod). The **Spring Boot** process is a stateless
executable JAR: on startup **Flyway** brings the MySQL schema to V34 and Hibernate validates the entity mapping
(`ddl-auto: validate` — the app never alters schema). Requests pass through the **JwtAuthenticationFilter**
(stateless bearer tokens), then `@PreAuthorize` role checks, into the **business services** (all TalentAI
modules), through **Spring Data JPA / Hibernate**, and out via the **HikariCP** pool over JDBC to **MySQL**.
Resume files live outside the DB on a **file-storage volume**; notifications are persisted **in-app** in MySQL.
Because the API holds no session state, it scales horizontally behind a proxy/load balancer.

---

## 6. Node Description

| Node | Role | Runtime |
|---|---|---|
| Client Device / Browser | Runs the React SPA, stores JWT (in-memory/localStorage) | Any modern browser |
| Nginx (reverse proxy) | TLS termination, static hosting, `/api` proxy, gzip | Nginx |
| Application Server | Hosts the Spring Boot JAR: REST, security, services, ORM, migrations | JVM 17 |
| Database Server | Persistent relational store + connection pooling target | MySQL 8.4 |
| File Storage | Resume upload persistence | Disk volume / mounted path |
| SMTP Server | Outbound transactional email (optional/planned) | SMTP relay |
| Monitoring | Health/metrics collection & dashboards | Actuator + Prometheus/Grafana (optional) |

---

## 7. Technology Mapping

| Layer | Technology | Node |
|---|---|---|
| Presentation | React 19, TypeScript, Material UI, Axios, Vite build | Nginx / Browser |
| API | Spring Web (REST), springdoc-openapi (Swagger) | App Server |
| Security | Spring Security, JWT (jjwt HS-family), method security | App Server |
| Business | Spring `@Service` modules (all TalentAI domains) | App Server |
| Persistence | Spring Data JPA, Hibernate, HikariCP | App Server → DB |
| Migration | Flyway (V1–V34) | App Server → DB |
| Database | MySQL 8.4 (InnoDB, utf8mb4) | DB Server |
| Files | Java NIO filesystem storage | File Storage |
| Observability | Spring Boot Actuator | App Server |
| Build/CI | Maven, Git, GitHub (+ Actions) | Dev/CI |

---

## 8. Environment Variable Mapping (no hard-coded values)

Configuration is entirely env-driven (`application.yml` reads `${VAR}`); only `application-{profile}.yml` differs.

| Variable | Dev | Test | Production |
|---|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `dev` | `test` | `prod` |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `3306` / `talentai` | Testcontainers (dynamic) or `talentai_test` | managed DB host / `3306` / `talentai` |
| `DB_USERNAME` / `DB_PASSWORD` | dev creds (`.env`, gitignored) | container creds | **secret manager** |
| `DB_USE_SSL` | `false` | `false` | `true` |
| `DB_POOL_MAX_SIZE` / `DB_POOL_MIN_IDLE` | `10` / `2` | small | tuned (e.g. `20`+) |
| `JWT_SECRET` | dev-only value | test value | **secret manager**, ≥256-bit |
| `JWT_EXPIRATION_MS` / `JWT_REFRESH_EXPIRATION_MS` | `3600000` / `86400000` | short | policy-driven |
| `FILE_UPLOAD_PATH` / `FILE_MAX_SIZE_MB` | `./uploads/resumes` / `10` | temp dir | persistent volume / object mount |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` | unset | unset | SMTP relay + secret (when enabled) |
| `AI_PROVIDER_BASE_URL` / `OPENAI_API_KEY` / `AI_MODEL` | unset (heuristic) | unset | set only if external AI is enabled |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | test origin | prod domain(s) |
| `SERVER_PORT` | `8080` | `8080` | `8080` (behind proxy) |
| `SWAGGER_UI_ENABLED` | `true` | `true` | `false` |
| `LOG_LEVEL` / `LOG_LEVEL_APP` | `INFO` | `WARN`/`INFO` | `INFO`/`WARN` |
| `ACTUATOR_HEALTH_DETAILS` | `when-authorized` | — | `when-authorized`/`never` |

Secrets are never committed: dev uses a gitignored `Backend/.env`; prod uses the platform's secret manager / injected env.

---

## 9. Deployment Environments (Mermaid)

```mermaid
flowchart LR
    subgraph DEV["Development (local workstation)"]
        DV1["Vite dev server :4200"]
        DV2["Spring Boot (mvn/JAR) :8080"]
        DV3[("MySQL :3306 local")]
        DV4["uploads ./uploads/resumes"]
        DV1 -->|proxy /api| DV2 --> DV3
        DV2 --> DV4
    end
    subgraph TEST["Testing / CI"]
        TS1["JUnit + MockMvc + Selenium + Gatling"]
        TS2["Spring Boot test context"]
        TS3[("MySQL Testcontainer / talentai_test")]
        TS1 --> TS2 --> TS3
    end
    subgraph PROD["Production"]
        PR1["Nginx (TLS 443)"]
        PR2["Spring Boot JAR :8080"]
        PR3[("MySQL 8.4 (SSL)")]
        PR4["Resume volume"]
        PR5["SMTP (optional)"]
        PR6["Monitoring"]
        PR1 --> PR2 --> PR3
        PR2 --> PR4
        PR2 -. optional .-> PR5
        PR6 -. scrape .-> PR2
    end
```

**Config source per env:** Dev → `Backend/.env` (gitignored). Test → `@DynamicPropertySource` (Testcontainers) or
`IT_JDBC_URL` for a local MySQL; `application-test.yml`. Prod → injected environment / secret manager;
`application-prod.yml`.

---

## 10. JWT Authentication Flow (Mermaid)

```mermaid
sequenceDiagram
    participant B as Browser (React)
    participant P as Nginx
    participant S as Spring Security / Auth
    participant DB as MySQL

    B->>P: POST /api/v1/auth/login {email, password} (HTTPS)
    P->>S: proxy
    S->>DB: load user + roles
    S-->>B: 200 { token (JWT), role, roles, expiresIn }
    Note over B: store JWT
    B->>P: GET /api/v1/... (Authorization: Bearer JWT)
    P->>S: proxy
    S->>S: JwtAuthenticationFilter validates signature+expiry, loads authorities
    S->>S: @PreAuthorize role check
    S-->>B: 200 protected resource  (401 if no/invalid/expired token · 403 if role denied)
```

---

## 11. Registration Approval Flow (Mermaid)

```mermaid
flowchart TD
    R["Recruiter / HM / Interviewer / HR registers<br/>POST /api/v1/auth/register"] --> P["Account PENDING_APPROVAL<br/>role NOT yet assigned"]
    P --> N["In-app notification to Admins"]
    P --> L1["Login attempt → 403 REGISTRATION_PENDING"]
    N --> A["Admin review queue<br/>GET /api/v1/admin/registration-requests"]
    A --> D{Decision}
    D -->|Approve| AC["Active + role assigned<br/>approval_history: Approved"]
    D -->|Reject| RJ["REJECTED (+reason)<br/>approval_history: Rejected"]
    AC --> OK["Login allowed"]
    RJ --> NO["Login → 403 REGISTRATION_REJECTED (+reason)"]
    C["Candidate registers"] --> CA["ACTIVE immediately → login allowed"]
```

---

## 12. Optional Cloud Deployment (Mermaid)

```mermaid
flowchart TB
    U["Users"] -->|HTTPS| CDN["CDN / Static hosting<br/>(React build)"]
    U -->|HTTPS| LB["Load Balancer (TLS)"]
    LB --> APP1["App container/instance 1<br/>Spring Boot JAR"]
    LB --> APP2["App container/instance 2<br/>Spring Boot JAR"]
    APP1 --> RDS[("Managed MySQL<br/>(primary + read replica)")]
    APP2 --> RDS
    APP1 --> OBJ["Object Storage<br/>(resumes)"]
    APP2 --> OBJ
    APP1 -. optional .-> MAIL["Managed Email Service"]
    APP1 --> LOGS["Central Logging"]
    MONS["Monitoring/APM"] -. scrape .-> APP1
    MONS -. scrape .-> APP2
    SEC["Secret Manager"] -. inject env .-> APP1
    SEC -. inject env .-> APP2
```

Cloud mapping (provider-neutral): Load Balancer (ALB/App Gateway/GCLB) · App tier (ECS/EKS/App Service/Cloud Run,
2+ stateless instances) · Managed MySQL (RDS/Cloud SQL/Azure MySQL) · Object Storage (S3/Blob/GCS) for resumes ·
Managed Email (SES/SendGrid) · Monitoring (CloudWatch/Prometheus+Grafana/App Insights) · Secret Manager for
`JWT_SECRET`, DB creds, SMTP creds.

---

## 13. PlantUML — Production Deployment

```plantuml
@startuml
skinparam componentStyle rectangle
left to right direction

node "Client Device" {
  artifact "Web Browser\n(React SPA)" as Browser
}
cloud "Internet\n(HTTPS 443)" as Net

node "Reverse Proxy (Nginx, TLS)" {
  artifact "React Frontend (static)" as FE
  component "Reverse proxy /api" as Proxy
}

node "Application Server (JVM 17)" {
  component "REST API /v1/**" as REST
  component "Spring Security + JWT filter" as Sec
  component "Business Services (all modules)" as Svc
  component "Spring Data JPA / Hibernate" as JPA
  component "HikariCP pool" as Pool
  component "Flyway (V1-V34)" as Flyway
  component "Actuator / Swagger" as Ops
}

database "MySQL 8.4\nschema talentai" as DB
folder "File Storage\n(resumes)" as Files
queue "SMTP (optional)" as Smtp
node "Monitoring" as Mon

Browser --> Net : HTTPS
Net --> Proxy : HTTPS 443
FE ..> Browser : assets
Proxy --> REST : HTTP 8080 (Bearer JWT)
REST --> Sec
Sec --> Svc
Svc --> JPA
JPA --> Pool
Pool --> DB : JDBC 3306 (SSL)
Flyway --> DB : JDBC (boot)
Svc --> Files : file I/O
Svc ..> Smtp : SMTP 587 (planned)
Mon ..> Ops : scrape
@enduml
```

### PlantUML — Optional Cloud Deployment

```plantuml
@startuml
skinparam componentStyle rectangle
actor Users
cloud "CDN (React build)" as CDN
node "Load Balancer (TLS)" as LB
node "App Instance 1" as A1
node "App Instance 2" as A2
database "Managed MySQL\n(primary + replica)" as RDS
folder "Object Storage (resumes)" as S3
queue "Managed Email (optional)" as SES
node "Monitoring/APM" as Mon
node "Secret Manager" as SM

Users --> CDN : HTTPS
Users --> LB : HTTPS
LB --> A1
LB --> A2
A1 --> RDS
A2 --> RDS
A1 --> S3
A2 --> S3
A1 ..> SES
Mon ..> A1
Mon ..> A2
SM ..> A1 : env inject
SM ..> A2 : env inject
@enduml
```

---

## 14. ASCII Deployment Diagram (documentation-friendly)

```text
        ┌───────────────────────┐
        │      Client Device      │
        │   Web Browser (React)   │
        └───────────┬─────────────┘
                    │ HTTPS 443
                    ▼
             ~ ~ ~ Internet ~ ~ ~
                    │ HTTPS 443
                    ▼
   ┌────────────────────────────────────────────┐
   │      Reverse Proxy — Nginx (TLS)             │
   │   • React static build (SPA)                 │
   │   • /api  ──►  reverse proxy to app:8080     │
   └───────────────────────┬──────────────────────┘
                            │ HTTP 8080  (REST/JSON, Bearer JWT)
                            ▼
   ┌────────────────────────────────────────────────────────────┐
   │        Application Server — Spring Boot JAR (JVM 17)          │
   │  REST /v1/**                                                 │
   │     └► Spring Security + JwtAuthenticationFilter + @PreAuth   │
   │           └► Business Services                                │
   │              (Candidate·Recruiter·HiringManager·Interviewer· │
   │               HR·Admin·Auth·Registration-Approval·AI Match·  │
   │               Interview·Offer·Job·Application·Notification·  │
   │               Reporting·Audit)                               │
   │                 └► Spring Data JPA ─► Hibernate ─► HikariCP   │
   │  Flyway (V1–V34, on boot)     Actuator /health,/metrics      │
   └───────┬───────────────────────────┬───────────────┬──────────┘
           │ JDBC 3306 (SSL)            │ file I/O      │ SMTP 587 (optional)
           ▼                            ▼               ▼
   ┌───────────────┐         ┌────────────────────┐   ┌──────────────┐
   │  MySQL 8.4     │         │  File Storage       │   │ SMTP / Email │
   │  schema        │         │  resumes            │   │ (planned)    │
   │  talentai      │         │  FILE_UPLOAD_PATH   │   └──────────────┘
   └───────────────┘         └────────────────────┘
```

---

## 15. Security Considerations
- **TLS everywhere in prod** — HTTPS at the proxy; browser↔proxy encrypted; app reachable only on the internal network.
- **Stateless JWT** — signed bearer tokens (HS, `JWT_SECRET` from secret manager); no server sessions. Expired/invalid → `401`; missing → `401` via the JWT entry point.
- **Spring Security + `@PreAuthorize`** — role-based method authorization (e.g. approval endpoints require `SYSTEM_ADMIN`/`HR_ADMIN`).
- **Registration approval gate** — non-Candidate roles cannot log in until Admin approval (`403 REGISTRATION_PENDING/REJECTED`); System Admin is not self-registerable (data-driven + server-validated).
- **Least privilege DB user** — app connects with a scoped MySQL user (not root); `useSSL=true` in prod.
- **Secrets** — never in git; dev `.env` gitignored, prod via secret manager. CORS restricted to known origins; Swagger UI disabled in prod.
- **Auditing** — significant events (register/approve/reject/role-assign/activation/login) written to `audit_log`.

## 16. Scalability Recommendations
- **Scale the API horizontally** — it's stateless; run N instances behind the LB/proxy. JWT means no sticky sessions.
- **Static/CDN** — serve the React build from CDN/object storage to offload the app tier.
- **Database** — tune HikariCP (`DB_POOL_MAX_SIZE`) to instance count; add a **read replica** for reporting/dashboards; the existing indexes support the hot paths.
- **Move resumes to object storage** (S3/Blob/GCS) instead of a local volume so any instance can serve them and storage scales independently.
- **Externalize notifications/email** — introduce a managed email service and/or a queue for async delivery when SMTP is enabled.
- **Observability** — scrape Actuator metrics into Prometheus/Grafana or an APM; alert on latency/error-rate/DB-pool saturation.
- **CI/CD** — the GitHub Actions workflow already builds/tests; extend it to build the JAR + container image and deploy per environment.
```
