# TalentAI — Local Load Balancing & Scaling

Run several TalentAI backend instances behind a load balancer on one machine.
The API is **stateless (JWT)** — no server sessions — so any instance can serve
any request. That is what makes horizontal scaling and load balancing safe here;
all instances share the same MySQL, JWT secret, and resume folder.

```
                         :8080  (load balancer)
   Browser / Gatling  ─────────────►  LoadBalancer.java  (or nginx)
                                          │  round-robin + health checks
                        ┌─────────────────┼─────────────────┐
                        ▼                 ▼                 ▼
                  :8081 instance    :8082 instance    :8083 instance   ← java -jar (same JAR)
                        └─────────────────┼─────────────────┘
                                          ▼
                                   MySQL :3306   (shared)
                                   uploads\resumes (shared)
```

## Why this isn't "auto-scaling" (and what to run instead)

True auto-scaling — instances added/removed automatically on CPU or latency — is
a feature of an **orchestrator** (Kubernetes HPA, Docker Swarm) or a cloud **Auto
Scaling Group**. It needs a container runtime / control plane you don't have on a
bare laptop (Docker isn't installed here). The honest local equivalents:

| You want… | Local reality |
|---|---|
| Horizontal scaling | ✅ Run N instances (`start-cluster.ps1 -Instances N`) |
| Load balancing | ✅ `start-lb.ps1` (bundled) or nginx (`nginx.conf`) |
| Self-healing (restart crashes) | ✅ `autoscale-watchdog.ps1` keeps the desired count alive |
| Latency-driven scale-up | ⚠️ Approximated by `autoscale-watchdog.ps1` (demo only) |
| Real elastic autoscale | ❌ Needs K8s/Swarm/cloud — see Deployment_Architecture.md §12 |

## Prerequisites

1. **MySQL running** on 3306 — `powershell -ExecutionPolicy Bypass -File ..\start-mysql.ps1`
2. **JDK 17** at `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`
3. **The JAR built** — from `Backend\`: `mvn package -DskipTests`
4. `Backend\.env` present (DB creds + JWT secret) — the instances load it.

## Quick start (two terminals)

**Terminal 1 — start the cluster** (2 instances on 8081, 8082):
```
powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-cluster.ps1 -Instances 2
```
Wait ~15–30 s until each `http://localhost:8081/api/actuator/health` (and 8082) returns `{"status":"UP"}`.

**Terminal 2 — start the load balancer** on 8080:
```
powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-lb.ps1 -Instances 2
```
This window prints one line per request showing which instance served it and a
running per-instance hit tally.

Because the balancer listens on **8080**, the existing frontend (which already
calls `:8080`) needs **no change** — it now talks to the cluster.

## Verify balancing

```
curl -i http://localhost:8080/api/v1/public/roles
```
Look at the `X-LB-Upstream` response header — repeat the call and it alternates
`127.0.0.1:8081` → `127.0.0.1:8082` → … Kill one instance and the balancer marks
it DOWN within ~5 s and routes only to the survivor (verified failover).

## Drive load through it

Point the existing Gatling suite at the balancer instead of a single instance:
```
cd D:\TalentAI\LoadTests
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
set "PATH=C:\dev-tools\apache-maven-3.9.9\bin;%JAVA_HOME%\bin;%PATH%"
mvn gatling:test -Dprofile=concurrent -Dusers=200 -Dduration=120 -DbaseUrl=http://localhost:8080
```
Watch the balancer window: hits spread across the instances. (Confirm the sim
reads `-DbaseUrl`; if it hard-codes the URL, point it at `http://localhost:8080`.)

## Scale up / down

- **Up:** stop the LB, run `start-cluster.ps1 -Instances 3`, then `start-lb.ps1 -Instances 3`.
  For nginx, uncomment the `8083` line in `nginx.conf` and `nginx -s reload`.
- **Down:** `stop-cluster.ps1` and restart with a smaller `-Instances`.

## Self-healing / pseudo-autoscale
```
powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\autoscale-watchdog.ps1 -Min 2 -Max 4
```
Keeps `-Min` instances healthy (restarts crashed ones) and adds one (up to `-Max`)
when a probe through the balancer exceeds the latency threshold. Demonstration aid.

## Production balancer (nginx)
```
winget install nginx
nginx -c D:\TalentAI\cluster\nginx.conf      # reload: nginx -s reload   stop: nginx -s stop
```
`nginx.conf` uses `least_conn` + passive health checks (`max_fails`/`fail_timeout`)
and mirrors the `X-LB-Upstream` header. It listens on 8080, same as the Java LB.

## Stop everything
```
powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\stop-cluster.ps1
```
Ctrl+C the load-balancer window (or `nginx -s stop`).

## Files
| File | Purpose |
|---|---|
| `start-cluster.ps1` | Launch N backend instances (8081, 8082, …) |
| `start-lb.ps1` | Run the bundled pure-JDK load balancer on 8080 |
| `LoadBalancer.java` | The balancer: round-robin + health checks + `X-LB-Upstream` |
| `stop-cluster.ps1` | Stop all instances (by recorded PID, optionally by port) |
| `nginx.conf` | Production balancer config (needs nginx) |
| `autoscale-watchdog.ps1` | Self-healing + demo latency-based scale-up |

> Note on this sandbox: servers must be started in **your own terminals** — a
> process launched by the assistant's tooling is reaped when its call ends, which
> is why the instances and balancer are yours to run, not started for you here.
