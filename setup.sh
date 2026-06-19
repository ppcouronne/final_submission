#!/bin/bash
set -e

echo "======================================="
echo "  Trip Planner — Setup"
echo "  Montreal → Mauritius, April 2027"
echo "======================================="
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "ERROR: Python 3 is required. Install it from https://www.python.org"
  exit 1
fi

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required. Install it from https://nodejs.org"
  exit 1
fi

echo "Setting up backend..."
cd backend

# Create virtualenv if needed
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# Activate and install
source venv/bin/activate
pip install -q -r requirements.txt

# Copy env if not exists
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created backend/.env (you can edit it to customize settings)"
fi

deactivate
cd ..

echo ""
echo "Setting up frontend..."
cd frontend
npm install --silent
cd ..

echo ""
echo "======================================="
echo "  Setup complete!"
echo ""
echo "  To start the app, run: ./start.sh"
echo ""
echo "  For AI chat features, install Ollama:"
echo "  1. Download from https://ollama.com"
echo "  2. Run: ollama pull llama3.2"
echo "======================================="
