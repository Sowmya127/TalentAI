# =====================================================================
# start-cluster.ps1 — launch N TalentAI backend instances for load balancing.
#
# Each instance is the SAME executable JAR on a different port, all sharing
# the same MySQL, JWT secret and resume folder. The app is stateless (JWT),
# so any instance can serve any request — that is what makes load balancing
# safe here.
#
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-cluster.ps1
#   powershell -ExecutionPolicy Bypass -File D:\TalentAI\cluster\start-cluster.ps1 -Instances 3
#
# Prereq: MySQL must be running (start-mysql.ps1). Stop with stop-cluster.ps1.
# =====================================================================
param(
    [int]$Instances = 2,
    [int]$BasePort  = 8081
)
$ErrorActionPreference = 'Stop'

$Root       = Split-Path $PSScriptRoot -Parent          # D:\TalentAI
$BackendDir = Join-Path $Root 'Backend'
$JavaHome   = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$Jar        = Join-Path $BackendDir 'target\talentai-backend-0.1.0-SNAPSHOT.jar'
$EnvFile    = Join-Path $BackendDir '.env'
$UploadDir  = Join-Path $BackendDir 'uploads\resumes'   # shared by every instance
$PidFile    = Join-Path $PSScriptRoot '.pids'

if (-not (Test-Path $Jar)) {
    Write-Error "JAR not found at $Jar. Build it first:  cd Backend; mvn package -DskipTests"
}
if (-not (Test-Path $EnvFile)) {
    Write-Error "No Backend\.env found. The instances need DB creds + JWT secret from it."
}

# --- Load Backend\.env into this process; children inherit it ---
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx = $line.IndexOf('=')
        Set-Item -Path ("Env:" + $line.Substring(0, $idx).Trim()) -Value $line.Substring($idx + 1).Trim()
    }
}
$env:JAVA_HOME = $JavaHome
if (-not $env:SPRING_PROFILES_ACTIVE) { $env:SPRING_PROFILES_ACTIVE = 'dev' }
$env:FILE_UPLOAD_PATH = $UploadDir                      # force a shared, absolute upload path
New-Item -ItemType Directory -Force -Path $UploadDir | Out-Null

$java = Join-Path $JavaHome 'bin\java.exe'
$pids = @()
$ups  = @()
Write-Host "Starting $Instances TalentAI instance(s), profile '$($env:SPRING_PROFILES_ACTIVE)'..." -ForegroundColor Cyan

for ($i = 0; $i -lt $Instances; $i++) {
    $port = $BasePort + $i
    $env:SERVER_PORT = "$port"                          # each child reads its own port
    # New window per instance so you can watch its logs; title shows the port.
    $p = Start-Process -FilePath $java `
        -ArgumentList @('-jar', $Jar) `
        -WorkingDirectory $BackendDir -PassThru
    $pids += $p.Id
    $ups  += "127.0.0.1:$port"
    Write-Host ("  instance {0}: http://localhost:{1}/api  (pid {2})" -f ($i + 1), $port, $p.Id)
}

$pids | Set-Content $PidFile
Write-Host ""
Write-Host "PIDs written to $PidFile" -ForegroundColor DarkGray
Write-Host "Instances are booting (~15-30s each). Wait for health, then start the balancer:" -ForegroundColor Yellow
Write-Host ("  powershell -ExecutionPolicy Bypass -File {0}\start-lb.ps1 -Instances {1}" -f $PSScriptRoot, $Instances)
Write-Host ""
Write-Host "Upstreams: $($ups -join ', ')" -ForegroundColor DarkGray
