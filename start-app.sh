#!/bin/bash

echo "🚀 Starting Dating App - Co-Creation Platform"
echo "============================================"

# Check if .env exists in backend
if [ ! -f "./backend/.env" ]; then
    echo "⚠️  Creating .env file from example..."
    cp ./backend/.env.example ./backend/.env
    echo "📝 Please edit ./backend/.env with your configuration"
    echo "   Minimum required:"
    echo "   - JWT_SECRET (generate a random 32+ char string)"
    echo "   - JWT_REFRESH_SECRET (another random 32+ char string)"
    echo ""
fi

# Function to open browser
open_browser() {
    sleep 5
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:3000
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:3000
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        start http://localhost:3000
    fi
}

# Start backend
echo "🔧 Starting Backend Server..."
cd backend
npm install
echo "📊 Initializing Database..."
npm run db:init 2>/dev/null || echo "Database already initialized"
npm start &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!
cd ..

# Open browser
open_browser &

echo ""
echo "✅ Application starting..."
echo "📱 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
trap "echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait