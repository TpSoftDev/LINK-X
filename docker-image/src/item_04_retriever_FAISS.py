# It contains all the functions: response with sources, response without sources, get similar chunks, raw LLM response, answer to QA

import os
import sys
from dotenv import load_dotenv, find_dotenv
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.globals import set_verbose, set_debug
from langchain.schema import BaseRetriever, Document
import warnings

# Load environment variables
load_dotenv(find_dotenv())

warnings.filterwarnings("ignore", message=".*LangChainDeprecationWarning.*")

# Disable verbose and debug logging
set_verbose(False)
set_debug(False)

# Dummy retriever that always returns an empty list.
class EmptyRetriever(BaseRetriever):
    def _get_relevant_documents(self, query):
        # Return an empty list of Documents
        return []

def process_llm_response_with_sources(llm_response):
    result = llm_response['result'].strip().lower()
    result = result.split(".")[0]
    # Check if the response is a variation of "I don't know"
    if result in ["i don't know", "i do not know", "unknown", "i'm not sure", "i am not sure"]:
        return result.capitalize()
    
    return_txt = llm_response['result']
    return_txt += '\nSources:'
    
    # Use a set to keep track of unique sources
    unique_sources = set()
    
    for source in llm_response["source_documents"]:
        citation = source.metadata['source']
        # Only add the citation if it's not already in the set
        if citation not in unique_sources:
            return_txt += f"\n \n{citation}"
            unique_sources.add(citation)
    
    return return_txt

def process_llm_response(llm_response):
    result = llm_response['result'].strip().lower()
    result = result.split(".")[0]
    # Check if the response is a variation of "I don't know"
    if result in ["i don't know", "i do not know", "unknown", "i'm not sure", "i am not sure"]:
        return result.capitalize()
    
    return_txt = llm_response['result']

    return return_txt

def get_similar_chunks(raw_llm_response):

    similar_chunks = []
    for doc in raw_llm_response["source_documents"]:
        similar_chunks.append(doc.page_content)
    
    return similar_chunks

def raw_LLM_response(query, faiss_index_path, closed):
    embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    if(closed):
        # --- CLOSED: FAISS + RAG path ---
        vectordb = FAISS.load_local(
            faiss_index_path, embedding, allow_dangerous_deserialization=True
        )
        retriever = vectordb.as_retriever()  
    else:
        # --- OPEN: plain LLM path ---
        retriever = EmptyRetriever()
    
    qa_chain = RetrievalQA.from_chain_type(
        llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )

    llm_response = qa_chain.invoke(query)

    return llm_response

def answer_to_QA(query, faiss_index_path):
    # If no FAISS index provided, use an open qa chain
    if faiss_index_path is None:
        closed = False
    else:
        closed = True

    llm_response = raw_LLM_response(query, faiss_index_path, closed)
    
    # Response without citations
    answer_txt = process_llm_response(llm_response)
    # Response with citations (could add a flag if there are cases where we want the sources listed
    # answer_txt = process_llm_response_with_sources(llm_response)

    return answer_txt


if __name__ == "__main__":
    # query = "How parastites are damaging the corals?"
    query = "Split the given content up into 10 individual modules to make a full educational course"
    
    # llm_response = raw_LLM_response(query)

    # similar_chunk_list = get_similar_chunks(llm_response)
    
    # print(process_llm_response(llm_response))

    # print(similar_chunk_list)

    print(answer_to_QA(query))