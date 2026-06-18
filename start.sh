#!/bin/bash
# MomentumX — Start servers
echo "Starting MomentumX..."

# Kill anything already on these ports
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
cd "$(dirname "$0")/server" && npm run dev &
sleep 2

# Start frontend
cd "$(dirname "$0")" && npm run dev &
sleep 2

echo ""
echo "✅ MomentumX is running"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop."
echo ""
wait
