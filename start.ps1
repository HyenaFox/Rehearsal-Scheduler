# 🚀 Rehearsal Scheduler Development Startup Script
Write-Host "🚀 Starting Rehearsal Scheduler Development Environment" -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Kill any existing processes on ports 3000 and 8081
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
try {
    $processes3000 = netstat -ano | findstr :3000
    if ($processes3000) {
        $pid = ($processes3000 -split '\s+')[-1]
        taskkill /PID $pid /F 2>$null
        Write-Host "   Killed process on port 3000" -ForegroundColor Gray
    }
} catch { }

try {
    $processes8081 = netstat -ano | findstr :8081
    if ($processes8081) {
        $pid = ($processes8081 -split '\s+')[-1]
        taskkill /PID $pid /F 2>$null
        Write-Host "   Killed process on port 8081" -ForegroundColor Gray
    }
} catch { }

Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
Set-Location "$scriptDir\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host "⏳ Waiting 5 seconds for backend to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "📱 Starting React Native App..." -ForegroundColor Yellow
Set-Location $scriptDir
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx expo start --clear" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host "🌐 Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📱 Frontend: http://localhost:8081" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)" -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
