#!/bin/bash

# Backend Agent - Sequential workflow with PRD monitoring

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIREMENTS_REPO="$SCRIPT_DIR/../todo-requirements"
BACKEND_REPO="$SCRIPT_DIR"
AGENT_NAME="Backend Agent"

echo "[$AGENT_NAME] Starting sequential monitoring..."
echo "[$AGENT_NAME] Working in: $BACKEND_REPO"
echo "[$AGENT_NAME] Monitoring: $REQUIREMENTS_REPO"

while true; do
    cd "$REQUIREMENTS_REPO"
    git pull origin init >/dev/null 2>&1
    
    # Debug: Show current turn status
    CURRENT_TURN_LINE=$(grep -A1 "Current Turn" COLLABORATION.md)
    echo "[$AGENT_NAME] Current turn status: $CURRENT_TURN_LINE"
    
    # Git-based turn coordination
    git pull origin main >/dev/null 2>&1
    
    # Get PRD last commit timestamp and current time
    PRD_TIMESTAMP=$(git log -1 --format="%ct" -- PRD.md)
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - PRD_TIMESTAMP))
    
    # Check current turn
    CURRENT_TURN=$(grep "^\*\*" COLLABORATION.md | head -1 | grep -o "FRONTEND\|BACKEND")
    
    # Proceed if it's our turn OR timeout exceeded (300s = 5min)
    if [[ "$CURRENT_TURN" == "BACKEND" ]] || [[ $TIME_DIFF -gt 300 ]]; then
        echo "[$AGENT_NAME] My turn detected! Processing PRD requirements..."
        
        PRD_CONTENT=$(cat PRD.md)
        
        cd "$BACKEND_REPO"
        git pull origin init >/dev/null 2>&1
        
        # Execute Kiro CLI with PRD content
        cat << EOF | kiro-cli chat --non-interactive --trust-all-tools
You are the Backend Agent. Implement the Express backend based on PRD requirements:

PRD REQUIREMENTS:
$PRD_CONTENT

Tasks:
1. Create/update Express server matching PRD API specifications
2. Implement all CRUD endpoints as defined in PRD
3. Set up JSON file storage as specified
4. Add proper CORS and error handling
5. Ensure API matches frontend integration needs
6. Add unit tests as specified in PRD
7. Commit and push all changes with message "Backend Agent: Implemented PRD requirements"

CRITICAL: Follow PRD as single source of truth. Work in current directory.
After completing ALL tasks including unit tests, respond with "BACKEND_TASK_COMPLETE" to signal completion.
EOF
        
        # Check if task was completed successfully
        if [ $? -eq 0 ]; then
            echo "[$AGENT_NAME] Task execution completed successfully."
        else
            echo "[$AGENT_NAME] Task execution failed. Will retry on next cycle."
            sleep 15
            continue
        fi
        
        # Update turn using git coordination
        cd "$REQUIREMENTS_REPO"
        sed -i '' 's/\*\*BACKEND\*\*.*/\*\*FRONTEND\*\* - Waiting for PRD changes/' COLLABORATION.md
        
        # Add completion log
        echo "" >> COLLABORATION.md
        echo "### [$(date '+%Y-%m-%d %H:%M')] - $AGENT_NAME" >> COLLABORATION.md
        echo "- Processed PRD requirements" >> COLLABORATION.md
        echo "- Implemented backend API" >> COLLABORATION.md
        echo "- Committed and pushed changes" >> COLLABORATION.md
        echo "- Ready for next PRD update" >> COLLABORATION.md
        
        git add COLLABORATION.md
        git commit -m "$AGENT_NAME: Completed task, ready for next cycle" >/dev/null 2>&1
        git push origin init >/dev/null 2>&1
        
        echo "[$AGENT_NAME] Task completed. Waiting for next PRD update."
        
        # Wait before next check
        sleep 15
    else
        # Not our turn and timeout not reached
        echo "[$AGENT_NAME] Waiting... (${TIME_DIFF}s since last PRD update)"
        sleep 15
    fi
done
