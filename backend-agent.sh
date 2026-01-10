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
    
    # Check if it's backend's turn and frontend has completed
    CURRENT_TURN=$(grep -A1 "Current Turn" COLLABORATION.md | grep "BACKEND")
    FRONTEND_COMPLETED=$(grep -A5 "Frontend Agent" COLLABORATION.md | tail -5 | grep "Passing turn to Backend Agent")
    
    if [[ -n "$CURRENT_TURN" ]] && [[ -n "$FRONTEND_COMPLETED" ]]; then
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
            sleep 20
            continue
        fi
        
        # Update collaboration log and reset turn to frontend
        cd "$REQUIREMENTS_REPO"
        
        # Update current turn back to frontend
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
        
        # Wait longer after completing task to avoid immediate re-processing
        sleep 60
    else
        # Not our turn, wait shorter
        sleep 20
    fi
done
