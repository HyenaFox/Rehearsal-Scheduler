@echo off
echo 🚀 Starting Rehearsal Scheduler Backend on Port 3001...
echo.
echo 💡 Using port 3001 to avoid conflicts with port 3000
echo.

cd /d "%~dp0backend"

echo 🔧 Setting PORT environment variable to 3001...
set PORT=3001

echo 📦 Starting backend server...
npm start

pause
