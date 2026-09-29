# MedGuardian 1-Click Startup Script (PowerShell)
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "      Starting MedGuardian Healthcare System" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. MongoDB Check & Start
$mongoConn = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if (-not $mongoConn) {
    Write-Host "[1/3] Starting MongoDB instance on port 27017..." -ForegroundColor Yellow
    $mongoExe = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
    $dbPath = Join-Path $PSScriptRoot "data\db"
    Start-Process -FilePath $mongoExe -ArgumentList "--dbpath `"$dbPath`"" -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "[1/3] MongoDB is already active." -ForegroundColor Green
}

# 2. Start Backend Server
Write-Host "[2/3] Starting Backend API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\server'; npm run dev"
Start-Sleep -Seconds 2

# 3. Start Frontend Client
Write-Host "[3/3] Starting Frontend Client (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\client'; npm run dev"
Start-Sleep -Seconds 3

# 4. Open in Browser
Write-Host "Opening http://localhost:5173/login..." -ForegroundColor Green
Start-Process "http://localhost:5173/login"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " MedGuardian is running!" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
