from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')

def generate_embedding(text: str):
    try:
        embedding = model.encode(text, convert_to_numpy=True)
        
        return embedding.tolist()
    except Exception as e:
        print(f"Lỗi khi tạo embedding: {e}")
        return None