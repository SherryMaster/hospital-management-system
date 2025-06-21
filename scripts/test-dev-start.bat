@echo off
REM Hospital Management System - Test Development Start Script
REM This script tests if the development environment can start properly

echo 🏥 Testing Hospital Management System Development Environment...
echo ================================================================

REM Get project directories
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

echo Testing project structure...

REM Check if directories exist
if not exist "%BACKEND_DIR%" (
    echo ❌ Backend directory not found: %BACKEND_DIR%
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%" (
    echo ❌ Frontend directory not found: %FRONTEND_DIR%
    pause
    exit /b 1
)

echo ✅ Project directories found

REM Check if manage.py exists
if not exist "%BACKEND_DIR%\manage.py" (
    echo ❌ manage.py not found in backend directory
    pause
    exit /b 1
)

echo ✅ manage.py found

REM Check if package.json exists
if not exist "%FRONTEND_DIR%\package.json" (
    echo ❌ package.json not found in frontend directory
    pause
    exit /b 1
)

echo ✅ package.json found

REM Test backend setup
echo.
echo Testing backend setup...
cd /d "%BACKEND_DIR%"

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment for testing...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

echo ✅ Virtual environment ready

REM Test Django check
echo Testing Django configuration...
call venv\Scripts\activate.bat
venv\Scripts\python.exe manage.py check --quiet
if errorlevel 1 (
    echo ❌ Django configuration has issues
    call venv\Scripts\deactivate.bat
    pause
    exit /b 1
)

echo ✅ Django configuration is valid

REM Test database health
echo Testing database health...
venv\Scripts\python.exe manage.py dbhealth --quiet
if errorlevel 1 (
    echo ❌ Database health check failed
    call venv\Scripts\deactivate.bat
    pause
    exit /b 1
)

echo ✅ Database is healthy

call venv\Scripts\deactivate.bat

REM Test frontend setup
echo.
echo Testing frontend setup...
cd /d "%FRONTEND_DIR%"

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file for testing...
    copy .env.example .env
)

echo ✅ Frontend environment ready

REM Return to project root
cd /d "%PROJECT_ROOT%"

echo.
echo ✅ All tests passed!
echo.
echo 🚀 Your development environment is ready to start!
echo.
echo To start development:
echo   - Run: scripts\dev-start.bat
echo   - Or:  scripts\dev-start.ps1
echo.

pause
