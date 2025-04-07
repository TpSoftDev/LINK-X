import os
import sys
from dotenv import load_dotenv, find_dotenv
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import pandas as pd
import openai

# Load environment variables from .env file
load_dotenv(find_dotenv())

# Check for correct arguments
if len(sys.argv) != 2:
    print("Usage: python item_02_generate_citations_FAISS.py <path_to_working_directory>")
    sys.exit(1)

working_dir = sys.argv[1]
faiss_index_path = os.path.join(working_dir, "faiss_index")

# Validate existence of PDF file path
if not os.path.isdir(faiss_index_path):
    print(f"The provided path is not a valid file: {faiss_index_path}")
    sys.exit(1)

# Initialize OpenAI embeddings
embedding = OpenAIEmbeddings(api_key=os.getenv("OPENAI_API_KEY"))

# Load the FAISS index
vectordb = FAISS.load_local(faiss_index_path, embedding, allow_dangerous_deserialization=True)

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

# Save the DataFrame to a CSV file
output_dir = os.path.join(working_dir, "additional_files")

os.makedirs(output_dir, exist_ok=True)

csv_filename = os.path.join(output_dir, "citations.csv")
citations_df.to_csv(csv_filename, index=False, encoding='utf-8')

print(f"CSV file '{csv_filename}' has been created with Source and Reference columns.")

# Optionally, display the first few rows of the DataFrame
print(citations_df.head())