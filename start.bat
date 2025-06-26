@echo off
echo 🚀 Starting Rehearsal Scheduler Development Environment
echo.

echo 🧹 Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do taskkill /PID %%a /F >nul 2>&1

echo 📦 Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm run dev"

echo ⏳ Waiting 5 seconds for backend to initialize...
timeout /t 5 /nobreak >nul

echo 📱 Starting React Native App...
cd /d "%~dp0"
start "React Native App" cmd /k "npx expo start --clear"

echo.
echo ✅ Both servers are starting!
echo 🌐 Backend: http://localhost:3000
echo 📱 Frontend: http://localhost:8081
echo.
echo Press any key to exit this script (servers will continue running)
pause >nul
