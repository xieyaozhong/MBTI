import {
  equatorialToHorizontal,
  horizontalToWorldVector,
  normalizeDegrees,
  normalizeSignedDegrees,
  projectWorldToScreen,
  worldVectorToHorizontal,
} from './src/astronomy.js';

const PATTERN_URL = 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json';
const PATTERN_CACHE_KEY = 'sky-lens-selected-constellation-patterns-v1.7';

// 黃道十二宮：固定金黃色完整顯示。
const ZODIAC_META = new Map([
  ['Ari', { name:'白羊座', type:'zodiac' }],
  ['Tau', { name:'金牛座', type:'zodiac' }],
  ['Gem', { name:'雙子座', type:'zodiac' }],
  ['Cnc', { name:'巨蟹座', type:'zodiac' }],
  ['Leo', { name:'獅子座', type:'zodiac' }],
  ['Vir', { name:'室女座', type:'zodiac' }],
  ['Lib', { name:'天秤座', type:'zodiac' }],
  ['Sco', { name:'天蠍座', type:'zodiac' }],
  ['Sgr', { name:'人馬座', type:'zodiac' }],
  ['Cap', { name:'摩羯座', type:'zodiac' }],
  ['Aqr', { name:'寶瓶座', type:'zodiac' }],
  ['Psc', { name:'雙魚座', type:'zodiac' }],
]);

// 指標星座：刻意不包含任何黃道十二宮星座。
const RAW_FEATURED_META = new Map([
  ['Ori', { name:'獵戶座', type:'featured' }],
  ['UMa', { name:'大熊座／北斗七星', type:'featured' }],
  ['Cas', { name:'仙后座', type:'featured' }],
  ['Cyg', { name:'天鵝座', type:'featured' }],
  ['Cru', { name:'南十字座', type:'featured' }],
  ['Lyr', { name:'天琴座', type:'featured' }],
  ['Aql', { name:'天鷹座', type:'featured' }],
  ['CMa', { name:'大犬座', type:'featured' }],
  ['Boo', { name:'牧夫座', type:'featured' }],
  ['Peg', { name:'飛馬座', type:'featured' }],
  ['And', { name:'仙女座', type:'featured' }],
]);
const FEATURED_META = new Map(
  [...RAW_FEATURED_META].filter(([code]) => !ZODIAC_META.has(code))
);
const SELECTED_META = new Map([...ZODIAC_META, ...FEATURED_META]);
const ZODIAC_NAMES = new Set([
  '白羊座','牡羊座','金牛座','雙子座','巨蟹座','獅子座','室女座','處女座',
  '天秤座','天蠍座','人馬座','射手座','摩羯座','寶瓶座','水瓶座','雙魚座'
]);

const $ = selector => document.querySelector(selector);
const overlay = document.createElement('canvas');
overlay.id = 'zodiacOverlay';
overlay.setAttribute('aria-hidden', 'true');
document.body.appendChild(overlay);
const ctx = overlay.getContext('2d', { alpha:true });

const state = {
  dpr: 1,
  orientation: null,
  orientationDirty: false,
  basis: null,
  observer: null,
  patterns: [],
  patternsReady: false,
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
    east:m11*v.x + m12*v.y + m13*v.z,
    north:m21*v.x + m22*v.y + m23*v.z,
    up:m31*v.x + m32*v.y + m33*v.z,
  };
}

function updateBasis() {
  if (!state.orientation) return;
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
    heading:old ? normalizeDegrees(old.heading + normalizeSignedDegrees(heading-old.heading)*.22) : heading,
    beta:old ? old.beta + (event.beta-old.beta)*.22 : event.beta,
    gamma:old ? old.gamma + (event.gamma-old.gamma)*.22 : event.gamma,
  };
  state.orientationDirty = true;
}

function normalizeFeature(feature) {
  const meta = SELECTED_META.get(feature.id);
  if (!meta || !Array.isArray(feature.geometry?.coordinates)) return null;
  const lines = feature.geometry.coordinates
    .filter(line => Array.isArray(line) && line.length > 1)
    .map(line => line
      .filter(point => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1]))
      .map(([longitudeDeg, decDeg]) => ({
        raHours:normalizeDegrees(longitudeDeg) / 15,
        decDeg,
        key:`${longitudeDeg.toFixed(4)},${decDeg.toFixed(4)}`,
      }))
    ).filter(line => line.length > 1);
  if (!lines.length) return null;
  return { id:feature.id, ...meta, lines, center:calculateCenter(lines) };
}

function calculateCenter(lines) {
  const unique = new Map();
  for (const line of lines) for (const point of line) unique.set(point.key, point);
  let x=0, y=0, z=0;
  for (const point of unique.values()) {
    const ra = point.raHours * 15 * Math.PI / 180;
    const dec = point.decDeg * Math.PI / 180;
    const c = Math.cos(dec);
    x += c*Math.cos(ra); y += c*Math.sin(ra); z += Math.sin(dec);
  }
  const length = Math.hypot(x,y,z) || 1;
  x/=length; y/=length; z/=length;
  return {
    raHours:normalizeDegrees(Math.atan2(y,x)*180/Math.PI)/15,
    decDeg:Math.atan2(z,Math.hypot(x,y))*180/Math.PI,
  };
}

