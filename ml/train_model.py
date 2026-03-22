import pandas as pd
import re
import pickle
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords

# Download NLTK resources
nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def advanced_preprocessing(text):
    text = str(text).lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\@\w+|\#','', text)
    text = re.sub(r'[^a-z\s]', '', text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(word) for word in tokens if word not in stop_words]
    return " ".join(tokens)

def train_system():
    try:
        print("Loading dataset...")
        # Adjusted for id,label,tweet structure
        df = pd.read_csv('twitter.csv')
        df = df[['label', 'tweet']]
        df.columns = ['target', 'text']
        
        # In this dataset, 0 is often neutral/neg and 1 is positive/toxic depending on source
        # But we will treat 0 as Neg and 1 as Pos for training
        print("Executing advanced preprocessing...")
        df['text'] = df['text'].apply(advanced_preprocessing)
        
        X_train, X_test, y_train, y_test = train_test_split(df['text'], df['target'], test_size=0.1, random_state=42)

        print("Vectorizing (TF-IDF with Bigrams)...")
        vectorizer = TfidfVectorizer(max_features=50000, ngram_range=(1,2))
        X_train_vec = vectorizer.fit_transform(X_train)

        print("Training Logistic Regression (Balanced)...")
        model = LogisticRegression(max_iter=1000, class_weight='balanced')
        model.fit(X_train_vec, y_train)

        with open('model.pkl', 'wb') as f: pickle.dump(model, f)
        with open('vectorizer.pkl', 'wb') as f: pickle.dump(vectorizer, f)
        
        print("✅ Upgrade complete. Artifacts saved: model.pkl, vectorizer.pkl")
    except Exception as e:
        print(f"❌ Error during training: {e}")

if __name__ == "__main__":
    train_system()
