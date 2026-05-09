const STEP = 0.25;
const MIN_SPEED = 0.25;
const MAX_SPEED = 16;

let currentSpeed = 1.0;
let overlay = null;
let overlayTimeout = null;

// Site bazında kaydedilmiş hızı yükle
function loadSpeed() {
  const host = location.hostname;
  chrome.storage.local.get([host, 'defaultSpeed'], (data) => {
    const speed = data[host] || data['defaultSpeed'] || 1.0;
    setSpeed(speed, false, false);
  });
}

function saveSpeed(speed) {
  try {
    const host = location.hostname;
    chrome.storage.local.set({ [host]: speed });
  } catch (_) {}
}

// Shadow DOM dahil tüm video elementlerini bul
function getVideos(root = document) {
  const videos = [];
  const walk = (node) => {
    if (node.tagName === 'VIDEO') videos.push(node);
    if (node.shadowRoot) walk(node.shadowRoot);
    node.querySelectorAll('*').forEach(child => {
      if (child.shadowRoot) walk(child.shadowRoot);
    });
  };
  root.querySelectorAll('video').forEach(v => videos.push(v));
  // Shadow root'ları tara
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) el.shadowRoot.querySelectorAll('video').forEach(v => videos.push(v));
  });
  return [...new Set(videos)];
}

function setSpeed(speed, save = true, showOsd = true) {
  speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  speed = Math.round(speed * 100) / 100;
  currentSpeed = speed;

  getVideos().forEach(v => { v.playbackRate = speed; });

  if (showOsd) showOverlay(speed);
  if (save) saveSpeed(speed);

  // Popup'a bildir
  chrome.runtime.sendMessage({ type: 'speedChanged', speed }).catch(() => {});
}

function showOverlay(speed) {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__video_speed_overlay__';
    overlay.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: rgba(0,0,0,0.75);
      color: #fff;
      font-family: monospace;
      font-size: 18px;
      font-weight: bold;
      padding: 6px 14px;
      border-radius: 8px;
      pointer-events: none;
      transition: opacity 0.3s;
    `;
    (document.body || document.documentElement).appendChild(overlay);
  }
  overlay.textContent = `${speed.toFixed(2)}x`;
  overlay.style.opacity = '1';

  clearTimeout(overlayTimeout);
  overlayTimeout = setTimeout(() => {
    if (overlay) overlay.style.opacity = '0';
  }, 1500);
}

// Yeni eklenen videoları da yakala
const observer = new MutationObserver(() => {
  getVideos().forEach(v => {
    if (v.playbackRate !== currentSpeed) v.playbackRate = currentSpeed;
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });

// Klavye kısayolları
document.addEventListener('keydown', (e) => {
  // Input/textarea odaklıyken çalışmasın
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'd' || e.key === 'D') { e.preventDefault(); setSpeed(currentSpeed + STEP); }
  if (e.key === 's' || e.key === 'S') { e.preventDefault(); setSpeed(currentSpeed - STEP); }
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setSpeed(1.0); }
}, true);

// Popup'tan gelen mesajlar
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'setSpeed') setSpeed(msg.speed);
  if (msg.type === 'getSpeed') sendResponse({ speed: currentSpeed });
});

loadSpeed();
