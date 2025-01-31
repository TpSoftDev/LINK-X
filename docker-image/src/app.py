from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import faiss
import pickle
import numpy as np
from dotenv import load_dotenv
import os
from src.item_04_retriever_FAISS import raw_LLM_response, process_llm_response_with_sources
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS


# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# File paths for FAISS index and metadata
INDEX_PATH = "/app/"
PICKLE_PATH = "/app/"


# Load FAISS index
try:
    faiss_index = faiss.read_index("/app/index.faiss")
    print(f"FAISS index successfully loaded from /app/index.faiss")
except Exception as e:
    print(f"Error loading FAISS index: {e}")
    faiss_index = None

# Load metadata
try:
    with open("/app/index.pkl", "rb") as f:
        metadata = pickle.load(f)
    print(f"Metadata successfully loaded from /app/index.pkl")
except Exception as e:
    print(f"Error loading metadata: {e}")
    metadata = None

@app.route('/')
def home():
    """Serve the main UI."""
    return render_template('index.html')  # Ensure index.html exists in /templates directory


@app.route('/query', methods=['POST'])
def query():
    """
    Handle query requests.
    Accepts a JSON payload with 'input_string' and returns a response
    with similar chunks and sources if bypassing LLM is enabled.
    """
    user_input = request.json.get("input_string", "").strip()
    bypass_llm = request.json.get("bypass_llm", False)

    if not user_input:
        return jsonify({"error": "No input provided"}), 400

    print(f"Received query: {user_input}")
    print(f"Bypass LLM: {bypass_llm}")

    try:
        embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
        print("Embedding model initialized.")
        
        vectordb = FAISS.load_local(INDEX_PATH, embedding, allow_dangerous_deserialization=True)
        print(f"FAISS index loaded from {INDEX_PATH}.")
        
        retriever = vectordb.as_retriever()
        print("Retriever initialized.")
        
        if bypass_llm:
            docs = retriever.get_relevant_documents(user_input)
            print(f"Retrieved {len(docs)} documents from FAISS.")
            return jsonify({
                "query": user_input,
                "results": [{"context": doc.page_content, "metadata": doc.metadata} for doc in docs]
            })
        else:
            raw_response = raw_LLM_response(user_input, faiss_index_path=INDEX_PATH)
            print("Raw LLM response received.")
            
            formatted_response = process_llm_response_with_sources(raw_response)
            print("Response formatted with sources.")
            
            return jsonify({
                "query": user_input,
                "response": formatted_response
            })
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error processing query:\n{error_details}")
        return jsonify({"error": f"Error processing query: {e}"}), 500



@app.route('/citations', methods=['GET'])
def citations():
    """
    Generate APA citations for the documents in the FAISS index.
    This example uses mock data or specific logic from your citation generation scripts.
    """
    try:
        citation_data = []
        for idx, doc in enumerate(metadata.values()):
            citation_data.append({
                "source": doc.metadata.get("source", "Unknown"),
                "citation": f"Mock APA Citation for Document {idx + 1}"
            })

        return jsonify({"citations": citation_data})
    except Exception as e:
        return jsonify({"error": f"Error generating citations: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
