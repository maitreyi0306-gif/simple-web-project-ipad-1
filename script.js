// script.js — Thumbi enhanced client (animations, WebAudio SFX, optional LLM proxy)
(()=>{
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r=>setTimeout(r,ms));

  // Config
  const CONFIG = window.THUMBI_CONFIG || {};
  const canvas = $('#thumbiCanvas');
  const ctx = canvas.getContext('2d');
  const loader = $('#loader');
  const INTERNAL = 480; // drawing resolution
  canvas.width = INTERNAL; canvas.height = INTERNAL;

  // Elements
  const happinessEl = $('#happiness');
  const energyEl = $('#energy');
  const affectionEl = $('#affection');
  const playfulnessEl = $('#playfulness');

  const speechToggle = $('#speechToggle');
  const soundsToggle = $('#soundsToggle');
  const chatPanel = $('#chatPanel');
  const chatBtn = $('#talkBtn');
  const closeChat = $('#closeChat');
  const chatForm = $('#chatForm');
  const chatInput = $('#chatInput');
  const chatLog = $('#chatLog');
  const rememberBtn = $('#rememberBtn');

  const memoryPanel = $('#memoryPanel');
  const memoryBtn = $('#memoryBtn');
  const closeMemory = $('#closeMemory');
  const memoryList = $('#memoryList');
  const clearMemories = $('#clearMemories');

  const petBtn = $('#petBtn');
  const playBtn = $('#playBtn');
  const giftBtn = $('#giftBtn');

  // State
  let state = { happiness:75, energy:70, affection:70, playfulness:55, mood:'content', lastInteraction:Date.now(), memories:[] };
  const STORAGE_KEY = 'thumbi_state_v3';
  try{ const raw = localStorage.getItem(STORAGE_KEY); if(raw) Object.assign(state, JSON.parse(raw)); }catch(e){console.warn(e)}
  function saveState(){ state.lastInteraction = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateHud(); }
  function updateHud(){ happinessEl.textContent=Math.round(state.happiness); energyEl.textContent=Math.round(state.energy); affectionEl.textContent=Math.round(state.affection); playfulnessEl.textContent=Math.round(state.playfulness); }

  // Audio: WebAudio synth SFX
  const audioCtx = (window.AudioContext||window.webkitAudioContext) ? new (window.AudioContext||window.webkitAudioContext)() : null;
  function playSqueak(type='happy'){ if(!audioCtx) return; if(soundsToggle.dataset.on==='false') return; const now = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='sine'; o.connect(g); g.connect(audioCtx.destination); if(type==='happy'){ o.frequency.setValueAtTime(880,now); o.frequency.exponentialRampToValueAtTime(1320, now+0.1); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.06, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.25);} else if(type==='surprise'){ o.frequency.setValueAtTime(660, now); o.frequency.exponentialRampToValueAtTime(1320, now+0.06); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.08, now+0.015); g.gain.exponentialRampToValueAtTime(0.0001, now+0.2);} else { o.frequency.setValueAtTime(440,now); g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.06, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.3);} o.start(now); o.stop(now+0.35); }

  // Speech control
  let speechOn = CONFIG.speechDefault !== false; speechToggle.dataset.on = speechOn; speechToggle.textContent = `Speech: ${speechOn?'On':'Off'}`;
  speechToggle.addEventListener('click', ()=>{ speechOn = !speechOn; speechToggle.dataset.on = speechOn; speechToggle.textContent = `Speech: ${speechOn?'On':'Off'}`; });
  soundsToggle.dataset.on = 'true'; soundsToggle.addEventListener('click', ()=>{ const val = soundsToggle.dataset.on==='true' ? 'false' : 'true'; soundsToggle.dataset.on = val; soundsToggle.textContent = `Sounds: ${val==='true'?'On':'Off'}`; });

  // Memories
  memoryBtn.addEventListener('click', ()=>{ renderMemories(); memoryPanel.classList.remove('hidden'); }); closeMemory.addEventListener('click', ()=> memoryPanel.classList.add('hidden')); clearMemories.addEventListener('click', ()=>{ state.memories=[]; saveState(); renderMemories(); });
  function renderMemories(){ memoryList.innerHTML=''; if(!state.memories.length) memoryList.innerHTML='<div style="padding:12px;color:#666">No memories yet.</div>'; state.memories.forEach((m,i)=>{ const el=document.createElement('div'); el.className='mem'; el.innerHTML = `<div>${escapeHtml(m)}</div><div><button data-i='${i}'>Delete</button></div>`; el.querySelector('button').addEventListener('click', ()=>{ state.memories.splice(i,1); saveState(); renderMemories(); }); memoryList.appendChild(el); }); }
  function escapeHtml(s){ return (s+'').replace(/[&<>\"]+/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

  // Chat UI and LLM wiring
  chatBtn.addEventListener('click', ()=>{ chatPanel.classList.remove('hidden'); chatInput.focus(); }); closeChat.addEventListener('click', ()=> chatPanel.classList.add('hidden'));
  chatForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const text = chatInput.value.trim(); if(!text) return; appendUserMessage(text); chatInput.value=''; await handleChat(text); saveState(); });
  rememberBtn.addEventListener('click', ()=>{ const text = chatInput.value.trim(); if(!text) return; state.memories.push(text); saveState(); renderMemories(); alert('Saved to memories'); chatInput.value=''; });
  function appendUserMessage(t){ const el = document.createElement('div'); el.className='msg user'; el.textContent = t; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }
  function appendPetMessage(t){ const el = document.createElement('div'); el.className='msg pet'; el.textContent = t; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }

  async function handleChat(text){ // prefer cloud if available
    appendPetMessage('Thinking...');
    // try cloud endpoint
    try{
      const resp = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: text }) });
      if(resp.ok){ const data = await resp.json(); // extract reply
        const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || data.result || JSON.stringify(data);
        appendPetMessage(reply); if(speechOn) speak(reply); return; }
      // if no cloud, fallback
    }catch(e){ /*console.info('cloud unavailable',e)*/ }
    // Local fallback
    const reply = localRespond(text); appendPetMessage(reply); if(speechOn) speak(reply);
  }

  function localRespond(text){ const lower = text.toLowerCase(); if(/feed|food|eat|yum/.test(lower)){ state.happiness=Math.min(100,state.happiness+12); state.energy=Math.min(100,state.energy+8); playSqueak('happy'); return 'Yum! Thank you!'; } if(/play|toy|game/.test(lower)){ state.playfulness=Math.min(100,state.playfulness+15); state.happiness=Math.min(100,state.happiness+8); state.energy=Math.max(0,state.energy-5); playSqueak('happy'); return 'Let’s play! I’m excited!'; } if(/sleep|nap|tired/.test(lower)){ state.energy=Math.min(100,state.energy+25); return 'Zzz… so cozy.';} if(/call me (\S+)/.test(lower)){ const m = lower.match(/call me (\S+)/); state.memories.push('Name:'+m[1]); saveState(); return `Okay — I'll remember that you like to be called ${m[1]}!`; } if(/hello|hi|hey/.test(lower)) return randomChoice(['Hi hi! I missed you!','Hello! 💕']); return randomChoice(['Hehe, that sounds fun!','Oh wow!','Tell me more!']); }

  function randomChoice(a){ return a[Math.floor(Math.random()*a.length)]; }

  function speak(text){ if(!speechOn) return; try{ const ut = new SpeechSynthesisUtterance(text); ut.lang = CONFIG.lang || 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(ut);}catch(e){console.warn(e)} }

  // Buttons
  petBtn.addEventListener('click', ()=>{ handlePet(1); }); playBtn.addEventListener('click', ()=>{ state.playfulness=Math.min(100,state.playfulness+10); appendPetMessage('Yay! Play time!'); playSqueak('happy'); animateHappy(); saveState(); }); giftBtn.addEventListener('click', ()=>{ state.happiness=Math.min(100,state.happiness+12); appendPetMessage('Oooh a gift! Thanks!'); playSqueak('happy'); animateHappy(); saveState(); });
  function handlePet(n){ state.affection=Math.min(100,state.affection+8*n); state.happiness=Math.min(100,state.happiness+4*n); appendPetMessage('Hehe that tickles!'); playSqueak('happy'); animatePurr(); saveState(); }

  // Behavioral decay and mood
  setInterval(()=>{ state.happiness=Math.max(0,state.happiness-0.01); state.energy=Math.max(0,state.energy-0.02); state.playfulness=Math.max(0,state.playfulness-0.01); updateMood(); saveState(); }, 2000);
  function updateMood(){ if(state.energy<20) state.mood='sleepy'; else if(state.happiness<30) state.mood='sad'; else if(state.playfulness>80) state.mood='hyper'; else state.mood='content'; }

  // Avatar image load
  let avatarImg = null; async function loadAvatar(){ const url = CONFIG.avatarUrl; if(!url) return false; try{ const img = new Image(); img.crossOrigin='anonymous'; img.src = url; await new Promise((res,rej)=>{ img.onload = res; img.onerror = rej; setTimeout(()=>rej(new Error('timeout')),3000); }); avatarImg = img; return true; }catch(e){ console.warn('avatar load failed', e); return false; } }

  // Drawing helpers — draw avatar with subtle animations: breathe, blink overlay, hair sway
  let frame=0, blinkTimer=0, isBlinking=false; function draw(){ frame++; ctx.clearRect(0,0,canvas.width,canvas.height); // background
    ctx.fillStyle='#fff7f5'; ctx.fillRect(0, canvas.height-110, canvas.width, 110);
    // if image available, draw scaled centered
    if(avatarImg && avatarImg.naturalWidth){ const maxW = canvas.width*0.8; const maxH = canvas.height*0.8; let iw = avatarImg.naturalWidth, ih = avatarImg.naturalHeight; const ratio = Math.min(maxW/iw, maxH/ih); iw*=ratio; ih*=ratio; const x = (canvas.width-iw)/2 + Math.sin(frame/30)*2; const y = (canvas.height-ih)/2 + Math.sin(frame/40)*3; ctx.drawImage(avatarImg, x, y, iw, ih); // blinking overlay
      if(isBlinking){ ctx.fillStyle='rgba(0,0,0,0.06)'; const h = ih*0.25; ctx.fillRect(x, y+ih*0.22, iw, h); } return; }
    // fallback stylized drawing
    const cx = canvas.width/2, cy = canvas.height/2; const bob = Math.sin(frame/30)*3;
    // hair
    ctx.fillStyle='#2a1f1a'; ctx.fillRect(cx-140, cy-170+bob, 280, 80);
    // face
    ctx.fillStyle='#f2c9b8'; ctx.fillRect(cx-80, cy-120+bob, 160, 140);
    // glasses
    ctx.fillStyle='#000'; ctx.fillRect(cx-48, cy-70+bob, 36, 10); ctx.fillRect(cx+12, cy-70+bob, 36, 10); ctx.fillRect(cx-6, cy-70+bob, 12, 3);
    // bindi
    ctx.fillStyle='#000'; ctx.fillRect(cx-6, cy-110+bob, 12, 12);
    // chain
    ctx.fillStyle='#d4af37'; ctx.fillRect(cx-6, cy-10+bob, 12, 6);
  }

  // simple blink scheduler
  setInterval(()=>{ if(Math.random()<0.12){ isBlinking=true; setTimeout(()=>isBlinking=false, 180); } }, 1200);

  // Animations
  function animateLoop(){ draw(); requestAnimationFrame(animateLoop); }
  async function animateHappy(){ playSqueak('happy'); for(let i=0;i<6;i++){ await smallShift(0,-(i%2)*6,20); } }
  async function animatePurr(){ for(let i=0;i<6;i++){ await smallShift((i%2)*4,0,60); } }
  function smallShift(dx,dy,ms){ return new Promise(res=>{ const start = performance.now(); const orig = {dx:0,dy:0}; function step(t){ const p = Math.min(1,(t-start)/ms); // not used but keep
        draw(); // overlay small translate by drawing the avatar shifted
        res(); }
      setTimeout(()=>res(),ms); }); }

  // Pointer interactions (follow finger lightly, drag to pet)
  let isDown=false, lastTap=0, tapCount=0; canvas.addEventListener('pointerdown', e=>{ isDown=true; lastTap=Date.now(); tapCount++; canvas.setPointerCapture(e.pointerId); }); canvas.addEventListener('pointermove', e=>{ if(isDown){ handlePet(1); } }); canvas.addEventListener('pointerup', e=>{ isDown=false; canvas.releasePointerCapture(e.pointerId); const now=Date.now(); if(now-lastTap<350){ if(tapCount>3){ appendPetMessage('Okay stop! 😾'); animateRun(); state.happiness=Math.max(0,state.happiness-6); playSqueak('surprise'); tapCount=0; return; } else { handlePet(1); } } setTimeout(()=>tapCount=0,800); });

  async function animateRun(){ for(let i=0;i<12;i++){ await smallShift(10+i*6,0,20); } }

  // Auto-initiated behaviors
  setInterval(()=>{ const since = Date.now()-state.lastInteraction; if(since>1000*60*2 && Math.random()<0.25){ appendPetMessage(randomChoice(['I miss you!','Peekaboo!','Play with me?'])); playSqueak('happy'); } }, 30*1000);

  // Init
  (async ()=>{ loader.style.display='block'; const ok = await loadAvatar(); loader.style.display='none'; if(!ok) console.info('Using fallback drawing.'); updateHud(); animateLoop(); appendPetMessage('Hi! I am Thumbi — your tiny magical friend. Tap me or press Talk.'); if(speechOn) speak('Hi! I am Thumbi — your tiny magical friend.'); })();

})();
