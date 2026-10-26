# Pono Voice

Naskah jadi suara (Gemini TTS) dan rencana visual per adegan untuk Shorts 9:16. Tanpa build, tanpa server, jalan di browser HP.

## Dua halaman, satu alamat
| Alamat | Isi |
|---|---|
| `/` | **AI Voice**: naskah, suara (label pria/wanita), emosi, konteks, kamus ejaan, hasil MP3/WAV, durasi gambar. Tombol "Voice + Visual →" di atas. |
| `/studio` | **Voice + Visual**: tiga tab, yaitu 1 Naskah & suara, 2 Visual, 3 Paket CapCut. |

Pilihan tampilan (Otomatis / Terang / Gelap) ada di pojok kanan atas dan berlaku di kedua halaman.
API key, naskah, dan pengaturan dibagi antar halaman (disimpan di browser).

## Alur di /studio
1. **Naskah & suara**: tulis naskah (adegan dipisah baris kosong), lalu **Generate** suara. Atau **Impor audio jadi** (MP3/WAV) supaya tidak memakai kuota suara. Batas adegan pada audio impor dideteksi dari jeda, lalu diperkirakan dari panjang teks, dan bisa digeser per adegan.
2. **Visual**: pilih gaya dan jenis prompt (Gambar atau Video), lalu **Rencanakan visual**. Gemini membuat **master prompt** (mengunci gaya, palet, pencahayaan, subjek berulang) dan isi tiap adegan. Master dipasang di depan setiap prompt, jadi hasilnya konsisten. Master bisa dikunci dan dipakai ulang untuk video lain. Tool ini tidak membuat gambar atau video, hanya prompt untuk dipakai di generator text-to-image/video pilihanmu.
3. **Paket CapCut**: unduh MP3/WAV, salin durasi gambar per adegan, dan ringkasan (teks + prompt final + waktu) sebagai teks atau file `.txt`.

## Di CapCut (HP)
- Impor audio. Atur panjang tiap klip sesuai "gambar … dtk" (sudah termasuk jeda antar adegan, totalnya sama dengan panjang audio).
- CapCut HP tidak bisa impor SRT. Subtitle lewat *Auto captions*.

## File
`index.html`, `studio.html` (halaman), `style.css`, `theme.js`, `markup.js`, `core.js`, `studio.js` (kode bersama), `vercel.json` (alamat `/studio` tanpa `.html`).

## Deploy (dari HP)
1. GitHub: unggah semua file (Add file → Upload files → pilih semua), lalu Commit.
2. Vercel: Add New → Project → pilih repo, Framework Preset = **Other**, tanpa Build Command, Deploy.

## Catatan teknis
- API key hanya disimpan di browser (jika dicentang "Ingat key") dan dikirim langsung ke `generativelanguage.googleapis.com`. Setelah deploy, batasi key ke domain Vercel kamu.
- Suara: `POST /v1beta/interactions`. Rencana visual: `POST /v1beta/models/{model}:generateContent` (default `gemini-3.8-flash`, bisa diganti di bagian "API key").
- MP3 memakai lamejs yang dimuat dari cdnjs saat tombol ditekan (perlu internet). Jika gagal, pakai WAV.
- Memakai kuota API key: **Tes**, **Generate**, **Ulang**, dan **Rencanakan visual**. Impor audio tidak memakai kuota.
