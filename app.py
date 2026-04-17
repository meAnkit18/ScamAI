"""
Smart Attendance System — Flask API
"""

import os
import csv
import base64
import io
from datetime import datetime, date

import cv2
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from recognize import (
    recognize_faces,
    train_encodings,
    get_registered_people,
    load_encodings,
    DATASET_PATH,
)
from phishing import predict_email as phishing_predict

app = Flask(__name__, static_folder="frontend", static_url_path="/frontend")
CORS(app)

ATTENDANCE_FILE = os.path.join(os.path.dirname(__file__), "attendance.csv")

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


# ─── Helpers ────────────────────────────────────────────────────────────────

def decode_base64_frame(b64_string):
    """Decode a base64 image string to a BGR numpy array."""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    img = Image.open(io.BytesIO(img_bytes))
    frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    return frame


def log_attendance(name):
    """Log attendance to CSV. Only logs each person once per day."""
    today = date.today().isoformat()
    now = datetime.now().strftime("%H:%M:%S")

    # Check if already logged today
    if os.path.exists(ATTENDANCE_FILE):
        with open(ATTENDANCE_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("name") == name and row.get("date") == today:
                    return False  # Already logged

    file_exists = os.path.exists(ATTENDANCE_FILE)
    with open(ATTENDANCE_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "date", "time"])
        if not file_exists:
            writer.writeheader()
        writer.writerow({"name": name, "date": today, "time": now})
    return True


def get_attendance(target_date=None):
    """Get attendance records, optionally filtered by date."""
    if not os.path.exists(ATTENDANCE_FILE):
        return []

    records = []
    with open(ATTENDANCE_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if target_date is None or row.get("date") == target_date:
                records.append(row)
    return records


# ─── API Routes ─────────────────────────────────────────────────────────────

@app.route("/api/people", methods=["GET"])
def api_people():
    """List all registered people."""
    people = get_registered_people()
    return jsonify({"people": people, "total": len(people)})


@app.route("/api/register", methods=["POST"])
def api_register():
    """
    Register a new person.
    Body: { "name": "John Doe", "images": ["base64...", ...] }
    """
    data = request.get_json()
    name = data.get("name", "").strip().replace(" ", "_")
    images = data.get("images", [])

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if not images:
        return jsonify({"error": "At least one image is required"}), 400

    person_path = os.path.join(DATASET_PATH, name)
    os.makedirs(person_path, exist_ok=True)

    existing = len([
        f for f in os.listdir(person_path)
        if f.lower().endswith(('.jpg', '.jpeg', '.png'))
    ]) if os.path.exists(person_path) else 0

    saved = 0
    for i, b64_img in enumerate(images):
        try:
            frame = decode_base64_frame(b64_img)

            # Improve lighting
            frame = cv2.convertScaleAbs(frame, alpha=1.3, beta=20)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            if len(faces) > 0:
                x, y, w, h = faces[0]
                face = frame[y:y+h, x:x+w]
                face = cv2.resize(face, (200, 200))

                # Save original + augmented
                count = existing + saved
                cv2.imwrite(os.path.join(person_path, f"{count+1}.jpg"), face)
                cv2.imwrite(
                    os.path.join(person_path, f"{count+2}.jpg"),
                    cv2.flip(face, 1)
                )
                cv2.imwrite(
                    os.path.join(person_path, f"{count+3}.jpg"),
                    cv2.convertScaleAbs(face, alpha=1.2, beta=20)
                )
                cv2.imwrite(
                    os.path.join(person_path, f"{count+4}.jpg"),
                    cv2.convertScaleAbs(face, alpha=0.8, beta=-20)
                )
                saved += 4
        except Exception as e:
            print(f"Error processing image {i}: {e}")

    # Auto-retrain after registration
    if saved > 0:
        stats = train_encodings()
        return jsonify({
            "message": f"Registered {name.replace('_', ' ')} with {saved} images",
            "saved": saved,
            "training": stats,
        })

    return jsonify({"error": "No faces detected in provided images"}), 400


@app.route("/api/recognize", methods=["POST"])
def api_recognize():
    """
    Recognize faces in a frame.
    Body: { "image": "base64..." }
    """
    data = request.get_json()
    b64_img = data.get("image", "")

    if not b64_img:
        return jsonify({"error": "Image is required"}), 400

    try:
        frame = decode_base64_frame(b64_img)
        results = recognize_faces(frame)

        # Log attendance for recognized (non-Unknown) people
        logged = []
        for r in results:
            if r["name"] != "Unknown":
                was_new = log_attendance(r["name"])
                if was_new:
                    logged.append(r["name"])

        return jsonify({
            "faces": results,
            "newly_logged": logged,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/attendance", methods=["GET"])
def api_attendance():
    """Get attendance records. Query param: ?date=YYYY-MM-DD (defaults to today)."""
    target_date = request.args.get("date", date.today().isoformat())
    records = get_attendance(target_date)
    return jsonify({"records": records, "date": target_date, "total": len(records)})


@app.route("/api/attendance/all", methods=["GET"])
def api_attendance_all():
    """Get all attendance records."""
    records = get_attendance()
    return jsonify({"records": records, "total": len(records)})


@app.route("/api/phishing/detect", methods=["POST"])
def api_phishing_detect():
    """
    Detect if email text is phishing.
    Body: { "text": "email content..." }
    """
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Email text is required"}), 400
    try:
        result = phishing_predict(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/train", methods=["POST"])
def api_train():
    """Retrain face encodings from the dataset."""
    stats = train_encodings()
    return jsonify({"message": "Training complete", "stats": stats})


@app.route("/api/stats", methods=["GET"])
def api_stats():
    """Get dashboard statistics."""
    people = get_registered_people()
    today_records = get_attendance(date.today().isoformat())
    all_records = get_attendance()
    enc_data = load_encodings()

    return jsonify({
        "total_people": len(people),
        "total_encodings": len(enc_data.get("encodings", [])),
        "today_attendance": len(today_records),
        "total_attendance": len(all_records),
    })


# ─── Serve Frontend ─────────────────────────────────────────────────────────

@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    os.makedirs(DATASET_PATH, exist_ok=True)
    app.run(debug=True, host="0.0.0.0", port=5000)
