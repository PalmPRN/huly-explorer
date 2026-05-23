@echo off
rem Change directory to the script's directory
cd /d "%~dp0"

rem Huly Integration CLI launcher for Windows

echo =====================================================
echo         HULY INTEGRATION CLI LAUNCHER (Windows)
echo =====================================================

rem Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ❌ Error: Node.js is not installed. Please install Node.js (v18 or higher).
  exit /b 1
)

rem Check for .env file
if not exist .env (
  echo ⚠️  .env file not found. Initializing .env from template...
  copy .env.example .env
)

rem Install dependencies if node_modules doesn't exist
if not exist node_modules (
  echo 📦 Installing dependencies...
  call npm install
)

rem Run the CLI
echo 🚀 Launching Huly Terminal Dashboard...
call npm run cli
