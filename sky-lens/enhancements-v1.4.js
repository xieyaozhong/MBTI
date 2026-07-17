import {
  equatorialToHorizontal,
  horizontalToWorldVector,
  normalizeDegrees,
  normalizeSignedDegrees,
  projectWorldToScreen,
  worldVectorToHorizontal,
} from './src/astronomy.js';

const ZODIAC = [
  { id:'aries', name:'白羊座', ra:2.5, dec:20 },
  { id:'taurus', name:'金牛座', ra:4.6, dec:16 },
  { id:'gemini', name:'雙子座', ra:7.1, dec:23 },
  { id:'cancer', name:'巨蟹座', ra:8.7, dec:20 },
  { id:'leo', name:'獅子座', ra:10.7, dec:15 },
  { id:'virgo', name:'室女座', ra:13.4, dec:-5 },
  { id:'libra', name:'天秤座', ra:15.2, dec:-15 },
  { id:'scorpius', name:'天蠍座', ra:16.9, dec:-30 },
  { id:'sagittarius', name:'人馬座', ra:19.0, dec:-25 },
  { id:'capricornus', name:'摩羯座', ra:21.0, dec:-20 },
  { id:'aquarius', name:'寶瓶座', ra:22.3, dec:-10 },
  { id:'pisces', name:'雙魚座', ra:.7, dec:10 },
];
const ZODIAC_NAMES = new Set([
  '白羊座','牡羊座','金牛座','雙子座','巨蟹座','獅子座','室女座','處女座',
  '天秤座','天蠍座','人馬座','射手座','摩羯座','寶瓶座','水瓶座','雙魚座'
]);
const $ = selector => document.querySelector(selector);
const canvas = document.createElement('canvas');
canvas.id = 'zodiacOverlay';
canvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

const state = {
  dpr: 1,
  orientation: null,
  basis: null,
  observer: null,
  headingOffset: Number(localStorage.getItem('sky-lens-heading-offset') || 0),
  arrivalTimer: null,
  arrivedName: '',
};

function resize() {
  state.dpr = Math.min(devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width * state.dpr));
  canvas.height = Math.max(1, Math.round(rect.height * state.dpr));
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 180));
resize();

function clear() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function deviceVectorToWorld(v, headingDeg, betaDeg, gammaDeg) {
  const rad = Math.PI / 180;
  const alpha = normalizeDegrees(360 - (headingDeg + state.headingOffset)) * rad;
  const beta = betaDeg * rad;
  const gamma = gammaDeg * rad;
  const cA = Math.cos(alpha), sA = Math.sin(alpha);
  const cB = Math.cos(beta), sB = Math.sin(beta);
  const cG = Math.cos(gamma), sG = Math.sin(gamma);
  const m11 = cA*cG-sA*sB*sG, m12 = -cB*sA, m13 = cG*sA*sB+cA*sG;
  const m21 = cG*sA+cA*sB*sG, m22 = cA*cB, m23 = sA*sG-cA*cG*sB;
  const m31 = -cB*sG, m32 = sB, m33 = cB*cG;
  return {
    east:m11*v.x+m12*v.y+m13*v.z,
    north:m21*v.x+m22*v.y+m23*v.z,
    up:m31*v.x+m32*v.y+m33*v.z,
  };
}

function updateBasis() {
  if (!state.orientation) return;
  state.headingOffset = Number(localStorage.getItem('sky-lens-heading-offset') || 0);
  const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
  const right = { x:Math.cos(angle), y:Math.sin(angle), z:0 };
  const up = { x:-Math.sin(angle), y:Math.cos(angle), z:0 };
  const o = state.orientation;
  state.basis = {
    forward:deviceVectorToWorld({x:0,y:0,z:-1},o.heading,o.beta,o.gamma),
    right:deviceVectorToWorld(right,o.heading,o.beta,o.gamma),
    up:deviceVectorToWorld(up,o.heading,o.beta,o.gamma),
  };
}

function onOrientation(event) {
  let heading = null;
  if (Number.isFinite(event.webkitCompassHeading)) heading = event.webkitCompassHeading;
  else if (Number.isFinite(event.alpha)) heading = normalizeDegrees(360-event.alpha);
  if (heading == null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
  const old = state.orientation;
  state.orientation = {
    heading:old ? normalizeDegrees(old.heading + normalizeSignedDegrees(heading-old.heading)*.18) : heading,
    beta:old ? old.beta+(event.beta-old.beta)*.18 : event.beta,
    gamma:old ? old.gamma+(event.gamma-old.gamma)*.18 : event.gamma,
  };
  updateBasis();
}
window.addEventListener('deviceorientationabsolute', onOrientation, true);
window.addEventListener('deviceorientation', onOrientation, true);

function loadObserver() {
  try {
    const saved = JSON.parse(localStorage.getItem('sky-lens-position') || 'null');
    if (saved?.latitudeDeg != null) state.observer = saved;
  } catch {}
}
loadObserver();
setInterval(loadObserver, 1000);

function drawGlow(x, y, name) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,220,82,.95)';
  ctx.fillStyle = '#ffec9b';
  ctx.lineWidth = 1.8;
  ctx.shadowColor = '#ffc928';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(x, y, 19, 0, Math.PI*2);
  ctx.stroke();
  ctx.font = '700 12px system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(name, x+27, y);
  ctx.restore();
}

