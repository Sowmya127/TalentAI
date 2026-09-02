# Starts the local MySQL 8.4 server the backend depends on, on port 3306.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File D:\TalentAI\start-mysql.ps1
#
# Only needed if MySQL isn't already running (e.g. after a reboot).
# --mysql-native-password=ON is required: the app user authenticates with
# mysql_native_password, which 8.4 deactivates by default.

$ErrorActionPreference = 'Stop'

$MysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin'
$DataDir  = 'C:\ProgramData\MySQL\MySQL Server 8.4\Data'

$already = Get-Process mysqld -ErrorAction SilentlyContinue
if ($already) {
    Write-Host "MySQL is already running (pid $($already.Id))." -ForegroundColor Yellow
    return
}

Write-Host "Starting MySQL on port 3306 (this window stays open; Ctrl+C to stop)..." -ForegroundColor Cyan
& "$MysqlBin\mysqld.exe" --datadir="$DataDir" --basedir="C:\Program Files\MySQL\MySQL Server 8.4" --port=3306 --mysql-native-password=ON
