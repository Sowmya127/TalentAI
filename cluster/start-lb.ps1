# =====================================================================
# start-lb.ps1 — run the pure-JDK load balancer in front of the cluster.
#
# Listens on 8080 (so the existing frontend, which already calls :8080,
# needs no change) and round-robins across the instances started by
# start-cluster.ps1, skipping any that fail /api/actuator/health.
#
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-lb.ps1
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-lb.ps1 -Instances 3 -ListenPort 8080
#
# This window IS the balancer — it prints one line per request showing which
# instance served it and a running per-instance hit tally. Ctrl+C to stop.
# =====================================================================
param(
    [int]$ListenPort = 8080,
    [int]$Instances  = 2,
    [int]$BasePort   = 8081
)
$ErrorActionPreference = 'Stop'

$JavaHome = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$java     = Join-Path $JavaHome 'bin\java.exe'
$src      = Join-Path $PSScriptRoot 'LoadBalancer.java'

$ups = @()
for ($i = 0; $i -lt $Instances; $i++) { $ups += "127.0.0.1:$($BasePort + $i)" }

Write-Host "Load balancer :$ListenPort  ->  $($ups -join ', ')" -ForegroundColor Cyan
# Single-file source-code launch (Java 11+): no javac/build step needed.
& $java $src $ListenPort @ups
