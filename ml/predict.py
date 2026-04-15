import sys
import json
import nltk
import re
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Ensure vader_lexicon is downloaded silently
try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

# Toxic content detection patterns
HATE_SPEECH_PATTERNS = [
    r'\bhate\b', r'\bkill\b', r'\bdie\b', r'\bdeath\b', r'\bmurder\b',
    r'\bterrorist\b', r'\bnazi\b', r'\bracist\b', r'\bsexist\b',
    r'\bhomophobic\b', r'\bislamophobic\b', r'\bantisemitic\b',
    r'\bslave\b', r'\blynch\b', r'\bgenocide\b', r'\bmassacre\b'
]

PROFANITY_PATTERNS = [
    r'\bfuck\b', r'\bshit\b', r'\bass\b', r'\bdamn\b', r'\bhell\b',
    r'\bwhore\b', r'\bslut\b', r'\bbitch\b', r'\bastard\b', r'\bcunt\b',
    r'\bdick\b', r'\bpiss\b', r'\bcock\b', r'\bpussy\b', r'\btits\b'
]

ABUSIVE_LANGUAGE_PATTERNS = [
    r'\bstupid\b', r'\bidiot\b', r'\bdumb\b', r'\bretard\b', r'\bmoron\b',
    r'\bloser\b', r'\bpathetic\b', r'\bworthless\b', r'\buseless\b',
    r'\bdisgusting\b', r'\brepulsive\b', r'\bvile\b', r'\bdisgrace\b'
]

THREAT_PATTERNS = [
    r'\bthreaten\b', r'\bharm\b', r'\bhurt\b', r'\battack\b', r'\bassault\b',
    r'\bbeat\b', r'\bdestroy\b', r'\bkill\b', r'\brape\b', r'\bstab\b',
    r'\bshoot\b', r'\bbomb\b', r'\bexplode\b', r'\bviolence\b'
]

# Negative product feedback patterns
NEGATIVE_PRODUCT_PATTERNS = [
    r'\bnot good\b', r'\bbad quality\b', r'\bpoor quality\b', r'\bterrible\b',
    r'\bawful\b', r'\bhorrible\b', r'\bworst\b', r'\bsucks\b', r'\btrash\b',
    r'\bgarbage\b', r'\bwaste\b', r'\bdisappointed\b', r'\bunsatisfied\b',
    r'\bnot worth\b', r'\bnot recommend\b', r'\bnever buy\b', r'\bavoid\b',
    r'\bnot working\b', r'\bbroken\b', r'\bdefective\b', r'\buseless\b',
    r'\bpoor service\b', r'\bbad service\b', r'\bterrible service\b',
    r'\bquality is bad\b', r'\bquality is poor\b', r'\bquality is terrible\b',
    r'\bnot happy\b', r'\bnot satisfied\b', r'\bvery bad\b', r'\breally bad\b'
]

def detect_toxic_patterns(text):
    """Detect various types of toxic content using pattern matching"""
    text_lower = text.lower()
    
    hate_speech_count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in HATE_SPEECH_PATTERNS)
    profanity_count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in PROFANITY_PATTERNS)
    abusive_count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in ABUSIVE_LANGUAGE_PATTERNS)
    threat_count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in THREAT_PATTERNS)
    negative_product_count = sum(len(re.findall(pattern, text_lower, re.IGNORECASE)) for pattern in NEGATIVE_PRODUCT_PATTERNS)
    
    return {
        'hate_speech': hate_speech_count,
        'profanity': profanity_count,
        'abusive': abusive_count,
        'threats': threat_count,
        'negative_product_feedback': negative_product_count,
        'total_toxic_matches': hate_speech_count + profanity_count + abusive_count + threat_count + negative_product_count
    }

