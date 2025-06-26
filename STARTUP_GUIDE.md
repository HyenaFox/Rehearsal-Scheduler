# 🚀 Development Startup Scripts

I've created several convenient ways to start both the backend and React Native app together:

## Option 1: Windows Batch File (Recommended)
Double-click `start.bat` or run from command prompt:
```cmd
start.bat
```
This opens two separate terminal windows - one for backend, one for frontend.

## Option 2: PowerShell Script
Run from PowerShell:
```powershell
.\start.ps1
```
Similar to the batch file but with prettier colors and PowerShell styling.

## Option 3: NPM Scripts (Single Terminal)
Run from the project root:
```bash
npm run dev
# or
npm run start:both
```
This runs both servers in a single terminal using `concurrently`.

## Individual Scripts
If you want to start them separately:
```bash
npm run backend     # Start only backend
npm run frontend    # Start only frontend
```

## What Each Script Does:
1. **Backend**: Starts the Node.js/Express server on `http://localhost:3000`
2. **Frontend**: Starts the Expo dev server on `http://localhost:8081`
3. **Waits**: The scripts wait 3 seconds for backend to initialize before starting frontend

## Stopping the Servers:
- **Batch/PowerShell**: Close the terminal windows or press `Ctrl+C` in each
- **NPM concurrently**: Press `Ctrl+C` once to stop both servers

## 📱 Device Setup Reminder:
- **Emulator**: Use `http://localhost:3000/api` in `api.ts`
- **Physical Device**: Use `http://192.168.1.159:3000/api` in `api.ts`

Enjoy your streamlined development experience! 🎭
