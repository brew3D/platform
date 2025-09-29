#!/bin/bash

# Ruchi AI - Development Startup Script
# This script starts both the frontend (Next.js) and backend (Flask) servers

echo "🚀 Starting Ruchi AI Development Environment..."
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
echo -e "${PURPLE}🎨 Frontend: http://localhost:3000${NC}"
echo -e "${PURPLE}🔧 Legacy Backend:  http://localhost:5000 (sim-backend)${NC}"
echo -e "${PURPLE}🤖 Agents Backend:  http://localhost:5050 (game-engine-backend)${NC}"
echo -e "${PURPLE}📱 Mobile:   http://10.0.0.124:3000${NC}"
echo ""
echo -e "${CYAN}Press Ctrl+C to stop both servers${NC}"
echo "================================================"

# Function to cleanup background processes
cleanup() {
    print_status "Shutting down servers..."
    kill $FRONTEND_PID $BACKEND_PID $AGENTS_BACKEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Optionally start legacy Flask backend (sim-backend) if requested
START_SIM_BACKEND=${START_SIM_BACKEND:-0}
if [ "$START_SIM_BACKEND" = "1" ]; then
  print_status "Starting legacy Flask backend (sim-backend) on :5000..."
  cd sim-backend
  source venv/bin/activate
  python app.py &
  BACKEND_PID=$!
  cd ..
  sleep 1
else
  BACKEND_PID=0
fi

# Start new Agents backend (game-engine-backend)
print_status "Preparing Agents backend (game-engine-backend)..."
cd game-engine-backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment for agents..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install backend dependencies
print_status "Installing agents backend dependencies..."
pip install -r requirements.txt

# Load environment variables for agents backend
if [ -f .env ]; then
  print_status "Loading environment from game-engine-backend/.env"
  set -a; source .env; set +a
else
  print_warning "game-engine-backend/.env not found; using env.example defaults"
  set -a; source env.example; set +a
fi

# Ensure artifacts directory exists
export ARTIFACTS_DIR=${ARTIFACTS_DIR:-"$(pwd)/artifacts"}
mkdir -p "$ARTIFACTS_DIR/manifests" "$ARTIFACTS_DIR/glb" "$ARTIFACTS_DIR/voxels" "$ARTIFACTS_DIR/previews"

print_status "Starting Agents backend on :5050..."
python -m game-engine-backend.app &
AGENTS_BACKEND_PID=$!
cd ..

# Wait a moment for backend(s) to start
sleep 2

# Start frontend in background
print_status "Starting Next.js frontend server..."
yarn dev &
FRONTEND_PID=$!

# Wait for both processes
wait $FRONTEND_PID $BACKEND_PID
