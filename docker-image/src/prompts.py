import os

from flask import json
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv
from FAISS_retriever import answer_to_QA, answer_to_QA_all_chunks

load_dotenv(find_dotenv())

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def prompt1_create_course(user_query):
    system_query = (
    """
    You are an education assistant. Extract a topic and the user's level of expertise from the question.

    Give ONLY with the 'topic' and 'expertise' (one of: beginner, intermediate, advanced).

    Return ONLY the **raw valid JSON string** with the following structure:

    {
        "topic": "string",
        "expertise": "string"
    }
    
    Do NOT include any code-block markers (e.g., triple backticks, etc)
    """
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()

def prompt2_generate_course_outline_RAG(working_dir, expertise):
    query = ( 
    f"""
    You are an AI assistant with access to provided content on a subject. 
    
    The user has provided you with their experise on the subject: {expertise}

    Your task is to retrieve all content relevant to the topic based on their expertise and summarize it into exactly 10 chapters. For each chapter:

    1. Provide a concise title (3–7 words).
    2. Include an array of relevant metadata or key points. Each array should have 3–6 bullet items covering the main ideas, important highlights, and any important details from the content.

    Return ONLY the **raw valid JSON string** with the following structure:

    {{
    "chapters": [
        {{
        "chapterTitle": "string",
        "metadata": [
            "string",
            "string",
                ...
            ]
        }},
        ...
    ]
    }}

    Do NOT include any code-block markers (like ``` or similar)
    """
    )

    response = answer_to_QA(query, working_dir)

    # .choices[0].message.content.strip() already done in FAISS_retriever
    return response

def prompt2_generate_course_outline(topic, expertise):
    # “I’m a sophomore in finance and I want to learn about investing”
    system_query = ( 
    """
    You are an AI assistant generating an educational course outline.
    
    The user will provide you with a topic and their level of experise on the subject.
    
    Your task is to generate exactly **10 Chapters** based on the topic and expertise level provided.
    
    For each chapter:
    1. Provide a **concise title** (3–7 words).
    2. Include an **array of 3-6 metadata points** (key points, main ideas, important highlights, or details relevant to the chapter).

    Return ONLY the **raw valid JSON string** with the following structure:

    {
    "chapters": [
        {
            "chapterTitle": "string",
            "metadata": [
                "string",
                "string",
                ...
            ]
        },
        ...
    ]
    }
    
    Do NOT include any code-block markers (e.g., triple backticks, etc)
    """
    )

    user_query = f"The topic is: {topic}. My expertise level is: {expertise}"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )
    
    return response.choices[0].message.content.strip()

