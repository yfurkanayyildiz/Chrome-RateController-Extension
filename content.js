const STEP = 0.25;
const MIN_SPEED = 0.25;
const MAX_SPEED = 16;

let currentSpeed = 1.0;

// video -> overlay div eşlemesi
const overlayMap = new WeakMap();
const overlayTimeouts = new WeakMap();

function loadSpeed() {
  const host = location.hostname;
  chrome.storage.local.get([host, 'defaultSpeed'], (data) => {
    const speed = data[host] || data['defaultSpeed'] || 1.0;
    setSpeed(speed, false, false);
  });
}

function saveSpeed(speed) {
  try {
    chrome.storage.local.set({ [location.hostname]: speed });
  } catch (_) {}
}

function collectVideos(root, results) {
  root.querySelectorAll('video').forEach(v => results.add(v));
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) collectVideos(el.shadowRoot, results);
  });
}

function isVisible(video) {
  const r = video.getBoundingClientRect();
  return r.width > 10 && r.height > 10;
}

function getVideos() {
  const results = new Set();
  collectVideos(document, results);
  return [...results];
}

function getOrCreateOverlay(video) {
  if (overlayMap.has(video)) return overlayMap.get(video);

  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
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
    opacity: 0;
  `;
  (document.body || document.documentElement).appendChild(el);
  overlayMap.set(video, el);
  return el;
}

function positionOverlay(video, el) {
  const r = video.getBoundingClientRect();
  el.style.top  = (r.top  + 10) + 'px';
  el.style.left = (r.right - el.offsetWidth - 10) + 'px';
}

// Her görünür overlay için sürekli pozisyon takibi
const visibleOverlays = new Set(); // { video, el } çiftleri

function trackLoop() {
  visibleOverlays.forEach(({ video, el }) => {
    if (el.style.opacity === '0') {
      visibleOverlays.delete({ video, el });
      return;
    }
    positionOverlay(video, el);
  });
  requestAnimationFrame(trackLoop);
}
requestAnimationFrame(trackLoop);

function showOverlay(video, speed) {
  const el = getOrCreateOverlay(video);
  el.textContent = `${speed.toFixed(2)}x`;
  el.style.opacity = '1';
  positionOverlay(video, el);
  visibleOverlays.add({ video, el });

  clearTimeout(overlayTimeouts.get(video));
  overlayTimeouts.set(video, setTimeout(() => {
    el.style.opacity = '0';
  }, 1500));
}

function setSpeed(speed, save = true, showOsd = true) {
  speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
  speed = Math.round(speed * 100) / 100;
  currentSpeed = speed;

  getVideos().forEach(v => {
    v.playbackRate = speed;
    if (showOsd && !v.paused && isVisible(v)) showOverlay(v, speed);
  });

  if (save) saveSpeed(speed);
  chrome.runtime.sendMessage({ type: 'speedChanged', speed }).catch(() => {});
}

const observer = new MutationObserver(() => {
  getVideos().forEach(v => {
    if (v.playbackRate !== currentSpeed) v.playbackRate = currentSpeed;
  });
});
observer.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === 'd' || e.key === 'D') { e.preventDefault(); setSpeed(currentSpeed + STEP); }
  if (e.key === 's' || e.key === 'S') { e.preventDefault(); setSpeed(currentSpeed - STEP); }
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setSpeed(1.0); }
}, true);

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'setSpeed') setSpeed(msg.speed);
  if (msg.type === 'getSpeed') sendResponse({ speed: currentSpeed });
});

loadSpeed();
