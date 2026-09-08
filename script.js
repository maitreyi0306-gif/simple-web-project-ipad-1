// script.js — Thumbi prototype (rule-based, runs on iPad)
(()=>{
  // Utilities
  const $ = sel => document.querySelector(sel);
  const sleep = ms => new Promise(r=>setTimeout(r,ms));

  // Config & state
  const CONFIG = window.THUMBI_CONFIG || {};
  const canvas = $('#thumbiCanvas');
  const ctx = canvas.getContext('2d');
  const scale = 4; // pixel scale
  canvas.style.width = (canvas.width*1) + 'px';
  canvas.style.height = (canvas.height*1) + 'px';

  // DOM
  const happinessEl = $('#happiness');
  const energyEl = $('#energy');
  const affectionEl = $('#affection');
  const playfulnessEl = $('#playfulness');

  // Toggles
  const speechToggle = $('#speechToggle');
  const soundsToggle = $('#soundsToggle');

  // Panels
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

  // Action buttons
  const petBtn = $('#petBtn');
  const playBtn = $('#playBtn');
  const giftBtn = $('#giftBtn');

  // State
  let state = {
    happiness: 60,
    energy: 70,
    affection: 60,
    playfulness: 50,
    mood: 'content',
    lastInteraction: Date.now(),
    memories: []
  };

  // Storage
  const STORAGE_KEY = 'thumbi_state_v1';
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw) state = Object.assign(state, JSON.parse(raw));
    }catch(e){console.warn('loadState',e)}
  }
  function saveState(){
    state.lastInteraction = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateHud();
  }

  // HUD update
  function updateHud(){
    happinessEl.textContent = Math.round(state.happiness);
    energyEl.textContent = Math.round(state.energy);
    affectionEl.textContent = Math.round(state.affection);
    playfulnessEl.textContent = Math.round(state.playfulness);
  }

  // Simple sound (squeak)
  const audioCtx = (window.AudioContext || window.webkitAudioContext) && new (window.AudioContext || window.webkitAudioContext)();
  function squeak(type='happy'){
    if(!audioCtx) return;
    if(!soundsToggle.dataset.on || soundsToggle.dataset.on==='false') return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if(type==='happy'){
      o.frequency.setValueAtTime(880, now);
      o.frequency.exponentialRampToValueAtTime(1320, now+0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.08, now+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.25);
    }else if(type==='sad'){
      o.frequency.setValueAtTime(440, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.06, now+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.4);
    }
    o.start(now); o.stop(now+0.4);
  }

  // Speech
  let speechOn = CONFIG.speechDefault!==false;
  speechToggle.textContent = `Speech: ${speechOn? 'On':'Off'}`;
  speechToggle.addEventListener('click', ()=>{
    speechOn = !speechOn; speechToggle.textContent = `Speech: ${speechOn? 'On':'Off'}`; speechToggle.dataset.on = speechOn;
  });

  let soundsOn = true; soundsToggle.dataset.on = 'true';
  soundsToggle.addEventListener('click', ()=>{ soundsOn = !soundsOn; soundsToggle.dataset.on = soundsOn; soundsToggle.textContent = `Sounds: ${soundsOn? 'On':'Off'}` });

  // Memories UI
  memoryBtn.addEventListener('click', ()=>{ renderMemories(); memoryPanel.classList.remove('hidden'); });
  closeMemory.addEventListener('click', ()=> memoryPanel.classList.add('hidden'));
  clearMemories.addEventListener('click', ()=>{ state.memories = []; saveState(); renderMemories(); });

  function renderMemories(){
    memoryList.innerHTML = '';
    if(!state.memories.length) memoryList.innerHTML = '<div style="padding:12px;color:#666">No memories yet. Use "Remember" while chatting to save something.</div>';
    state.memories.forEach((m,i)=>{
      const el = document.createElement('div'); el.className = 'mem';
      el.innerHTML = `<div>${escapeHtml(m)}</div><div><button data-i="${i}">Delete</button></div>`;
      el.querySelector('button').addEventListener('click', (e)=>{ state.memories.splice(i,1); saveState(); renderMemories(); });
      memoryList.appendChild(el);
    });
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>\"]+/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c)); }

  // Chat UI
  chatBtn.addEventListener('click', ()=>{ chatPanel.classList.remove('hidden'); chatInput.focus(); });
  closeChat.addEventListener('click', ()=> chatPanel.classList.add('hidden'));
  chatForm.addEventListener('submit', async (e)=>{
    e.preventDefault(); const text = chatInput.value.trim(); if(!text) return; appendUserMessage(text); chatInput.value=''; await handleUserMessage(text); saveState();
  });
  rememberBtn.addEventListener('click', ()=>{ const text = chatInput.value.trim(); if(!text) return; state.memories.push(text); saveState(); renderMemories(); alert('Saved to memories'); chatInput.value=''; });

  function appendUserMessage(text){ const el = document.createElement('div'); el.className='msg user'; el.textContent = text; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }
  function appendPetMessage(text){ const el = document.createElement('div'); el.className='msg pet'; el.textContent = text; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }

  // Simple rule-based responses
  function respondTo(text){
    const lower = text.toLowerCase();
    // direct actions
    if(/feed|food|eat|yum/.test(lower)){
      state.happiness = Math.min(100, state.happiness + 12);
      state.energy = Math.min(100, state.energy + 8);
      squeak('happy');
      return randomChoice(['Yum! Thank you! 😋','Mmm tasty!','I love this! ❤']);
    }
    if(/play|game|toy/.test(lower)){
      state.playfulness = Math.min(100, state.playfulness + 15);
      state.happiness = Math.min(100, state.happiness + 8);
      state.energy = Math.max(0, state.energy - 5);
      squeak('happy');
      return randomChoice(['Yay! Let’s play! 🎉','I’m ready!','Catch me if you can!']);
    }
    if(/sleep|nap|tired/.test(lower)){
      state.energy = Math.min(100, state.energy + 25);
      return randomChoice(['Zzz… so cozy 🥱','A little nap sounds perfect.']);
    }
    if(/name|call me/.test(lower)){
      // store a simple memory
      const m = lower.match(/call me (\w+)/);
      if(m){ state.memories.push(`Name:${m[1]}`); saveState(); return `Okay — I'll remember that you like to be called ${m[1]}!` }
    }
    // mood-based replies
    if(state.happiness < 30) return randomChoice(['I feel a bit gloomy... 🙁','Maybe a hug?']);
    if(state.energy < 20) return randomChoice(['I’m sleepy...','Can we cuddle?']);
    if(state.playfulness > 70) return randomChoice(['Whee! So exciting!','I wanna dance! 💃']);
    // default small-talk
    if(/hello|hi|hey/.test(lower)) return randomChoice(['Hi hi! I missed you!','Hello! 💕','Hey there, sunshine!']);
    if(/thank/.test(lower)) return randomChoice(['Aww you’re sweet!','Hehe, you’re welcome!']);
    // if none matched, playful short responses
    return randomChoice(["Hmm? Tell me more!","Hehe, that sounds fun!","Oh wow 😮","I like that!"]);
  }

  async function handleUserMessage(text){
    const reply = respondTo(text);
    await animateSmallExcitement();
    appendPetMessage(reply);
    if(speechOn) speak(reply);
    saveState();
  }

  function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function speak(text){ if(!speechOn) return; try{ const ut = new SpeechSynthesisUtterance(text); ut.lang = CONFIG.lang || 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(ut);}catch(e){console.warn('speak',e)} }

  // Simple interaction handlers
  petBtn.addEventListener('click', ()=>{ handlePet(1); });
  playBtn.addEventListener('click', ()=>{ state.playfulness = Math.min(100, state.playfulness+10); appendPetMessage('Yay! Play time!'); squeak('happy'); animateHappyBounce(); saveState(); });
  giftBtn.addEventListener('click', ()=>{ state.happiness = Math.min(100, state.happiness+12); appendPetMessage('Oooh a gift! Thank you!'); squeak('happy'); animateHappyBounce(); saveState(); });

  function handlePet(amount){ state.affection = Math.min(100, state.affection + 8*amount); state.happiness = Math.min(100, state.happiness + 4*amount); appendPetMessage('Hehe, that tickles!'); squeak('happy'); animatePurr(); saveState(); }

  // Simple automatic decay over time
  setInterval(()=>{
    state.happiness = Math.max(0, state.happiness - 0.02);
    state.energy = Math.max(0, state.energy - 0.03);
    state.playfulness = Math.max(0, state.playfulness - 0.01);
    // mood
    updateMood();
    saveState();
  }, 1000);

  function updateMood(){
    if(state.energy < 20) state.mood = 'sleepy';
    else if(state.happiness < 30) state.mood = 'sad';
    else if(state.playfulness > 70) state.mood = 'playful';
    else state.mood = 'content';
  }

  // Canvas-based pixel-art placeholder sprite (simple frames)
  const P = {
    w:24, h:24, // pixels
    palette: {
      skin:'#f2c9b8', hair:'#1b1b1b', shirt:'#5a1222', jeans:'#3b82f6', glasses:'#000', bindi:'#000', gold:'#d4af37', shoe:'#111', bg: 'rgba(0,0,0,0)'
    }
  };

  // draw a frame by passing eye state & offset
  function drawFrame(frameIndex, xoffset=0, yoffset=0){
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const px = scale;
    const offx = 8 + xoffset, offy = 4 + yoffset; // position inside canvas
    // background small cozy rug
    ctx.fillStyle = '#fdeef3'; ctx.fillRect(0, canvas.height-40, canvas.width, 40);

    // draw body as rectangles (very simple pixel-art)
    function rect(pxX,pxY,w,h,color){ ctx.fillStyle=color; ctx.fillRect((offx+pxX)*px, (offy+pxY)*px, w*px, h*px); }

    // hair (big)
    rect(1,0,22,6,P.palette.hair);
    rect(0,6,24,2,P.palette.hair);
    // face
    rect(6,8,12,8,P.palette.skin);
    // bindi
    rect(11,10,2,2,P.palette.bindi || P.palette.bindi || '#000');
    // glasses
    rect(7,10,4,2,P.palette.glasses || P.palette.glasses || P.palette.glasses || '#000');
    rect(13,10,4,2,'#000');
    rect(11,10,2,1,'#000');
    // chain & pendant (tiny)
    rect(10,15,1,1,P.palette.gold); rect(12,15,1,1,P.palette.gold);
    // jumper shirt
    rect(6,16,12,6,P.palette.shirt);
    // jeans
    rect(6,22,12,4,P.palette.jeans);
    // shoes
    rect(6,26,5,2,P.palette.shoe); rect(13,26,5,2,P.palette.shoe);

    // eyes, mouth vary by frame
    if(frameIndex%4===0){ // eyes open
      rect(9,11,2,1,'#000'); rect(13,11,2,1,'#000');
      rect(11,13,2,1,'#b43a6b');
    }else if(frameIndex%4===1){ // blink
      rect(9,12,6,1,'#000');
      rect(11,13,2,1,'#b43a6b');
    }else if(frameIndex%4===2){ // look up
      rect(9,11,2,1,'#000'); rect(13,11,2,1,'#000');
      rect(11,12,2,1,'#b43a6b');
    }else{ // squint happy
      rect(9,11,2,1,'#000'); rect(13,11,2,1,'#000');
      rect(11,13,2,1,'#b43a6b');
    }
  }

  // Animation loop
  let frame = 0;
  let idleX = 0, idleY = 0; let dir=1; let following=false;
  function animate(){
    frame++;
    // slight bobbing
    idleY = Math.sin(frame/10)*0.5;
    // wandering horizontally
    idleX += 0.02*dir;
    if(Math.abs(idleX) > 4) dir *= -1;
    drawFrame(frame, Math.round(idleX), Math.round(idleY));
    requestAnimationFrame(animate);
  }

  // small animations
  async function animateHappyBounce(){ for(let i=0;i<6;i++){ drawFrame(frame+i,0,-(i%2)); await sleep(30);} }
  async function animatePurr(){ for(let i=0;i<6;i++){ drawFrame(frame+i, (i%2), 0); await sleep(60);} }
  async function animateSmallExcitement(){ for(let i=0;i<3;i++){ squeak('happy'); await animateHappyBounce(); } }

  // Pointer interactions: tap, drag to pet
  let isPointerDown=false, lastDown=0; let dragAccum=0; let tapCount=0; let lastTap=0;
  canvas.addEventListener('pointerdown', (e)=>{ isPointerDown=true; lastDown=Date.now(); tapCount++; lastTap=Date.now(); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e)=>{ if(isPointerDown){ dragAccum++; handlePet(1); } });
  canvas.addEventListener('pointerup', (e)=>{ isPointerDown=false; canvas.releasePointerCapture(e.pointerId); const now=Date.now(); if(now - lastTap < 400){ if(tapCount>3){ // annoyed
      appendPetMessage('OK stop! 😾'); animateRunAway(); state.happiness = Math.max(0, state.happiness-6); squeak('sad'); saveState(); tapCount=0; return; } else { // look at user
      appendPetMessage('You tapped me!'); handlePet(1); saveState(); }
    } setTimeout(()=>tapCount=0,800);
  });

  async function animateRunAway(){ for(let i=0;i<8;i++){ drawFrame(frame+i, 6+i, 0); await sleep(30);} }

  // Auto-init
  loadState(); updateHud(); animate();

  // Periodically Thumbi initiates interactions
  setInterval(()=>{
    const since = Date.now()-state.lastInteraction;
    if(since > 1000*60*5 && Math.random() < 0.25){ // every few minutes sometimes
      appendPetMessage(randomChoice(['Hey! I miss you ❤','Peekaboo!','Play with me?'])); squeak('happy'); animateSmallExcitement();
    }
  }, 30*1000);

  // Chat memory saving
  closeChat.addEventListener('click', ()=>chatPanel.classList.add('hidden'));

  // Simple startup greeting
  (async ()=>{
    appendPetMessage('Hi! I am Thumbi — your tiny magical friend. Tap me or press Talk to chat. 💕'); if(speechOn) speak('Hi! I am Thumbi — your tiny magical friend.'); await sleep(400);
  })();

})();
