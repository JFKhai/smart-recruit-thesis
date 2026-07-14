import numpy as np

def calculate_cosine_similarity(vector_a, vector_b):
    try:
        a = np.array(vector_a)
        b = np.array(vector_b)
          
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        score = dot_product / (norm_a * norm_b)
        return float(score)
    except Exception as e:
        print(f"Lỗi khi tính similarity: {e}")
        return 0.0