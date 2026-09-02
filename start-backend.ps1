# Starts the TalentAI Spring Boot backend on http://localhost:8080/api/v1
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File D:\TalentAI\start-backend.ps1
#
# The backend MUST build/run on JDK 17 -- Lombok's annotation processor
# crashes on this machine's default JDK 26.

$ErrorActionPreference = 'Stop'

$BackendDir = Join-Path $PSScriptRoot 'Backend'
$JavaHome   = 'C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot'
$MavenBin   = 'C:\dev-tools\apache-maven-3.9.9\bin'
$EnvFile    = Join-Path $BackendDir '.env'

# --- Load Backend\.env into this process's environment ---
if (-not (Test-Path $EnvFile)) {
    Write-Error "No .env found at $EnvFile. Copy .env.example to .env and fill it in."
}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
        $idx  = $line.IndexOf('=')
        $name = $line.Substring(0, $idx).Trim()
        $val  = $line.Substring($idx + 1).Trim()
        Set-Item -Path "Env:$name" -Value $val
    }
}

# --- Toolchain (JDK 17 + Maven) for this process only ---
$env:JAVA_HOME = $JavaHome
$env:Path      = "$MavenBin;$JavaHome\bin;$env:Path"

Write-Host "Java:  $JavaHome"
Write-Host "DB:    $($env:DB_USERNAME)@$($env:DB_HOST):$($env:DB_PORT)/$($env:DB_NAME)"
Write-Host "Starting backend (Ctrl+C to stop)..." -ForegroundColor Cyan

Set-Location $BackendDir
& "$MavenBin\mvn.cmd" spring-boot:run
