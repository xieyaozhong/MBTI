import { LOCAL_OBJECTS, CONSTELLATION_LINES } from './src/catalog.js';
import {
  equatorialToHorizontal,
  horizontalToEquatorial,
  horizontalToWorldVector,
  normalizeDegrees,
  normalizeSignedDegrees,
  projectWorldToScreen,
  shortestAngleLerp,
  worldVectorToHorizontal,
} from './src/astronomy.js';
import { querySimbadCone } from './src/simbad.js';

const $ = selector => document.querySelector(selector);
const video = $('#camera');
const canvas = $('#overlay');
const ctx = canvas.getContext('2d');
const startPanel = $('#startPanel');
const startButton = $('#startButton');
const toast = $('#toast');

const state = {
  started: false,
  observer: null,
  orientation: null,
  cameraBasis: null,
  stream: null,
  visible: [],
  onlineObjects: [],
  showStars: true,
  showConstellations: true,
  showDeepSky: true,
  fov: 55,
  headingOffset: Number(localStorage.getItem('sky-lens-heading-offset') || 0),
  magnitudeLimit: 5,
  deferredInstall: null,
  usingAbsoluteEvent: false,
  dpr: 1,
};

const kindNames = {
  star: '恆星', galaxy: '星系', nebula: '星雲', cluster: '星團',
  'planetary-nebula': '行星狀星雲', other: '天體'
};

function showToast(message, duration = 2600) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function setPermission(id, ok, text) {
  const el = $(id);
  el.textContent = `${ok ? '●' : '×'} ${text}`;
  el.classList.toggle('ok', ok);
  el.classList.toggle('fail', !ok);
}

function resizeCanvas() {
  state.dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * state.dpr));
  canvas.height = Math.max(1, Math.round(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}
function clearOverlay() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(() => { resizeCanvas(); updateCameraBasis(); }, 180));
resizeCanvas();

function deviceVectorToWorld(v, headingDeg, betaDeg, gammaDeg) {
  const rad = Math.PI / 180;
  const alpha = normalizeDegrees(360 - (headingDeg + state.headingOffset)) * rad;
  const beta = betaDeg * rad;
  const gamma = gammaDeg * rad;
  const cA = Math.cos(alpha), sA = Math.sin(alpha);
  const cB = Math.cos(beta), sB = Math.sin(beta);
  const cG = Math.cos(gamma), sG = Math.sin(gamma);

  const m11 = cA * cG - sA * sB * sG;
  const m12 = -cB * sA;
  const m13 = cG * sA * sB + cA * sG;
  const m21 = cG * sA + cA * sB * sG;
  const m22 = cA * cB;
  const m23 = sA * sG - cA * cG * sB;
  const m31 = -cB * sG;
  const m32 = sB;
  const m33 = cB * cG;

  return {
    east: m11 * v.x + m12 * v.y + m13 * v.z,
    north: m21 * v.x + m22 * v.y + m23 * v.z,
    up: m31 * v.x + m32 * v.y + m33 * v.z,
  };
}
function updateCameraBasis() {
  const o = state.orientation;
  if (!o) return;
  const screenAngle = Number(screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
  const screenRight = { x: Math.cos(screenAngle), y: Math.sin(screenAngle), z: 0 };
  const screenUp = { x: -Math.sin(screenAngle), y: Math.cos(screenAngle), z: 0 };
  state.cameraBasis = {
    forward: deviceVectorToWorld({x:0,y:0,z:-1}, o.heading, o.beta, o.gamma),
    right: deviceVectorToWorld(screenRight, o.heading, o.beta, o.gamma),
    up: deviceVectorToWorld(screenUp, o.heading, o.beta, o.gamma),
  };
}

function handleOrientation(event) {
  if (event.type === 'deviceorientationabsolute') state.usingAbsoluteEvent = true;
  if (state.usingAbsoluteEvent && event.type !== 'deviceorientationabsolute' && !Number.isFinite(event.webkitCompassHeading)) return;

  let heading = null;
  let source = '相對方向';
  if (Number.isFinite(event.webkitCompassHeading)) {
    heading = event.webkitCompassHeading;
    source = 'iPhone 羅盤';
  } else if (Number.isFinite(event.alpha)) {
    heading = normalizeDegrees(360 - event.alpha);
    source = event.absolute ? '絕對方向' : '裝置方向';
  }
  if (heading == null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;

  const previous = state.orientation;
  state.orientation = {
    heading: previous ? normalizeDegrees(previous.heading + normalizeSignedDegrees(heading - previous.heading) * 0.18) : heading,
    beta: previous ? previous.beta + (event.beta - previous.beta) * 0.18 : event.beta,
    gamma: previous ? previous.gamma + (event.gamma - previous.gamma) * 0.18 : event.gamma,
  };
  $('#sensorText').textContent = source;
  setPermission('#motionStatus', true, '方向感測');
  updateCameraBasis();
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}

async function requestMotionPermission() {
  try {
    if (typeof DeviceOrientationEvent === 'undefined') throw new Error('瀏覽器不支援方向感測');
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      let result;
      try { result = await withTimeout(DeviceOrientationEvent.requestPermission(true), 9000, '方向授權逾時'); }
      catch (firstError) {
        if (firstError.message === '方向授權逾時') throw firstError;
        result = await withTimeout(DeviceOrientationEvent.requestPermission(), 9000, '方向授權逾時');
      }
      if (result !== 'granted') throw new Error('方向權限未允許');
    }
    window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    window.removeEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return true;
  } catch (error) {
    setPermission('#motionStatus', false, '方向感測');
    showToast(error.message || '無法取得方向感測器');
    return false;
  }
}

async function requestCamera() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('相機功能需要 HTTPS 網址');
    state.stream = await withTimeout(navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
    }), 12000, '相機授權逾時');
    video.srcObject = state.stream;
    await withTimeout(video.play(), 6000, '相機畫面啟動逾時');
    video.classList.add('ready');
    setPermission('#cameraStatus', true, '相機');
    return true;
  } catch (error) {
    setPermission('#cameraStatus', false, '相機');
    showToast(`相機未啟動：${error.message || '權限被拒絕'}`);
    return false;
  }
}

