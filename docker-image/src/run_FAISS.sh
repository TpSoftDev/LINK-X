#!/bin/bash

set -e # Exit if any command fails

# Check that script was run with a file path argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_pdf>"
    exit 1
fi

# Assign input argument to variable
PDF_PATH=$1
# Remove file path and extension
PDF_NAME=$(basename "$PDF_PATH" .pdf)
# Create a hash based on the pdf - use as a unique course identifier
PDF_HASH=$(md5sum "$PDF_PATH" | awk '{print $1}')
# Set working directory location for specific pdf
# WORKING_DIR="faiss_generated/${PDF_NAME}/"
WORKING_DIR="faiss_generated/${PDF_HASH}/"

# Verify PDF exists
if [ ! -f $PDF_PATH ]; then
    echo "Error: File '$PDF_PATH' does not exist"
    exit 1
fi
# Verify PDF is readable
if [ ! -r $PDF_PATH ]; then
    echo "Error: File '$PDF_PATH' is not readable"
    exit 1
fi

echo -e "\nRunning item_01_database_creation_FAISS.py with provided pdf"
# TODO: Change item_01 so that it provides the WORKING_DIR back to the script
# Don't want the path hardcoded in two places if I can help it
python item_01_database_creation_FAISS.py "$PDF_PATH" "$PDF_HASH"

echo -e "\nRunning item_02_generate_citations_APA_FAISS.py"
python item_02_generate_citations_APA_FAISS.py "$WORKING_DIR"

echo -e "\nRunning item_03_replace_source_by_citation.py"
python item_03_replace_source_by_citation.py "$WORKING_DIR"

# echo -e "\nRunning item_04_retriever_FAISS.py"
# python item_04_retriever_FAISS.py "$WORKING_DIR"

# echo -e "\nRunning item_05_streamlit_FAISS.py"
# WORKING_DIR="$WORKING_DIR" streamlit run item_05_streamlit_FAISS.py