def prompt_generate_personalized_file_content(working_dir, persona):
    rag_query = ( 
    """
    You are an AI assistant generating a structured outline for educational content.

    You have been provided with the full body of source material. Your task is to divide this content into **5–10 logically organized chapters**, ensuring that all key information is represented.
    
    **STRUCTURE**
    For each chapter:
    1. Provide a **concise chapter title** (3–7 words).
    2. Include **2–4 comprehensive subsections**, each with:
        - A **short title** summarizing the subsection's focus.
        - A **fullText** explanation that presents the relevant information in **at least 10 sentences with subsections**.

    **INSTRUCTIONS**
    - Use language that is **clear, precise, and faithful** to the original material. Rephrase only to improve structure or flow.
    - Use the **entire content** unless something is clearly redundant.
    - You may **reorder or group** related points for clarity, but you must not omit any meaningful content.
    - Do **not invent** any facts, examples, or interpretations. Work only with the content provided.
    - If the original text contains specific names, terms, dates, steps, or examples, they **must be preserved** in the output.

    **OUTPUT FORMAT**
    Return a valid JSON matching this structure:

    {
        "chapters": [
            {
                "chapterTitle": "string",
                "subsections": [
                    {
                        "title": "string",
                        "fullText": "string"
                    },
                    ...
                ]
            },
            ...
        ]
    }

    **Do not** include markdown, code block markers (e.g., triple backticks), or extra commentary. Return only clean, raw JSON.
    """
    )

    JSON_response = answer_to_QA_all_chunks(rag_query, working_dir)
    print(JSON_response)

    personalization_query = (
    f"""
    You are an AI assistant tasked with personalizing structured educational content.

    You have been provided with a JSON object containing chapters and subsections: {JSON_response}
    Each subsection includes:
    - A **title** describing its focus
    - A **fullText** field containing the original explanation

    You will also receive:
    - A description of the **user’s persona**

    **Your task is to revise ONLY the fullText fields to match the user’s tone and background preferences.**

    **INSTRUCTIONS**
    1. You must **retain the original explanation and meaning** in every subsection.
    2. Do **not change** any subsection titles, chapter titles, or the number of items.
    3. You may personalize language, tone, depth, and examples based on the persona and expertise, but:
    - Do **not invent** new facts, terms, or interpretations
    - Do **not remove** information unless it is explicitly redundant
    4. If a subsection includes an example, you may **adapt its context or framing** to be more relatable to the user, but:
    - The example must still teach the same lesson
    - The core logic or takeaway must be unchanged

    **Return ONLY a valid JSON object** with the same structure as provided, with updated fullText values:

    **OUTPUT FORMAT**
    Return a valid JSON matching this structure:

    {{
        "chapters": [
            {{
                "chapterTitle": "string",
                "subsections": [
                    {{
                        "title": "string",
                        "fullText": "string"
                    }},
                    ...
                ]
            }},
            ...
        ]
    }}

    **Do not** include markdown or code block markers (e.g., triple backticks). Return just the modified JSON object.
    """
    )

    user_query = (
    f"""
    Persona: {persona}
    """
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": personalization_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()

def prompt3_generate_module_content_RAG(persona, expertise_summary, topic, working_dir):
    rag_query = (
    f"""
    You are an AI assistant retrieving raw knowledge to help generate an educational course module

    You have access to provided content. 

    The topic is: {topic}

    Your task is to retrieve all knowledge relevant to the module based on the provided topic and content.

    **Return ONLY** the raw knowledge.**  
    - No JSON
    - No code-block markers (like ``` or similar)
    """
    )

    rag_response = answer_to_QA(rag_query, working_dir)

    # After retrieval, personalize the content to the user.
    personalization_query = (
    f"""
    You are an AI assistant generating a personalized educational course module.

    You have been provided with retrieved knowledge: {rag_response}

    The user will provide you with their persona and their expertise level on the topic.

    Your tasks:
    1. You must use **ALL** of the retrieved knowledge provided
    2. Organize and explain the knowledge clearly, without omitting or skipping important parts.
    3. Personalize the explanation based on the user's persona and expertise level to adjust tone, depth, and style.
    4. Adapt examples to be more relevant to the user's persona without changing the underlying lesson or concept.
        - Do not change the core explanation or lesson being taught by the example.
        - Adjust only the context, terminology, or scenario so that the example feels more relatable and applicable to the user's background.

    **DO NOT** add any new information or content that wasn't in the retrieved knowledge.
    **DO NOT** leave out any part of the retrieved content unless explicitly redundant.

    **Return ONLY the raw explanatory text.**  
    - No JSON
    - No code-block markers (like ``` or similar)
    """
    )

    user_query = (
    f"""
    Persona: {persona}
    Expertise Level: {expertise_summary}
    """
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": personalization_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()

def prompt3_generate_module_content(persona, expertise_summary, topic):
    system_query = (
    f"""
    You are an AI assistant generating a personalized educational course module.

    The user will provide you with their persona, a module topic, and their expertise level on the topic.

    Your task is to generate a clear, instructional explanation of the topic, personalized to the user's persona and expertise.

    **Return ONLY the raw explanatory text.**  
    - No JSON
    - No code-block markers (like ``` or similar)
    """
    )

    user_query = (
    f"""
    Persona: {persona}
    Topic: {topic}
    Expertise Level: {expertise_summary}
    """
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )

    return response.choices[0].message.content.strip()

def prompt4_valid_query(user_query, course_outline):
    # Take a query given by a user and verify it is related to the course content
    system_query = (
    f"""
    You are an AI determining the relevance of a user query.

    You have been provided with the JSON outline of an educational course: {course_outline}

    The user will provide you with a query about the course.

    Your task is to:
    
    1. If the query is relevant to the course based on the outline, respond with:

        "true"

    2. If the query is not relevant to the course based on the outline, reply with:

        "false"

    Your output should **only provide one of these two outcomes** based on the relevance of the query to the course content.
    """
    )

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_query},
            {"role": "user", "content": user_query}
        ],
        temperature=0
    )

    result = response.choices[0].message.content.strip().lower().split(".")[0]

    if result == "true":
        return True
    elif result == "false":
        return False
    else:
        print(f"Unexpected response: {result}")

def prompt_course_faqs(course_title: str, questions: list[str]) -> dict:
    if not questions:
        return {"faqs": []}

    max_n = min(10, len(questions))
    bullet_list = "\n".join(f"- {q}" for q in questions)

    system_query = (
        f"""
You are an AI assistant. Below is the complete list of student chats in course '{course_title}'.

Your tasks:
1. Identify and group questions that have the same meaning even if phrased differently.
2. Return EXACTLY the top {max_n} most frequently asked questions with their counts.
3. Do NOT include any questions that were never asked.
4. If fewer than {max_n} unique questions exist after grouping, return only those.
5. Return strictly valid JSON in this format and nothing else:
```
{{
  "faqs": [
    {{ "question": "string", "count": number }},
    ...
  ]
}}
```
"""
    )

    user_query = (
        f"""
Course: {course_title}

Questions:
{bullet_list}
"""
    )

    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_query},
            {"role": "user",   "content": user_query}
        ],
        temperature=0.0,
    )

    return json.loads(resp.choices[0].message.content.strip())
