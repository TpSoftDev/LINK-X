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
from datasets import Dataset
from ragas import evaluate, RunConfig
from ragas.metrics import context_precision, context_recall
import nest_asyncio
import pandas as pd
import os
from openai import OpenAI

#%%
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# nest_asyncio.apply()

## We are using "Q&A-with-context.csv" file as the input for evaluation
## this file contains the questions, ground truth answers, answers from the model, and the similar chunks

llm_generated_qa_path = os.path.join(working_dir, "additional_files", "Q&A-LLM_generated_with_context.csv")

df = pd.read_csv(llm_generated_qa_path, encoding='utf-8')

# Prepare data in the format RAGAS expects
data = {
    "question": df["Question"].tolist(),
    "ground_truth": df["Ground truth"].tolist(),
    "answer": df["Answer"].tolist(),
    "contexts": [] 
}

# Combine the similar chunks into contexts for each row
for idx in range(len(df)):
    contexts = []
    for i in range(1, 5):  # Similar Chunks 1-4
        chunk = df[f"Similar Chunk {i}"].iloc[idx]
        if isinstance(chunk, str) and len(chunk.strip()) > 0:
            contexts.append(chunk)
    data["contexts"].append(contexts)

# Convert to Dataset format
dataset = Dataset.from_dict(data)

# Configure RAGAS runtime
run_config = RunConfig(max_workers=4, max_wait=180)

# Run evaluation
result = evaluate(
    dataset=dataset,
    metrics=[context_precision, context_recall],
    run_config=run_config,
    raise_exceptions=False,
)

# Print raw result to understand its structure
print("\nRaw Result:")
print(result)

new_df = df.copy()
overall_df = pd.DataFrame()

# %%
print("\nEvaluation Results:")
if isinstance(result['context_precision'], list):
    precision_avg = sum(result['context_precision']) / len(result['context_precision'])
    recall_avg = sum(result['context_recall']) / len(result['context_recall'])
    
    print(f"Context Precision: {precision_avg:.4f}")
    print(f"Context Recall: {recall_avg:.4f}")
    # overall_df['Context Precision'] = precision_avg
    # overall_df['Context Recall'] = recall_avg

    overall_df = pd.DataFrame({
    'Context Precision': [precision_avg],
    'Context Recall': [recall_avg]})
    
    print("\nIndividual Scores:")
    print("Context Precision:", [f"{x:.4f}" for x in result['context_precision']])
    print("Context Recall:", [f"{x:.4f}" for x in result['context_recall']])

    # create a new dataframe with Question, Ground truth, answer, context and (individual Context Precision)
    
    new_df['Context Precision'] = result['context_precision']
    new_df['Context Recall'] = result['context_recall']

else:
    print(f"Context Precision: {result['context_precision']:.4f}")
    print(f"Context Recall: {result['context_recall']:.4f}")
    overall_df['Context Precision'] = result['context_precision']
    overall_df['Context Recall'] = result['context_recall']
    new_df['Context Precision'] = result['context_precision']
    new_df['Context Recall'] = result['context_recall']



# %%
from ragas.metrics import faithfulness, answer_relevancy
result = evaluate(
        dataset=dataset,
        metrics=[faithfulness, answer_relevancy],
        run_config=run_config,
        raise_exceptions=False,
    )
print("\nRaw Result:")
print(result)


# %%

# new_df = df.copy()
print("\nEvaluation Results:")
if isinstance(result['faithfulness'], list):
    faithfulness_avg = sum(result['faithfulness']) / len(result['faithfulness'])
    relevancy_avg = sum(result['answer_relevancy']) / len(result['answer_relevancy'])
    
    print(f"Faithfulness: {faithfulness_avg:.4f}")
    print(f"Answer Relevancy: {relevancy_avg:.4f}")

    overall_df['Faithfulness'] = faithfulness_avg
    overall_df['Answer Relevancy'] = relevancy_avg
    
    print("\nIndividual Scores:")
    print("Faithfulness scores:", [f"{x:.4f}" for x in result['faithfulness']])
    print("Answer Relevancy scores:", [f"{x:.4f}" for x in result['answer_relevancy']])
    

    new_df['Faithfulness'] = result['faithfulness']
    new_df['Answer Relevancy'] = result['answer_relevancy']

else:
    print(f"Faithfulness: {result['faithfulness']:.4f}")
    print(f"Answer Relevancy: {result['answer_relevancy']:.4f}")
    overall_df['Faithfulness'] = result['faithfulness']
    overall_df['Answer Relevancy'] = result['answer_relevancy']    
    # Create new dataframe with all data
    new_df['Faithfulness'] = result['faithfulness']
    new_df['Answer Relevancy'] = result['answer_relevancy']


# %%
## overall evaluation
from ragas.metrics import answer_similarity, answer_correctness
result = evaluate(
        dataset=dataset,
        metrics=[answer_similarity, answer_correctness],
        run_config=run_config,
        raise_exceptions=False,
    )
print("\nRaw Result:")
print(result)


# %%

# new_df = df.copy()
# overall_df = pd.DataFrame()
print("\nEvaluation Results:")
if isinstance(result['semantic_similarity'], list):
    similarity_avg = sum(result['semantic_similarity']) / len(result['semantic_similarity'])
    correctness_avg = sum(result['answer_correctness']) / len(result['answer_correctness'])
    
    print(f"Answer Similarity: {similarity_avg:.4f}")
    print(f"Answer Correctness: {correctness_avg:.4f}")

    overall_df['Answer Similarity'] = similarity_avg
    overall_df['Answer Correctness'] = correctness_avg

    # overall_df = pd.DataFrame({
    # 'Answer Similarity': [similarity_avg],
    # 'Answer Correctness': [correctness_avg]})
    
    print("\nIndividual Scores:")
    print("Answer Similarity scores:", [f"{x:.4f}" for x in result['semantic_similarity']])
    print("Answer Correctness scores:", [f"{x:.4f}" for x in result['answer_correctness']])
    
    new_df['Answer Similarity'] = result['semantic_similarity']
    new_df['Answer Correctness'] = result['answer_correctness']
else:
    print(f"Answer Similarity: {result['semantic_similarity']:.4f}")
    print(f"Answer Correctness: {result['answer_correctness']:.4f}")
    
    overall_df['Answer Similarity'] = result['semantic_similarity']
    overall_df['Answer Correctness'] = result['answer_correctness']
    # Create new dataframe with all data
    new_df['Answer Similarity'] = result['semantic_similarity']
    new_df['Answer Correctness'] = result['answer_correctness']

# %%
# save results
## "Q&A_with_result.csv" results for each question
save_path_llm_QA = os.path.join(working_dir, "additional_files", "Q&A_result-LLM_generated.csv")
new_df.to_csv(save_path_llm_QA, index=False, encoding='utf-8')
# %%
## "overall_result.csv" contains the overall evaluation results for all questions
save_path_llm_overall = os.path.join(working_dir, "additional_files", "overall_result-LLM_generated.csv")
overall_df.to_csv(save_path_llm_overall, index=False, encoding='utf-8')
# %%
