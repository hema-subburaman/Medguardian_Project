@echo off
echo =======================================================
echo          Starting MedGuardian Healthcare System
echo =======================================================

echo [1/3] Checking MongoDB status on port 27017...
netstat -ano | findstr :27017 >nul
if %errorlevel% neq 0 (
    echo Starting MongoDB instance...
    start "MedGuardian MongoDB" /min "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "%~dp0data\db"
    timeout /t 3 /nobreak >nul
) else (
    echo MongoDB is already active.
)

echo [2/3] Starting Backend API Server (Port 5000)...
start "MedGuardian Backend" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Client (Port 5173)...
start "MedGuardian Client" cmd /k "cd /d %~dp0client && npm run dev"

timeout /t 3 /nobreak >nul
echo Opening MedGuardian in default browser...
start http://localhost:5173/login

echo =======================================================
echo  MedGuardian is running at http://localhost:5173
echo =======================================================
