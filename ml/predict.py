import sys
import pickle
import re
import os

# Absolute paths for loading artifacts correctly when called from Node.js
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model.pkl')
VECTORIZER_PATH = os.path.join(BASE_DIR, 'vectorizer.pkl')

# Priority Overrides
TOXIC_KEYWORDS = ['hate', 'stupid', 'idiot', 'trash', 'abusive', 'offensive', 'scam', 'horrible']
NEGATIVE_KEYWORDS = ['bad', 'worst', 'terrible', 'annoying', 'disappointing', 'hate']

# Load artifacts once
try:
    with open(MODEL_PATH, 'rb') as f: model = pickle.load(f)
    with open(VECTORIZER_PATH, 'rb') as f: vectorizer = pickle.load(f)
except Exception as e:
    # Error will be caught by Node.js exec stderr
    print(f"Error loading model: {e}")
    sys.exit(1)

def is_toxic(text):
    text_lower = text.lower()
    for word in TOXIC_KEYWORDS:
        if word in text_lower:
            return True
    return False

def get_prediction(text):
    if is_toxic(text): return 3 # Toxic
    
    cleaned = re.sub(r'[^a-z\s]', '', text.lower())
    vec = vectorizer.transform([cleaned])
    
    # Model returns prob of 0 (clean) and 1 (hate/toxic)
    prob = model.predict_proba(vec)[0]
    hate_prob = prob[1]

    # Heuristic mapping for better demo impact
    if hate_prob > 0.5: return 0 # Negative
    
    # Manual check for common negative words if model missed them
    text_lower = text.lower()
    if any(word in text_lower for word in NEGATIVE_KEYWORDS): return 0
    
    # Check for Neutrality (Low intensity)
    if len(text.split()) < 5: return 2 # Short text usually neutral in demo
    
    if hate_prob < 0.2: return 1 # Positive
    
    return 2 # Neutral

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        print(get_prediction(input_text))
