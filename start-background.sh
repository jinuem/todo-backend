#!/bin/bash

# Kill existing backend process if running
pkill -f "node server.js" 2>/dev/null

# Start backend in background
nohup npm start > backend.log 2>&1 &

# Get the process ID
PID=$!
echo "Backend started in background with PID: $PID"
echo $PID > backend.pid

# Wait a moment to check if it started successfully
sleep 2
if ps -p $PID > /dev/null; then
    echo "Backend is running successfully on port 4000"
else
    echo "Failed to start backend"
    exit 1
fi
