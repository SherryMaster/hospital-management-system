@echo off
REM Hospital Management System - Windows Development Startup Script
REM This script starts both backend and frontend in development mode on Windows

echo 🏥 Starting Hospital Management System Development Environment...
echo ================================================================

REM Get the script directory and project root
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

echo Script directory: %SCRIPT_DIR%
echo Project root: %PROJECT_ROOT%
echo Backend directory: %BACKEND_DIR%
echo Frontend directory: %FRONTEND_DIR%

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

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.11+ and add it to your PATH
    pause
    exit /b 1
)

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 18+ and add it to your PATH
    pause
    exit /b 1
)

echo ✅ Python and Node.js found

REM Setup backend
echo.
echo 🔧 Setting up backend...
cd /d "%BACKEND_DIR%"

REM Check if manage.py exists
if not exist "manage.py" (
    echo ❌ manage.py not found in backend directory
    echo Current directory: %CD%
    dir
    pause
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Install dependencies if needed
if not exist "requirements_installed.flag" (
    echo Installing Python dependencies...
    call venv\Scripts\activate.bat
    python.exe -m pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo. > requirements_installed.flag
    call venv\Scripts\deactivate.bat
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update backend\.env with your configuration
)

REM Run migrations
echo Running database migrations...
call venv\Scripts\activate.bat
python manage.py migrate
if errorlevel 1 (
    echo ⚠️  Database migration failed, but continuing...
)
call venv\Scripts\deactivate.bat

REM Start backend server in background
echo Starting Django backend server...
start "Hospital Backend" cmd /k "cd /d "%BACKEND_DIR%" && venv\Scripts\activate.bat && python manage.py runserver"

REM Setup frontend
echo.
echo 🔧 Setting up frontend...
cd /d "%FRONTEND_DIR%"

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update frontend\.env with your configuration
)

REM Start frontend server in background
echo Starting React frontend server...
start "Hospital Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

REM Return to project root
cd /d "%PROJECT_ROOT%"

REM Wait for servers to start
echo.
echo ⏳ Waiting for servers to start...
timeout /t 15 /nobreak >nul

REM Check if servers are running
echo.
echo 🔍 Checking server status...

REM Check backend
curl -f http://localhost:8000/health/ >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend may still be starting...
) else (
    echo ✅ Backend is running
)

REM Check frontend
curl -f http://localhost:5173/ >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Frontend may still be starting...
) else (
    echo ✅ Frontend is running
)

echo.
echo ✅ Development environment started!
echo.
echo 🌐 Access your application:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Documentation: http://localhost:8000/api/docs/
echo    Admin Panel: http://localhost:8000/admin/
echo    Health Check: http://localhost:8000/health/
echo.
echo 📊 Development info:
echo    Backend and frontend are running in separate windows
echo    Close the command windows to stop the servers
echo.
echo 🔧 Troubleshooting:
echo    If servers don't start, check the separate windows for error messages
echo    Make sure ports 8000 and 5173 are not in use by other applications
echo    Ensure Python virtual environment is properly activated
echo    Check that all dependencies are installed correctly
echo.
echo Happy coding! 🚀

pause
