#!/bin/bash

echo "======================================="
echo "  Starting Trip Planner"
echo "  Montreal → Mauritius, April 2027"
echo "======================================="
echo ""

# Kill background processes on exit
cleanup() {
  echo ""
  echo "Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

# Start backend
echo "Starting backend API (port 8000)..."
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
deactivate
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "Starting frontend (port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "======================================="
echo "  App is running!"
echo ""
echo "  Open: http://localhost:5173"
echo "  (share this URL with friends on your network: http://$(hostname -I | awk '{print $1}'):5173)"
echo ""
echo "  Press Ctrl+C to stop"
echo "======================================="
echo ""

wait
