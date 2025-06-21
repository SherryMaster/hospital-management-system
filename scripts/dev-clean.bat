@echo off
REM Hospital Management System - Clean Development Environment (Windows)
REM This script cleans up development artifacts and caches

echo 🏥 Cleaning Hospital Management System Development Environment...
echo ================================================================

REM Get project directories
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

echo 🧹 Cleaning development artifacts...

REM Clean Python cache files
echo Cleaning Python cache files...
if exist "%BACKEND_DIR%" (
    cd /d "%BACKEND_DIR%"
    
    REM Remove __pycache__ directories
    for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d" 2>nul
    
    REM Remove .pyc files
    del /s /q *.pyc 2>nul
    
    REM Remove .pyo files
    del /s /q *.pyo 2>nul
    
    REM Remove requirements flag
    if exist "requirements_installed.flag" del "requirements_installed.flag"
    
    echo ✅ Python cache cleaned
) else (
    echo ⚠️  Backend directory not found
)

REM Clean Node.js cache files
echo Cleaning Node.js cache files...
if exist "%FRONTEND_DIR%" (
    cd /d "%FRONTEND_DIR%"
    
    REM Remove dist directory
    if exist "dist" rd /s /q "dist" 2>nul
    
    REM Remove .vite directory
    if exist ".vite" rd /s /q ".vite" 2>nul
    
    REM Remove build directory
    if exist "build" rd /s /q "build" 2>nul
    
    echo ✅ Node.js cache cleaned
) else (
    echo ⚠️  Frontend directory not found
)

REM Clean Docker artifacts (optional)
echo Cleaning Docker artifacts...
docker system prune -f >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker not available or no cleanup needed
) else (
    echo ✅ Docker artifacts cleaned
)

REM Return to project root
cd /d "%PROJECT_ROOT%"

echo.
echo ✅ Development environment cleaned!
echo.
echo 📊 What was cleaned:
echo    - Python __pycache__ directories and .pyc files
echo    - Node.js dist, .vite, and build directories
echo    - Docker system artifacts (if Docker available)
echo    - Development flags and temporary files
echo.
echo 💡 Note: This does NOT remove:
echo    - Virtual environments (backend\venv)
echo    - Node modules (frontend\node_modules)
echo    - Database files
echo    - Environment configuration files
echo.
echo To remove dependencies too, delete:
echo    - backend\venv directory
echo    - frontend\node_modules directory
echo.

pause
