# streamlit run .\scripts\FAISS_scripts\item_05_streamlit_FAISS.py

import base64
import os
import sys
import streamlit as st
from item_04_retriever_FAISS import answer_to_QA

working_dir = os.getenv("WORKING_DIR")
# Validate existence of working directory
if not os.path.isdir(working_dir):
    print(f"The provided path is not a valid directory: {working_dir}")
    sys.exit(1)

def main():
    st.set_page_config(page_title="Link-X", layout="wide")

    # CSS
    st.markdown(f"""
        <style>
        .title {{
            color: #0052A5;
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }}
        .subtitle {{
            color: #4169E1;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
        }}
        .stButton>button {{
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            font-weight: bold;
            border: none;
            border-radius: 5px;
            padding: 10px 15px;
            cursor: pointer;
            transition: all 0.3s;
        }}
        .stButton>button:hover {{
            background-color: #45a049;
            transform: scale(1.05);
        }}
        .stButton.clear-button>button {{
            background-color: #f44336;
        }}
        .stButton.clear-button>button:hover {{
            background-color: #d32f2f;
        }}
        .stTextInput>div>div>input {{
            font-size: 18px;
            border-radius: 5px;
            background-color: white;
        }}
        .answer-container {{
            background-color: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-top: 20px;
        }}
        div[data-testid="stVerticalBlock"] > div:has(> div.stTextInput) {{
            background-color: white;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }}
        </style>
        """, unsafe_allow_html=True)

    # Title and subtitle
    st.markdown('<h1 class="title">Link-X AI</h1>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">Tool to test queries using FAISS and RAG</p>', unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1,2,1])
    with col2:
        # Initialize session state for user query if it doesn't exist
        if 'user_query' not in st.session_state:
            st.session_state.user_query = ''

        # Function to clear the input and answer
        def clear_input():
            st.session_state.user_query = ''
            if 'answer' in st.session_state:
                del st.session_state.answer

        # Function to handle query submission
        def handle_submit():
            if st.session_state.user_query:
                try:
                    with st.spinner("Thinking..."):
                        response = answer_to_QA(st.session_state.user_query, working_dir)
                    st.session_state.answer = response
                except Exception as e:
                    st.error(f"An error occurred: {str(e)}")

        # Text input using session state
        user_query = st.text_input("", 
                                   placeholder="Ask a question about the PDF...", 
                                   key="user_query",
                                   on_change=handle_submit,
                                   label_visibility="collapsed")

        # Create three columns for button placement
        col_submit, col_spacer, col_clear = st.columns([1, 2, 1])
        
        with col_submit:
            submit_button = st.button("Get Answer", on_click=handle_submit, use_container_width=True)
        
        with col_clear:
            clear_button = st.button("Clear", on_click=clear_input, use_container_width=True)

        # Create a placeholder for the answer box
        answer_placeholder = st.empty()

        if submit_button and user_query:
            try:
                with st.spinner("Thinking..."):
                    response = answer_to_QA(user_query, working_dir)
                
                # Store the answer in session state
                st.session_state.answer = response
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")

        # Display the answer if it exists in session state
        if 'answer' in st.session_state:
            # Split the answer into the main text and sources
            answer_parts = st.session_state.answer.split('\nSources:')
            main_answer = answer_parts[0]
            sources = answer_parts[1] if len(answer_parts) > 1 else ""

            # Format the sources as an HTML unordered list
            formatted_sources = "<ul>" + "".join(f"<li>{source.strip()}</li>" for source in sources.split('\n') if source.strip()) + "</ul>"

            # Use the placeholder to display the answer
            answer_placeholder.markdown(f"""
            <div class="answer-container">
                <h3>Q: {user_query}</h3>
                <p>{main_answer}</p>
                <h3>Sources:</h3>
                {formatted_sources}
            </div>
            """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()