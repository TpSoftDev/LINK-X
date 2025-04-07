#%%

import os

# Get the current script's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate two levels up
working_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))

#%%
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

import warnings
warnings.filterwarnings("ignore", message=".*LangChainDeprecationWarning.*")

from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_core.globals import set_verbose, set_debug

# Disable verbose and debug logging
set_verbose(False)
set_debug(False)
from openai import OpenAI

client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

#%%

faiss_index_path= os.path.join(working_dir, "faiss_index")
embedding = OpenAIEmbeddings()
vectordb = FAISS.load_local(faiss_index_path, embedding, allow_dangerous_deserialization=True)

#%%
import pandas as pd
from tqdm import tqdm

# Define the prompt template for question generation
question_generation_prompt = """Generate up to 3 relevant and insightful questions based on the provided text. Focus on thematic questions that apply to the subject matter as a whole but can be answered directly from the text. Avoid questions that are specific to particular articles, names, or individual entities mentioned in the text.
Format your response as a Python list of strings, like this: ["Question 1?", "Question 2?", "Question 3?"]

Text: {text}"""

# Define the function to generate questions and answers
def generate_qa_pairs(chunk_text):
    # Generate questions using GPT-4o-mini
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates questions based on given text."},
            {"role": "user", "content": question_generation_prompt.format(text=chunk_text)}
        ],
        temperature=0
    )
    
    # Parse the response to get questions
    try:
        questions = eval(response.choices[0].message.content)
    except:
        questions = []
        print("Error parsing questions for chunk")
        return []
    
    # Create QA pairs
    qa_pairs = []

    # Generate answer for each question using the same chunk
    for question in questions:
        # Generate answer using the specific chunk
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Respond to the question using only the provided context. Do not use any outside knowledge in your answer. If the answer is not found in the context, reply with 'I don't know.' Avoid prefacing your response with phrases such as 'Based on the context.'"},
                {"role": "user", "content": f"Context: {chunk_text}\n\nQuestion: {question}"}
            ],
            temperature=0
        )
        answer = response.choices[0].message.content
        
        qa_pairs.append({
            "Question": question,
            "Ground truth": answer,
            "context": chunk_text
        })
    
    return qa_pairs

# Get all documents from vectordb - CORRECTED VERSION
all_docs = []
retriever = vectordb.as_retriever()
# Using similarity search to get all documents
docs = vectordb.similarity_search("", k=10000)  # Adjust k based on your total documents

qa_dataset = []

# Process every 100th document
for i in tqdm(range(0, len(docs), 30)):
    chunk_text = docs[i].page_content
    qa_pairs = generate_qa_pairs(chunk_text)
    qa_dataset.extend(qa_pairs)

# Convert to DataFrame and save as CSV
df = pd.DataFrame(qa_dataset)

#%%

automated_qa_path = os.path.join(working_dir, "additional_files", "Q&A-LLM_generated.csv")

df.to_csv(automated_qa_path, index=False, encoding='utf-8')
print(f"Generated {len(df)} question-answer pairs and saved to {automated_qa_path}")
# %%
