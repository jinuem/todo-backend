#!/bin/bash

# Backend Agent - Monitors requirements repo and develops Express backend

REQUIREMENTS_REPO="../todo-requirements"
BACKEND_REPO="."
AGENT_NAME="Auto Backend Agent"
SERVICE_STARTED=false

echo "[$AGENT_NAME] Starting automated monitoring..."

while true; do
    cd "$REQUIREMENTS_REPO"
    git pull origin init >/dev/null 2>&1
    
    LAST_COMMIT=$(git log -1 --format="%H")
    CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r $LAST_COMMIT 2>/dev/null || echo "")
    
    if [[ "$CHANGED_FILES" == *"PRD.md"* ]] || [[ "$CHANGED_FILES" == *"COLLABORATION.md"* ]]; then
        echo "[$AGENT_NAME] Requirements updated! Auto-processing..."
        
        PRD_CONTENT=$(cat PRD.md)
        COLLAB_CONTENT=$(cat COLLABORATION.md)
        
        cd "$BACKEND_REPO"
        git pull origin init >/dev/null 2>&1
        
        # Auto-run Kiro CLI
        cat << 'EOF' | kiro-cli chat --non-interactive --trust-all-tools
You are the Backend Agent. Based on these requirements, develop/update the Express backend:

REQUIREMENTS:
$PRD_CONTENT

COLLABORATION LOG:
$COLLAB_CONTENT

Tasks:
1. Create/update Express server and API endpoints
2. Implement CRUD operations for todos
3. Set up database integration (use JSON file for now)
4. Add CORS and error handling
5. Ensure API matches frontend needs
6. Commit your changes with message \"Backend Agent: Auto-update from requirements\"

Work efficiently and commit when done.

After completing the work, start the backend server in a new terminal:
- Open new terminal for backend service
- Run: cd $BACKEND_REPO && npm start
EOF

        # Start backend service in new terminal after code update (only once)
        if [ "$SERVICE_STARTED" = false ]; then
            echo "[$AGENT_NAME] Starting backend service in new terminal..."
            osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && echo 'Backend Service Starting...' && npm start\""
            SERVICE_STARTED=true
        else
            echo "[$AGENT_NAME] Service already running, skipping start"
        fi
        
        # Update collaboration log
        cd "$REQUIREMENTS_REPO"
        echo "" >> COLLABORATION.md
        echo "### [$(date '+%Y-%m-%d %H:%M')] - $AGENT_NAME" >> COLLABORATION.md
        echo "- Auto-processed requirements change" >> COLLABORATION.md
        echo "- Updated backend API" >> COLLABORATION.md
        
        git add COLLABORATION.md
        git commit -m "$AGENT_NAME: Auto-processed requirements" >/dev/null 2>&1
        git push origin init >/dev/null 2>&1
        
        echo "[$AGENT_NAME] Completed auto-update cycle"
    fi
    
    sleep 15
done
