
# DocChat AI | Smart Document Assistant

DocChat AI is a FastAPI-based intelligent document assistant that allows users to upload documents (TXT, PDF, DOCX), process them into searchable chunks, generate embeddings, and interact with the content via a chatbot powered by LLaMA 2. It uses semantic search to find relevant document sections and answer user queries intelligently.

---

## Features

- Upload multiple documents (TXT, PDF, DOCX)
- Extract and split documents into manageable chunks
- Generate embeddings using Sentence Transformers (`all-MiniLM-L6-v2`)
- Build FAISS index for fast semantic search
- Interactive chatbot to query documents with LLaMA 2 backend
- Simple web interface for uploading files and chatting
- Summarization functionality via the chatbot

---

## Tech Stack

- **Backend:** FastAPI
- **Embedding Model:** Sentence Transformers (`all-MiniLM-L6-v2`)
- **Vector Search:** FAISS
- **LLM Integration:** LLaMA 2 API (local or remote)
- **Document Parsing:** PyPDF2 (PDF), python-docx (DOCX), plain text
- **Frontend:** Jinja2 Templates + Static files

---

## Installation & Setup

1. **Clone the repo:**
    ```bash
    https://github.com/GoldSharon/DocChat-AI
    ```

2. **Create and activate virtual environment (optional but recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate   # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4. **Ensure you have a running LLaMA 2 API endpoint** at `http://localhost:11434/api/generate` (or adjust the URL in `chat_with_llama2` function).

5. **Run the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```

6. **Open your browser and go to** `http://localhost:8000` to use the web interface.

---

## Usage

- Upload documents on the homepage.
- Click **Process** to parse, chunk, embed, and index documents.
- Use the chat box to ask questions related to your uploaded documents.
- The system will search the knowledge base and answer based on the context.

---

## Project Structure

````

.
├── main.py               # FastAPI application and endpoints
├── utils.py              # Document processing, embedding, search utilities
├── templates/            # Jinja2 HTML templates
├── static/               # CSS, JS, images for frontend
├── uploaded\_documents/   # Folder for storing uploaded files
├── requirements.txt      # Python dependencies
└── README.md             # This file

````

---

## Key Functions Overview

- `load_documents(folder_path)`: Loads and extracts text from TXT, PDF, and DOCX files.
- `split_documents(documents, chunk_size)`: Splits documents into smaller chunks.
- `generate_embeddings(texts, model_name)`: Generates embeddings using SentenceTransformer.
- `build_faiss_index(embeddings)`: Builds a FAISS index for fast nearest neighbor search.
- `search_index(query, model, index, texts, k)`: Searches the FAISS index for relevant chunks.
- `chat_with_llama2(prompt)`: Sends a prompt to the LLaMA 2 model and returns a response.

---

## Requirements

- Python 3.8+
- FastAPI
- Uvicorn
- SentenceTransformers
- Faiss
- PyPDF2
- python-docx
- requests

---

## Notes

- Make sure to have the LLaMA 2 inference server running and accessible.
- The chunk size and number of search results (`k`) can be tuned in the code for performance/accuracy.
- This project assumes a local or accessible LLaMA 2 API endpoint.

---

## License

MIT License © 2025 Gold Sharon R

---

## Contact

For questions or suggestions, reach out at:  
**Gold Sharon R**  
Email: gold33sharon@gmail.com  
LinkedIn: [Gold Sharon](https://linkedin.com/in/goldsharonr)  
GitHub: [Gold Sharon](https://github.com/GoldSharon)


