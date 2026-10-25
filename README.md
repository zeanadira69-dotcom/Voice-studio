# Pono Voice

Naskah jadi suara (Gemini TTS) plus rencana visual per adegan untuk Shorts 9:16. Satu file HTML, tanpa build, tanpa server, jalan di browser HP.

## Cara pakai
1. Buka aplikasi, tempel API key Gemini (buat di https://aistudio.google.com/apikey).
2. Tulis naskah. Pisahkan adegan dengan satu baris kosong.
3. Pilih suara (ada label pria/wanita), emosi, tempo, lalu konteks adegan singkat.
4. Tekan **Generate**. Cek sinkron lewat waveform, ulang adegan yang kurang pas.
5. **Unduh MP3** (atau WAV) dan **Salin durasi gambar** untuk dipakai di CapCut.
6. Di bagian **Rencana visual**, pilih gaya lalu tekan **Rencanakan visual**: Gemini menyusun ide visual, prompt gambar, kata kunci footage, dan gerakan CapCut untuk tiap adegan.

Kata salah ucap: isi **Kamus ejaan** dengan format `kata=ejaan`, lalu generate ulang adegan itu.

## Alur ke CapCut (HP)
- Impor audio MP3 ke CapCut.
- Atur panjang tiap gambar/klip sesuai "durasi gambar" (sudah termasuk jeda antar adegan, totalnya sama dengan panjang audio).
- Subtitle: CapCut HP tidak bisa impor file SRT, jadi pakai *Auto captions* dari audio yang sama, atau salin teks adegan lewat tombol **Salin teks adegan**.

## Deploy (dari HP)
1. GitHub: unggah `index.html` dan `README.md` ke repo (**Add file → Upload files**), lalu Commit.
2. Vercel: **Add New → Project**, pilih repo, Framework Preset = **Other**, tanpa Build Command, Deploy.

## Catatan teknis
- API key hanya disimpan di browser (jika dicentang "Ingat key") dan dikirim langsung ke `generativelanguage.googleapis.com`.
- Setelah deploy, batasi key ke domain Vercel kamu di Google AI Studio.
- Suara: `POST /v1beta/interactions` (model TTS). Rencana visual: `POST /v1beta/models/{model}:generateContent` (model teks, default `gemini-3.8-flash`). Nama model bisa diganti di bagian "API key".
- MP3 memakai library lamejs yang dimuat dari cdnjs saat tombol ditekan (perlu internet). Kalau gagal dimuat, pakai WAV.
- Output audio: 24 kHz, mono. Tombol **Tes**, **Generate**, **Ulang**, dan **Rencanakan visual** memakai kuota API key.
