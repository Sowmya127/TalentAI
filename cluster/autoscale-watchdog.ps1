# =====================================================================
# autoscale-watchdog.ps1 — a local stand-in for autoscaling.
#
# TRUE autoscaling (add/remove instances automatically on CPU/latency) needs an
# orchestrator — Kubernetes HPA, Docker Swarm, or a cloud Auto Scaling Group.
# You cannot get that from a single laptop with no container runtime.
#
# What you CAN do locally, and what this script does, is the honest analog:
#   * keep a DESIRED number of instances alive (self-healing: restart crashes),
#   * optionally SCALE UP by one instance when average latency through the load
#     balancer exceeds a threshold, up to a max.
#
# It polls each instance's health and the balancer's latency, then reconciles.
# This is a demonstration aid, not a production controller.
#
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\autoscale-watchdog.ps1 -Min 2 -Max 4
# =====================================================================
param(
    [int]$Min = 2,
    [int]$Max = 4,
    [int]$BasePort = 8081,
    [int]$LbPort = 8080,
    [int]$LatencyThresholdMs = 800,   # scale up if a probe through the LB is slower than this
    [int]$IntervalSec = 15
)
$ErrorActionPreference = 'Continue'

$Root       = Split-Path $PSScriptRoot -Parent
$BackendDir = Join-Path $Root 'Backend'
$JavaHome   = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$Jar        = Join-Path $BackendDir 'target\talentai-backend-0.1.0-SNAPSHOT.jar'
$java       = Join-Path $JavaHome 'bin\java.exe'

# Reuse the env-loading + shared upload path from start-cluster's contract.
$EnvFile = Join-Path $BackendDir '.env'
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('='); Set-Item -Path ("Env:" + $line.Substring(0,$idx).Trim()) -Value $line.Substring($idx+1).Trim()
    }
}
$env:JAVA_HOME = $JavaHome
if (-not $env:SPRING_PROFILES_ACTIVE) { $env:SPRING_PROFILES_ACTIVE = 'dev' }
$env:FILE_UPLOAD_PATH = Join-Path $BackendDir 'uploads\resumes'

function Test-Health([int]$port) {
    try { (Invoke-WebRequest "http://localhost:$port/api/actuator/health" -TimeoutSec 2 -UseBasicParsing).StatusCode -eq 200 }
    catch { $false }
}
function Start-Instance([int]$port) {
    $env:SERVER_PORT = "$port"
    $p = Start-Process -FilePath $java -ArgumentList @('-jar', $Jar) -WorkingDirectory $BackendDir -PassThru
    Write-Host ("[scale] started instance on :{0} (pid {1})" -f $port, $p.Id) -ForegroundColor Green
}
function Probe-LatencyMs {
    try {
        $sw = [Diagnostics.Stopwatch]::StartNew()
        Invoke-WebRequest "http://localhost:$LbPort/api/actuator/health" -TimeoutSec 5 -UseBasicParsing | Out-Null
        $sw.ElapsedMilliseconds
    } catch { [int]::MaxValue }
}

Write-Host "Watchdog: keeping $Min-$Max instances healthy (scale-up > ${LatencyThresholdMs}ms). Ctrl+C to stop." -ForegroundColor Cyan
$desired = $Min
while ($true) {
    # 1) Reconcile: how many of ports BasePort..BasePort+Max-1 are healthy?
    $healthy = @()
    for ($i = 0; $i -lt $Max; $i++) { if (Test-Health ($BasePort + $i)) { $healthy += ($BasePort + $i) } }

    # 2) Self-heal up to desired count (fill the lowest free ports).
    for ($i = 0; $i -lt $desired; $i++) {
        $port = $BasePort + $i
        if ($healthy -notcontains $port) { Start-Instance $port }
    }

    # 3) Scale up one step if latency is high and we're below Max.
    $lat = Probe-LatencyMs
    if ($lat -gt $LatencyThresholdMs -and $desired -lt $Max) {
        $desired++
        Write-Host ("[scale] latency ${lat}ms > ${LatencyThresholdMs}ms -> desired = {0}" -f $desired) -ForegroundColor Yellow
    }

    Write-Host ("[watchdog] healthy={0} desired={1} lbLatency={2}ms" -f $healthy.Count, $desired, $lat) -ForegroundColor DarkGray
    Start-Sleep -Seconds $IntervalSec
}
