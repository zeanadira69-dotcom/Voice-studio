'use strict';
/* Pono Voice · halaman Voice + Visual. Dimuat setelah core.js (memakai S, store, toast, rebuild, dll). */
const V={tab:store.get('tab',1),mode:store.get('vmode','image'),master:store.get('master',''),scenes:[],src:'',planning:false};
{const p=store.get('vplan',null);if(p&&Array.isArray(p.scenes)){V.scenes=p.scenes;V.src=p.src||''}}

/* ---------- tab ---------- */
function setTab(n,scroll){
  V.tab=n;store.set('tab',n);
  document.querySelectorAll('[data-tab]').forEach(el=>{el.hidden=+el.dataset.tab!==n});
  document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.t===n));
  document.body.classList.toggle('nobar',n!==1);
  if(n===3)renderPack();
  if(scroll!==false)window.scrollTo({top:0});
  draw();
}
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>setTab(+b.dataset.t)));
HK.beforeKey=()=>{if(V.tab!==1)setTab(1,false)};

/* ---------- impor audio ---------- */
function detectBounds(x,rate,texts){
  const N=texts.length;if(N<2)return{b:[0],method:'satu adegan'};
  const fl=Math.max(1,Math.round(rate*0.02)),fs=fl/rate,nf=Math.floor(x.length/fl),e=new Float32Array(nf);let mx=0;
  for(let f=0;f<nf;f++){let s=0;const o=f*fl;for(let i=0;i<fl;i++){const v=x[o+i];s+=v*v}const r=Math.sqrt(s/fl);e[f]=r;if(r>mx)mx=r}
  const thr=Math.max(0.006,mx*0.05);
  let f0=0;while(f0<nf&&e[f0]<thr)f0++;let f1=nf-1;while(f1>f0&&e[f1]<thr)f1--;
  const a0=f0*fs,a1=(f1+1)*fs,total=x.length/rate;
  const runs=[];let st=-1;
  for(let f=f0;f<=f1+1;f++){const sil=f<=f1&&e[f]<thr;if(sil&&st<0)st=f;if(!sil&&st>=0){const len=(f-st)*fs;if(len>=0.28)runs.push({c:(st+f)/2*fs,len});st=-1}}
  const lens=texts.map(t=>t.replace(/\s+/g,' ').length||1),sum=lens.reduce((a,b)=>a+b,0);
  const span=Math.max(0.5,a1-a0),tol=Math.max(1.0,span*0.1);
  const b=[0];let snapped=0,cum=0,prev=0;
  for(let i=1;i<N;i++){
    cum+=lens[i-1];const exp=a0+span*cum/sum;
    let best=null,bd=1e9;
    for(const r of runs){const d=Math.abs(r.c-exp);if(r.c>prev+0.3&&d<tol&&d<bd){best=r;bd=d}}
    let pos;if(best){pos=best.c;snapped++}else pos=exp;
    pos=Math.max(prev+0.3,Math.min(pos,total-0.3*(N-i)));
    b.push(pos);prev=pos;
  }
  return{b,method:snapped===N-1?'dari jeda di audio':snapped===0?'perkiraan dari panjang teks':'campuran jeda audio dan perkiraan teks'};
}
async function importAudio(f){
  const texts=parseScenes();
  if(!texts.length){toast('Isi naskah dulu (Langkah 1), lalu impor audionya.','err');$('#script').focus();return}
  if(S.busy){toast('Tunggu proses generate selesai.','err');return}
  $('#impName').textContent='Membaca '+f.name+'…';
  let ab;
  try{
    const buf=await f.arrayBuffer();const AC=window.AudioContext||window.webkitAudioContext;const ac=new AC();
    try{ab=await new Promise((res,rej)=>{const p=ac.decodeAudioData(buf,res,rej);if(p&&p.catch)p.catch(rej)})}
    finally{try{ac.close()}catch{}}
  }catch(err){$('#impName').textContent='';toast('Audio tidak bisa dibaca. Coba format MP3 atau WAV.','err');return}
  const n=ab.length,ch=ab.numberOfChannels,rate=ab.sampleRate,mono=new Float32Array(n);
  for(let c=0;c<ch;c++){const d=ab.getChannelData(c);for(let i=0;i<n;i++)mono[i]+=d[i]/ch}
  const pcm=new Int16Array(n);for(let i=0;i<n;i++){const v=Math.max(-1,Math.min(1,mono[i]));pcm[i]=v<0?v*32768:v*32767}
  const det=detectBounds(mono,rate,texts);
  if(!audio.paused)audio.pause();
  S.rate=rate;S.imported={pcm,rate,bounds:det.b};
  S.scenes=texts.map(t=>({text:t,pcm:null,err:null,busy:false,start:0,dur:0}));
  buildScenesUI();$('#result').hidden=false;$('#gap').disabled=true;rebuild();
  $('#impName').textContent=f.name+' · '+fmt(S.total);
  $('#impInfo').textContent='Batas adegan: '+det.method+'. Geser per adegan di bagian Hasil bila kurang pas.';
  toast('Audio diimpor. Cek batas adegan di bagian Hasil.','ok');
  $('#result').scrollIntoView({block:'start'});
}
$('#impFile').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(f)await importAudio(f)});
function nudge(i,dx){
  const bd=S.imported.bounds,lo=bd[i-1]+0.2,hi=(i<bd.length-1?bd[i+1]:S.total)-0.2;
  bd[i]=Math.max(lo,Math.min(hi,bd[i]+dx));rebuild();playScene(i);
}
HK.sceneRow=(i,d)=>{
  if(!S.imported||i===0)return;
  const n=document.createElement('div');n.className='nudge';
  n.innerHTML='<span class="t">Geser mulai</span>'+[-0.5,-0.1,0.1,0.5].map(x=>'<button class="btn sm" type="button" data-d="'+x+'">'+(x>0?'+':'−')+Math.abs(x)+'</button>').join('');
  n.querySelectorAll('button').forEach(b=>b.onclick=()=>nudge(i,parseFloat(b.dataset.d)));
  d.insertBefore(n,d.querySelector('.st'));
};

