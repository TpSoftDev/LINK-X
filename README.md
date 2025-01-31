
<p align="center">
  An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.
</p>

<p align="center">
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a>
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Model Providers

This template ships with OpenAI `gpt-4o` as the default.

### TO-DO

Add Coral AI custom RAG system to API routes in `app/xhat/api`

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`

```bash
nvm use

pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).


# PYTHON/RAG NOTES: Coral Research Question-Answering System

A sophisticated document processing and retrieval system that leverages FAISS (Facebook AI Similarity Search) and OpenAI embeddings to create an interactive question-answering interface for coral research documents.

## Overview

This project implements a document processing pipeline that converts PDF documents into a searchable vector database, coupled with a user-friendly Streamlit interface for querying coral-related research information.

## System Architecture

![System Architecture](additional_files/system_architecture.png)

The system consists of three main workflows:

### 1. Document Processing Pipeline
- **Data Collection & Processing** (`item_01_database_creation_FAISS.py`)
  - Loads coral reef research papers
  - Splits documents into smaller chunks
  - Creates embeddings using OpenAI's model: Ada-002
  - Stores vectors in FAISS database: FlatL2-index

- **Citation Management** (`item_02_generate_citations_APA_FAISS.py` & `item_03_replace_source_by_citation.py`)
  - Generates APA citations using LLM: GPT-4o-mini
  - Human verification of citations (Done manually)
  - Updates vector storage with proper citations

### 2. Query Processing Pipeline
- **Query Processing** (`item_04_retriever_FAISS.py`)
  - Processes user queries
  - Creates query embeddings: Ada-002
  - Checks similarity with stored vectors: Euclidean-distance
  - Selects top k most similar chunks
  - Generates context-aware prompts: GPT-4o-mini
  - Uses LLM to generate answers with citations: GPT-4o-mini

- **User Interface** (`item_05_streamlit_FAISS.py`)
  - Provides web interface for user interaction
  - Displays answers and citations
  - Handles user input and system responses

### 3. Evaluation Pipeline (Not shown in the architecture)
- **Response Collection** (`item_06_eval_01_save_response_and_context.py`)
  - Processes predefined human-generated Q&A pairs
  - Generates system responses
  - Saves responses with relevant context chunks

- **System Evaluation** (`item_07_eval_02_human_evaluation.py`)
  - Evaluates system performance using RAGAS metrics
  - Measures context precision, recall, faithfulness, etc.
  - Generates detailed evaluation reports

- **LLM-Based Evaluation** (Additional evaluation pipeline)
  - **Question Generation** (`item_08_eval_03_generate_questions_answers_from_chunk.py`)
    - Generates Q&A pairs from document chunks using GPT-4o-mini
    - Creates automated test dataset for evaluation
  - **Response Collection** (`item_09_eval_04_save_response_and_context_LLM.py`)
    - Processes LLM-generated Q&A pairs
    - Generates system responses with context
  - **LLM Evaluation** (`item_10_eval_05_llm_evaluation.py`)
    - Evaluates system using RAGAS metrics on LLM-generated dataset
    - Provides comparative analysis with human-generated results


## File Structure and Relationships

### Input Files
Located in `data/nine_pdfs/`:
- Collection of PDF documents containing coral research papers
- Used by `item_01_database_creation_FAISS.py` for initial database creation

### Generated Files
Located in `additional_files/`:

1. **citations.csv**
   - Generated by: `item_02_generate_citations_APA_FAISS.py`
   - Contains: PDF source paths and their corresponding APA citations
   - Format:
     ```
     Source,Reference
     path/to/pdf,APA formatted citation
     ```

2. **Q&A-Human_generated.csv**
   - Used by: `item_06_eval_01_save_response_and_context.py`
   - Contains: Human-generated questions and their ground truth answers
   - Format:
     ```
     Question,Ground truth
     What temperature...,The majority of coral reefs...
     ```

3. **Q&A-human_generated_with_context.csv**
   - Generated by: `item_06_eval_01_save_response_and_context.py`
   - Contains: Original Q&A pairs, system responses, and relevant context chunks
   - Format:
     ```
     Question,Ground truth,Answer,Similar Chunk 1,Similar Chunk 2,Similar Chunk 3,Similar Chunk 4
     ```

4. **Q&A_result-human_generated.csv**
   - Generated by: `item_07_eval_02_human_evaluation.py`
   - Contains: Detailed evaluation metrics for each question
   - Metrics include:
     - Context Precision and Recall
     - Faithfulness
     - Answer Relevancy
     - Answer Similarity
     - Answer Correctness

5. **overall_result-human_generated.csv**
   - Generated by: `item_07_eval_02_human_evaluation.py`
   - Contains: Aggregated evaluation metrics for the entire system
   - Average scores for all evaluation metrics

6. **Q&A-LLM_generated.csv**
   - Generated by: `item_08_eval_03_generate_questions_answers_from_chunk.py`
   - Contains: LLM-generated questions and their corresponding answers
   - Format:
     ```
     Question,Answer
     What temperature...,The majority of coral reefs...
     ```
7. **Q&A-LLM_generated_with_context.csv**
   - Generated by: `item_09_eval_04_save_response_and_context_LLM.py`
   - Contains: LLM-generated Q&A pairs with context
   - Format:
     ```
     Question,Answer,Similar Chunk 1,Similar Chunk 2,Similar Chunk 3,Similar Chunk 4
     ```

8. **Q&A_result-LLM_generated.csv**
   - Generated by: `item_10_eval_05_llm_evaluation.py`
   - Contains: Detailed evaluation metrics for LLM-generated Q&A pairs
   - Metrics include:
     - Context Precision
     - Context Recall
     - Faithfulness
     - Answer Relevancy
     - Answer Similarity

