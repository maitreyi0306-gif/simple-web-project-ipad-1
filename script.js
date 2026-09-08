// script.js — Thumbi prototype (enhanced: responsive canvas, avatar image fallback, improved interactions)
(()=>{
  // Utilities
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r=>setTimeout(r,ms));

  // Config & DOM
  const CONFIG = window.THUMBI_CONFIG || {};
  const canvas = $('#thumbiCanvas');
  const ctx = canvas.getContext('2d');
  const loader = $('#loader');

  // Responsive canvas sizing: keep internal drawing resolution fixed, scale CSS
  const INTERNAL_SIZE = 360; // drawing resolution (square)
  canvas.width = INTERNAL_SIZE; canvas.height = INTERNAL_SIZE;

  // DOM elements
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
  let state = {
    happiness: 70,
    energy: 70,
    affection: 70,
    playfulness: 50,
    mood: 'content',
    lastInteraction: Date.now(),
    memories: []
  };

  const STORAGE_KEY = 'thumbi_state_v2';
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) Object.assign(state, JSON.parse(raw));
    }catch(e){ console.warn('loadState', e); }
  }
  function saveState(){ state.lastInteraction = Date.now(); localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateHud(); }

  function updateHud(){ happinessEl.textContent = Math.round(state.happiness); energyEl.textContent = Math.round(state.energy); affectionEl.textContent = Math.round(state.affection); playfulnessEl.textContent = Math.round(state.playfulness); }

  // Audio
  const audioCtx = (window.AudioContext || window.webkitAudioContext) && new (window.AudioContext || window.webkitAudioContext)();
  function squeak(type='happy'){ if(!audioCtx) return; if(soundsToggle.dataset.on==='false') return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination); const now = audioCtx.currentTime; if(type==='happy'){ o.frequency.setValueAtTime(880, now); o.frequency.exponentialRampToValueAtTime(1320, now+0.12); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.08, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.25);} else { o.frequency.setValueAtTime(440, now); g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.06, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+0.4);} o.start(now); o.stop(now+0.4); }

  // Speech
  let speechOn = CONFIG.speechDefault!==false;
  speechToggle.textContent = `Speech: ${speechOn? 'On':'Off'}`; speechToggle.dataset.on = speechOn;
  speechToggle.addEventListener('click', ()=>{ speechOn = !speechOn; speechToggle.textContent = `Speech: ${speechOn? 'On':'Off'}`; speechToggle.dataset.on = speechOn; });
  soundsToggle.dataset.on = 'true'; soundsToggle.addEventListener('click', ()=>{ const val = soundsToggle.dataset.on === 'true' ? 'false' : 'true'; soundsToggle.dataset.on = val; soundsToggle.textContent = `Sounds: ${val==='true'? 'On':'Off'}`; });

  // Memories UI
  memoryBtn.addEventListener('click', ()=>{ renderMemories(); memoryPanel.classList.remove('hidden'); });
  closeMemory.addEventListener('click', ()=> memoryPanel.classList.add('hidden'));
  clearMemories.addEventListener('click', ()=>{ state.memories = []; saveState(); renderMemories(); });
  function renderMemories(){ memoryList.innerHTML=''; if(!state.memories.length) memoryList.innerHTML = '<div style="padding:12px;color:#666">No memories yet.</div>'; state.memories.forEach((m,i)=>{ const el = document.createElement('div'); el.className='mem'; el.innerHTML = `<div>${escapeHtml(m)}</div><div><button data-i="${i}">Delete</button></div>`; el.querySelector('button').addEventListener('click', ()=>{ state.memories.splice(i,1); saveState(); renderMemories(); }); memoryList.appendChild(el); }); }
  function escapeHtml(s){ return (s+'').replace(/[&<>\"]+/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

  // Chat
  chatBtn.addEventListener('click', ()=>{ chatPanel.classList.remove('hidden'); chatInput.focus(); });
  closeChat.addEventListener('click', ()=> chatPanel.classList.add('hidden'));
  chatForm.addEventListener('submit', async (e)=>{ e.preventDefault(); const text = chatInput.value.trim(); if(!text) return; appendUserMessage(text); chatInput.value=''; await handleUserMessage(text); saveState(); });
  rememberBtn.addEventListener('click', ()=>{ const text = chatInput.value.trim(); if(!text) return; state.memories.push(text); saveState(); renderMemories(); alert('Saved to memories'); chatInput.value=''; });
  function appendUserMessage(text){ const el = document.createElement('div'); el.className='msg user'; el.textContent = text; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }
  function appendPetMessage(text){ const el = document.createElement('div'); el.className='msg pet'; el.textContent = text; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }

  // Simple responses
  function respondTo(text){ const lower = text.toLowerCase(); if(/feed|food|eat|yum/.test(lower)){ state.happiness = Math.min(100, state.happiness + 12); state.energy = Math.min(100, state.energy + 8); squeak('happy'); return randomChoice(['Yum! Thank you! 😋','Mmm tasty!','I love this! ❤']); } if(/play|game|toy/.test(lower)){ state.playfulness = Math.min(100, state.playfulness + 15); state.happiness = Math.min(100, state.happiness + 8); state.energy = Math.max(0, state.energy - 5); squeak('happy'); return randomChoice(['Yay! Let’s play! 🎉','I’m ready!','Catch me if you can!']); } if(/sleep|nap|tired/.test(lower)){ state.energy = Math.min(100, state.energy + 25); return randomChoice(['Zzz… so cozy 🥱','A little nap sounds perfect.']); } if(/call me (\S+)/.test(lower)){ const m = lower.match(/call me (\S+)/); state.memories.push(`Name:${m[1]}`); saveState(); return `Okay — I'll remember that you like to be called ${m[1]}!`; } if(state.happiness < 30) return randomChoice(['I feel a bit gloomy... 🙁','Maybe a hug?']); if(state.energy < 20) return randomChoice(['I’m sleepy...','Can we cuddle?']); if(state.playfulness > 70) return randomChoice(['Whee! So exciting!','I wanna dance! 💃']); if(/hello|hi|hey/.test(lower)) return randomChoice(['Hi hi! I missed you!','Hello! 💕','Hey there, sunshine!']); if(/thank/.test(lower)) return randomChoice(['Aww you’re sweet!','Hehe, you’re welcome!']); return randomChoice(["Hmm? Tell me more!","Hehe, that sounds fun!","Oh wow 😮","I like that!"]); }
  async function handleUserMessage(text){ const reply = respondTo(text); await animateSmallExcitement(); appendPetMessage(reply); if(speechOn) speak(reply); saveState(); }
  function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function speak(text){ if(!speechOn) return; try{ const ut = new SpeechSynthesisUtterance(text); ut.lang = CONFIG.lang || 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(ut);}catch(e){console.warn('speak',e);} }

  // Buttons
  petBtn.addEventListener('click', ()=>{ handlePet(1); });
  playBtn.addEventListener('click', ()=>{ state.playfulness = Math.min(100, state.playfulness+10); appendPetMessage('Yay! Play time!'); squeak('happy'); animateHappyBounce(); saveState(); });
  giftBtn.addEventListener('click', ()=>{ state.happiness = Math.min(100, state.happiness+12); appendPetMessage('Oooh a gift! Thank you!'); squeak('happy'); animateHappyBounce(); saveState(); });
  function handlePet(amount){ state.affection = Math.min(100, state.affection + 8*amount); state.happiness = Math.min(100, state.happiness + 4*amount); appendPetMessage('Hehe, that tickles!'); squeak('happy'); animatePurr(); saveState(); }

  // Decay
  setInterval(()=>{ state.happiness = Math.max(0, state.happiness - 0.01); state.energy = Math.max(0, state.energy - 0.02); state.playfulness = Math.max(0, state.playfulness - 0.01); updateMood(); saveState(); }, 1500);
  function updateMood(){ if(state.energy < 20) state.mood = 'sleepy'; else if(state.happiness < 30) state.mood = 'sad'; else if(state.playfulness > 70) state.mood = 'playful'; else state.mood = 'content'; }

  // Drawing: try to load avatarUrl image; fallback to pixel draw
  let avatarImg = null;
  async function loadAvatar(){ const url = CONFIG.avatarUrl; if(!url) return false; try{ const img = new Image(); img.crossOrigin = 'anonymous'; img.src = url; await new Promise((res,rej)=>{ img.onload = ()=>res(); img.onerror = ()=>rej(); setTimeout(()=>/*timeout*/res(),1200); }); avatarImg = img; return true; }catch(e){ console.warn('avatar load failed', e); return false; } }

  function clearCanvas(){ ctx.clearRect(0,0,canvas.width,canvas.height); }

  function drawAvatarFrame(frameIndex=0, xoffset=0, yoffset=0){ clearCanvas(); // background rug
    ctx.fillStyle = '#fdeef3'; ctx.fillRect(0, canvas.height - 90, canvas.width, 90);
    if(avatarImg && avatarImg.complete && avatarImg.naturalWidth){ // draw centered
      const maxW = canvas.width * 0.8; const maxH = canvas.height * 0.8; let iw = avatarImg.naturalWidth, ih = avatarImg.naturalHeight; const ratio = Math.min(maxW / iw, maxH / ih); iw *= ratio; ih *= ratio; const dx = (canvas.width - iw)/2 + xoffset*2; const dy = (canvas.height - ih)/2 + yoffset*2; ctx.drawImage(avatarImg, dx, dy, iw, ih); return; }
    // fallback: simple polished pixel-style drawing
    const hair = '#1b1b1b', skin = '#f2c9b8', shirt = '#5a1222', jeans = '#3b82f6', gold='#d4af37', shoe='#111';
    // face & body
    const cx = canvas.width/2, cy = canvas.height/2;
    // body
    ctx.fillStyle = shirt; ctx.fillRect(cx-48 + xoffset, cy+30 + yoffset, 96, 80);
    ctx.fillStyle = jeans; ctx.fillRect(cx-48 + xoffset, cy+110 + yoffset, 96, 36);
    // head
    ctx.fillStyle = hair; ctx.fillRect(cx-60 + xoffset, cy-80 + yoffset, 120, 40);
    ctx.fillStyle = skin; ctx.fillRect(cx-40 + xoffset, cy-60 + yoffset, 80, 70);
    // glasses
    ctx.fillStyle = '#000'; ctx.fillRect(cx-24 + xoffset, cy-30 + yoffset, 18, 6); ctx.fillRect(cx+6 + xoffset, cy-30 + yoffset, 18, 6); ctx.fillRect(cx-6 + xoffset, cy-30 + yoffset, 12, 2);
    // bindi & jhumka (earrings)
    ctx.fillStyle = '#000'; ctx.fillRect(cx-2 + xoffset, cy-46 + yoffset, 6, 6);
    ctx.fillStyle = gold; ctx.fillRect(cx-44 + xoffset, cy-20 + yoffset, 6, 10); ctx.fillRect(cx+38 + xoffset, cy-20 + yoffset, 6, 10);
    // simple eyes/mouth
    ctx.fillStyle = '#000'; ctx.fillRect(cx-18 + xoffset, cy-22 + yoffset, 6, 4); ctx.fillRect(cx+12 + xoffset, cy-22 + yoffset, 6, 4);
    ctx.fillStyle = '#b43a6b'; ctx.fillRect(cx-6 + xoffset, cy-6 + yoffset, 12, 6);
  }

  // Animation loop
  let frame = 0; let idleX = 0, idleY = 0, dir = 1;
  function animate(){ frame++; idleY = Math.sin(frame/10)*2; idleX += 0.2*dir; if(Math.abs(idleX) > 8) dir *= -1; drawAvatarFrame(frame, Math.round(idleX), Math.round(idleY)); requestAnimationFrame(animate); }

  async function animateHappyBounce(){ for(let i=0;i<6;i++){ drawAvatarFrame(frame+i,0,-(i%2)*4); await sleep(40);} }
  async function animatePurr(){ for(let i=0;i<6;i++){ drawAvatarFrame(frame+i, (i%2)*3, 0); await sleep(60);} }
  async function animateSmallExcitement(){ for(let i=0;i<2;i++){ squeak('happy'); await animateHappyBounce(); } }
  async function animateRunAway(){ for(let i=0;i<10;i++){ drawAvatarFrame(frame+i, 10+i*6, 0); await sleep(20);} }

  // Pointer interactions
  let isPointerDown=false, dragAccum=0, tapCount=0, lastTap=0;
  canvas.addEventListener('pointerdown', (e)=>{ isPointerDown=true; tapCount++; lastTap = Date.now(); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e)=>{ if(isPointerDown){ dragAccum++; handlePet(1); } });
  canvas.addEventListener('pointerup', (e)=>{ isPointerDown=false; canvas.releasePointerCapture(e.pointerId); const now = Date.now(); if(now - lastTap < 400){ if(tapCount>3){ appendPetMessage('OK stop! 😾'); animateRunAway(); state.happiness = Math.max(0, state.happiness-6); squeak('sad'); saveState(); tapCount=0; return; } else { appendPetMessage('You tapped me!'); handlePet(1); saveState(); } } setTimeout(()=>tapCount=0,800); });

  function handlePet(amount){ state.affection = Math.min(100, state.affection + 8*amount); state.happiness = Math.min(100, state.happiness + 4*amount); appendPetMessage('Hehe, that tickles!'); squeak('happy'); animatePurr(); saveState(); }

  // Auto interactions
  setInterval(()=>{ const since = Date.now() - state.lastInteraction; if(since > 1000*60*2 && Math.random() < 0.25){ appendPetMessage(randomChoice(['Hey! I miss you ❤','Peekaboo!','Play with me?'])); squeak('happy'); animateSmallExcitement(); } }, 30*1000);

  // Init
  (async ()=>{
    loadState(); updateHud(); loader.style.display='block';
    const ok = await loadAvatar(); loader.style.display='none';
    if(!ok) console.info('Avatar not loaded — using fallback drawing');
    animate();
    appendPetMessage('Hi! I am Thumbi — your tiny magical friend. Tap me or press Talk to chat. 💕'); if(speechOn) speak('Hi! I am Thumbi — your tiny magical friend.');
  })();

})();
