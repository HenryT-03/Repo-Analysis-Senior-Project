#!/bin/bash
# Backend Setup and Run Script for Linux/Mac

echo "===== Dashboard Backend Setup ====="
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    echo "Please install Python 3.8+ from python.org or your package manager"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to create virtual environment"
        exit 1
    fi
fi

# Activate venv and install requirements
echo "Activating virtual environment and installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install requirements"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo
    echo "===== IMPORTANT ====="
    echo "No .env file found!"
    echo "Please copy .env.example to .env and fill in your configuration:"
    echo "  - Database credentials"
    echo "  - GitLab token (optional for testing)"
    echo "  - Microsoft auth credentials (optional for testing)"
    echo
    echo "For testing without a database, you may get errors on database operations."
    echo
    read -p "Press Enter to continue..."
fi

# Run the app
echo
echo "Starting Flask backend on http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo

python app.py