def calculate_toxicity_score(text, sentiment_scores, toxic_patterns):
    """Calculate comprehensive toxicity score"""
    # Base toxicity from negative sentiment
    base_toxicity = abs(sentiment_scores['neg']) if sentiment_scores['compound'] < 0 else 0.1
    
    # Increase toxicity based on pattern matches
    pattern_multiplier = 1.0 + (toxic_patterns['total_toxic_matches'] * 0.3)
    
    # Specific category multipliers
    if toxic_patterns['hate_speech'] > 0:
        pattern_multiplier += 0.5 * toxic_patterns['hate_speech']
    if toxic_patterns['threats'] > 0:
        pattern_multiplier += 0.7 * toxic_patterns['threats']
    if toxic_patterns['negative_product_feedback'] > 0:
        pattern_multiplier += 0.4 * toxic_patterns['negative_product_feedback']
    
    # Additional boost for negative sentiment about quality
    if sentiment_scores['compound'] < -0.1:
        pattern_multiplier += 0.3
    
    toxicity = min(0.95, base_toxicity * pattern_multiplier)
    
    return round(float(toxicity), 2)

def categorize_toxicity(toxicity, toxic_patterns):
    """Categorize the type of toxicity"""
    if toxicity < 0.3:
        return "safe"
    elif toxicity < 0.5:
        return "mild"
    elif toxicity < 0.7:
        return "moderate"
    else:
        return "severe"

def get_toxicity_categories(toxic_patterns):
    """Identify specific toxicity categories"""
    categories = []
    if toxic_patterns['hate_speech'] > 0:
        categories.append("hate_speech")
    if toxic_patterns['profanity'] > 0:
        categories.append("profanity")
    if toxic_patterns['abusive'] > 0:
        categories.append("abusive_language")
    if toxic_patterns['threats'] > 0:
        categories.append("threats")
    if toxic_patterns['negative_product_feedback'] > 0:
        categories.append("negative_product_feedback")
    
    return categories if categories else ["negative_sentiment"]

def get_vader_sentiment(text):
    if not text or not text.strip():
        return {"code": 2, "confidence": 0.8, "toxicity": 0.0, "toxicity_level": "safe", "toxicity_categories": [], "toxicity_details": {}}

    try:
        sia = SentimentIntensityAnalyzer()
        scores = sia.polarity_scores(text)
        compound = scores['compound']

        # ADJUSTED THRESHOLDS for better negative detection:
        # More sensitive to negative feedback, especially product quality issues
        if compound >= 0.3:
            code = 1  # Positive
        elif compound <= -0.1:  # Changed from -0.4 to -0.1 for better negative detection
            code = 0  # Negative
        else:
            code = 2  # Neutral

        # Confidence Score
        if code == 2:
            confidence = 0.8  # Consistent high confidence for Neutral
        else:
            confidence = abs(compound)

        confidence = max(0.5, min(0.99, confidence))
        
        # Enhanced toxicity detection
        toxic_patterns = detect_toxic_patterns(text)
        toxicity = calculate_toxicity_score(text, scores, toxic_patterns)
        toxicity_level = categorize_toxicity(toxicity, toxic_patterns)
        toxicity_categories = get_toxicity_categories(toxic_patterns)

        return {
            "code": code, 
            "confidence": round(float(confidence), 2), 
            "toxicity": toxicity,
            "toxicity_level": toxicity_level,
            "toxicity_categories": toxicity_categories,
            "toxicity_details": toxic_patterns
        }
    except Exception:
        return {"code": 2, "confidence": 0.8, "toxicity": 0.0, "toxicity_level": "safe", "toxicity_categories": [], "toxicity_details": {}}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_data = sys.argv[1]
        try:
            # Check if it's a temp file path
            if input_data.endswith(".json"):
                with open(input_data, "r") as f:
                    data = json.load(f)
            else:
                data = json.loads(input_data)
                
            if isinstance(data, list):
                # Batch mode
                results = [get_vader_sentiment(text) for text in data]
                print(json.dumps(results))
            else:
                result = get_vader_sentiment(str(data))
                print(json.dumps(result))
        except Exception:
            # Fallback to single string argument
            result = get_vader_sentiment(input_data)
            print(json.dumps(result))
    else:
        print(json.dumps({"code": 2, "confidence": 0.8}))
