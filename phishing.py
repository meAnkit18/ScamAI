"""
Phishing Email Detection Module
"""
import os
import pickle

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models/phishing_detector.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data/preprocessed_data.pkl")

_model = None
_vectorizer = None


def load_model():
    """Load model and vectorizer from pickle files."""
    global _model, _vectorizer
    if _model is None:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(DATA_PATH, "rb") as f:
            _, _, _vectorizer = pickle.load(f)
    return _model, _vectorizer


def predict_email(text):
    """
    Predict if email text is phishing.
    Returns: {"label": "Phishing"|"Not Phishing", "confidence": float}
    """
    model, vectorizer = load_model()
    vec = vectorizer.transform([text]).toarray()
    pred = model.predict(vec)[0]
    proba = model.predict_proba(vec)[0]
    
    label = "Phishing" if pred == 1 else "Not Phishing"
    confidence = float(proba[pred])
    
    return {"label": label, "confidence": confidence}
