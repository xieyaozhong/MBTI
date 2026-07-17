import {
  equatorialToHorizontal,
  horizontalToWorldVector,
  normalizeDegrees,
  normalizeSignedDegrees,
  projectWorldToScreen,
  worldVectorToHorizontal,
} from './src/astronomy.js';
import { CONSTELLATION_TARGETS } from './src/constellations.js';

const ZODIAC_IDS = new Set([
  'aries','taurus','gemini','cancer','leo','virgo','libra','scorpius',
  'sagittarius','capricornus','aquarius','pisces'
]);
const ZODIAC_NAMES = new Set([
  '白羊座','牡羊座','金牛座','雙子座','巨蟹座','獅子座','室女座','處女座',
  '天秤座','天蠍座','人馬座','射手座','摩羯座','寶瓶座','水瓶座','雙魚座'
]);
const ZODIAC = CONSTELLATION_TARGETS.filter(item => ZODIAC_IDS.has(item.id));
const $ = selector => document.querySelector(selector);

const overlay = document.createElement('canvas');
overlay.id = 'zodiacOverlay';
overlay.setAttribute('aria-hidden', 'true');
document.body.appendChild(overlay);
const ctx = overlay.getContext('2d', { alpha: true });

const state = {
  dpr: 1,
  orientation: null,
  basis: null,
  observer: null,
  lastDrawAt: 0,
  arrivalStartedAt: 0,
  arrivalName: '',
  hidden: document.visibilityState !== 'visible',
};

function resize() {
  state.dpr = Math.min(devicePixelRatio || 1, 1.25);
  const rect = overlay.getBoundingClientRect();
  overlay.width = Math.max(1, Math.round(rect.width * state.dpr));
  overlay.height = Math.max(1, Math.round(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function clear() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function loadObserver() {
  try {
    const saved = JSON.parse(localStorage.getItem('sky-lens-position') || 'null');
    if (saved?.latitudeDeg != null && saved?.longitudeDeg != null) state.observer = saved;
  } catch {}
}

function deviceVectorToWorld(v, headingDeg, betaDeg, gammaDeg) {
  const headingOffset = Number(localStorage.getItem('sky-lens-heading-offset') || 0);
  const rad = Math.PI / 180;
  const alpha = normalizeDegrees(360 - (headingDeg + headingOffset)) * rad;
  const beta = betaDeg * rad;
  const gamma = gammaDeg * rad;
  const cA = Math.cos(alpha), sA = Math.sin(alpha);
  const cB = Math.cos(beta), sB = Math.sin(beta);
  const cG = Math.cos(gamma), sG = Math.sin(gamma);
  const m11 = cA*cG-sA*sB*sG, m12 = -cB*sA, m13 = cG*sA*sB+cA*sG;
  const m21 = cG*sA+cA*sB*sG, m22 = cA*cB, m23 = sA*sG-cA*cG*sB;
  const m31 = -cB*sG, m32 = sB, m33 = cB*cG;
  return {
    east: m11*v.x + m12*v.y + m13*v.z,
    north: m21*v.x + m22*v.y + m23*v.z,
    up: m31*v.x + m32*v.y + m33*v.z,
  };
}

function updateBasis() {
  if (!state.orientation) return;
  const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
  const right = { x: Math.cos(angle), y: Math.sin(angle), z: 0 };
  const up = { x: -Math.sin(angle), y: Math.cos(angle), z: 0 };
  const o = state.orientation;
  state.basis = {
    forward: deviceVectorToWorld({ x:0, y:0, z:-1 }, o.heading, o.beta, o.gamma),
    right: deviceVectorToWorld(right, o.heading, o.beta, o.gamma),
    up: deviceVectorToWorld(up, o.heading, o.beta, o.gamma),
  };
}

function onOrientation(event) {
  let heading = null;
  if (Number.isFinite(event.webkitCompassHeading)) heading = event.webkitCompassHeading;
  else if (Number.isFinite(event.alpha)) heading = normalizeDegrees(360 - event.alpha);
  if (heading == null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
  const old = state.orientation;
  state.orientation = {
    heading: old ? normalizeDegrees(old.heading + normalizeSignedDegrees(heading - old.heading) * .22) : heading,
    beta: old ? old.beta + (event.beta - old.beta) * .22 : event.beta,
    gamma: old ? old.gamma + (event.gamma - old.gamma) * .22 : event.gamma,
  };
  updateBasis();
}

function drawGlow(x, y, name) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,220,82,.9)';
  ctx.fillStyle = '#ffec9b';
  ctx.lineWidth = 1.4;
  ctx.shadowColor = '#ffc928';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '700 11px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(name, x + 23, y);
  ctx.restore();
}

function drawBelow(x, y, name, depth) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,74,.72)';
  ctx.fillStyle = '#ffe7a0';
  ctx.lineWidth = 1.3;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '700 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`${name} ↓${depth}°`, x, y - 18);
  ctx.restore();
}

