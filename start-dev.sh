#!/bin/bash

# Brew 3D - Development Startup Script
# This script starts both the frontend (Next.js) and backend (Flask) servers

echo "🚀 Starting Brew 3D Development Environment..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    print_warning "Yarn not found. Installing yarn..."
    npm install -g yarn
fi

print_status "Installing frontend dependencies..."
yarn install

print_status "Seeding dev users (Supabase)..."
yarn run seed:users 2>/dev/null || npm run seed:users 2>/dev/null || true

print_status "Setting up backend virtual environment..."
cd sim-backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
print_status "Installing backend dependencies..."
pip install -r requirements.txt 2>/dev/null || {
    print_status "requirements.txt not found, installing dependencies manually..."
    pip install flask flask-cors flask-socketio bcryptjs jsonwebtoken
}

# Go back to project root
cd ..

print_status "Starting servers..."
echo ""
echo -e "${PURPLE}🎨 Frontend: http://localhost:5050${NC}"
echo -e "${PURPLE}🔧 Backend:  http://localhost:5069 (sim-backend)${NC}"
echo -e "${PURPLE}📱 Mobile:   http://10.0.0.124:5050${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop both servers${NC}"
echo "================================================"

# Function to cleanup background processes
cleanup() {
    print_status "Shutting down servers..."
    kill $FRONTEND_PID 2>/dev/null
    if [ "$BACKEND_PID" -ne 0 ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Flask backend (sim-backend)
print_status "Starting Flask backend (sim-backend) on :5069..."
cd sim-backend
source venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in background
print_status "Starting Next.js frontend server on :5050..."
yarn dev --port 5050 &
FRONTEND_PID=$!

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID
