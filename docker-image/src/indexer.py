import pickle
import faiss
import numpy as np
from sqlalchemy.orm import Session

from textUtils import extract_text, split_text, embed_text, openai_embed_text
from src.db.queries import get_file_by_id, get_modules_by_course, get_files_by_module, insert_file_chunks

def rebuild_course_index(db: Session, course_id: str):
    """
    Rebuilds both the FAISS index and the metadata pickle for a course,
    based on all files in all modules of that course.
    Returns: (index_bytes, pkl_bytes)
    """
    texts = []
    metadata = {}

    # 1) Iterate modules → files → extract & chunk
    modules = get_modules_by_course(db, course_id)
    for mod in modules:
        files = get_files_by_module(db, mod.id)
        for f in files:
            raw = extract_text(f.file_data, f.filename)
            chunks = split_text(raw)
            for i, chunk in enumerate(chunks):
                idx = len(texts)
                texts.append(chunk)
                metadata[idx] = {
                    'file_id': str(f.id),
                    'chunk_index': i,
                    'filename': f.filename
                }

    if not texts:
        # no content: return empty index + metadata
        empty_index = faiss.IndexFlatL2(1)
        return faiss.serialize_index(empty_index), pickle.dumps(metadata)

    # 2) Embed all chunks
    embeddings = [embed_text(t) for t in texts]
    arr = np.vstack(embeddings).astype('float32')
    dim = arr.shape[1]

    # 3) Build FAISS index
    index = faiss.IndexFlatL2(dim)
    index.add(arr)
    index_bytes = faiss.serialize_index(index)

    # 4) Pickle metadata dict
    pkl_bytes = pickle.dumps(metadata)

    return index_bytes, pkl_bytes

def rebuild_file_index(db: Session, file_id: str):
    
    f = get_file_by_id(db, file_id)
    raw = extract_text(f.file_data, f.filename)
    chunks = split_text(raw)

    texts, metadata = [], {}
    for i, chunk in enumerate(chunks):
        idx = len(texts)
        texts.append(chunk)
        metadata[idx] = {
            'file_id':     str(f.id),
            'chunk_index': i,
            'filename':    f.filename
        }

    if not texts:
        empty = faiss.IndexFlatL2(1)
        return faiss.serialize_index(empty), pickle.dumps(metadata)

    emb = [embed_text(t) for t in texts]
    arr = np.vstack(emb).astype('float32')
    dim = arr.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(arr)
    return faiss.serialize_index(index), pickle.dumps(metadata)

def store_file_embeddings(db: Session, file_id: str) -> int:
    """
    Extracts, splits, embeds, and persists all chunks for one file.
    Returns the number of chunks stored.
    """
    f = get_file_by_id(db, file_id)          # assumes raises if not found
    raw_text  = extract_text(f.file_data, f.filename)
    chunks    = split_text(raw_text)         # list[str]

    if not chunks:
        return 0

    vectors = openai_embed_text(chunks)      # in textUtils.py

    course_id = f.module.course_id

    return insert_file_chunks(db, file_id, course_id, chunks, vectors) # in queries.py
