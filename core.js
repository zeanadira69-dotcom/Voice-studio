'use strict';
const $=s=>document.querySelector(s);
const HK={stats(){},rebuild(){},beforeKey(){},sceneRow(){}};
const store={
  get(k,d){try{const v=localStorage.getItem('pv.'+k);return v==null?d:JSON.parse(v)}catch{return d}},
  set(k,v){try{localStorage.setItem('pv.'+k,JSON.stringify(v))}catch{}},
  del(k){try{localStorage.removeItem('pv.'+k)}catch{}}
};
const VOICES=[["Zephyr","Cerah","W"],["Puck","Ceria","P"],["Charon","Informatif","P"],["Kore","Tegas","W"],["Fenrir","Bersemangat","P"],["Leda","Muda","W"],["Orus","Tegas","P"],["Aoede","Ringan","W"],["Callirrhoe","Santai","W"],["Autonoe","Cerah","W"],["Enceladus","Berembus","P"],["Iapetus","Jernih","P"],["Umbriel","Santai","P"],["Algieba","Halus","P"],["Despina","Halus","W"],["Erinome","Jernih","W"],["Algenib","Serak","P"],["Rasalgethi","Informatif","P"],["Laomedeia","Ceria","W"],["Achernar","Lembut","W"],["Alnilam","Tegas","P"],["Schedar","Rata","P"],["Gacrux","Dewasa","W"],["Pulcherrima","Lugas","W"],["Achird","Ramah","P"],["Zubenelgenubi","Kasual","P"],["Vindemiatrix","Lembut","W"],["Sadachbia","Hidup","P"],["Sadaltager","Berpengetahuan","P"],["Sulafat","Hangat","W"]];
const GEN={W:"Wanita",P:"Pria"};
const EMOS=[["netral","Netral",""],["ceria","Ceria","cheerful and upbeat"],["serius","Serius","serious and authoritative"],["penasaran","Penasaran","curious and intrigued"],["bisik","Bisikan","whispered and intimate"],["santai","Santai","relaxed and conversational"],["dramatis","Dramatis","dramatic, building tension"],["tegas","Tegas","firm and confident"],["hangat","Hangat","warm and friendly"],["antusias","Antusias","excited and energetic"]];
const TAGS=[["Jeda pendek","<short pause>"],["Jeda panjang","<long pause>"],["Napas","<breath>"],["Tawa kecil","<chuckle>"],["Desah","<sigh>"],["Bisik","<whispers>"],["Kaget","<gasp>"]];
const TEMPO={slow:"slower pace",normal:"",fast:"slightly faster pace"};
const COLORS=["#3b82f6","#06b6d4","#8b5cf6","#10b981","#f59e0b","#ec4899"];
const MAXCHARS=900, WPS=2.6;

const S={gf:store.get('gf','all'),voice:store.get('voice','Kore'),emo:store.get('emo','netral'),tempo:store.get('tempo','normal'),
  gap:store.get('gap',0.25),imported:null,scenes:[],rate:24000,busy:false,abort:null,stopAt:null,merged:null,url:null,peaks:null,total:0};
const audio=new Audio(); audio.preload='auto';
let preview=null;

/* ---------- util ---------- */
const sleep=(ms,sig)=>new Promise((res,rej)=>{const t=setTimeout(res,ms);sig&&sig.addEventListener('abort',()=>{clearTimeout(t);rej(new DOMException('Abort','AbortError'))},{once:true})});
const fmt=t=>{t=Math.max(0,t||0);const m=Math.floor(t/60);return m+':'+(t-m*60).toFixed(1).padStart(4,'0')};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
let toastT;function toast(msg,type){const t=$('#toast');t.textContent=msg;t.className='toast show '+(type||'');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),type==='err'?7000:3200)}
const debounce=(f,ms)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};

