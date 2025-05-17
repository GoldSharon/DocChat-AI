import os
import glob
import shutil
import docx
import requests
from PyPDF2 import PdfReader
from typing import List
from sentence_transformers import SentenceTransformer
import faiss

UPLOAD_FOLDER = "uploaded_documents"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

documents = []
chunks = []
embed_model = None
index = None

def load_documents(folder_path: str) -> List[str]:
    documents = []

    for filepath in glob.glob(os.path.join(folder_path, "*.txt")):
        with open(filepath, 'r', encoding='utf-8') as f:
            documents.append(f.read())
    
    for filepath in glob.glob(os.path.join(folder_path, "*.pdf")):
        text = ""
        with open(filepath, 'rb') as f:
            reader = PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        documents.append(text)
    
    for filepath in glob.glob(os.path.join(folder_path, "*.docx")):
        doc = docx.Document(filepath)
        text = "\n".join([para.text for para in doc.paragraphs])
        documents.append(text)
    
    return documents

def split_documents(documents, chunk_size=500):
    chunks = []
    for doc in documents:
        for i in range(0, len(doc), chunk_size):
            chunk = doc[i:i+chunk_size]
            chunks.append(chunk)
    return chunks

def generate_embeddings(texts, model_name='all-MiniLM-L6-v2'):
    model = SentenceTransformer(model_name)
    embeddings = model.encode(texts, convert_to_numpy=True)
    return embeddings, model

def build_faiss_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    return index

def search_index(query, model, index, texts, k=3):
    query_vector = model.encode([query])
    D, I = index.search(query_vector, k)
    results = [texts[i] for i in I[0]]
    return results

def chat_with_llama2(prompt):
    try:
        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                'model': 'llama2',
                'prompt': prompt,
                'stream': False
            }
        )
        if response.status_code == 200:
            return response.json().get('response', '')
        return f"Error: {response.status_code}"
    except Exception as e:
        return f"LLM Error: {str(e)}"

def summarize_text(text):
    summary_prompt = f"Summarize the following text:\n\n{text}\n\nSummary:"
    response = chat_with_llama2(summary_prompt)
    return response.strip()
