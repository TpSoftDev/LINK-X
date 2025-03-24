#!/bin/bash

set -e  # Exit if any command fails

# Step 1: Build Backend
echo "Step 1: Building Backend..."
docker build -t dev7 docker-image || { echo "Docker build failed"; exit 1; }

# Step 2: Run Backend
echo "Step 2: Running Backend..."
cd docker-image/src || { echo "Failed to navigate to docker-image/src"; exit 1; }
docker run --env-file .env -p 8080:8080 dev7 || { echo "Docker run failed"; exit 1; }