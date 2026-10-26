/* Pono Voice: kerangka halaman (markup). Dipakai index.html dan studio.html. */
const PVH={};
const SVG=p=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
PVH.ico={
  auto:SVG('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
  light:SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  dark:SVG('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>')
};
PVH.header=page=>`<div class="topbar">${page==='studio'?'<a class="btn sm" href="./index.html">← AI Voice</a>':'<a class="btn sm" href="./studio.html">Voice + Visual →</a>'}<span class="sp"></span>
  <div class="theme" role="group" aria-label="Mode tampilan">
    <button type="button" data-m="auto" aria-label="Otomatis" title="Otomatis">${PVH.ico.auto}</button>
    <button type="button" data-m="light" aria-label="Terang" title="Terang">${PVH.ico.light}</button>
    <button type="button" data-m="dark" aria-label="Gelap" title="Gelap">${PVH.ico.dark}</button>
  </div></div>
<header>
  <div class="logo" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="url(#lg)" stroke-width="2.6" stroke-linecap="round"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0788c4"/><stop offset="1" stop-color="#2650d0"/></linearGradient></defs><path d="M5 10v4M9 6v12M13 9v6M17 4v16M21 9v6"/></svg></div>
  <h1>Pono Voice</h1><p>${page==='studio'?'Voice + Visual · Shorts 9:16':'Naskah jadi suara · Gemini TTS'}</p>
</header>`;
PVH.key=(tm)=>`<section class="card" id="keyCard">
  <details id="keyBox" open>
    <summary>
      <span class="pill">Siapkan</span><h2 style="font-size:16px;margin:0;white-space:nowrap">API key</h2>
      <span class="ok" id="keyOk" hidden>● TERSIMPAN</span>
      <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </summary>
    <div style="margin-top:14px">
      <label class="f" for="key">Gemini API key</label>
      <div class="row">
        <input id="key" type="password" placeholder="AIza…" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="ib" id="eye" type="button" aria-label="Tampilkan key"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
      </div>
      <label class="chk"><input type="checkbox" id="remember"> Ingat key di perangkat ini</label>
      <p class="hint">Key disimpan hanya di browser kamu dan dikirim langsung ke Google. Buat di <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>.</p>
      <div class="sub"><label class="f" for="model">Model</label>
        <select id="model">
          <option value="gemini-3.8-flash-tts">Gemini 3.8 Flash TTS (kualitas)</option>
          <option value="gemini-3.8-flash-lite-tts">Gemini 3.8 Flash-Lite TTS (hemat &amp; cepat)</option>
          <option value="__custom">Model lain…</option>
        </select>
        <input id="modelCustom" type="text" placeholder="id model, contoh: gemini-3.8-flash-tts" style="margin-top:8px" hidden autocapitalize="off" spellcheck="false">
      </div>
${tm?`      <div class="sub"><label class="f" for="textModel">Model teks (rencana visual)</label>
        <input id="textModel" type="text" value="gemini-3.8-flash" autocapitalize="off" spellcheck="false">
      </div>
`:''}      <div class="sub row"><button class="btn sm" id="forget" type="button">Hapus data tersimpan</button></div>
    </div>
  </details>
</section>`;
PVH.script=`<section class="card">
  <div class="head"><span class="pill">Langkah 1</span><h2>Tulis naskah</h2></div>
  <textarea id="script" placeholder="Pernah nggak kamu bingung, kenapa bahasa di dunia itu beda-beda?&#10;&#10;Karena ada gunung, laut, dan sungai yang memisahkan manusia di masa lalu. Jadi kata baru muncul di satu tempat."></textarea>
  <div class="meta"><span id="sWords">0 kata</span><span id="sChars">0 karakter</span><span id="sDur">≈ 0 dtk</span><span id="sScenes">0 adegan</span></div>
  <p class="hint">Pisahkan adegan dengan satu baris kosong. Baca keras dulu: kalimat yang bikin lidah tersandung perlu dipersingkat.</p>
</section>`;
PVH.voice=`<section class="card">
  <div class="head"><span class="pill">Langkah 2</span><h2>Pilih suara</h2></div>
  <div class="vsum">
    <div class="sp"><b id="vName">Kore</b> <span id="vDesc">Tegas</span></div>
    <button class="btn sm" id="vTest" type="button"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>Tes</button>
    <button class="btn sm" id="vToggle" type="button" aria-expanded="false">Ganti</button>
  </div>
  <div id="vWrap" hidden>
    <div class="seg g4" id="vGender" style="margin-top:12px"><button type="button" data-v="all">Semua</button><button type="button" data-v="P">Pria</button><button type="button" data-v="W">Wanita</button></div>
    <input id="vSearch" type="text" placeholder="Cari nama atau karakter suara…" style="margin-top:12px" autocomplete="off">
    <div class="vgrid" id="vGrid"></div>
  </div>
</section>`;
PVH.emo=`<section class="card">
  <div class="head"><span class="pill">Langkah 3</span><h2>Atur emosi &amp; tempo</h2></div>
  <label class="f">Gaya bicara</label>
  <div class="chips" id="emo"></div>
  <div class="sub"><label class="f">Tempo</label>
    <div class="seg" id="tempo"><button type="button" data-v="slow">Lambat</button><button type="button" data-v="normal">Normal</button><button type="button" data-v="fast">Cepat</button></div>
  </div>
  <div class="sub"><label class="f">Sisipkan ke naskah (di posisi kursor)</label>
    <div class="chips" id="tags"></div>
  </div>
</section>`;
PVH.ctx=`<section class="card">
  <div class="head"><span class="pill">Langkah 4</span><h2>Konteks adegan</h2></div>
  <textarea id="ctx" class="sm" placeholder="Pembicara sedang berdiri di depan kamera, gaya edukatif"></textarea>
  <p class="hint">Tulis singkat, cukup cara menyampaikannya. Jangan tulis umur, gender, atau nama.</p>
  <div class="final" id="finalStyle">Gaya akhir: (kosong, suara netral)</div>
</section>`;
PVH.dict=`<section class="card">
  <details id="dictBox">
    <summary><span class="pill">Opsional</span><h2 style="font-size:16px;margin:0">Kamus ejaan</h2>
      <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary>
    <div style="margin-top:12px">
      <textarea id="dict" class="sm" placeholder="Satu aturan per baris, format kata=ejaan&#10;rimousyen=rimiusyen&#10;AI=ei ai"></textarea>
      <p class="hint">Kalau ada kata salah ucap, tulis ejaan yang kamu mau di sini lalu generate ulang. Teks di naskah tidak berubah, hanya yang dikirim ke suara.</p>
    </div>
  </details>
</section>`;
PVH.result=`<section class="card" id="result" hidden>
  <div class="head"><span class="pill">Hasil</span><h2>Cek sinkron &amp; unduh</h2></div>
  <div class="tl" id="tl"></div>
  <div class="wave" id="waveBox"><canvas id="wave"></canvas></div>
  <div class="player">
    <button class="ib" id="play" type="button" aria-label="Putar"><svg id="icoPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
    <span class="time" id="time">0:00.0 / 0:00.0</span>
    <span style="flex:1"></span>
    <label class="f" for="gap" style="margin:0">Jeda</label>
    <select id="gap" style="width:auto;padding:7px 9px;font-size:14px;border-radius:9px">
      <option value="0">0 dtk</option><option value="0.25">0.25</option><option value="0.5">0.5</option><option value="0.8">0.8</option>
    </select>
  </div>
  <div class="sub"><label class="f" for="fname">Nama file</label>
    <input id="fname" type="text" value="naskah" autocapitalize="off" spellcheck="false"></div>
  <div class="row" style="flex-wrap:wrap;margin-top:14px">
    <button class="btn pri" id="dlMp3" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg><span>Unduh MP3</span></button>
    <button class="btn" id="dl" type="button">Unduh WAV</button>
  </div>
  <div class="row" style="flex-wrap:wrap;margin-top:12px">
    <button class="btn sm" id="copyT" type="button">Salin durasi gambar</button>
    <button class="btn sm" id="copyS" type="button">Salin teks adegan</button>
  </div>
  <p class="hint">Di CapCut: impor audionya, lalu atur panjang tiap gambar sesuai "durasi gambar". Totalnya sama dengan panjang audio.</p>
  <div id="scenes"></div>
</section>`;
PVH.imp=`<section class="card" id="impCard">
  <div class="head"><span class="pill">Opsional</span><h2>Impor audio jadi</h2></div>
  <p class="hint" style="margin-top:0">Pakai audio yang sudah kamu punya (MP3/WAV) tanpa memakai kuota suara. Naskah di Langkah 1 harus sama dengan isi audio, dengan adegan dipisah baris kosong.</p>
  <div class="row sub" style="margin-top:14px;flex-wrap:wrap"><label class="btn" for="impFile" id="impBtn">Pilih file audio</label><input id="impFile" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg" hidden><span class="time" id="impName"></span></div>
  <p class="hint" id="impInfo"></p>
</section>`;
PVH.tabs=`<div class="tabs" id="tabs" role="group" aria-label="Langkah">
  <button type="button" data-t="1"><b>1</b>Naskah &amp; suara</button>
  <button type="button" data-t="2"><b>2</b>Visual</button>
  <button type="button" data-t="3"><b>3</b>Paket CapCut</button>
</div>`;
PVH.viz=`<div data-tab="2" hidden>
<section class="card" id="vizCard">
  <div class="head"><span class="pill">Visual</span><h2>Gaya &amp; master prompt</h2></div>
  <label class="f">Gaya visual</label>
  <div class="chips" id="vpre"></div>
  <textarea id="vstyle" class="sm" style="margin-top:14px" placeholder="Contoh: realistis sinematik, alat berat konstruksi, pencahayaan dramatis"></textarea>
  <div class="sub"><label class="f">Jenis prompt</label>
    <div class="seg two" id="vmode"><button type="button" data-v="image">Gambar</button><button type="button" data-v="video">Video</button></div>
    <p class="hint">Gambar = text-to-image. Video = text-to-video (ditambah gerakan dan durasi).</p></div>
  <div class="sub"><label class="f" for="master">Master prompt (kunci konsistensi)</label>
    <textarea id="master" style="min-height:140px" placeholder="Diisi otomatis oleh Gemini saat kamu menekan Rencanakan visual. Boleh kamu tulis atau edit sendiri."></textarea>
    <label class="chk"><input type="checkbox" id="vlock"> Kunci master ini (jangan dibuat ulang)</label>
    <p class="hint">Master dipasang di depan setiap prompt adegan supaya gaya, warna, dan subjek berulang tetap sama. Kunci master yang sama untuk video lain agar satu gaya.</p></div>
  <div class="row sub" style="flex-wrap:wrap"><button class="btn pri" id="plan" type="button">Rencanakan visual</button></div>
  <p class="hint">Satu request teks ke Gemini untuk semua adegan, jadi hemat kuota.</p>
  <div class="final" id="vizStale" hidden>Naskah berubah sejak rencana dibuat. Rencanakan ulang supaya sesuai.</div>
</section>
<section class="card" id="vizRows" hidden>
  <div class="head"><span class="pill">Adegan</span><h2>Prompt per adegan</h2></div>
  <div id="vizList"></div>
  <div class="row" style="flex-wrap:wrap;margin-top:18px"><button class="btn sm" id="copyP" type="button">Salin semua prompt</button></div>
</section>
</div>`;
PVH.pack=`<div data-tab="3" hidden>
<section class="card">
  <div class="head"><span class="pill">Paket</span><h2>Siap ke CapCut</h2></div>
  <div class="chkrow" id="pkState"></div>
  <div class="row" style="flex-wrap:wrap">
    <button class="btn pri" id="pkMp3" type="button">Unduh MP3</button>
    <button class="btn" id="pkWav" type="button">Unduh WAV</button>
  </div>
  <div class="row" style="flex-wrap:wrap;margin-top:12px">
    <button class="btn sm" id="pkDur" type="button">Salin durasi gambar</button>
    <button class="btn sm" id="pkAll" type="button">Salin ringkasan</button>
    <button class="btn sm" id="pkTxt" type="button">Unduh ringkasan .txt</button>
  </div>
  <p class="hint">Di CapCut: impor audio, buat gambar/video dari prompt di tool lain, lalu atur panjang tiap klip sesuai "gambar … dtk". Subtitle lewat Auto captions.</p>
</section>
<section class="card">
  <div class="head"><span class="pill">Adegan</span><h2>Ringkasan</h2></div>
  <div id="packList"></div>
</section>
</div>`;
PVH.mount=function(){
  const page=document.body.dataset.page,hdr=document.getElementById('hdr'),app=document.getElementById('app'),studio=page==='studio';
  hdr.innerHTML=PVH.header(page);
  const base=PVH.key(studio)+PVH.script+PVH.voice+PVH.emo+PVH.ctx+PVH.dict;
  app.innerHTML=studio?PVH.tabs+'<div data-tab="1">'+base+PVH.imp+PVH.result+'</div>'+PVH.viz+PVH.pack:base+PVH.result;
};
PVH.mount();
