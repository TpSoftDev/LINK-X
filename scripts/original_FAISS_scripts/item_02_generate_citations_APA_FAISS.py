#%%
import os

# Get the current script's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Navigate two levels up
working_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))

#%%
from dotenv import load_dotenv, find_dotenv
import pandas as pd
import openai
from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings

# Load environment variables
load_dotenv(find_dotenv())

# Initialize OpenAI embeddings
embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load the FAISS index
faiss_save_path = os.path.join(working_dir, "faiss_index")
vectordb = FAISS.load_local(faiss_save_path, embedding, allow_dangerous_deserialization=True)

# Get the document store data
data_to_manipulate = vectordb.docstore.__dict__['_dict']
values_list = list(data_to_manipulate.values())
all_keys = list(data_to_manipulate.keys())

# Create initial DataFrame
df = pd.DataFrame({"Keys": all_keys, "Values": values_list})

# Extract source from metadata
df["Source"] = df["Values"].apply(lambda x: x.metadata["source"])

# Get unique sources
unique_sources = df['Source'].unique()

def obtain_reference_using_gpt(text_for_obtaining_reference):
    completion = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a straightforward assistant who provides quick, direct, and answers without unnecessary elaboration. You will be provided a text chunk and you need to generate the APA 7th reference. Please reply 'I do not know' if you cannot generate the reference. Do not use any other information than the text chunk.",
            },
            {
                "role": "user",
                "content": f"Text chunk: {text_for_obtaining_reference}",
            }
        ],
    )
    return completion.choices[0].message.content

# Generate references for unique sources
reference_dict = {}
for source in unique_sources:
    df_for_each_unique = df[df["Source"] == source].iloc[:3]
    text_for_obtaining_reference = " ".join(df_for_each_unique["Values"].apply(lambda x: x.page_content))
    reference = obtain_reference_using_gpt(text_for_obtaining_reference)
    reference_dict[source] = reference

# Create a new DataFrame with Source and Reference columns
citations_df = pd.DataFrame(list(reference_dict.items()), columns=['Source', 'Reference'])

#%%
# Save the DataFrame to a CSV file
csv_filename = os.path.join(working_dir, "additional_files", "citations.csv")
citations_df.to_csv(csv_filename, index=False, encoding='utf-8')

print(f"CSV file '{csv_filename}' has been created with Source and Reference columns.")

# Optionally, display the first few rows of the DataFrame
print(citations_df.head())
# %%
