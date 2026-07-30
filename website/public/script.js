const socket = io();

const numberInput = document.getElementById('numberInput');
const pairBtn = document.getElementById('pairBtn');
const pairForm = document.getElementById('pairForm');
const codeBox = document.getElementById('codeBox');
const codeText = document.getElementById('codeText');
const successBox = document.getElementById('successBox');

document.getElementById('year').textContent = new Date().getFullYear();

pairBtn.addEventListener('click', () => {
  const number = numberInput.value.trim().replace(/[^0-9]/g, '');
  if (number.length < 8) {
    alert('Please enter a valid phone number with country code (e.g. 263780026088)');
    return;
  }
  pairBtn.disabled = true;
  pairBtn.textContent = 'Requesting code...';
  socket.emit('request-pair', { number });
});

socket.on('pairing-code', ({ code }) => {
  pairForm.classList.add('hidden');
  codeBox.classList.remove('hidden');
  codeText.textContent = code;
  pairBtn.disabled = false;
  pairBtn.textContent = 'Get Pairing Code';
});

socket.on('pairing-error', ({ message }) => {
  alert('Error: ' + message);
  pairBtn.disabled = false;
  pairBtn.textContent = 'Get Pairing Code';
});

socket.on('paired', () => {
  codeBox.classList.add('hidden');
  successBox.classList.remove('hidden');
});

socket.on('stats-update', renderStats);

function renderStats(s) {
  document.getElementById('statActive').textContent = s.activeNow;
  document.getElementById('statPaired').textContent = s.totalPaired;
  document.getElementById('statUsers').textContent = s.totalUsers;
  document.getElementById('statCapacity').textContent = s.capacity + '%';
  document.getElementById('capacityBar').style.width = s.capacity + '%';
  document.getElementById('metaSessions').textContent = s.activeNow;
}

async function loadInitialStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    renderStats(data);
  } catch (e) {
    console.error('Could not load stats', e);
  }
}
loadInitialStats();
setInterval(loadInitialStats, 15000);

const startTime = Date.now();
setInterval(() => {
  const secs = Math.floor((Date.now() - startTime) / 1000);
  const h = String(Math.floor(secs / 3600)).padStart(2, '0');
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  document.getElementById('metaUptime').textContent = `${h}:${m}:${s}`;
}, 1000);
