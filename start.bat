@echo off
cd /d "%~dp0"
echo ==================================================
echo   Starting Heritage Pulse Dashboard Server...     
echo ==================================================

if not exist "node_modules" (
  echo Installing project dependencies...
  call npm install
)

start http://localhost:3000
node server/index.js
pause
