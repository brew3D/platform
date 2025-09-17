@echo off
REM Ruchi AI - Development Startup Script for Windows
REM This script starts both the frontend (Next.js) and backend (Flask) servers

echo.
echo 🚀 Starting Ruchi AI Development Environment...
echo ================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo [INFO] Installing frontend dependencies...
call yarn install

echo [INFO] Setting up backend virtual environment...
cd sim-backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Install backend dependencies
echo [INFO] Installing backend dependencies...
pip install flask flask-cors flask-socketio bcryptjs jsonwebtoken

REM Go back to project root
cd ..

echo.
echo [INFO] Starting servers...
echo.
echo 🎨 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000
echo.
echo Press Ctrl+C to stop both servers
echo ================================================
echo.

REM Start backend in background
echo [INFO] Starting Flask backend server...
start "Backend Server" cmd /k "cd sim-backend && venv\Scripts\activate.bat && python app.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo [INFO] Starting Next.js frontend server...
call yarn dev

pause
