#!/bin/bash

# Ringle AI Tutor Development Mode Startup Script
echo "🚀 Starting Ringle AI Tutor in Development Mode..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "   npm install -g pnpm"
    exit 1
fi

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ python3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Set up cleanup trap
trap cleanup SIGINT SIGTERM

# Start backend server
echo "📡 Starting backend server (FastAPI)..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Start backend server in background
echo "🔧 Starting FastAPI server on http://localhost:8000"
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Move to frontend directory
cd ../frontend

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
pnpm install

# Start frontend server
echo "🎨 Starting Next.js frontend on http://localhost:3000"
pnpm run dev &
FRONTEND_PID=$!

# Wait for both servers to start
sleep 3

echo ""
echo "✅ Development servers are running:"
echo "   🎨 Frontend: http://localhost:3000"
echo "   📡 Backend:  http://localhost:8000"
echo "   📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop
wait