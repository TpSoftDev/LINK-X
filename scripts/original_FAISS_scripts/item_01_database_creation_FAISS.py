#%%
import os

# Get the current script's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate two levels up
working_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))

#%%
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

#%%

from langchain.vectorstores import FAISS  # Import FAISS vectorstore
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.document_loaders import TextLoader, PyPDFLoader
from langchain.document_loaders import DirectoryLoader

pdf_folder = os.path.join(working_dir, "data", "nine_pdfs")

loader = DirectoryLoader(pdf_folder, glob="**/*.pdf", loader_cls=PyPDFLoader)
documents = loader.load()

#%%

# Splitting the text into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
texts = text_splitter.split_documents(documents)

len(texts)

#%%
# Create the DB using FAISS

# Use OpenAI embeddings
embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Create FAISS vector store from documents
vectordb = FAISS.from_documents(documents=texts, embedding=embedding)

#%%

# Save the FAISS vectorstore to disk (optional, you can serialize it for later use)
faiss_save_path = os.path.join(working_dir, "faiss_index")
vectordb.save_local(faiss_save_path)
