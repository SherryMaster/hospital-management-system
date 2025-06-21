@echo off
REM Hospital Management System - Stop Development Servers (Windows)
REM This script stops all running development servers

echo 🏥 Stopping Hospital Management System Development Servers...
echo ============================================================

echo 🛑 Stopping development servers...

REM Stop Python/Django processes
echo Stopping Django backend servers...
taskkill /f /im python.exe >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No Python processes found
) else (
    echo ✅ Python processes stopped
)

REM Stop Node.js/npm processes
echo Stopping Node.js frontend servers...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No Node.js processes found
) else (
    echo ✅ Node.js processes stopped
)

REM Stop npm processes specifically
taskkill /f /im npm.cmd >nul 2>&1

REM Stop any remaining development processes
echo Stopping any remaining development processes...
taskkill /f /fi "WINDOWTITLE eq Hospital Backend*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Hospital Frontend*" >nul 2>&1

echo.
echo ✅ Development servers stopped!
echo.
echo 📊 Note: If you were using Docker, run: docker-compose down
echo.

pause
