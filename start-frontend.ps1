# Starts the TalentAI frontend dev server on http://localhost:4200
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File D:\TalentAI\start-frontend.ps1

$ErrorActionPreference = 'Stop'
$FrontendDir = Join-Path $PSScriptRoot 'Frontend'

Set-Location $FrontendDir
Write-Host "Starting frontend on http://localhost:4200 (Ctrl+C to stop)..." -ForegroundColor Cyan
npm run dev
