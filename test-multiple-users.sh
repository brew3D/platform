#!/bin/bash

# Test script for multiple users
echo "Starting Simo Collaborative Editor Test"
echo "======================================"

# Start the backend server
echo "Starting backend server..."
cd sim-backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend servers
echo "Starting frontend servers..."
cd ..

# Start first user on port 3001
PORT=3001 npm run dev &
FRONTEND1_PID=$!

# Wait a bit then start second user on port 3002
sleep 2
PORT=3002 npm run dev &
FRONTEND2_PID=$!

echo ""
echo "Servers started!"
echo "Backend: http://localhost:5000"
echo "User 1: http://localhost:3001"
echo "User 2: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND1_PID $FRONTEND2_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
