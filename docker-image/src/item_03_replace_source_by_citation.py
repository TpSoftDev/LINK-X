import os
import sys
from dotenv import load_dotenv, find_dotenv
import pandas as pd
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

# Load environment variables
load_dotenv(find_dotenv())

# Check for correct arguments
if len(sys.argv) != 2:
    print("Usage: python item_02_generate_citations_FAISS.py <path_to_working_directory>")
    sys.exit(1)

working_dir = sys.argv[1]
faiss_index_path = os.path.join(working_dir, "faiss_index")

# Validate existence of faiss index directory
if not os.path.isdir(faiss_index_path):
    print(f"The provided path is not a valid file: {faiss_index_path}")
    sys.exit(1)

# Initialize OpenAI embeddings
embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load the FAISS index
vectordb = FAISS.load_local(faiss_index_path, embedding, allow_dangerous_deserialization=True)

# Load the CSV file with sources and references
csv_filename = os.path.join(working_dir, "additional_files", "citations.csv")
if not os.path.isfile(csv_filename):
    print(f"Error: Citations CSV file not found at: {csv_filename}")
    sys.exit(1)
citations_df = pd.read_csv(csv_filename)

# Create a dictionary for quick lookup
source_to_reference = dict(zip(citations_df['Source'], citations_df['Reference']))

# Get all keys from the vector database
all_keys = list(vectordb.docstore.__dict__['_dict'].keys())

# Function to replace source with reference
def replace_source_with_reference(doc):
    original_source = doc.metadata["source"]
    if original_source in source_to_reference:
        doc.metadata["source"] = source_to_reference[original_source]
    return doc

# Iterate through all documents and replace the source with the reference
for key in all_keys:
    vectordb.docstore.__dict__['_dict'][key] = replace_source_with_reference(
        vectordb.docstore.__dict__['_dict'][key]
    )

# Save the modified vectordb to local
vectordb.save_local(faiss_index_path)

print(f"Sources in the FAISS database have been replaced with their corresponding references.")

# Optionally, verify a few entries
# This should show chunks with the same citation when using a single PDF
# print("\nVerifying a few entries:")
# for i in range(min(5, len(all_keys))):
#     print(f"Document {i + 1} source:", vectordb.docstore.__dict__['_dict'][all_keys[i]].metadata["source"])