9. **overall_result-LLM_generated.csv**
   - Generated by: `item_10_eval_05_llm_evaluation.py`
   - Contains: Aggregated evaluation metrics for LLM-generated Q&A pairs


### Vector Database
Located in `faiss_index/`:
- Generated by: `item_01_database_creation_FAISS.py`
- Modified by: `item_03_replace_source_by_citation.py`
- Used by: All retrieval and evaluation scripts
- Contains: FAISS vector database with document embeddings

## Project Structure
```
project/
├── scripts/
│   └── FAISS_scripts/
│       ├── item_01_database_creation_FAISS.py    # Initial document processing
│       ├── item_02_generate_citations_APA_FAISS.py # Citation generation
│       ├── item_03_replace_source_by_citation.py   # Citation integration
│       ├── item_04_retriever_FAISS.py             # Query processing
│       ├── item_05_streamlit_FAISS.py             # Web interface
│       ├── item_06_eval_01_save_response_and_context.py # Evaluation data collection
│       ├── item_07_eval_02_human_evaluation.py     # System evaluation
│       ├── item_08_eval_03_generate_questions_answers_from_chunk.py  
│       ├── item_09_eval_04_save_response_and_context_LLM.py
│       ├── item_10_eval_05_llm_evaluation.py
├── data/
│   └── nine_pdfs/            # Source PDF documents
├── faiss_index/             # FAISS vector database storage
├── additional_files/
│   ├── citations.csv        # Generated APA citations
│   ├── background.jpeg      # UI background image
│   ├── system_architecture.png # System architecture diagram
│   ├── Q&A-Human_generated.csv # Human-created test questions
│   ├── Q&A-human_generated_with_context.csv # System responses
│   ├── Q&A_result-human_generated.csv # Detailed evaluation results
│   ├── overall_result-human_generated.csv # Summary evaluation metrics
│   ├── Q&A-LLM_generated.csv # LLM-created test questions
│   ├── Q&A-LLM_generated_with_context.csv # System responses
│   ├── Q&A_result-LLM_generated.csv # Detailed evaluation results
│   ├── overall_result-LLM_generated.csv # Summary evaluation metrics
│   └── overall_result-LLM_generated_divided.csv # Summary evaluation metrics
└── README.md
```

## Prerequisites

- Python 3.x
- OpenAI API key
- Required Python packages:
  ```
  langchain
  faiss-cpu
  openai
  python-dotenv
  pandas
  streamlit
  PyPDF2
  ```

## Installation

1. Clone the repository
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### 1. Database Creation
```bash
python scripts/FAISS_scripts/item_01_database_creation_FAISS.py
```
This script:
- Loads PDF documents from the specified directory
- Splits text into manageable chunks
- Creates FAISS vector embeddings using OpenAI
- Saves the vector database locally

### 2. Generate APA Citations
```bash
python scripts/FAISS_scripts/item_02_generate_citations_APA_FAISS.py
```
This script:
- Processes the vector database
- Generates APA citations using GPT-4
- Saves citations to a CSV file

### 3. Update Source References
```bash
python scripts/FAISS_scripts/item_03_replace_source_by_citation.py
```
This script replaces source file paths with proper APA citations in the vector database.

### 4. Launch the Web Interface
```bash
streamlit run scripts/FAISS_scripts/item_05_streamlit_FAISS.py
```
This launches the Streamlit interface where you can:
- Ask questions about coral research
- Receive AI-generated answers
- View source citations for all responses

### 5. Run System Evaluation
```bash
# Generate system responses for evaluation
python scripts/FAISS_scripts/item_06_eval_01_save_response_and_context.py

# Perform system evaluation
python scripts/FAISS_scripts/item_07_eval_02_human_evaluation.py
```

The evaluation process:
1. Uses human-generated Q&A pairs as ground truth
2. Generates system responses with context
3. Evaluates performance using RAGAS metrics:
   - Context Precision: 0.67 - How relevant the retrieved context is
   - Context Recall: 0.86 - How much relevant context is retrieved
   - Faithfulness: 0.87 - How well answers align with provided context
   - Answer Relevancy: 0.96 - How well answers address the questions
   - Answer Similarity: 0.91 - Semantic similarity to ground truth
   - Answer Correctness: 0.73 - Factual accuracy of responses

Evaluation results are saved in:
- `Q&A_result-human_generated.csv`: Detailed results for each question
- `overall_result-human_generated.csv`: Summary metrics for system performance

## Data Flow

1. **Document Processing**
   ```
   PDFs → database_creation_FAISS.py → FAISS index
   FAISS index → generate_citations_APA_FAISS.py → citations.csv
   citations.csv + FAISS index → replace_source_by_citation.py → Updated FAISS index
   ```

2. **Query Processing**
   ```
   User Query → retriever_FAISS.py → Answer with citations
   ```

3. **Evaluation Pipeline**
   ```
   Q&A-Human_generated.csv → eval_01_save_response_and_context.py → Q&A-human_generated_with_context.csv
   Q&A-human_generated_with_context.csv → eval_02_human_evaluation.py → Q&A_result-human_generated.csv + overall_result-human_generated.csv
   ```

4. **LLM-Based Evaluation**
   ```
   item_08_eval_03_generate_questions_answers_from_chunk.py → Q&A-LLM_generated_with_context.csv
   item_09_eval_04_save_response_and_context_LLM.py → Q&A-LLM_generated_with_context.csv
   Q&A-LLM_generated_with_context.csv → eval_05_llm_evaluation.py → Q&A_result-LLM_generated.csv + overall_result-LLM_generated.csv
   ```

## Acknowledgments

- LangChain for the document processing framework
- OpenAI for embeddings and GPT-4
- Facebook Research for FAISS
- RAGAS for evaluation metrics
