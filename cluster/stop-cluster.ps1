# =====================================================================
# stop-cluster.ps1 — stop every backend instance started by start-cluster.ps1.
#
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\stop-cluster.ps1
#
# Stops the PIDs recorded in .pids. The load balancer itself is stopped with
# Ctrl+C in its own window (or pass -AlsoPorts to free 8081..808N by port).
# =====================================================================
param(
    [int]$BasePort  = 8081,
    [int]$Instances = 0,      # if > 0, also kill whatever listens on those ports
    [switch]$AlsoPorts
)
$ErrorActionPreference = 'SilentlyContinue'

$PidFile = Join-Path $PSScriptRoot '.pids'
if (Test-Path $PidFile) {
    Get-Content $PidFile | ForEach-Object {
        $procId = $_.Trim()
        if ($procId) {
            Stop-Process -Id $procId -Force
            Write-Host "Stopped instance pid $procId"
        }
    }
    Remove-Item $PidFile -Force
} else {
    Write-Host "No .pids file — nothing recorded to stop." -ForegroundColor Yellow
}

if ($AlsoPorts -and $Instances -gt 0) {
    for ($i = 0; $i -lt $Instances; $i++) {
        $port = $BasePort + $i
        Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
            ForEach-Object { Stop-Process -Id $_.OwningProcess -Force; Write-Host "Freed port $port" }
    }
}
Write-Host "Done." -ForegroundColor Green
