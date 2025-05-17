from fastapi import FastAPI, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from typing import List
import os
import shutil

from utils import (
    load_documents, split_documents, generate_embeddings, build_faiss_index,
    search_index, chat_with_llama2, summarize_text,
    UPLOAD_FOLDER, documents, chunks, embed_model, index
)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/")
async def upload_files(files: List[UploadFile] = File(...)):
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        try:
            if os.path.isfile(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Error deleting {file_path}: {e}")
    
    for file in files:
        file_location = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    return {"message": f"Successfully uploaded {len(files)} files"}

@app.post("/process/")
async def process_documents():
    global documents, chunks, embed_model, index
    
    documents = load_documents(UPLOAD_FOLDER)
    chunks = split_documents(documents)
    
    if not chunks:
        return {"error": "No documents processed"}
    
    embeddings, embed_model = generate_embeddings(chunks)
    index = build_faiss_index(embeddings)
    
    return {"message": f"Processed {len(chunks)} chunks from {len(documents)} documents"}

@app.post("/chat/")
async def chat_endpoint(request: Request):
    data = await request.json()
    user_input = data.get("message", "")
    
    if not user_input:
        return {"error": "Empty message"}
    
    if not index or not embed_model:
        return {"error": "Documents not processed yet"}
    
    relevant_chunks = search_index(user_input, embed_model, index, chunks)
    
    context = "\n".join(relevant_chunks)
    prompt = f"""
    ### Role:
    You are an intelligent assistant.

    ### Instruction:
    Use the following **Knowledge** only if it is clearly related to the user's question. If not, **ignore it completely**.
    
    ***  ignore the knowledge provided in the instruction and focus solely on the user's question if the knowledge and anser the question ***

    ### Knowledge:
    {context if context else 'No relevant information found.'}

    ### User Question:
    {user_input}

    ### Answer:
    """
    
    response = chat_with_llama2(prompt)
    
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
