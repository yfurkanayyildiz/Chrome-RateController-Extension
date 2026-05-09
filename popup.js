const presets = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 8, 16];
const display = document.getElementById('speedDisplay');
const slider = document.getElementById('slider');
const presetsDiv = document.getElementById('presets');

let activeTab = null;

// Preset butonlarını oluştur
presets.forEach(p => {
  const btn = document.createElement('button');
  btn.textContent = p + 'x';
  btn.dataset.speed = p;
  btn.addEventListener('click', () => sendSpeed(p));
  presetsDiv.appendChild(btn);
});

function updateUI(speed) {
  display.textContent = parseFloat(speed).toFixed(2) + 'x';
  slider.value = Math.min(4, speed);
  presetsDiv.querySelectorAll('button').forEach(b => {
    b.classList.toggle('active', parseFloat(b.dataset.speed) === speed);
  });
}

function sendSpeed(speed) {
  speed = Math.round(speed * 100) / 100;
  updateUI(speed);
  if (activeTab) {
    chrome.tabs.sendMessage(activeTab, { type: 'setSpeed', speed });
  }
}

slider.addEventListener('input', () => sendSpeed(parseFloat(slider.value)));
document.getElementById('btnMinus').addEventListener('click', () => {
  chrome.tabs.sendMessage(activeTab, { type: 'getSpeed' }, (r) => {
    sendSpeed(Math.max(0.25, (r?.speed || 1) - 0.25));
  });
});
document.getElementById('btnPlus').addEventListener('click', () => {
  chrome.tabs.sendMessage(activeTab, { type: 'getSpeed' }, (r) => {
    sendSpeed(Math.min(16, (r?.speed || 1) + 0.25));
  });
});
document.getElementById('btnReset').addEventListener('click', () => sendSpeed(1.0));

// Aktif sekmedeki mevcut hızı al
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  activeTab = tabs[0].id;
  chrome.tabs.sendMessage(activeTab, { type: 'getSpeed' }, (r) => {
    updateUI(r?.speed || 1.0);
  });
});

// Content script'ten hız değişikliği gelirse güncelle
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'speedChanged') updateUI(msg.speed);
});
