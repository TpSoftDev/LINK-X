#!/bin/bash

set -e # Exit if any command fails

# Check that script was run with a file path argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 faiss_generated/<pdf_id>"
    exit 1
fi

# Assign input argument to variable 
WORKING_DIR=$1

# Verify directory exists
if [ ! -d $WORKING_DIR ]; then
    echo "Error: Directory '$WORKING_DIR' does not exist"
    exit 1
fi
# Verify directory is readable
if [ ! -r $WORKING_DIR ]; then
    echo "Error: Directory '$WORKING_DIR' is not readable"
    exit 1
fi

echo -e "\nRunning item_05_streamlit_FAISS.py"
WORKING_DIR="$WORKING_DIR" streamlit run item_05_streamlit_FAISS.py