function getPosition() {
  return new Promise(resolve => {
    const saved = JSON.parse(localStorage.getItem('sky-lens-position') || 'null');
    if (!navigator.geolocation) {
      resolve(saved || { latitudeDeg: 24.1477, longitudeDeg: 120.6736, fallback: true });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => resolve({ latitudeDeg: position.coords.latitude, longitudeDeg: position.coords.longitude }),
      () => resolve(saved || { latitudeDeg: 24.1477, longitudeDeg: 120.6736, fallback: true }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
  });
}

async function requestLocation() {
  state.observer = await getPosition();
  localStorage.setItem('sky-lens-position', JSON.stringify({ latitudeDeg: state.observer.latitudeDeg, longitudeDeg: state.observer.longitudeDeg }));
  setPermission('#locationStatus', !state.observer.fallback, state.observer.fallback ? '使用預設位置' : '定位');
  $('#positionText').textContent = `${state.observer.latitudeDeg.toFixed(4)}, ${state.observer.longitudeDeg.toFixed(4)}`;
}

startButton.addEventListener('click', async () => {
  if (startButton.disabled) return;
  startButton.disabled = true;
  let cameraOk = false;
  try {
    startButton.textContent = '1/3 允許方向感測…';
    await requestMotionPermission();

    startButton.textContent = '2/3 允許相機…';
    cameraOk = await requestCamera();

    startButton.textContent = '3/3 取得位置…';
    await withTimeout(requestLocation(), 14000, '定位逾時').catch(() => {
      state.observer = { latitudeDeg: 24.1477, longitudeDeg: 120.6736, fallback: true };
      setPermission('#locationStatus', false, '使用預設位置');
      $('#positionText').textContent = '24.1477, 120.6736';
    });
  } catch (error) {
    showToast(`啟動時發生問題：${error.message || '未知錯誤'}`, 4200);
  } finally {
    if (!state.observer) state.observer = { latitudeDeg: 24.1477, longitudeDeg: 120.6736, fallback: true };
    state.started = true;
    startPanel.classList.add('hidden');
    startButton.disabled = false;
    startButton.textContent = '啟動星空';
    if (!cameraOk) showToast('已進入星圖模式；可稍後在 Safari 設定中允許相機。', 4200);
  }
});

function magnitudeRadius(object) {
  if (object.source === 'simbad') return object.kind === 'star' ? 2 : 4.5;
  if (object.kind !== 'star') return 5.5;
  return Math.max(1.7, Math.min(6.5, 5.8 - (object.magnitude ?? 4) * 0.65));
}
function objectColor(kind) {
  if (kind === 'star') return '#f4fbff';
  if (kind === 'galaxy') return '#b5a7ff';
  if (kind === 'nebula' || kind === 'planetary-nebula') return '#7fe9ff';
  if (kind === 'cluster') return '#ffd699';
  return '#a8e2c4';
}
function objectGlyph(kind) {
  return kind === 'galaxy' ? '◎' : kind === 'nebula' ? '◇' : kind === 'cluster' ? '⊙' : kind === 'planetary-nebula' ? '◈' : kind === 'other' ? '+' : '•';
}

function render() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  clearOverlay();

  const basis = state.cameraBasis;
  if (!state.observer || !basis) {
    requestAnimationFrame(render);
    return;
  }

  const now = new Date();
  const allObjects = LOCAL_OBJECTS.concat(state.onlineObjects);
  const visible = [];
  const pointById = new Map();

  for (const object of allObjects) {
    if (object.kind === 'star' && !state.showStars) continue;
    if (object.kind !== 'star' && !state.showDeepSky) continue;
    if (object.kind === 'star' && object.source !== 'simbad' && (object.magnitude ?? 99) > state.magnitudeLimit) continue;

    const horizontal = equatorialToHorizontal(object.raHours, object.decDeg, state.observer, now);
    if (horizontal.altitudeDeg < -7) continue;
    const world = horizontalToWorldVector(horizontal.altitudeDeg, horizontal.azimuthDeg);
    const point = projectWorldToScreen(world, basis.right, basis.up, basis.forward, width, height, state.fov);
    if (!point || point.depth < 0.14 || point.x < -24 || point.x > width + 24 || point.y < -24 || point.y > height + 24) continue;
    const entry = { object, point, ...horizontal };
    visible.push(entry);
    pointById.set(object.id, point);
  }

  if (state.showConstellations) {
    ctx.save();
    ctx.lineWidth = 1.15;
    ctx.strokeStyle = 'rgba(117, 202, 255, .58)';
    ctx.shadowColor = 'rgba(64, 161, 232, .45)';
    ctx.shadowBlur = 5;
    for (const line of CONSTELLATION_LINES) {
      const a = pointById.get(line.from), b = pointById.get(line.to);
      if (!a || !b) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
  }

  ctx.textBaseline = 'middle';
  const labelBoxes = [];
  const onlineLabels = new Set(
    visible
      .filter(entry => entry.object.source === 'simbad' && entry.object.kind !== 'star')
      .sort((a, b) => b.point.depth - a.point.depth)
      .slice(0, 10)
      .map(entry => entry.object.id)
  );
  let labelCount = 0;
  const overlaps = box => labelBoxes.some(other => !(box.x2 < other.x1 || box.x1 > other.x2 || box.y2 < other.y1 || box.y1 > other.y2));

  visible.sort((a, b) => {
    const aRank = a.object.kind === 'star' ? (a.object.magnitude ?? 9) : -2;
    const bRank = b.object.kind === 'star' ? (b.object.magnitude ?? 9) : -2;
    return aRank - bRank;
  });

  for (const entry of visible) {
    const { object, point } = entry;
    const radius = magnitudeRadius(object);
    const color = objectColor(object.kind);
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = object.kind === 'star' ? 8 : 11;
    ctx.fillStyle = color;
    if (object.kind === 'star') {
      ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.font = '18px system-ui';
      ctx.fillText(objectGlyph(object.kind), point.x - 7, point.y);
    }
    ctx.restore();

    const localLabel = object.source !== 'simbad' && (object.kind !== 'star' || (object.magnitude ?? 99) <= 1.9);
    const onlineLabel = onlineLabels.has(object.id);
    if ((localLabel || onlineLabel) && labelCount < 22) {
      const label = object.nameZh || object.name;
      ctx.font = onlineLabel ? '10px system-ui' : '600 11px system-ui';
      const tw = ctx.measureText(label).width;
      const x = Math.min(width - tw - 14, Math.max(4, point.x + 9));
      const y = Math.min(height - 11, Math.max(11, point.y));
      const box = { x1: x - 3, y1: y - 10, x2: x + tw + 8, y2: y + 10 };
      if (!overlaps(box)) {
        labelBoxes.push(box);
        labelCount += 1;
        ctx.fillStyle = 'rgba(2, 9, 17, .72)';
        ctx.fillRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
        ctx.fillStyle = onlineLabel ? '#b8d0df' : '#eff9ff';
        ctx.fillText(label, x + 1, y);
      }
    }
  }
  state.visible = visible;

  const center = worldVectorToHorizontal(basis.forward);
  $('#compass').textContent = `方向 ${Math.round(center.azimuthDeg)}°　高度 ${Math.round(center.altitudeDeg)}°`;
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function selectObjectAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left, y = clientY - rect.top;
  let nearest = null, best = 38;
  for (const entry of state.visible) {
    const distance = Math.hypot(entry.point.x - x, entry.point.y - y);
    if (distance < best) { best = distance; nearest = entry; }
  }
  if (!nearest) return;
  const o = nearest.object;
  $('#objectKind').textContent = kindNames[o.kind] || '天體';
  $('#objectName').textContent = o.nameZh || o.name;
  $('#objectEnglish').textContent = o.nameZh ? o.name : `${o.source === 'simbad' ? 'SIMBAD 線上星表' : '本機星表'}${o.constellation ? ` · ${o.constellation}` : ''}`;
  $('#objectAz').textContent = `${nearest.azimuthDeg.toFixed(1)}°`;
  $('#objectAlt').textContent = `${nearest.altitudeDeg.toFixed(1)}°`;
  $('#objectRa').textContent = `${o.raHours.toFixed(3)}h`;
  $('#objectDec').textContent = `${o.decDeg >= 0 ? '+' : ''}${o.decDeg.toFixed(2)}°`;
  $('#objectCard').classList.remove('hidden');
}
canvas.addEventListener('click', event => selectObjectAt(event.clientX, event.clientY));
$('#closeObjectCard').addEventListener('click', () => $('#objectCard').classList.add('hidden'));

for (const button of document.querySelectorAll('[data-toggle]')) {
  button.addEventListener('click', () => {
    const key = button.dataset.toggle;
    const map = { stars: 'showStars', constellations: 'showConstellations', deepSky: 'showDeepSky' };
    state[map[key]] = !state[map[key]];
    button.classList.toggle('active', state[map[key]]);
  });
}

$('#settingsButton').addEventListener('click', () => $('#settingsPanel').classList.toggle('hidden'));
$('#closeSettings').addEventListener('click', () => $('#settingsPanel').classList.add('hidden'));
$('#fovRange').addEventListener('input', event => { state.fov = Number(event.target.value); $('#fovOutput').textContent = `${state.fov}°`; });
$('#headingRange').value = state.headingOffset;
$('#headingOutput').textContent = `${state.headingOffset}°`;
$('#headingRange').addEventListener('input', event => {
  state.headingOffset = Number(event.target.value);
  $('#headingOutput').textContent = `${state.headingOffset}°`;
  localStorage.setItem('sky-lens-heading-offset', state.headingOffset);
  updateCameraBasis();
});
$('#magnitudeRange').addEventListener('input', event => { state.magnitudeLimit = Number(event.target.value); $('#magnitudeOutput').textContent = state.magnitudeLimit.toFixed(1); });
$('#resetCalibration').addEventListener('click', () => {
  state.headingOffset = 0; $('#headingRange').value = 0; $('#headingOutput').textContent = '0°';
  localStorage.removeItem('sky-lens-heading-offset'); updateCameraBasis(); showToast('水平校正已重設');
});

$('#onlineButton').addEventListener('click', async () => {
  if (!state.observer || !state.cameraBasis) { showToast('請先啟動定位與方向感測'); return; }
  const button = $('#onlineButton');
  button.disabled = true; button.querySelector('span').textContent = '…';
  try {
    const center = worldVectorToHorizontal(state.cameraBasis.forward);
    const eq = horizontalToEquatorial(center.altitudeDeg, center.azimuthDeg, state.observer, new Date());
    state.onlineObjects = await querySimbadCone(eq.raHours, eq.decDeg, 4, 100);
    $('#onlineText').textContent = state.onlineObjects.length;
    button.classList.add('active');
    showToast(`已載入目前方向附近 ${state.onlineObjects.length} 個 SIMBAD 天體`, 3600);
  } catch (error) {
    showToast(`線上星表無法載入：${error.message || '網路或跨網域限制'}`, 4400);
  } finally {
    button.disabled = false; button.querySelector('span').textContent = '⌕';
  }
});

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); state.deferredInstall = event; $('#installButton').classList.remove('hidden');
});
$('#installButton').addEventListener('click', async () => {
  if (!state.deferredInstall) return;
  await state.deferredInstall.prompt(); state.deferredInstall = null; $('#installButton').classList.add('hidden');
});

$('#catalogText').textContent = `${LOCAL_OBJECTS.length} 個／${CONSTELLATION_LINES.length} 段連線`;
setInterval(() => { $('#clock').textContent = new Date().toLocaleTimeString('zh-TW', { hour12:false }); }, 500);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
}
