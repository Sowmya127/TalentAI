# TalentAI — Load / Performance Test Plan

Load testing of the backend APIs with **Gatling** (Java DSL) run via Maven — reuses the JDK 17 +
Maven toolchain, no separate tool to install. Harness: `LoadTests/` → `TalentAiLoadSimulation`.

## 1. Objectives
- Verify the API meets response-time and error-rate targets under expected and peak load.
- Find the breaking point (stress) and behaviour under sudden bursts (spike) and sustained traffic (soak).
- Catch performance regressions and misbehaving endpoints (the harness already caught a 500 on a wrong path during bring-up — that's the point of the SLA assertions).

## 2. Scope — the important flows to load test
Chosen for highest traffic and performance sensitivity.

| ID | Flow / functionality | Endpoint(s) | Why it matters | Type | Target (SLA) |
|---|---|---|---|---|---|
| LT-01 | **Public job browsing** | `GET /v1/public/jobs` | Hit by every landing-page visit, **unauthenticated** → highest volume | avg · stress · spike | p95 < 800 ms, errors < 1% |
| LT-02 | **Login** | `POST /v1/auth/login` | Auth gateway; every session starts here | avg · spike | p95 < 1000 ms, errors < 1% |
| LT-03 | **Authenticated job browse** | `GET /v1/jobs?status=Published` | Candidates & recruiters browsing/filtering | avg | p95 < 1000 ms |
| LT-04 | **Dashboard summary** | `GET /v1/dashboard` | Aggregated counts across tables — heavier queries | avg · stress | p95 < 1500 ms |
| LT-05 | **Candidate registration** | `POST /v1/auth/register` | Write path; sign-up spikes (campaigns) | spike | p95 < 1500 ms, errors < 1% |

> Candidate `apply`, offer, and interview writes are natural follow-ups; start with the read-heavy, high-traffic paths above.

## 3. Load profiles (the test cases)
Selected with `-Dprofile=<name>`; scale with `-Dusers`, `-Dramp`, `-Dduration`.

| Profile | Purpose | Shape |
|---|---|---|
| **smoke** | Validate the harness & endpoints work (default) | A few users, once |
| **load** | Expected/average traffic | Ramp to `users`, then hold at a steady arrival rate for `duration` |
| **stress** | Find the breaking point | Ramp to ~3× `users` and observe where latency/errors climb |
| **spike** | Sudden burst resilience | Idle, then a large batch of users at once |
| **soak** | Endurance (leaks, pool exhaustion) | Steady arrival rate held for a long `duration` |
| **concurrent** | Hold a fixed **number of concurrent users** for a fixed **duration** (you specify both) | Closed model: ramp in, then hold `-Dusers` concurrent for `-Dduration` |
| **breakpoint** | **Gradually increasing** load to find the break point | Closed model: ramp concurrency `1 → -Dusers` over `-Dduration`; watch where p95/errors knee (SLA assertions disabled here) |

## 4. Metrics & pass/fail
Captured per request and globally (Gatling HTML report):
- Response time: mean, **p95**, p99, max
- **Throughput** (requests/sec)
- **Error rate** (% failed)

Automated assertions in the simulation (build fails if breached):
- Global **p95 response time < 2000 ms**
- Global **failed requests < 1%**

Recommended server-side observation during runs: CPU, heap/GC, DB connection-pool usage, slow queries.

## 5. Tooling & how to run
**Prerequisites:** backend (`:8080`) and MySQL (`:3306`) running. (The load test hits the API directly — the frontend is not required.)

```
cd D:\TalentAI\LoadTests
mvn gatling:test -Dprofile=smoke                                  # quick validation (default)
mvn gatling:test -Dprofile=load  -Dusers=50 -Dramp=20 -Dduration=60
mvn gatling:test -Dprofile=stress -Dusers=100
mvn gatling:test -Dprofile=spike -Dusers=80
mvn gatling:test -Dprofile=soak  -Dusers=40 -Dduration=300
mvn gatling:test -Dprofile=concurrent -Dusers=100 -Dduration=120   # hold 100 concurrent users for 120s
mvn gatling:test -Dprofile=breakpoint -Dusers=500 -Dduration=180   # ramp 1..500 to find the break point
```
Options: `-DbaseUrl` (default `http://localhost:8080`), `-DloginEmail` / `-DloginPassword`.
HTML report: `LoadTests/target/gatling/<simulation>-<timestamp>/index.html`.

Before large runs, raise backend capacity: `DB_POOL_MAX_SIZE` (Hikari), JVM heap, and MySQL `max_connections`.

## 6. Latest smoke run (2026-09-07)
```
Requests: 13   OK: 13   KO: 0
p95: 125 ms   p99: 126 ms   mean: 63 ms   throughput: ~13 req/s
Assertions — p95 < 2000ms: PASS · failures < 1%: PASS → BUILD SUCCESS
```
Covered: `GET /public/jobs` (x2 pages), `POST /auth/login`, `GET /jobs`, `GET /dashboard`, `POST /auth/register`.

> Note: candidate registration and (at scale) higher profiles **write rows** to the database via `POST /auth/register`. Run heavier profiles against a disposable/test database, not production.

## 7. Regression comparison (this run vs the previous run)
`LoadTests/perf-report.ps1` reads a run's `js/global_stats.json`, compares it to a saved baseline, and writes an HTML report ([Docs/load-test-comparison.html](load-test-comparison.html)) with per-metric deltas and a verdict.

```powershell
# 1) capture a known-good run as the baseline ("previous run")
powershell -File D:\TalentAI\LoadTests\perf-report.ps1 -SaveBaseline
# 2) later, after another run, compare against it
powershell -File D:\TalentAI\LoadTests\perf-report.ps1
```
**Verdict = DEGRADED** if, vs baseline, **p95** or **mean** rose > 10%, **throughput** dropped > 10%, or the **error rate** rose by > 1 point. Otherwise **NO DEGRADATION**. The baseline lives in `LoadTests/baseline/global_stats.json`; re-run `-SaveBaseline` to move it forward after an intended change.

### Latest comparison (2026-09-07)
Two `concurrent -Dusers=8 -Dduration=15` runs — **NO DEGRADATION**: p95 259 → 249 ms (−3.9%), mean 71 → 76 ms (+7%), throughput 94.3 → 88 req/s (−6.7%), errors 0% — all within thresholds.
