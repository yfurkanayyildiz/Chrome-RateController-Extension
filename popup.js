const STRINGS = {
  tr: {
    title:  '🎬 Video Hızlandırıcı',
    reset:  'Sıfırla',
    hint:   '{D} hızlan · {S} yavaşla · {R} sıfırla',
  },
  en: {
    title:  '🎬 Video Speed Controller',
    reset:  'Reset',
    hint:   '{D} faster · {S} slower · {R} reset',
  },
  es: {
    title:  '🎬 Controlador de Velocidad',
    reset:  'Restablecer',
    hint:   '{D} más rápido · {S} más lento · {R} restablecer',
  },
  zh: {
    title:  '🎬 视频速度控制器',
    reset:  '重置',
    hint:   '{D} 加速 · {S} 减速 · {R} 重置',
  },
};

// Tarayıcı dilinden varsayılan dili belirle
function detectLang() {
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('tr')) return 'tr';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('es')) return 'es';
  return 'en';
}

function applyLang(lang) {
  const s = STRINGS[lang];
  document.getElementById('title').textContent = s.title;
  document.getElementById('btnReset').textContent = s.reset;
  document.getElementById('hint').innerHTML = s.hint
    .replace(/\{(\w)\}/g, '<kbd>$1</kbd>');
}

const presets = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 8, 16];
const display    = document.getElementById('speedDisplay');
const slider     = document.getElementById('slider');
const presetsDiv = document.getElementById('presets');
const langSelect = document.getElementById('langSelect');

let activeTab = null;

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
  if (activeTab) chrome.tabs.sendMessage(activeTab, { type: 'setSpeed', speed });
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

langSelect.addEventListener('change', () => {
  const lang = langSelect.value;
  chrome.storage.local.set({ lang });
  applyLang(lang);
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) return;
  activeTab = tabs[0].id;
  chrome.tabs.sendMessage(activeTab, { type: 'getSpeed' }, (r) => {
    updateUI(r?.speed || 1.0);
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'speedChanged') updateUI(msg.speed);
});

// Kaydedilmiş dili yükle, yoksa tarayıcı dilini kullan
chrome.storage.local.get('lang', (data) => {
  const lang = data.lang || detectLang();
  langSelect.value = lang;
  applyLang(lang);
});