function selectPatterns(collection) {
  return (collection?.features || []).map(normalizeFeature).filter(Boolean);
}

async function loadPatterns() {
  try {
    const cached = JSON.parse(localStorage.getItem(PATTERN_CACHE_KEY) || 'null');
    if (Array.isArray(cached) && cached.length) {
      state.patterns = cached;
      state.patternsReady = true;
    }
  } catch {}

  try {
    const response = await fetch(`${PATTERN_URL}?v=1.7.0`, { cache:'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const selected = selectPatterns(await response.json());
    if (selected.length) {
      state.patterns = selected;
      state.patternsReady = true;
      try { localStorage.setItem(PATTERN_CACHE_KEY, JSON.stringify(selected)); } catch {}
    }
  } catch {
    // 已有本機資料時繼續離線運作；首次離線時維持原有簡化星座。
  }

  const status = $('#constellationText');
  if (status && state.patternsReady) {
    const zodiacCount = state.patterns.filter(item => item.type === 'zodiac').length;
    const featuredCount = state.patterns.filter(item => item.type === 'featured').length;
    status.textContent = `${zodiacCount} 黃道＋${featuredCount} 指標`;
  }
}

function styleFor(type) {
  if (type === 'zodiac') return {
    line:'rgba(255,211,65,.88)', star:'#fff2a6', label:'#ffe27a', shadow:'#ffc52b',
    radius:2.35, lineWidth:1.55, shadowBlur:9,
  };
  return {
    line:'rgba(139,218,255,.78)', star:'#eefaff', label:'#ccefff', shadow:'#63c9ff',
    radius:2.05, lineWidth:1.25, shadowBlur:6,
  };
}

function projectVertex(vertex, observer, basis, width, height, fov, now) {
  const horizontal = equatorialToHorizontal(vertex.raHours, vertex.decDeg, observer, now);
  const world = horizontalToWorldVector(horizontal.altitudeDeg, horizontal.azimuthDeg);
  const point = projectWorldToScreen(world,basis.right,basis.up,basis.forward,width,height,fov);
  return { ...horizontal, world, point };
}

function drawPattern(pattern, observer, basis, width, height, fov, now) {
  const style = styleFor(pattern.type);
  const projected = new Map();
  const visibleStars = [];
  for (const line of pattern.lines) {
    for (const vertex of line) {
      if (!projected.has(vertex.key)) {
        const value = projectVertex(vertex, observer, basis, width, height, fov, now);
        projected.set(vertex.key, value);
        if (value.point && value.point.depth > .08 && value.altitudeDeg > -2 &&
            value.point.x > -18 && value.point.x < width+18 && value.point.y > 88 && value.point.y < height-82) {
          visibleStars.push({ vertex, ...value });
        }
      }
    }
  }

  if (!visibleStars.length) return false;

  ctx.save();
  ctx.lineWidth = style.lineWidth;
  ctx.strokeStyle = style.line;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = style.shadowBlur;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const line of pattern.lines) {
    let drawing = false;
    ctx.beginPath();
    for (const vertex of line) {
      const value = projected.get(vertex.key);
      const usable = value?.point && value.point.depth > .08 && value.altitudeDeg > -2 &&
        value.point.x > -70 && value.point.x < width+70 && value.point.y > 70 && value.point.y < height-68;
      if (!usable) { drawing = false; continue; }
      if (!drawing) { ctx.moveTo(value.point.x,value.point.y); drawing = true; }
      else ctx.lineTo(value.point.x,value.point.y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 所有星座連線節點都固定畫出，不套用星等上限。
  ctx.save();
  ctx.fillStyle = style.star;
  ctx.shadowColor = style.shadow;
  ctx.shadowBlur = style.shadowBlur;
  for (const star of visibleStars) {
    ctx.beginPath();
    ctx.arc(star.point.x,star.point.y,style.radius,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  const labelStars = visibleStars.filter(star => star.point.x>28 && star.point.x<width-95 && star.point.y>110 && star.point.y<height-100);
  if (labelStars.length >= 2) {
    const x = labelStars.reduce((sum,item)=>sum+item.point.x,0)/labelStars.length;
    const y = labelStars.reduce((sum,item)=>sum+item.point.y,0)/labelStars.length;
    ctx.save();
    ctx.font = pattern.type==='zodiac' ? '800 12px system-ui' : '700 11px system-ui';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=style.label; ctx.shadowColor=style.shadow; ctx.shadowBlur=7;
    ctx.fillText(pattern.name,x,y-15);
    ctx.restore();
  }
  return true;
}

function drawBelowMarker(x,y,pattern,depth) {
  const style=styleFor(pattern.type);
  ctx.save();
  ctx.strokeStyle=style.line; ctx.fillStyle=style.label; ctx.lineWidth=1.3;
  ctx.setLineDash([4,4]); ctx.shadowColor=style.shadow; ctx.shadowBlur=5;
  ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.stroke();
  ctx.setLineDash([]); ctx.shadowBlur=0;
  ctx.font='700 9px system-ui'; ctx.textAlign='center';
  ctx.fillText(`${pattern.name} ↓${depth}°`,x,y-18);
  ctx.restore();
}

function renderPatterns(timestamp) {
  if (state.hidden || timestamp-state.lastDrawAt<100) return;
  state.lastDrawAt=timestamp;
  clear(); loadObserver();
  if (state.orientationDirty || !state.basis) { updateBasis(); state.orientationDirty=false; }
  const basis=state.basis, observer=state.observer;
  const constellationButton=$('[data-toggle="constellations"]');
  if (!basis || !observer || !state.patternsReady || (constellationButton && !constellationButton.classList.contains('active'))) return;

  const width=overlay.clientWidth, height=overlay.clientHeight;
  const now=new Date(), fov=Number($('#fovRange')?.value || 55);
  const center=worldVectorToHorizontal(basis.forward);
  const below=[];

  for (const pattern of state.patterns) {
    const centerHorizontal=equatorialToHorizontal(pattern.center.raHours,pattern.center.decDeg,observer,now);
    const azDiff=normalizeSignedDegrees(centerHorizontal.azimuthDeg-center.azimuthDeg);
    if (centerHorizontal.altitudeDeg<0) {
      if (Math.abs(azDiff)<62) below.push({pattern,horizontal:centerHorizontal,azDiff});
      continue;
    }
    drawPattern(pattern,observer,basis,width,height,fov,now);
  }

  const used=[];
  for (const entry of below.sort((a,b)=>Math.abs(a.azDiff)-Math.abs(b.azDiff)).slice(0,4)) {
    let x=width/2+(entry.azDiff/65)*(width/2-48);
    x=Math.max(52,Math.min(width-52,x));
    if (used.some(value=>Math.abs(value-x)<84)) continue;
    used.push(x);
    drawBelowMarker(x,height-105,entry.pattern,Math.round(Math.abs(entry.horizontal.altitudeDeg)));
  }
}

function stopNavigation(name) {
  $('#cancelNavigation')?.click();
  navigator.vibrate?.([70,40,110]);
  const toast=$('#toast');
  if (!toast) return;
  toast.textContent=`已找到${name}，導航已自動停止`;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),4200);
}

function updateNavigationFeatures() {
  const hud=$('#navigationHud'),arrow=$('#navigationArrow'),hint=$('#navigationHint'),marker=$('#targetMarker');
  if (!hud || !arrow || !hint || !marker) return;
  if (hud.classList.contains('hidden')) {
    state.arrivalStartedAt=0; state.arrivalName=''; marker.dataset.label='';
    marker.classList.remove('below-horizon','zodiac','arrived'); marker.classList.add('hidden');
    return;
  }
  const name=$('#navigationName')?.textContent?.trim() || '';
  const zodiac=ZODIAC_NAMES.has(name);
  const belowMatch=hint.textContent.match(/地平線下\s*(\d+)°/);
  const below=Boolean(belowMatch);
  hud.classList.toggle('zodiac',zodiac); hud.classList.toggle('below-horizon',below);
  arrow.classList.toggle('zodiac',zodiac); marker.classList.toggle('zodiac',zodiac);
  marker.classList.toggle('below-horizon',below);
  if (below) {
    const turn=hint.textContent.match(/向(左|右)轉\s*(\d+)°/);
    const direction=turn?.[1]==='左'?-1:turn?.[1]==='右'?1:0;
    const amount=Number(turn?.[2]||0);
    marker.style.left=`${Math.max(40,Math.min(innerWidth-40,innerWidth/2+direction*Math.min(innerWidth*.38,amount/180*innerWidth*.5)))}px`;
    marker.style.top=`${innerHeight-112}px`; marker.dataset.label=`地平線下 ${belowMatch[1]}°`;
    marker.classList.remove('hidden','arrived');
  } else marker.dataset.label='';
  const arrived=arrow.classList.contains('arrived') && !below;
  if (arrived) {
    if (!state.arrivalStartedAt || state.arrivalName!==name) {
      state.arrivalStartedAt=performance.now(); state.arrivalName=name;
    } else if (performance.now()-state.arrivalStartedAt>=1200) {
      state.arrivalStartedAt=0; state.arrivalName=''; stopNavigation(name);
    }
  } else { state.arrivalStartedAt=0; state.arrivalName=''; }
}

window.addEventListener('resize',resize,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(()=>{resize();state.orientationDirty=true},180),{passive:true});
window.addEventListener('deviceorientationabsolute',onOrientation,{capture:true,passive:true});
window.addEventListener('deviceorientation',onOrientation,{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{
  state.hidden=document.visibilityState!=='visible';
  if (!state.hidden) { loadObserver(); state.orientationDirty=true; }
});
resize(); loadObserver(); loadPatterns();
setInterval(()=>renderPatterns(performance.now()),100);
setInterval(updateNavigationFeatures,200);
