# Tumbuh Harapan



## 1. Deskripsi
Tumbuh harapan merupakan sebuah aplikasi deteksi dini stunting berbasis website yang memanfaatkan Model IBM Granite yaitu  [ibm-granite/granite-3.3-8b-instruct](https://replicate.com/ibm-granite/granite-3.3-8b-instruct) melalui Replicate. Website ini dirancang untuk mendeteksi risiko stunting pada anak secara dini. Memudahkan orang tua, tenaga kesehatan, dan sekolah untuk memantau pertumbuhan anak. Mendukung program SDGs pemerintah, khususnya target Good Health and Well-being (SDG 3) dengan meningkatkan kesehatan dan perkembangan anak.

## 2. Teknologi yang Digunakan
**Frontend :** Html, CSS, TailwindCSS, Javascript
**Backend :**  Flask, Python
**Database :** sqlite3
**Replicate API :** Akses model IBM Granite AI

## 3. Fitur
- Input Data Anak : Umur, tinggi badan dan jenis kelamin
- Prediksi Risiko Stunting : Hasil prediksi cepat dengan model AI
- Visualisasi Hasil :  Panel hasil risiko stunting (Normal, Risiko, Tinggi, Tinggi Risiko).
- UI Responsif :  Tampilan responsif di beberapa device
- Saran Perbaikan Gizi : Generate saran perbaikan gizi menggunakan IBM-Construct 3.3-8b sesuai inputan data anak
-  Pencarian Konsul Terdekat : Tersedia maps untuk mendukung penanganan cepat dengan kategori pilihan yaitu cari dokter anak, puskesmas dan klinik terdekat



