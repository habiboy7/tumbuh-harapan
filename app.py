import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, g, render_template
from flask_cors import CORS
import joblib
import pandas as pd
import sqlite3
from datetime import datetime
import replicate

# --- Load environment variables ---
load_dotenv()

# --- Path settings ---
APP_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(APP_DIR, 'model_stunting.pkl')
DB_PATH = os.path.join(APP_DIR, 'database.db')

# --- Init app ---
app = Flask(__name__)
CORS(app)

# --- Replicate API Token ---
os.environ["REPLICATE_API_TOKEN"] = os.getenv("REPLICATE_API_TOKEN")

# --- Load ML model ---
try:
    model = joblib.load(MODEL_PATH)
except FileNotFoundError:
    print(f"⚠️ Model file not found at {MODEL_PATH}")
    model = None

# --- Database helpers ---
def get_db():
    if '_database' not in g:
        g._database = sqlite3.connect(DB_PATH)
        g._database.row_factory = sqlite3.Row
    return g._database

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS checks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                age REAL,
                height REAL,
                gender INTEGER,
                status_gizi TEXT,
                probability REAL,
                created_at TEXT
            )
        """)
        conn.commit()

@app.teardown_appcontext
def close_connection(exception):
    db = g.pop('_database', None)
    if db is not None:
        db.close()

init_db()

# ===================
# ROUTES
# ===================

# --- Beranda ---
@app.route("/")
def beranda():
    return render_template("beranda.html")

# --- Tes Stunting (GET: halaman, POST: prediksi) ---
@app.route("/tes-stunting", methods=["GET", "POST"])
def tes_stunting():
    if request.method == "GET":
        return render_template("tes_stunting.html")

    if request.method == "POST":
        data = request.get_json()
        required_fields = ['age', 'height', 'gender']
        if not data or not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        try:
            if model is None:
                return jsonify({'error': 'Model not loaded'}), 500

            age = float(data['age'])
            if age > 60:
                return jsonify({
                    'error': 'Usia tidak boleh lebih dari 60 bulan'
                }), 400

            height = float(data['height'])
            gender = int(data['gender'])

            
            df = pd.DataFrame([[gender, age, height]],
                              columns=['Jenis Kelamin', 'Umur (bulan)', 'Tinggi Badan (cm)'])

            pred = model.predict(df)[0]
            prob = float(model.predict_proba(df).max())

            status_map = {
                "severely stunted": "Berisiko stunting tinggi",
                "stunted": "Stunting",
                "normal": "Normal",
                "tinggi": "Tinggi"
            }
            status_display = status_map.get(pred.lower(), "Status Tidak Diketahui")

            # AI suggestion
            gender_text = "Laki-laki" if gender == 1 else "Perempuan"
            prompt = (
                f"Anda adalah ahli gizi anak yang ramah dan penuh empati"
                f"Berikut data anak:\n"
                f"- Usia: {age} bulan (maksimal 60 bulan)\n"
                f"- Tinggi badan: {height} cm\n"
                f"- Jenis kelamin: {gender_text}\n"
                f"- Status gizi: {status_display}\n\n"
                f"Tugas Anda:\n"
                f"1. Berikan 4 saran perbaikan gizi sesuai usia, jenis kelamin, tinggi, dan status gizi anak. \n"
                f"2. Sesuaikan saran dengan kemampuan makan anak di usia tersebut \n"
                f"3. Saran harus praktis, mudah dimengerti orang tua, hangat, dan sopan.\n"
                f"4. Gunakan bahasa Indonesia, tanpa istilah asing atau medis.\n"
                f"5. Setiap saran maksimal 30 kata.\n"
                f"6. Pastikan jawaban akurat dan membantu perbaikan gizi\n"
                f"Format:\n"
                f"1. Susui anak lebih sering sesuai kebutuhan\n"
                f"2. Tambahkan bubur lembut dengan sayur dan sedikit ikan\n"
                f"3. Berikan potongan buah matang sebagai camilan sehat\n"
                f"4. Variasikan sumber protein hewani tiap hari sesuai usia dan porsi anak"
            )
            try:
                output = replicate.run(
                    "ibm-granite/granite-3.3-8b-instruct",
                    input={
                        "prompt": prompt,
                        "temperature": 0.2,
                        "max_tokens": 520,
                        "min_tokens": 1,
                        "top_p": 0.8,
                        "top_k": 42,
                       }
                )
                saran = "".join(output)
            except Exception as e:
                saran = "Maaf, terjadi kesalahan saat memproses saran gizi."
                app.logger.error(f"Replicate API Error: {e}")

            # Save to DB
            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO checks (age, height, gender, status_gizi, probability, created_at)
                VALUES (?,?,?,?,?,?)
            ''', (age, height, gender, status_display, prob, datetime.utcnow().isoformat()))
            conn.commit()

            return jsonify({
                'status': status_display,
                'probability': prob,
                'age': age,
                'height': height,
                'gender': gender,
                'saran': saran
            })

        except Exception as e:
            app.logger.error(f"Prediction Error: {e}")
            return jsonify({'error': str(e)}), 400




# ===================
# RUN SERVER
# ===================
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
