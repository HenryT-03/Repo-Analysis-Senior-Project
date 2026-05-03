@echo off
REM Backend Setup and Run Script for Windows

echo ===== Dashboard Backend Setup =====
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Check if venv exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate venv and install requirements
echo Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install requirements
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo.
    echo ===== IMPORTANT =====
    echo No .env file found!
    echo Please copy .env.example to .env and fill in your configuration:
    echo   - Database credentials
    echo   - GitLab token (optional for testing)
    echo   - Microsoft auth credentials (optional for testing)
    echo.
    echo For testing without a database, you may get errors on database operations.
    echo.
    pause
)

REM Run the app
echo.
echo Starting Flask backend on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python app.py

pause
