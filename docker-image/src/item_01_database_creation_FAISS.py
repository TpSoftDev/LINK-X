import os
import sys
from dotenv import load_dotenv, find_dotenv
from langchain_community.vectorstores import FAISS  # Import FAISS vectorstore
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# Load environment variables from .env file
load_dotenv(find_dotenv())

# Check for correct arguments
if len(sys.argv) != 3:
    print("Usage: python item_01_database_creation_FAISS.py <path_to_pdf> <pdf_hash>")
    sys.exit(1)

pdf_path = sys.argv[1]

pdf_hash = sys.argv[2]

# Validate existence of PDF file path
if not os.path.isfile(pdf_path):
    print(f"The provided path is not a valid file: {pdf_path}")
    sys.exit(1)

# PDF Loading and Text Extraction
loader = PyPDFLoader(pdf_path)
documents = loader.load() # load the pdf and extract text using PyPDFLoader

# Splitting the text into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200) # Divide into 1000 char chunks w/ 200 char overlap to retain context across chunks
texts = text_splitter.split_documents(documents) # contains the document chunks
print(f"Number of text chunks: {len(texts)}")

# FAISS Vector Store Creation
embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY")) # convert text into OpenAI vector embeddings
vectordb = FAISS.from_documents(documents=texts, embedding=embedding)

# pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
# output_dir = os.path.join("faiss_generated", pdf_name, "faiss_index")
output_dir = os.path.join("faiss_generated", pdf_hash, "faiss_index")

os.makedirs(output_dir, exist_ok=True)

vectordb.save_local(output_dir)