function drawBelow(x, y, name, depth) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,215,74,.75)';
  ctx.fillStyle = '#ffe7a0';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4,4]);
  ctx.shadowColor = '#ffc62c';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '700 10px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`${name} ↓${depth}°`, x, y-20);
  ctx.restore();
}

function render() {
  clear();
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const basis = state.basis, observer = state.observer;
  const constellationButton = document.querySelector('[data-toggle="constellations"]');
  if (!basis || !observer || constellationButton && !constellationButton.classList.contains('active')) {
    requestAnimationFrame(render);
    return;
  }
  const now = new Date();
  const center = worldVectorToHorizontal(basis.forward);
  const below = [];
  for (const item of ZODIAC) {
    const horizontal = equatorialToHorizontal(item.ra, item.dec, observer, now);
    const world = horizontalToWorldVector(horizontal.altitudeDeg, horizontal.azimuthDeg);
    const azDiff = normalizeSignedDegrees(horizontal.azimuthDeg-center.azimuthDeg);
    if (horizontal.altitudeDeg < 0) {
      if (Math.abs(azDiff) < 55) below.push({item,horizontal,azDiff});
      continue;
    }
    const fov = Number($('#fovRange')?.value || 55);
    const point = projectWorldToScreen(world,basis.right,basis.up,basis.forward,width,height,fov);
    if (point && point.depth>.12 && point.x>24 && point.x<width-70 && point.y>105 && point.y<height-100) {
      drawGlow(point.x,point.y,item.name);
    }
  }
  const used=[];
  for (const entry of below.sort((a,b)=>Math.abs(a.azDiff)-Math.abs(b.azDiff)).slice(0,3)) {
    let x=width/2+(entry.azDiff/60)*(width/2-50);
    x=Math.max(55,Math.min(width-55,x));
    if (used.some(v=>Math.abs(v-x)<88)) continue;
    used.push(x);
    drawBelow(x,height-105,entry.item.name,Math.round(Math.abs(entry.horizontal.altitudeDeg)));
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function targetName() {
  return $('#navigationName')?.textContent?.trim() || '';
}

function updateNavigationEnhancements() {
  const hud = $('#navigationHud');
  const arrow = $('#navigationArrow');
  const hint = $('#navigationHint');
  const marker = $('#targetMarker');
  if (!hud || !arrow || !hint || !marker) return;
  if (hud.classList.contains('hidden')) {
    clearTimeout(state.arrivalTimer);
    state.arrivalTimer = null;
    state.arrivedName = '';
    marker.dataset.label = '';
    marker.classList.remove('below-horizon','zodiac','arrived');
    marker.classList.add('hidden');
    return;
  }
  const name = targetName();
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
    const width = innerWidth;
    marker.style.left = `${Math.max(40,Math.min(width-40,width/2+direction*Math.min(width*.38,amount/180*width*.5)))}px`;
    marker.style.top = `${innerHeight-112}px`;
    marker.dataset.label = `地平線下 ${belowMatch[1]}°`;
    marker.classList.remove('hidden','arrived');
  } else {
    marker.dataset.label = '';
  }

  const arrived = arrow.classList.contains('arrived') && !below;
  if (arrived) {
    if (!state.arrivalTimer || state.arrivedName !== name) {
      clearTimeout(state.arrivalTimer);
      state.arrivedName = name;
      state.arrivalTimer = setTimeout(() => {
        if (!arrow.classList.contains('arrived') || $('#navigationHint')?.textContent.includes('地平線下')) return;
        $('#cancelNavigation')?.click();
        navigator.vibrate?.([80,45,130]);
        const toast = $('#toast');
        if (toast) {
          toast.textContent = `已找到${name}，導航已自動停止`;
          toast.classList.add('show');
          setTimeout(()=>toast.classList.remove('show'),4200);
        }
      },1200);
    }
  } else {
    clearTimeout(state.arrivalTimer);
    state.arrivalTimer = null;
    state.arrivedName = '';
  }
}

new MutationObserver(updateNavigationEnhancements).observe(document.body,{
  subtree:true,childList:true,characterData:true,attributes:true,
  attributeFilter:['class','style']
});
setInterval(updateNavigationEnhancements,250);
