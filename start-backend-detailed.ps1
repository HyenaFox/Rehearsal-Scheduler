#!/usr/bin/env pwsh
# PowerShell script to start the Rehearsal Scheduler

Write-Host "🎭 Starting Rehearsal Scheduler..." -ForegroundColor Green
Write-Host ""

# Check if backend directory exists
if (!(Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the correct directory." -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "🚀 Starting backend server..." -ForegroundColor Yellow
Write-Host "📁 Navigating to backend directory..." -ForegroundColor Cyan

Set-Location -Path "backend"

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ Backend package.json not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
npm install

Write-Host "🔧 Starting backend server..." -ForegroundColor Cyan
Write-Host "⏳ This will start the server. Keep this window open!" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Look for this message: 'Connected to MongoDB successfully'" -ForegroundColor Green
Write-Host "✅ And: 'Server running on port 3000'" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Once the server is running, you can access:" -ForegroundColor Cyan
Write-Host "   - API: http://localhost:3000/" -ForegroundColor White
Write-Host "   - Health: http://localhost:3000/health" -ForegroundColor White
Write-Host ""
Write-Host "📱 After the backend starts, run your frontend app:" -ForegroundColor Cyan
Write-Host "   - Open a new terminal" -ForegroundColor White
Write-Host "   - Navigate to the main directory" -ForegroundColor White
Write-Host "   - Run: npm start" -ForegroundColor White
Write-Host ""

# Start the server
npm start