function renderZodiac(timestamp) {
  if (state.hidden || timestamp - state.lastDrawAt < 100) return;
  state.lastDrawAt = timestamp;
  clear();
  loadObserver();
  const basis = state.basis;
  const observer = state.observer;
  const constellationButton = $('[data-toggle="constellations"]');
  if (!basis || !observer || (constellationButton && !constellationButton.classList.contains('active'))) return;

  const width = overlay.clientWidth;
  const height = overlay.clientHeight;
  const now = new Date();
  const center = worldVectorToHorizontal(basis.forward);
  const below = [];
  const fov = Number($('#fovRange')?.value || 55);

  for (const item of ZODIAC) {
    const horizontal = equatorialToHorizontal(item.raHours, item.decDeg, observer, now);
    const world = horizontalToWorldVector(horizontal.altitudeDeg, horizontal.azimuthDeg);
    const azDiff = normalizeSignedDegrees(horizontal.azimuthDeg - center.azimuthDeg);
    if (horizontal.altitudeDeg < 0) {
      if (Math.abs(azDiff) < 58) below.push({ item, horizontal, azDiff });
      continue;
    }
    const point = projectWorldToScreen(world, basis.right, basis.up, basis.forward, width, height, fov);
    if (point && point.depth > .12 && point.x > 22 && point.x < width - 68 && point.y > 105 && point.y < height - 95) {
      drawGlow(point.x, point.y, item.nameZh);
    }
  }

  const used = [];
  for (const entry of below.sort((a,b) => Math.abs(a.azDiff) - Math.abs(b.azDiff)).slice(0, 3)) {
    let x = width / 2 + (entry.azDiff / 60) * (width / 2 - 48);
    x = Math.max(50, Math.min(width - 50, x));
    if (used.some(value => Math.abs(value - x) < 82)) continue;
    used.push(x);
    drawBelow(x, height - 105, entry.item.nameZh, Math.round(Math.abs(entry.horizontal.altitudeDeg)));
  }
}

function stopNavigation(name) {
  $('#cancelNavigation')?.click();
  navigator.vibrate?.([70,40,110]);
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = `已找到${name}，導航已自動停止`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4200);
}

function updateNavigationFeatures() {
  const hud = $('#navigationHud');
  const arrow = $('#navigationArrow');
  const hint = $('#navigationHint');
  const marker = $('#targetMarker');
  if (!hud || !arrow || !hint || !marker) return;

  if (hud.classList.contains('hidden')) {
    state.arrivalStartedAt = 0;
    state.arrivalName = '';
    marker.dataset.label = '';
    marker.classList.remove('below-horizon','zodiac','arrived');
    marker.classList.add('hidden');
    return;
  }

  const name = $('#navigationName')?.textContent?.trim() || '';
  const zodiac = ZODIAC_NAMES.has(name);
  const belowMatch = hint.textContent.match(/地平線下\s*(\d+)°/);
  const below = Boolean(belowMatch);
  hud.classList.toggle('zodiac', zodiac);
  hud.classList.toggle('below-horizon', below);
  arrow.classList.toggle('zodiac', zodiac);
  marker.classList.toggle('zodiac', zodiac);
  marker.classList.toggle('below-horizon', below);

  if (below) {
    const turn = hint.textContent.match(/向(左|右)轉\s*(\d+)°/);
    const direction = turn?.[1] === '左' ? -1 : turn?.[1] === '右' ? 1 : 0;
    const amount = Number(turn?.[2] || 0);
    marker.style.left = `${Math.max(40, Math.min(innerWidth - 40, innerWidth / 2 + direction * Math.min(innerWidth * .38, amount / 180 * innerWidth * .5)))}px`;
    marker.style.top = `${innerHeight - 112}px`;
    marker.dataset.label = `地平線下 ${belowMatch[1]}°`;
    marker.classList.remove('hidden','arrived');
  } else {
    marker.dataset.label = '';
  }

  const arrived = arrow.classList.contains('arrived') && !below;
  if (arrived) {
    if (!state.arrivalStartedAt || state.arrivalName !== name) {
      state.arrivalStartedAt = performance.now();
      state.arrivalName = name;
    } else if (performance.now() - state.arrivalStartedAt >= 1200) {
      state.arrivalStartedAt = 0;
      state.arrivalName = '';
      stopNavigation(name);
    }
  } else {
    state.arrivalStartedAt = 0;
    state.arrivalName = '';
  }
}

window.addEventListener('resize', resize, { passive:true });
window.addEventListener('orientationchange', () => setTimeout(resize, 180), { passive:true });
window.addEventListener('deviceorientationabsolute', onOrientation, { capture:true, passive:true });
window.addEventListener('deviceorientation', onOrientation, { capture:true, passive:true });
document.addEventListener('visibilitychange', () => {
  state.hidden = document.visibilityState !== 'visible';
  if (!state.hidden) loadObserver();
});
resize();
loadObserver();
setInterval(() => renderZodiac(performance.now()), 100);
setInterval(updateNavigationFeatures, 200);
