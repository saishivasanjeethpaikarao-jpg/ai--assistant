import os
# Lazy imports moved inside the class methods to avoid startup hangs

KB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base")
os.makedirs(KB_DIR, exist_ok=True)

class DocumentBrain:
    def __init__(self):
        self.model = None
        self.index = None
        self.chunks = []

    def _get_model(self):
        """Lazy load the sentence transformer model."""
        if self.model is None:
            print("🧠 [RAG] Loading brain models (this may take a few seconds on first use)...")
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
        return self.model
        
    def _extract_text(self):
        from PyPDF2 import PdfReader
        docs_text = []
        for file in os.listdir(KB_DIR):
            ext = file.split('.')[-1].lower()
            path = os.path.join(KB_DIR, file)
            try:
                if ext == 'pdf':
                    reader = PdfReader(path)
                    for page in reader.pages:
                        docs_text.append(page.extract_text() or "")
                elif ext == 'txt':
                    with open(path, 'r', encoding='utf-8') as f:
                        docs_text.append(f.read())
            except Exception as e:
                print(f"Error reading {file}: {e}")
        return "\n".join(docs_text)

    def _chunk_text(self, text, size=500, overlap=50):
        words = text.split()
        chunks = []
        for i in range(0, len(words), size - overlap):
            chunks.append(" ".join(words[i:i + size]))
        return chunks

    def build_index(self):
        """Builds FAISS index. Run this whenever new docs are added."""
        import faiss
        import numpy as np
        
        text = self._extract_text()
        if not text.strip():
            self.index = None
            self.chunks = []
            return "Knowledge base is empty."
            
        self.chunks = self._chunk_text(text)
        model = self._get_model()
        embeddings = model.encode(self.chunks)
        dim = embeddings.shape[1]
        
        self.index = faiss.IndexFlatL2(dim)
        self.index.add(np.array(embeddings).astype('float32'))
        return f"Successfully indexed {len(self.chunks)} chunks of text from knowledge base."

    def search(self, query: str, top_k=3) -> str:
        """Finds most relevant knowledge chunks for a query."""
        import numpy as np
        import faiss
        
        if not self.index:
            self.build_index()
            
        if not self.index:
            return "No documents found in knowledge base."
            
        model = self._get_model()
        query_vector = model.encode([query])
        distances, indices = self.index.search(np.array(query_vector).astype('float32'), top_k)
        
        results = []
        for idx in indices[0]:
            if 0 <= idx < len(self.chunks):
                results.append(self.chunks[idx])
        return "\n---\n".join(results)

brain = DocumentBrain()

def query_knowledge_base(query: str):
    """Triggered by assistant_core if user explicitly asks to read documents."""
    return brain.search(query)
