// script.js — small interactivity
const helloBtn = document.getElementById('helloBtn');
const countBtn = document.getElementById('countBtn');
const themeBtn = document.getElementById('themeBtn');
const countEl = document.getElementById('count');
let count = 0;

helloBtn.addEventListener('click', () => {
  // Use a friendly modal-like message that works on iPad
  if (window.navigator && navigator.vibrate) navigator.vibrate(10);
  alert('Hello — this runs in your browser on iPad!');
});

countBtn.addEventListener('click', () => {
  count += 1;
  countEl.textContent = count;
});

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});