/* ---------- visual: gaya, master, rencana ---------- */
const VPRE=[["Sinematik","photorealistic, cinematic lighting, shallow depth of field"],["3D render","clean 3D render, soft studio lighting, high detail"],["Ilustrasi flat","flat vector illustration, bold shapes, limited color palette"],["Infografis gelap","dark minimal infographic style, glowing accents, clean icons"]];
function renderVpre(){
  const c=$('#vpre');c.innerHTML='';
  VPRE.forEach(([l,t])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=l;b.setAttribute('aria-pressed',$('#vstyle').value.trim()===t);
    b.onclick=()=>{$('#vstyle').value=t;store.set('vstyle',t);renderVpre()};c.appendChild(b)});
}
$('#vstyle').addEventListener('input',debounce(()=>{store.set('vstyle',$('#vstyle').value);renderVpre()},300));
function syncMode(){document.querySelectorAll('#vmode button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===V.mode))}
document.querySelectorAll('#vmode button').forEach(b=>b.addEventListener('click',()=>{V.mode=b.dataset.v;store.set('vmode',V.mode);syncMode();updateFinals();if(V.tab===3)renderPack()}));
$('#master').addEventListener('input',()=>{V.master=$('#master').value;store.set('master',V.master);updateFinals()});
$('#vlock').addEventListener('change',()=>store.set('vlock',$('#vlock').checked));

const str=x=>typeof x==='string'?x.trim():(x==null?'':String(x));
function parsePlan(txt){
  const t=txt.trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');let v;
  try{v=JSON.parse(t)}catch{const a=t.search(/[\[{]/),b=Math.max(t.lastIndexOf(']'),t.lastIndexOf('}'));if(a>=0&&b>a){try{v=JSON.parse(t.slice(a,b+1))}catch{}}}
  let master='',arr=v;
  if(v&&!Array.isArray(v)){master=str(v.master??v.master_prompt);arr=v.scenes||v.adegan||v.items||Object.values(v).find(Array.isArray)}
  if(!Array.isArray(arr))throw new Error('Format jawaban Gemini tidak terbaca. Coba rencanakan lagi.');
  return{master,scenes:arr.map(o=>({idea:str(o.idea??o.ide),scene:str(o.scene??o.prompt??o.image_prompt??o.adegan),motion:str(o.motion??o.move??o.gerakan)}))};
}
async function planVisual(texts,style,locked,signal,onWait){
  const list=texts.map((t,i)=>(i+1)+'. '+t.replace(/\s+/g,' ')).join('\n');
  const prompt='Kamu perencana visual untuk video vertikal 9:16 (YouTube Shorts) yang akan dibuat di generator text-to-image atau text-to-video.\n'+
   (locked?'Gunakan MASTER PROMPT berikut apa adanya (jangan diubah, jangan ditulis ulang):\n'+locked+'\n\nLalu buat rencana untuk setiap adegan naskah.\n':'Pertama buat "master", lalu buat rencana untuk setiap adegan naskah.\n')+
   'Balas HANYA dengan JSON object: '+(locked?'{"scenes":[...]}':'{"master":"...","scenes":[...]}')+'.\n'+
   (locked?'':'- "master": satu paragraf bahasa Inggris (80 sampai 120 kata) yang mengunci tampilan seluruh video: jenis visual (mis. photorealistic, 3D render, flat illustration), palet warna, pencahayaan, gaya kamera dan lensa, suasana, serta deskripsi tetap untuk subjek atau karakter yang muncul berulang (tulis persis sama setiap kali muncul). Akhiri dengan aturan: vertical 9:16, no text, no letters, no logos, no watermarks.\n')+
   '- "scenes": array berisi tepat '+texts.length+' objek, urut sesuai adegan. Tiap objek berisi:\n'+
   '  - "idea": ide visual dalam bahasa Indonesia, satu kalimat.\n'+
   '  - "scene": bahasa Inggris, satu sampai dua kalimat tentang isi adegan ini saja (subjek, aksi, lokasi, sudut kamera). Jangan mengulang gaya yang sudah ada di master. Kalau ada subjek berulang, pakai deskripsi yang sama persis dengan di master.\n'+
   '  - "motion": bahasa Inggris, satu kalimat gerakan kamera atau subjek untuk video (mis. slow push-in while steam rises). Buat sederhana supaya bisa ditiru dengan zoom atau geser di CapCut.\n'+
   'Jangan menampilkan orang nyata yang dikenal.\n'+
   'Gaya visual dari pengguna: '+(style||'realistis sinematik, pencahayaan natural')+'\n\nNaskah per adegan:\n'+list;
  const url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(getTextModel())+':generateContent';
  const mk=json=>({contents:[{parts:[{text:prompt}]}],...(json?{generationConfig:{responseMimeType:'application/json'}}:{})});
  let j;
  try{j=await callApi(url,mk(true),signal,onWait)}
  catch(e){if(e.status===400&&!e.keyBad)j=await callApi(url,mk(false),signal,onWait);else throw e}
  const txt=((j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[]).map(p=>p.text||'').join('');
  if(!txt){const br=j.promptFeedback&&j.promptFeedback.blockReason;throw new Error(br?'Gemini menolak naskah ini ('+br+'). Ubah sedikit lalu coba lagi.':'Gemini tidak mengembalikan teks. Coba lagi atau ganti model teks.')}
  return parsePlan(txt);
}

/* ---------- prompt final ---------- */
function durOf(i){return S.scenes.length&&S.scenes.length===V.scenes.length&&S.scenes.every(s=>s.pcm)?clipFmt(i):null}
function finalPrompt(i){
  const v=V.scenes[i],m=(V.master||'').trim(),p=[];
  if(m)p.push(m);
  p.push('Scene: '+(v.scene||'').trim());
  if(V.mode==='video'){
    if(v.motion)p.push('Motion: '+v.motion.trim());
    const d=durOf(i);if(d)p.push('Duration: about '+d+' seconds.');
  }
  p.push('Vertical 9:16 composition. No text, letters, logos or watermarks.');
  return p.join('\n\n');
}
const savePlan=()=>store.set('vplan',{scenes:V.scenes,src:V.src});
const savePlanD=debounce(savePlan,400);
function updateFinals(){document.querySelectorAll('#vizList .scene').forEach((d,i)=>{if(V.scenes[i])d.querySelector('pre.fin').textContent=finalPrompt(i)})}
function updateVizDur(){document.querySelectorAll('#vizList .vd').forEach((el,i)=>{const d=durOf(i);el.textContent=d?'gambar '+d+' dtk':''});updateFinals()}
function renderViz(){
  const box=$('#vizList');box.innerHTML='';
  V.scenes.forEach((v,i)=>{
    const d=document.createElement('div');d.className='scene';
    d.innerHTML='<div class="top"><span class="dot" style="background:'+COLORS[i%COLORS.length]+'"></span><b>Adegan '+(i+1)+'</b><span class="vd"></span></div>'+
      '<p class="src"></p>'+
      '<label class="f">Ide visual</label><textarea data-f="idea" class="sm" style="min-height:64px"></textarea>'+
      '<label class="f">Isi adegan (Inggris)</label><textarea data-f="scene" class="sm" style="min-height:84px"></textarea>'+
      '<label class="f">Gerakan (video / efek CapCut)</label><input type="text" data-f="motion">'+
      '<label class="f">Prompt final</label><pre class="fin"></pre>'+
      '<div class="acts"><button class="btn sm" data-a="cp" type="button">Salin prompt final</button></div>';
    d.querySelector('.src').textContent=v.text;
    d.querySelectorAll('[data-f]').forEach(el=>{el.value=v[el.dataset.f]||'';el.addEventListener('input',()=>{v[el.dataset.f]=el.value;d.querySelector('pre.fin').textContent=finalPrompt(i);savePlanD()})});
    d.querySelector('[data-a=cp]').onclick=()=>copyText(finalPrompt(i),'Prompt adegan '+(i+1)+' disalin.');
    box.appendChild(d);
  });
  $('#vizRows').hidden=!V.scenes.length;
  if(!$('#toPack')&&V.scenes.length){$('#vizRows').insertAdjacentHTML('beforeend','<div class="row" style="margin-top:12px"><button class="btn" id="toPack" type="button">Lanjut ke Paket CapCut →</button></div>');$('#toPack').onclick=()=>setTab(3)}
  updateVizDur();updateStats();
}
$('#plan').onclick=async()=>{
  if(V.planning||needKey())return;
  const texts=parseScenes();if(!texts.length){toast('Naskah masih kosong.','err');setTab(1);$('#script').focus();return}
  const locked=($('#vlock').checked&&$('#master').value.trim())||'';
  const b=$('#plan'),old=b.innerHTML;V.planning=true;b.disabled=true;b.innerHTML='<span class="spin"></span>Menyusun rencana…';
  try{
    const r=await planVisual(texts,$('#vstyle').value.trim(),locked,null,w=>toast(w));
    if(!locked&&r.master){V.master=r.master;$('#master').value=r.master;store.set('master',r.master)}
    V.scenes=texts.map((t,i)=>Object.assign({text:t,idea:'',scene:'',motion:''},r.scenes[i]||{}));V.src=JSON.stringify(texts);savePlan();renderViz();
    const miss=texts.length-r.scenes.length;
    toast(miss>0?'Sebagian adegan belum terisi ('+r.scenes.length+' dari '+texts.length+'). Coba lagi.':'Rencana visual siap. Edit bila perlu.',miss>0?'err':'ok');
    $('#vizRows').scrollIntoView({block:'start'});
  }catch(e){toast(e.message,'err')}
  V.planning=false;b.disabled=false;b.innerHTML=old;
};
$('#copyP').onclick=()=>copyText(V.scenes.map((v,i)=>(i+1)+'.\n'+finalPrompt(i)).join('\n\n---\n\n'),'Semua prompt final disalin.');

/* ---------- paket CapCut ---------- */
function packItems(){return V.scenes.length?V.scenes:parseScenes().map(t=>({text:t,idea:'',scene:'',motion:''}))}
function packText(){
  const items=packItems(),hasA=S.scenes.length&&S.scenes.every(s=>s.pcm),same=hasA&&S.scenes.length===items.length;
  const L=['PONO VOICE · PAKET CAPCUT'];
  if(hasA)L.push('Total audio: '+fmt(S.total));
  if(V.scenes.length)L.push('Jenis prompt: '+(V.mode==='video'?'video':'gambar'));
  L.push('');
  items.forEach((v,i)=>{
    L.push('ADEGAN '+(i+1)+(same?' · mulai '+fmt(S.scenes[i].start)+' · gambar '+clipFmt(i)+' dtk':''));
    L.push('Teks: '+v.text);
    if(v.scene)L.push('Prompt:\n'+finalPrompt(i));
    L.push('');
  });
  return L.join('\n').trim()+'\n';
}
function renderPack(){
  const hasA=S.scenes.length&&S.scenes.every(s=>s.pcm),hasV=V.scenes.length>0,items=packItems();
  $('#pkState').innerHTML='<span class="'+(hasA?'y':'n')+'">'+(hasA?'✓':'✗')+' Audio '+(hasA?fmt(S.total):'belum ada')+'</span><span class="'+(hasV?'y':'n')+'">'+(hasV?'✓':'✗')+' Rencana visual</span>';
  ['pkMp3','pkWav','pkDur'].forEach(id=>{$('#'+id).disabled=!hasA});
  $('#pkAll').disabled=$('#pkTxt').disabled=!items.length;
  const box=$('#packList');box.innerHTML='';
  if(!items.length){box.innerHTML='<p class="hint" style="margin:0">Isi naskah di Langkah 1 dulu.</p>';return}
  const same=hasA&&S.scenes.length===items.length;
  items.forEach((v,i)=>{
    const d=document.createElement('div');d.className='scene';
    d.innerHTML='<div class="top"><span class="dot" style="background:'+COLORS[i%COLORS.length]+'"></span><b>Adegan '+(i+1)+'</b><span class="vd"></span></div><p class="src" style="-webkit-line-clamp:3"></p>'+(v.scene?'<pre class="fin" style="margin-top:10px"></pre><div class="acts"><button class="btn sm" data-a="cp" type="button">Salin prompt final</button></div>':'');
    d.querySelector('.src').textContent=v.text;d.querySelector('.vd').textContent=same?'gambar '+clipFmt(i)+' dtk':'';
    if(v.scene){d.querySelector('pre.fin').textContent=finalPrompt(i);d.querySelector('[data-a=cp]').onclick=()=>copyText(finalPrompt(i),'Prompt adegan '+(i+1)+' disalin.')}
    box.appendChild(d);
  });
}
$('#pkMp3').onclick=()=>$('#dlMp3').click();
$('#pkWav').onclick=()=>$('#dl').click();
$('#pkDur').onclick=()=>$('#copyT').click();
$('#pkAll').onclick=()=>copyText(packText(),'Ringkasan paket disalin.');
$('#pkTxt').onclick=()=>{const n=($('#fname').value.trim()||'naskah').replace(/[^\w\-. ]+/g,'_');saveBlob(new Blob([packText()],{type:'text/plain;charset=utf-8'}),n+'-paket.txt');toast('Ringkasan diunduh.','ok')};

/* ---------- hook ke core ---------- */
HK.stats=()=>{const el=$('#vizStale');if(el)el.hidden=!(V.scenes.length&&V.src!==JSON.stringify(parseScenes()))};
HK.rebuild=()=>{updateVizDur();if(V.tab===3)renderPack()};

/* ---------- init ---------- */
$('#vstyle').value=store.get('vstyle','');$('#master').value=V.master;$('#vlock').checked=store.get('vlock',false);
renderVpre();syncMode();renderViz();
$('#result').insertAdjacentHTML('beforeend','<div class="row sub"><button class="btn" id="toViz" type="button">Lanjut ke Visual →</button></div>');
$('#toViz').onclick=()=>setTab(2);
setTab(V.tab,false);
HK.stats();
