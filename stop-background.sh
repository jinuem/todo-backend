#!/bin/bash

# Stop backend service
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null; then
        kill $PID
        echo "Backend stopped (PID: $PID)"
    else
        echo "Backend process not running"
    fi
    rm -f backend.pid
else
    # Fallback: kill by process name
    pkill -f "node server.js"
    echo "Backend processes killed"
fi
