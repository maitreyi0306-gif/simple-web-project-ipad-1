// script.js — Thumbi enhanced client (animations, WebAudio SFX, Anthropic proxy client unchanged)
(() => {
  const $ = s => document.querySelector(s);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Config
  const CONFIG = window.THUMBI_CONFIG || {};
  const canvas = $('#thumbiCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const loader = $('#loader') || { style: { display: 'none' } };
  const INTERNAL = 480; // drawing resolution
  if (canvas && ctx) {
    canvas.width = INTERNAL; canvas.height = INTERNAL;
  }

  // Elements (some pages only)
  const happinessEl = $('#happiness');
  const energyEl = $('#energy');
  const affectionEl = $('#affection');
  const playfulnessEl = $('#playfulness');

  const speechToggle = $('#speechToggle') || { dataset: {}, textContent: '' };
  const soundsToggle = $('#soundsToggle') || { dataset: { on: 'true' }, textContent: '' };
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
  let state = { happiness: 75, energy: 70, affection: 70, playfulness: 55, mood: 'content', lastInteraction: Date.now(), memories: [] };
  const STORAGE_KEY = 'thumbi_state_v3';
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) Object.assign(state, JSON.parse(raw)); } catch (e) { console.warn(e) }
  function saveState() { state.lastInteraction = Date.now(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { } updateHud(); }
  function updateHud() {
    if (!happinessEl) return;
    happinessEl.textContent = Math.round(state.happiness);
    energyEl.textContent = Math.round(state.energy);
    affectionEl.textContent = Math.round(state.affection);
    playfulnessEl.textContent = Math.round(state.playfulness);
  }

  // Audio: WebAudio synth SFX (refined palette)
  const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
  function playSfx(type = 'pop') {
    if (!audioCtx || soundsToggle.dataset.on === 'false') return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    const map = {
      pop: { freq: 880, t: 0.06, type: 'sine' },
      warm: { freq: 440, t: 0.16, type: 'sine' },
      twinkle: { freq: 1320, t: 0.08, type: 'sine' },
      soft: { freq: 520, t: 0.12, type: 'triangle' },
      ding: { freq: 660, t: 0.12, type: 'sine' }
    };
    const cfg = map[type] || map.pop;
    o.type = cfg.type;
    o.frequency.setValueAtTime(cfg.freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + cfg.t + 0.02);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + cfg.t + 0.05);
  }

  // Speech control
  let speechOn = CONFIG.speechDefault !== false;
  if (speechToggle) { speechToggle.dataset.on = speechOn; speechToggle.textContent = `Speech: ${speechOn ? 'On' : 'Off'}`; speechToggle.addEventListener && speechToggle.addEventListener('click', () => { speechOn = !speechOn; speechToggle.dataset.on = speechOn; speechToggle.textContent = `Speech: ${speechOn ? 'On' : 'Off'}`; }); }
  if (soundsToggle && soundsToggle.addEventListener) { soundsToggle.dataset.on = 'true'; soundsToggle.addEventListener('click', () => { const val = soundsToggle.dataset.on === 'true' ? 'false' : 'true'; soundsToggle.dataset.on = val; soundsToggle.textContent = `Sounds: ${val === 'true' ? 'On' : 'Off'}`; }); }

  // Memories (lightweight)
  if (memoryBtn && closeMemory) { memoryBtn.addEventListener('click', () => { renderMemories(); memoryPanel && memoryPanel.classList.remove('hidden'); }); closeMemory.addEventListener('click', () => memoryPanel && memoryPanel.classList.add('hidden')); }
  function renderMemories() { if (!memoryList) return; memoryList.innerHTML = ''; if (!state.memories.length) memoryList.innerHTML = '<div style="padding:12px;color:#666">No memories yet.</div>'; state.memories.forEach((m, i) => { const el = document.createElement('div'); el.className = 'mem'; el.textContent = m; memoryList.appendChild(el); }); }

  function escapeHtml(s) { return (s + '').replace(/[&<>\"]+/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c)); }

  // Chat UI and LLM wiring
  chatBtn && chatBtn.addEventListener && chatBtn.addEventListener('click', () => { chatPanel && chatPanel.classList.remove('hidden'); chatInput && chatInput.focus(); });
  closeChat && closeChat.addEventListener && closeChat.addEventListener('click', () => chatPanel && chatPanel.classList.add('hidden'));
  chatForm && chatForm.addEventListener && chatForm.addEventListener('submit', async (e) => { e.preventDefault(); const text = (chatInput && chatInput.value || '').trim(); if (!text) return; appendUserMessage(text); chatInput.value = ''; await handleChat(text); });
  rememberBtn && rememberBtn.addEventListener && rememberBtn.addEventListener('click', () => { const text = (chatInput && chatInput.value || '').trim(); if (!text) return; state.memories.push(text); saveState(); renderMemories(); alert('Saved to memories'); chatInput.value = ''; });

  function appendUserMessage(t) { if (!chatLog) return; const el = document.createElement('div'); el.className = 'msg user'; el.textContent = t; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }
  function appendPetMessage(t) { if (!chatLog) return; const el = document.createElement('div'); el.className = 'msg pet'; el.textContent = t; chatLog.appendChild(el); chatLog.scrollTop = chatLog.scrollHeight; }

  async function handleChat(text) { appendPetMessage('Thinking...'); // try cloud endpoint
    try {
      const resp = await fetch('https://thumbi-2uxh.onrender.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: text,
    mood: currentMood,
    behavior: currentBehavior,
    memories: memoryContext
  })
});
const data = await resp.json();
const reply = data.reply;
  }

  function localRespond(text) {
    const lower = text.toLowerCase();
    if (/feed|food|eat|yum/.test(lower)) { state.happiness = Math.min(100, state.happiness + 12); state.energy = Math.min(100, state.energy + 8); saveState(); return 'Yum! Thank you!'; }
    if (/sleep|nap|tired/.test(lower)) { state.energy = Math.min(100, state.energy + 20); saveState(); return 'Zzz... nice cozy nap.'; }
    return randomChoice(['Hehe!', 'I like that!', 'Tell me more', 'Wow!']);
  }

  function randomChoice(a) { return a[Math.floor(Math.random() * a.length)]; }

  function speak(text) { if (!speechOn) return; try { const ut = new SpeechSynthesisUtterance(text); ut.lang = CONFIG.lang || 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(ut); } catch (e) { console.warn(e); } }

  // Buttons
  petBtn && petBtn.addEventListener && petBtn.addEventListener('click', () => { handlePet(1); }); playBtn && playBtn.addEventListener && playBtn.addEventListener('click', () => { state.playfulness = Math.min(100, state.playfulness + 10); appendPetMessage('Yay! Play time!'); playSfx('twinkle'); saveState(); });
  function handlePet(n) { state.affection = Math.min(100, state.affection + 8 * n); state.happiness = Math.min(100, state.happiness + 4 * n); appendPetMessage('Hehe that tickles!'); playSfx('pop'); animateHappy(); saveState(); }

  // Behavioral decay and mood
  setInterval(() => { state.happiness = Math.max(0, state.happiness - 0.01); state.energy = Math.max(0, state.energy - 0.02); state.playfulness = Math.max(0, state.playfulness - 0.01); updateMood(); saveState(); }, 1000 * 30);
  function updateMood() { if (state.energy < 20) state.mood = 'sleepy'; else if (state.happiness < 30) state.mood = 'sad'; else if (state.playfulness > 80) state.mood = 'hyper'; else state.mood = 'content'; }

  // Avatar + sprite-sheet
  let avatarImg = null;
  let spriteSheet = null; // Image
  let sheetFrame = 0;
  let sheetFrames = 6;
  let frameW = 360, frameH = 360;

  async function loadAvatar() {
    // Try assets/thumbi-reference.png first (attempted file move fallback case)
    const candidates = ['/assets/thumbi-reference.png', CONFIG.avatarUrl || '/8C512FF5-A158-4A91-8B11-5C5991E36F2D.png'];
    for (const url of candidates) {
      if (!url) continue;
      try {
        const img = await loadImage(url);
        if (img) {
          avatarImg = img;
          // try to build sprite sheet (may fail if CORS prevents readPixels but drawImage to new canvas is usually fine)
          try {
            const dataUrl = await buildSpriteSheetFromImage(img, sheetFrames, frameW, frameH);
            spriteSheet = await loadImage(dataUrl);
          } catch (e) { spriteSheet = null; }
          return true;
        }
      } catch (e) { /* try next */ }
    }
    return false;
  }

  function loadImage(url) {
    return new Promise((res, rej) => {
      const i = new Image(); i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = (e) => rej(e);
      i.src = url;
    });
  }

  async function buildSpriteSheetFromImage(img, frames = 6, fw = 360, fh = 360) {
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = fw * frames;
    sheetCanvas.height = fh;
    const sctx = sheetCanvas.getContext('2d');
    for (let i = 0; i < frames; i++) {
      const dx = Math.round(Math.sin(i * 1.3) * 6);
      const scale = 1 + (Math.cos(i * 0.9) * 0.02);
      sctx.save();
      const x = i * fw;
      sctx.translate(x + fw / 2 + dx, fh / 2);
      sctx.scale(scale, scale);
      sctx.translate(-fw / 2, -fh / 2);
      // draw source image to cover frame
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const ratio = Math.max(fw / iw, fh / ih);
      const dw = iw * ratio, dh = ih * ratio;
      const sx = (dw - fw) / -2, sy = (dh - fh) / -2;
      sctx.drawImage(img, sx, sy, dw, dh, 0, 0, fw, fh);
      // subtle hue overlay
      sctx.fillStyle = `hsla(${(i * 12) % 360},12%,10%,0.04)`;
      sctx.fillRect(0, 0, fw, fh);
      sctx.restore();
    }
    return sheetCanvas.toDataURL('image/png');
  }

  // Drawing helpers — draw avatar with subtle animations: breathe, blink overlay, hair sway
  let frame = 0, isBlinking = false;
  function draw() {
    if (!ctx) return;
    frame++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff7f5'; ctx.fillRect(0, canvas.height - 110, canvas.width, 110);
    const bob = Math.sin(frame / 30) * 3;

    if (spriteSheet && spriteSheet.naturalWidth) {
      // draw current frame from sprite sheet
      const fw = frameW, fh = frameH;
      const sx = (sheetFrame % sheetFrames) * fw;
      // center in canvas
      const dx = (canvas.width - fw) / 2, dy = (canvas.height - fh) / 2 + bob;
      ctx.drawImage(spriteSheet, sx, 0, fw, fh, dx, dy, fw, fh);
      // blinking overlay
      if (isBlinking) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(dx, dy + fh * 0.22, fw, fh * 0.25); }
      return;
    }

    if (avatarImg && avatarImg.naturalWidth) {
      // draw the single image scaled and centered
      const maxW = canvas.width * 0.8; const maxH = canvas.height * 0.8;
      let iw = avatarImg.naturalWidth, ih = avatarImg.naturalHeight;
      const ratio = Math.min(maxW / iw, maxH / ih);
      const dw = iw * ratio, dh = ih * ratio;
      const x = (canvas.width - dw) / 2, y = (canvas.height - dh) / 2 + bob;
      ctx.drawImage(avatarImg, x, y, dw, dh);
      if (isBlinking) { ctx.fillStyle = 'rgba(0,0,0,0.06)'; const h = dh * 0.25; ctx.fillRect(x, y + dh * 0.22, dw, h); }
      return;
    }

    // fallback stylized drawing
    const cx = canvas.width / 2, cy = canvas.height / 2; const bob2 = bob;
    // hair
    ctx.fillStyle = '#2a1f1a'; ctx.fillRect(cx - 140, cy - 170 + bob2, 280, 80);
    // face
    ctx.fillStyle = '#f2c9b8'; ctx.fillRect(cx - 80, cy - 120 + bob2, 160, 140);
    // glasses
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 48, cy - 70 + bob2, 36, 10);
    ctx.fillRect(cx + 12, cy - 70 + bob2, 36, 10); ctx.fillRect(cx - 6, cy - 70 + bob2, 12, 3);
    // bindi
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 6, cy - 110 + bob2, 12, 12);
    // chain
    ctx.fillStyle = '#d4af37'; ctx.fillRect(cx - 6, cy - 10 + bob2, 12, 6);
  }

  // simple blink scheduler
  setInterval(() => { if (Math.random() < 0.12) { isBlinking = true; setTimeout(() => isBlinking = false, 180); } }, 1200);

  // Animations
  function animateLoop() { draw(); requestAnimationFrame(animateLoop); }
  async function animateHappy() { playSfx('warm'); for (let i = 0; i < 6; i++) { await smallShift(0, -(i % 2) * 6, 20); } }
  async function animatePurr() { for (let i = 0; i < 6; i++) { await smallShift((i % 2) * 4, 0, 60); } }
  function smallShift(dx, dy, ms) { return new Promise(res => { draw(); setTimeout(() => res(), ms); }); }

  // advance sprite frame timer
  setInterval(() => { if (spriteSheet) { sheetFrame = (sheetFrame + 1) % sheetFrames; } }, 1000 / 6);

  // Pointer interactions (lightweight)
  if (canvas) {
    let isDown = false, lastTap = 0, tapCount = 0;
    canvas.addEventListener('pointerdown', e => { isDown = true; lastTap = Date.now(); tapCount++; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); playSfx('pop'); });
    canvas.addEventListener('pointerup', e => { isDown = false; canvas.releasePointerCapture && canvas.releasePointerCapture(e.pointerId); });
  }

  // Auto-initiated behaviors
  setInterval(() => { const since = Date.now() - state.lastInteraction; if (since > 1000 * 60 * 2 && Math.random() < 0.25) { appendPetMessage(randomChoice(['I miss you!', 'Peekaboo!', 'Play with me?'])); playSfx('soft'); } }, 1000 * 30);

  // Init
  (async () => { loader.style.display = 'block'; const ok = await loadAvatar(); loader.style.display = 'none'; if (!ok) console.info('Using fallback drawing.'); updateHud(); animateLoop(); appendPetMessage('Hi! I\'m Thumbi — say hi!'); })();

})();
