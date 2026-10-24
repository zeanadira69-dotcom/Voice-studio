# Pono Voice

Naskah jadi suara dengan Gemini TTS. Satu file HTML, tanpa build, tanpa server, jalan di browser HP.

## Cara pakai
1. Buka aplikasi, tempel API key Gemini (buat di https://aistudio.google.com/apikey).
2. Tulis naskah. Pisahkan adegan dengan satu baris kosong.
3. Pilih suara, emosi, tempo, lalu tulis konteks adegan singkat.
4. Tekan **Generate**. Cek sinkron lewat waveform, ulang adegan yang kurang pas, lalu **Unduh WAV**.

Kata salah ucap: isi **Kamus ejaan** dengan format `kata=ejaan`, lalu generate ulang adegan itu.

## Deploy (dari HP)
1. GitHub: buat repo baru, pilih **Add file → Upload files**, unggah `index.html` dan `README.md`, lalu Commit.
2. Vercel: **Add New → Project**, pilih repo itu, Framework Preset = **Other**, tanpa Build Command, lalu Deploy.

## Catatan
- API key hanya disimpan di browser (jika dicentang "Ingat key") dan dikirim langsung ke `generativelanguage.googleapis.com`. Tidak lewat server lain.
- Setelah deploy, batasi key di Google AI Studio / Cloud Console ke domain Vercel kamu supaya aman.
- Endpoint: `POST /v1beta/interactions`. Model bisa diganti di bagian "API key & model" bila Google merilis versi baru.
- Output: WAV 24 kHz, mono, 16-bit.
