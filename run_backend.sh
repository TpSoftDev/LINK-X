#!/bin/bash

set -e  # Exit if any command fails

REMOVE_OLD=false # Default: Do not remove old containers
DETATCHED=false # Default: Do not run docker in detatched mode

while getopts "rd" opt; do
    case ${opt} in
        r ) REMOVE_OLD=true ;; # If flag -r is used, set REMOVE_OLD to true
        d ) DETATCHED=true ;; # If flag -d is used, set DETATCHED to true
        * ) echo "Usage: $0 [-r]"; exit 1 ;;
    esac
done

# Step 0: Remove Old Containers if -r argument provided
if $REMOVE_OLD; then
    echo "Step 0: Removing existing containers using image \"dev7\""
    docker ps -aq --filter "ancestor=dev7" | xargs -r docker rm -f
fi

# Step 1: Build Backend
echo "Step 1: Building Backend..."
docker build -t dev7 docker-image || { echo "Docker build failed"; exit 1; }

# Step 2: Run Backend
echo "Step 2: Running Backend..."
cd docker-image/src || { echo "Failed to navigate to docker-image/src"; exit 1; }

RUN_MODE=""
if $DETACHED; then
    RUN_MODE="-d"
fi

pwd

# port 8501 currently used for the streamlit webui
# binds data/learning_pdfs folder to container
# TODO: move all of the FAISS scripts to LINK-X/scripts/FAISS_scripts and the bind to the container
docker run $RUN_MODE --env-file .env -v "$(pwd)/../../data/learning_pdfs:/app/src/learning_pdfs" -v "$(pwd)/../../data/faiss_generated:/app/src/faiss_generated" -p 8080:8080 -p 8501:8501 dev7 || { echo "Docker run failed"; exit 1; }

# While in detatched mode,
# use "docker exec -it <container_id_or_name> /bin/bash" 
# to start an interactive shell not attached to the main process