/* ---------- settings ---------- */
const keyEl=$('#key'),modelEl=$('#model'),modelC=$('#modelCustom');
function getKey(){return keyEl.value.trim()}
function getTextModel(){const t=$('#textModel');return (t&&t.value.trim())||'gemini-3.8-flash'}
function getModel(){return modelEl.value==='__custom'?(modelC.value.trim()||'gemini-3.8-flash-tts'):modelEl.value}
function initSettings(){
  const remember=store.get('remember',false);$('#remember').checked=remember;
  if(remember){keyEl.value=store.get('key','')||''}
  $('#keyOk').hidden=!getKey();$('#keyBox').open=!getKey();
  const m=store.get('model','gemini-3.8-flash-tts');
  if([...modelEl.options].some(o=>o.value===m))modelEl.value=m;else{modelEl.value='__custom';modelC.value=m;modelC.hidden=false}
  if($('#textModel'))$('#textModel').value=store.get('textModel','gemini-3.8-flash');
  $('#script').value=store.get('script','');$('#ctx').value=store.get('ctx','');$('#dict').value=store.get('dict','');
  $('#gap').value=String(S.gap);if($('#gap').value!==String(S.gap)){$('#gap').value='0.25';S.gap=0.25}
  if($('#dict').value.trim())$('#dictBox').open=true;
}
function saveKey(){
  const k=getKey();$('#keyOk').hidden=!k;
  if($('#remember').checked){store.set('remember',true);store.set('key',k)}else{store.set('remember',false);store.del('key')}
}
keyEl.addEventListener('input',debounce(saveKey,300));
$('#remember').addEventListener('change',saveKey);
$('#eye').addEventListener('click',()=>{keyEl.type=keyEl.type==='password'?'text':'password'});
modelEl.addEventListener('change',()=>{modelC.hidden=modelEl.value!=='__custom';store.set('model',getModel())});
if($('#textModel'))$('#textModel').addEventListener('input',debounce(()=>store.set('textModel',getTextModel()),300));
modelC.addEventListener('input',debounce(()=>store.set('model',getModel()),300));
$('#forget').addEventListener('click',()=>{try{Object.keys(localStorage).filter(k=>k.startsWith('pv.')).forEach(k=>localStorage.removeItem(k))}catch{}keyEl.value='';$('#remember').checked=false;$('#keyOk').hidden=true;toast('Data tersimpan dihapus dari perangkat ini.','ok')});

/* ---------- script / scenes ---------- */
function splitLong(t){
  if(t.length<=MAXCHARS)return[t];
  const sents=t.match(/[^.!?…\n]+[.!?…]*\s*/g)||[t];const out=[];let cur='';
  for(const s of sents){if(cur&&(cur+s).length>MAXCHARS){out.push(cur.trim());cur=''}cur+=s}
  if(cur.trim())out.push(cur.trim());return out;
}
function parseScenes(){return $('#script').value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean).flatMap(splitLong)}
function applyDict(text){
  const lines=$('#dict').value.split('\n');
  for(const ln of lines){
    const m=ln.match(/^\s*(.+?)\s*(?:=|->|→)\s*(.+?)\s*$/);if(!m)continue;
    const re=new RegExp('(^|[^\\p{L}\\p{N}])'+esc(m[1])+'(?![\\p{L}\\p{N}])','giu');
    text=text.replace(re,(_,p)=>p+m[2]);
  }
  return text;
}
function styleStr(){
  const e=(EMOS.find(x=>x[0]===S.emo)||[])[2]||'';
  return[e,TEMPO[S.tempo],$('#ctx').value.trim()].filter(Boolean).join('. ');
}
function updateStats(){
  const t=$('#script').value;const words=(t.trim().match(/\S+/g)||[]).length;const sc=parseScenes().length;
  $('#sWords').textContent=words+' kata';$('#sChars').textContent=t.length+' karakter';
  const d=Math.round(words/WPS);$('#sDur').textContent='≈ '+d+' dtk';$('#sScenes').textContent=sc+' adegan';
  $('#bInfo').textContent=sc+' adegan · ≈ '+d+' dtk';
  HK.stats();
  if(!S.busy)$('#bSub').textContent=sc?(VOICES.find(v=>v[0]===S.voice)||[])[0]+' · '+(EMOS.find(x=>x[0]===S.emo)||[])[1]:'Isi naskah dulu';
}
function updateStyle(){const s=styleStr();$('#finalStyle').textContent='Gaya akhir: '+(s||'(kosong, suara netral)')}
const saveDraft=debounce(()=>{store.set('script',$('#script').value);store.set('ctx',$('#ctx').value);store.set('dict',$('#dict').value)},400);
$('#script').addEventListener('input',()=>{updateStats();saveDraft()});
$('#ctx').addEventListener('input',()=>{updateStyle();saveDraft()});
$('#dict').addEventListener('input',saveDraft);

