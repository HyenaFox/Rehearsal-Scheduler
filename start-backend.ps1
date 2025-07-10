#!/usr/bin/env pwsh
# PowerShell script to start the backend server

Write-Host "🚀 Starting Rehearsal Scheduler Backend Server..." -ForegroundColor Green
Write-Host "📁 Navigating to backend directory..." -ForegroundColor Yellow

Set-Location -Path "c:\Users\blaze\Rehearsal-Scheduler\backend"

Write-Host "🔧 Starting server..." -ForegroundColor Yellow
npm start
