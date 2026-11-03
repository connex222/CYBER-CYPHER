@echo off
setlocal
cd /d "%~dp0"
title CYBER CYPHER - Approved AAA Artwork Installer

echo.
echo CYBER CYPHER -- INSTALL APPROVED ARTWORK
echo No extra Creative Claw credits will be used.
echo Existing 24 avatars will not be changed.
echo.

where py >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python 3 is not installed. Install Python from python.org.
  echo During setup tick "Add Python to PATH".
  pause
  exit /b 1
)

py -3 -m pip install Pillow numpy fonttools brotli
if errorlevel 1 (
  echo ERROR: Python packages failed to install.
  pause
  exit /b 1
)

py -3 production\build_art.py
if errorlevel 1 (
  echo ERROR: Art conversion failed. Check the printed error.
  pause
  exit /b 1
)

py -3 production\build_art.py --verify-only
if errorlevel 1 (
  echo ERROR: Artwork failed verification.
  pause
  exit /b 1
)

echo.
echo SUCCESS: 16 local WebP images built. Avatars unchanged.
echo See production\ART-QA.json for measured results.
echo GitHub cannot see these local files until committed.
pause
