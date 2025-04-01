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
import pandas as pd

from item_04_retriever_FAISS import get_similar_chunks, raw_LLM_response, process_llm_response

#%%
human_generated_qa_path = os.path.join(working_dir, "additional_files", "Q&A-Human_generated.csv")

df = pd.read_csv(human_generated_qa_path, encoding='utf-8')

# %%

new_df = df.copy()

#%%

for index, row in new_df.iterrows():
    query = row['Question']
    llm_response = raw_LLM_response(query)
    answer = process_llm_response(llm_response)
    new_df.at[index, 'Answer'] = answer
    similar_chunk_list = get_similar_chunks(llm_response)
    for i, chunk in enumerate(similar_chunk_list):
        new_df.at[index, f'Similar Chunk {i+1}'] = chunk

# %%
save_path = os.path.join(working_dir, "additional_files", "Q&A-human_generated_with_context.csv")
new_df.to_csv(save_path, index=False, encoding='utf-8')

# %%