/* ---------- voice / emotion UI ---------- */
function renderVoices(){
  const q=$('#vSearch').value.trim().toLowerCase();const g=$('#vGrid');g.innerHTML='';
  VOICES.filter(v=>(S.gf==='all'||v[2]===S.gf)&&(!q||(v[0]+' '+v[1]+' '+GEN[v[2]]).toLowerCase().includes(q))).forEach(([n,d,x])=>{
    const b=document.createElement('button');b.type='button';b.className='v';b.setAttribute('aria-pressed',n===S.voice);
    b.innerHTML='<b>'+n+'</b><span>'+d+'</span><em>'+(x==='W'?'♀ ':'♂ ')+GEN[x]+'</em>';
    b.onclick=()=>{S.voice=n;store.set('voice',n);setVoiceSummary();renderVoices();$('#vWrap').hidden=true;$('#vToggle').setAttribute('aria-expanded','false');$('#vToggle').textContent='Ganti';updateStats()};
    g.appendChild(b);
  });
  if(!g.children.length){g.innerHTML='<p class="hint" style="grid-column:1/-1">Tidak ada suara yang cocok.</p>'}
}
document.querySelectorAll('#vGender button').forEach(b=>b.onclick=()=>{S.gf=b.dataset.v;store.set('gf',S.gf);syncGender();renderVoices()});
function syncGender(){document.querySelectorAll('#vGender button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.gf))}
function setVoiceSummary(){const v=VOICES.find(x=>x[0]===S.voice)||VOICES[3];$('#vName').textContent=v[0];$('#vDesc').textContent=GEN[v[2]]+' · '+v[1]}
$('#vToggle').onclick=()=>{const h=$('#vWrap').hidden;$('#vWrap').hidden=!h;$('#vToggle').setAttribute('aria-expanded',h);$('#vToggle').textContent=h?'Tutup':'Ganti'};
$('#vSearch').addEventListener('input',renderVoices);
function renderEmo(){
  const c=$('#emo');c.innerHTML='';
  EMOS.forEach(([id,l])=>{const b=document.createElement('button');b.type='button';b.className='chip';b.textContent=l;b.setAttribute('aria-pressed',id===S.emo);
    b.onclick=()=>{S.emo=id;store.set('emo',id);renderEmo();updateStyle();updateStats()};c.appendChild(b)});
}
document.querySelectorAll('#tempo button').forEach(b=>{
  b.onclick=()=>{S.tempo=b.dataset.v;store.set('tempo',S.tempo);syncTempo();updateStyle()};
});
function syncTempo(){document.querySelectorAll('#tempo button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===S.tempo))}
function renderTags(){
  const c=$('#tags');
  TAGS.forEach(([l,t])=>{const b=document.createElement('button');b.type='button';b.className='chip tag';b.textContent=l;
    b.onmousedown=e=>e.preventDefault();
    b.onclick=()=>{const ta=$('#script');const a=ta.selectionStart??ta.value.length,z=ta.selectionEnd??a;
      const pre=ta.value.slice(0,a),post=ta.value.slice(z);const ins=(pre&&!/\s$/.test(pre)?' ':'')+t+(post&&!/^\s/.test(post)?' ':'');
      ta.value=pre+ins+post;const p=pre.length+ins.length;ta.focus();ta.setSelectionRange(p,p);updateStats();saveDraft()};
    c.appendChild(b)});
}

/* ---------- audio helpers ---------- */
function findAudio(o){
  let r=null;
  (function w(x){
    if(!x||typeof x!=='object')return;
    if(typeof x.data==='string'&&x.data.length>100&&(x.type==='audio'||/audio/.test(x.mime_type||x.mimeType||'')))r=x.data;
    const il=x.inlineData||x.inline_data;if(il&&typeof il.data==='string')r=il.data;
    for(const k in x)w(x[k]);
  })(o);
  return r;
}
function decodeAudio(b64){
  const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
  let rate=24000,off=0,len=u.length;
  if(u.length>44&&String.fromCharCode(u[0],u[1],u[2],u[3])==='RIFF'){
    const dv=new DataView(u.buffer);let p=12;
    while(p+8<=u.length){
      const id=String.fromCharCode(u[p],u[p+1],u[p+2],u[p+3]);const sz=dv.getUint32(p+4,true);
      if(id==='fmt ')rate=dv.getUint32(p+12,true);
      if(id==='data'){off=p+8;len=(sz>0&&sz<=u.length-off)?sz:u.length-off;break}
      p+=8+sz+(sz&1);
    }
  }
  len&=~1;const pcm=new Int16Array(len/2);const dv2=new DataView(u.buffer,off,len);
  for(let i=0;i<pcm.length;i++)pcm[i]=dv2.getInt16(i*2,true);
  return{pcm,rate};
}
function wavBlob(pcm,rate){
  const n=pcm.length,buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
  const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++)v.setInt16(44+i*2,pcm[i],true);
  return new Blob([buf],{type:'audio/wav'});
}

/* ---------- API ---------- */
const API='https://generativelanguage.googleapis.com/v1beta/interactions';
function httpErr(st,msg){const e=httpErr0(st,msg);e.status=st;e.keyBad=st===400&&/api key/i.test(msg||'');return e}
function httpErr0(st,msg){
  const m=msg||'';
  if(st===400&&/api key/i.test(m))return new Error('API key tidak valid. Periksa lagi key kamu.');
  if(st===400)return new Error('Permintaan ditolak Google: '+m.slice(0,160));
  if(st===401||st===403)return new Error('API key ditolak atau belum punya akses ke model ini.');
  if(st===404)return new Error('Model tidak ditemukan. Ganti model di bagian "API key & model".');
  if(st===429)return new Error('Limit/kuota Gemini tercapai. Tunggu sekitar 1 menit lalu klik Ulang.');
  return new Error('Server Google bermasalah ('+st+'). '+m.slice(0,120));
}
async function callApi(url,body,signal,onWait){
  const key=getKey();let last;
  for(let a=0;a<3;a++){
    let res;
    try{res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal})}
    catch(e){if(e.name==='AbortError')throw e;last=new Error('Tidak bisa terhubung ke Google. Cek koneksi internet.');if(a<2){onWait&&onWait('Koneksi gagal, mencoba lagi…');await sleep(1500*(a+1),signal);continue}throw last}
    if(res.ok)return await res.json();
    let msg='';try{msg=(await res.json()).error?.message||''}catch{}
    last=httpErr(res.status,msg);
    if((res.status===429||res.status>=500)&&a<2){onWait&&onWait('Menunggu limit Google, mencoba lagi…');await sleep(5000*(a+1),signal);continue}
    throw last;
  }
  throw last;
}
async function tts(text,style,voice,signal,onWait){
  const content={type:'text',text};
  if(style)content.annotations=[{type:'speech_metadata',style}];
  const body={model:getModel(),input:[{type:'user_input',content:[content]}],response_format:{type:'audio'},generation_config:{speech_config:[{voice}]}};
  const j=await callApi(API,body,signal,onWait);const au=findAudio(j);
  if(!au)throw new Error('Respons tidak berisi audio. Coba model lain atau kosongkan gaya.');
  return decodeAudio(au);
}

/* ---------- generate ---------- */
function needKey(){if(getKey())return false;HK.beforeKey();$('#keyBox').open=true;$('#keyCard').scrollIntoView({block:'center'});toast('Masukkan API key Gemini dulu.','err');return true}
function setBusy(b){S.busy=b;$('#goTxt').textContent=b?'Batal':(S.scenes.length?'Generate ulang':'Generate');if(!b){$('#go').style.setProperty('--p','0%');updateStats()}}
async function genScene(i,onWait){
  const sc=S.scenes[i];sc.busy=true;sc.err=null;sc.wait='';sceneUI(i);
  try{
    const {pcm,rate}=await tts(applyDict(($('#sc'+i+' textarea')||{}).value||sc.text),styleStr(),S.voice,S.abort&&S.abort.signal,w=>{sc.wait=w;sceneUI(i)});
    sc.pcm=pcm;S.rate=rate;
  }catch(e){sc.err=e.name==='AbortError'?'Dibatalkan.':e.message}
  sc.busy=false;sc.wait='';rebuild();
}
async function generateAll(){
  if(S.busy){S.abort&&S.abort.abort();return}
  if(needKey())return;
  const parts=parseScenes();if(!parts.length){toast('Naskah masih kosong.','err');$('#script').focus();return}
  if(audio&&!audio.paused)audio.pause();
  S.imported=null;$('#gap').disabled=false;
  S.scenes=parts.map(t=>({text:t,pcm:null,err:null,busy:false,start:0,dur:0}));
  buildScenesUI();$('#result').hidden=false;rebuild();
  S.abort=new AbortController();setBusy(true);
  $('#result').scrollIntoView({block:'start'});
  try{
    for(let i=0;i<S.scenes.length;i++){
      $('#bSub').textContent='Adegan '+(i+1)+' dari '+S.scenes.length;
      $('#go').style.setProperty('--p',(i/S.scenes.length*100)+'%');
      await genScene(i);
      if(S.scenes[i].err)break;
    }
  }finally{
    const done=S.scenes.every(s=>s.pcm);setBusy(false);rebuild();
    if(done)toast('Selesai. Putar untuk cek sinkron, lalu unduh.','ok');
    else{const e=S.scenes.find(s=>s.err);toast(e?e.err:'Belum semua adegan selesai.','err')}
  }
}
async function redoScene(i){
  if(S.busy||S.imported||needKey())return;
  S.abort=new AbortController();S.busy=true;
  const wasPlaying=!audio.paused;audio.pause();
  await genScene(i);S.busy=false;
  if(S.scenes[i].err)toast(S.scenes[i].err,'err');
  else{toast('Adegan '+(i+1)+' diperbarui.','ok');playScene(i)}
}
$('#go').addEventListener('click',generateAll);

/* ---------- merged audio + UI ---------- */
function rebuild(){
  const rate=S.rate;let out;
  if(S.imported){
    out=S.imported.pcm;const bd=S.imported.bounds;
    S.scenes.forEach((s,i)=>{const a=Math.round(bd[i]*rate),z=i<bd.length-1?Math.round(bd[i+1]*rate):out.length;s.start=a/rate;s.dur=(z-a)/rate;s.pcm=out.subarray(a,z)});
  }else{
    const gapN=Math.round(S.gap*rate);const ready=S.scenes.filter(s=>s.pcm);
    let total=0;ready.forEach((s,k)=>{total+=s.pcm.length+(k<ready.length-1?gapN:0)});
    out=new Int16Array(total);let p=0;
    S.scenes.forEach(s=>{if(!s.pcm)return;s.start=p/rate;out.set(s.pcm,p);p+=s.pcm.length;s.dur=s.pcm.length/rate;p+=gapN;});
  }
  S.merged=out;S.total=out.length/rate;
  const wasT=audio.currentTime||0,wasP=!audio.paused;
  if(S.url){URL.revokeObjectURL(S.url);S.url=null}
  if(out.length){S.url=URL.createObjectURL(wavBlob(out,rate));audio.src=S.url;try{audio.currentTime=Math.min(wasT,S.total)}catch{}}
  // peaks
  const N=180;S.peaks=new Float32Array(N);
  if(out.length){const win=Math.max(1,Math.floor(out.length/N));let mx=1;
    for(let b=0;b<N;b++){let m=0;const a=b*win,z=Math.min(out.length,a+win);for(let i=a;i<z;i+=4){const v=Math.abs(out[i]);if(v>m)m=v}S.peaks[b]=m;if(m>mx)mx=m}
    for(let b=0;b<N;b++)S.peaks[b]/=mx}
  buildTimeline();S.scenes.forEach((_,i)=>sceneUI(i));draw();updateTime();
  const all=S.scenes.length&&S.scenes.every(s=>s.pcm);
  $('#dl').disabled=!all;$('#dlMp3').disabled=!all;$('#copyT').disabled=!all;$('#copyS').disabled=!S.scenes.length;$('#play').disabled=!S.total;HK.rebuild();
}
function buildTimeline(){
  const tl=$('#tl');tl.innerHTML='';
  S.scenes.forEach((s,i)=>{if(!s.pcm)return;const c=COLORS[i%COLORS.length];const b=document.createElement('button');b.type='button';
    b.style.flex=Math.max(s.dur,.5)+' 1 0';b.innerHTML='<i class="dot" style="background:'+c+'"></i>A'+(i+1);b.setAttribute('aria-label','Putar adegan '+(i+1));b.onclick=()=>playScene(i);tl.appendChild(b)});
}
const ICO={play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  redo:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/></svg>'};
function buildScenesUI(){
  const box=$('#scenes');box.innerHTML='';
  S.scenes.forEach((s,i)=>{
    const d=document.createElement('div');d.className='scene';d.id='sc'+i;
    d.innerHTML='<div class="top"><span class="dot" style="background:'+COLORS[i%COLORS.length]+'"></span><b>Adegan '+(i+1)+'</b><span class="t"></span>'+
      '<button class="ib" data-a="play" aria-label="Putar adegan">'+ICO.play+'</button><button class="ib" data-a="redo" aria-label="Generate ulang adegan">'+ICO.redo+'</button><button class="ib" data-a="dl" aria-label="Unduh adegan">'+ICO.dl+'</button></div>'+
      '<textarea spellcheck="false"></textarea><div class="st"></div>';
    d.querySelector('textarea').value=s.text;
    d.querySelector('[data-a=play]').onclick=()=>playScene(i);
    d.querySelector('[data-a=redo]').onclick=()=>redoScene(i);
    d.querySelector('[data-a=dl]').onclick=()=>{if(!s.pcm)return;saveBlob(wavBlob(s.pcm,S.rate),($('#fname').value.trim()||'naskah')+'-adegan'+(i+1)+'.wav')};
    box.appendChild(d);HK.sceneRow(i,d);
  });
}
function clipDur(i){
  const s=S.scenes[i];if(!s||!s.pcm)return null;let nx=null;
  for(let k=i+1;k<S.scenes.length;k++){if(S.scenes[k].pcm){nx=S.scenes[k];break}}
  return nx?nx.start-s.start:s.dur;
}
function clipFmt(i){
  const s=S.scenes[i];if(!s||!s.pcm)return '';let end=S.total;
  for(let k=i+1;k<S.scenes.length;k++){if(S.scenes[k].pcm){end=S.scenes[k].start;break}}
  return ((Math.round(end*10)-Math.round(s.start*10))/10).toFixed(1);
}
function sceneUI(i){
  const s=S.scenes[i],d=$('#sc'+i);if(!d)return;
  const st=d.querySelector('.st');
  if(s.busy){st.className='st go';st.innerHTML='<span class="spin"></span>'+(s.wait||'Menghasilkan suara…')}
  else if(s.err){st.className='st err';st.textContent=s.err}
  else if(s.pcm){st.className='st';st.textContent='Siap · mulai '+fmt(s.start)+' · suara '+s.dur.toFixed(1)+' dtk · gambar '+clipFmt(i)+' dtk'}
  else{st.className='st';st.textContent='Menunggu giliran'}
  d.querySelector('[data-a=play]').disabled=!s.pcm;d.querySelector('[data-a=dl]').disabled=!s.pcm;
  d.querySelector('[data-a=redo]').disabled=s.busy||!!S.imported;
}

/* ---------- player / waveform ---------- */
const cv=$('#wave'),ctx2=cv.getContext('2d');
function draw(){
  const box=$('#waveBox'),dpr=window.devicePixelRatio||1,w=box.clientWidth,h=box.clientHeight;
  if(!w)return;if(cv.width!==Math.round(w*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr)}
  ctx2.setTransform(dpr,0,0,dpr,0,0);ctx2.clearRect(0,0,w,h);
  const N=S.peaks?S.peaks.length:0;if(!N||!S.total)return;
  const bw=w/N,cur=audio.currentTime||0;
  for(let b=0;b<N;b++){
    const t=b/N*S.total;let si=S.scenes.findIndex(s=>s.pcm&&t>=s.start&&t<s.start+s.dur+S.gap);if(si<0)si=0;
    ctx2.globalAlpha=t<=cur?1:.42;ctx2.fillStyle=COLORS[si%COLORS.length];
    const bh=Math.max(2,S.peaks[b]*(h-14));ctx2.beginPath();ctx2.roundRect?ctx2.roundRect(b*bw+bw*.18,(h-bh)/2,bw*.64,bh,2):ctx2.rect(b*bw+bw*.18,(h-bh)/2,bw*.64,bh);ctx2.fill();
  }
  ctx2.globalAlpha=1;ctx2.fillStyle=getComputedStyle(document.body).color;ctx2.fillRect(Math.min(w-2,cur/S.total*w),0,2,h);
}
function updateTime(){$('#time').textContent=fmt(audio.currentTime)+' / '+fmt(S.total)}
function setPlayIcon(){$('#icoPlay').outerHTML=audio.paused?'<svg id="icoPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>':'<svg id="icoPlay" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>'}
function tick(){draw();updateTime();if(S.stopAt!=null&&audio.currentTime>=S.stopAt){audio.pause();S.stopAt=null}if(!audio.paused)requestAnimationFrame(tick)}
audio.addEventListener('play',()=>{setPlayIcon();requestAnimationFrame(tick)});
audio.addEventListener('pause',()=>{setPlayIcon();draw();updateTime()});
audio.addEventListener('ended',()=>{S.stopAt=null;setPlayIcon();draw();updateTime()});
$('#play').onclick=()=>{if(!S.total)return;S.stopAt=null;if(audio.paused){if(audio.ended||audio.currentTime>=S.total-.05)audio.currentTime=0;audio.play().catch(()=>{})}else audio.pause()};
function playScene(i){const s=S.scenes[i];if(!s||!s.pcm)return;audio.currentTime=s.start;S.stopAt=s.start+s.dur;audio.play().catch(()=>{})}
function seekFrom(e){const r=$('#waveBox').getBoundingClientRect();const x=(e.clientX-r.left)/r.width;if(S.total){S.stopAt=null;audio.currentTime=Math.max(0,Math.min(S.total,x*S.total));draw();updateTime()}}
let dragging=false;
$('#waveBox').addEventListener('pointerdown',e=>{dragging=true;seekFrom(e)});
window.addEventListener('pointermove',e=>{if(dragging)seekFrom(e)});
window.addEventListener('pointerup',()=>dragging=false);
window.addEventListener('resize',draw);

/* ---------- download / copy ---------- */
function saveBlob(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000)}
$('#gap').addEventListener('change',e=>{S.gap=parseFloat(e.target.value);store.set('gap',S.gap);if(S.scenes.some(s=>s.pcm))rebuild()});
$('#dl').onclick=()=>{if(!S.merged||!S.merged.length)return;const n=($('#fname').value.trim()||'naskah').replace(/[^\w\-. ]+/g,'_');saveBlob(wavBlob(S.merged,S.rate),n+'.wav');toast('File '+n+'.wav diunduh.','ok')};
async function copyText(tx,msg){
  try{await navigator.clipboard.writeText(tx)}catch{const t=document.createElement('textarea');t.value=tx;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch{}t.remove()}
  toast(msg,'ok');
}
$('#copyT').onclick=()=>{
  if(!S.scenes.every(s=>s.pcm))return;
  copyText(S.scenes.map((s,i)=>'Adegan '+(i+1)+': '+clipFmt(i)+' dtk (mulai '+fmt(s.start)+')').join('\n')+'\nTotal: '+fmt(S.total),'Durasi gambar tiap adegan disalin.');
};
$('#copyS').onclick=()=>{
  const ta=[...document.querySelectorAll('#scenes .scene textarea')].map(t=>t.value.trim());
  const arr=ta.length?ta:parseScenes();if(!arr.length)return;
  copyText(arr.map((t,i)=>(i+1)+'. '+t).join('\n\n'),'Teks adegan disalin.');
};
/* ---------- MP3 (lamejs dimuat saat dibutuhkan) ---------- */
let lameP=null;
function loadLame(){
  if(window.lamejs)return Promise.resolve();
  return lameP||(lameP=new Promise((res,rej)=>{
    const sc=document.createElement('script');sc.src='https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
    sc.onload=()=>window.lamejs?res():(lameP=null,rej(new Error('lamejs')));sc.onerror=()=>{lameP=null;rej(new Error('lamejs'))};document.head.appendChild(sc);
  }));
}
async function mp3Blob(pcm,rate){
  await loadLame();const enc=new lamejs.Mp3Encoder(1,rate,128);const out=[];const step=1152*8;
  for(let i=0,n=0;i<pcm.length;i+=step,n++){
    const b=enc.encodeBuffer(pcm.subarray(i,i+step));if(b.length)out.push(new Uint8Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.length)));
    if(n%40===39)await new Promise(r=>setTimeout(r));
  }
  const f=enc.flush();if(f.length)out.push(new Uint8Array(f.buffer.slice(f.byteOffset,f.byteOffset+f.length)));
  return new Blob(out,{type:'audio/mpeg'});
}
$('#dlMp3').onclick=async()=>{
  if(!S.merged||!S.merged.length)return;const b=$('#dlMp3'),lab=b.querySelector('span');b.disabled=true;lab.textContent='Menyiapkan MP3…';
  try{const n=($('#fname').value.trim()||'naskah').replace(/[^\w\-. ]+/g,'_');saveBlob(await mp3Blob(S.merged,S.rate),n+'.mp3');toast('File '+n+'.mp3 diunduh.','ok')}
  catch(e){toast('Encoder MP3 gagal dimuat (perlu internet). Pakai Unduh WAV dulu.','err')}
  lab.textContent='Unduh MP3';b.disabled=!S.scenes.every(s=>s.pcm);
};

/* ---------- voice test ---------- */
$('#vTest').onclick=async()=>{
  if(needKey())return;const b=$('#vTest');if(b.disabled)return;
  const first=parseScenes()[0]||'Halo, ini contoh suara untuk videomu.';const sample=first.slice(0,140);
  b.disabled=true;const old=b.innerHTML;b.innerHTML='<span class="spin"></span>';
  try{const {pcm,rate}=await tts(applyDict(sample),styleStr(),S.voice);if(preview){preview.pause();URL.revokeObjectURL(preview.src)}
    preview=new Audio(URL.createObjectURL(wavBlob(pcm,rate)));preview.play().catch(()=>{})}
  catch(e){toast(e.message,'err')}
  b.disabled=false;b.innerHTML=old;
};


/* ---------- init ---------- */
initSettings();setVoiceSummary();syncGender();renderVoices();renderEmo();syncTempo();renderTags();updateStats();updateStyle();
function syncTheme(){const m=PVTheme.get();document.querySelectorAll('.theme button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.m===m))}
document.querySelectorAll('.theme button').forEach(b=>b.addEventListener('click',()=>{PVTheme.set(b.dataset.m);syncTheme();draw()}));
syncTheme();
