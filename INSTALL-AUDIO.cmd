@echo off
setlocal
cd /d "%~dp0"
title CYBER CYPHER - Audio Installer
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing. Install Node.js LTS from https://nodejs.org/ then reopen this file.
  pause
  exit /b 1
)
node tools\install-audio.js
if errorlevel 1 echo Audio installation had errors. Read the messages above.
echo.
echo Press any key to finish.
pause >nul
