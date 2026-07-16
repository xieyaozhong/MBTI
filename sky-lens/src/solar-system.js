const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const norm = value => ((value % 360) + 360) % 360;
const sinD = value => Math.sin(value * DEG);
const cosD = value => Math.cos(value * DEG);

function daysSinceEpoch(date) {
  return date.getTime() / 86400000 - 10956;
}

function eccentricAnomaly(meanAnomalyDeg, eccentricity) {
  const mean = norm(meanAnomalyDeg) * DEG;
  let anomaly = mean + eccentricity * Math.sin(mean) * (1 + eccentricity * Math.cos(mean));
  for (let i = 0; i < 7; i += 1) {
    anomaly -= (anomaly - eccentricity * Math.sin(anomaly) - mean) / (1 - eccentricity * Math.cos(anomaly));
  }
  return anomaly;
}

function orbitalPosition(elements, d) {
  const N = elements.N(d), i = elements.i(d), w = elements.w(d);
  const a = elements.a(d), e = elements.e(d), M = elements.M(d);
  const E = eccentricAnomaly(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv) * RAD;
  const r = Math.hypot(xv, yv);
  const lon = v + w;
  return {
    x: r * (cosD(N) * cosD(lon) - sinD(N) * sinD(lon) * cosD(i)),
    y: r * (sinD(N) * cosD(lon) + cosD(N) * sinD(lon) * cosD(i)),
    z: r * sinD(lon) * sinD(i),
    r, lon: norm(lon), meanAnomaly: norm(M),
  };
}

function eclipticToEquatorial(x, y, z, d) {
  const obliquity = (23.4393 - 3.563e-7 * d) * DEG;
  const ye = y * Math.cos(obliquity) - z * Math.sin(obliquity);
  const ze = y * Math.sin(obliquity) + z * Math.cos(obliquity);
  return {
    raHours: norm(Math.atan2(ye, x) * RAD) / 15,
    decDeg: Math.atan2(ze, Math.hypot(x, ye)) * RAD,
  };
}

const constant = value => () => value;
const elements = {
  mercury: {N:d=>48.3313+3.24587e-5*d,i:d=>7.0047+5e-8*d,w:d=>29.1241+1.01444e-5*d,a:constant(.387098),e:d=>.205635+5.59e-10*d,M:d=>168.6562+4.0923344368*d},
  venus: {N:d=>76.6799+2.4659e-5*d,i:d=>3.3946+2.75e-8*d,w:d=>54.891+1.38374e-5*d,a:constant(.72333),e:d=>.006773-1.302e-9*d,M:d=>48.0052+1.6021302244*d},
  mars: {N:d=>49.5574+2.11081e-5*d,i:d=>1.8497-1.78e-8*d,w:d=>286.5016+2.92961e-5*d,a:constant(1.523688),e:d=>.093405+2.516e-9*d,M:d=>18.6021+.5240207766*d},
  jupiter: {N:d=>100.4542+2.76854e-5*d,i:d=>1.303-1.557e-7*d,w:d=>273.8777+1.64505e-5*d,a:constant(5.20256),e:d=>.048498+4.469e-9*d,M:d=>19.895+.0830853001*d},
  saturn: {N:d=>113.6634+2.3898e-5*d,i:d=>2.4886-1.081e-7*d,w:d=>339.3939+2.97661e-5*d,a:constant(9.55475),e:d=>.055546-9.499e-9*d,M:d=>316.967+.0334442282*d},
  uranus: {N:d=>74.0005+1.3978e-5*d,i:d=>.7733+1.9e-8*d,w:d=>96.6612+3.0565e-5*d,a:d=>19.18171-1.55e-8*d,e:d=>.047318+7.45e-9*d,M:d=>142.5905+.011725806*d},
  neptune: {N:d=>131.7806+3.0173e-5*d,i:d=>1.77-2.55e-7*d,w:d=>272.8461-6.027e-6*d,a:d=>30.05826+3.313e-8*d,e:d=>.008606+2.15e-9*d,M:d=>260.2471+.005995147*d},
};

const planetMeta = {
  mercury:{name:'Mercury',nameZh:'水星',glyph:'☿',magnitude:-.2},
  venus:{name:'Venus',nameZh:'金星',glyph:'♀',magnitude:-4},
  mars:{name:'Mars',nameZh:'火星',glyph:'♂',magnitude:-1},
  jupiter:{name:'Jupiter',nameZh:'木星',glyph:'♃',magnitude:-2.2},
  saturn:{name:'Saturn',nameZh:'土星',glyph:'♄',magnitude:.5},
  uranus:{name:'Uranus',nameZh:'天王星',glyph:'⛢',magnitude:5.7},
  neptune:{name:'Neptune',nameZh:'海王星',glyph:'♆',magnitude:7.8},
};

function sunPosition(d) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = .016709 - 1.151e-9 * d;
  const M = 356.047 + .9856002585 * d;
  const E = eccentricAnomaly(M, e);
  const xv = Math.cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv) * RAD;
  const r = Math.hypot(xv, yv);
  const lon = norm(v + w);
  return { x:r*cosD(lon), y:r*sinD(lon), z:0, lon, meanAnomaly:norm(M), r };
}

function moonPosition(d, sun) {
  const N = norm(125.1228 - .0529538083 * d);
  const i = 5.1454;
  const w = norm(318.0634 + .1643573223 * d);
  const a = 60.2666;
  const e = .0549;
  const M = norm(115.3654 + 13.0649929509 * d);
  const E = eccentricAnomaly(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv) * RAD;
  let r = Math.hypot(xv, yv);
  let lon = norm(v + w);
  let lat = Math.asin(sinD(lon) * sinD(i)) * RAD;
  const Lm = norm(N + w + M);
  const Ls = norm(sun.lon);
  const D = norm(Lm - Ls);
  const F = norm(Lm - N);
  lon += -1.274*sinD(M-2*D)+.658*sinD(2*D)-.186*sinD(sun.meanAnomaly)-.059*sinD(2*M-2*D)-.057*sinD(M-2*D+sun.meanAnomaly)+.053*sinD(M+2*D)+.046*sinD(2*D-sun.meanAnomaly)+.041*sinD(M-sun.meanAnomaly)-.035*sinD(D)-.031*sinD(M+sun.meanAnomaly)-.015*sinD(2*F-2*D)+.011*sinD(M-4*D);
  lat += -.173*sinD(F-2*D)-.055*sinD(M-F-2*D)-.046*sinD(M+F-2*D)+.033*sinD(F+2*D)+.017*sinD(2*M+F);
  r += -.58*cosD(M-2*D)-.46*cosD(2*D);
  const x = r*cosD(lon)*cosD(lat);
  const y = r*sinD(lon)*cosD(lat);
  const z = r*sinD(lat);
  const elongation = norm(lon - sun.lon);
  const phase = (1 - Math.cos(elongation * DEG)) / 2;
  return { ...eclipticToEquatorial(x,y,z,d), phase, waxing: elongation < 180 };
}

function moonGlyph(phase, waxing) {
  if (phase < .04) return '🌑';
  if (phase > .96) return '🌕';
  if (waxing) {
    if (phase < .38) return '🌒';
    if (phase < .62) return '🌓';
    return '🌔';
  }
  if (phase > .62) return '🌖';
  if (phase > .38) return '🌗';
  return '🌘';
}

export function getSolarSystemObjects(date = new Date()) {
  const d = daysSinceEpoch(date);
  const sun = sunPosition(d);
  const sunEq = eclipticToEquatorial(sun.x, sun.y, sun.z, d);
  const objects = [{
    id:'solar-sun', name:'Sun', nameZh:'太陽', kind:'sun', source:'solar',
    glyph:'☉', magnitude:-26.7, ...sunEq
  }];
  const moon = moonPosition(d, sun);
  objects.push({
    id:'solar-moon', name:'Moon', nameZh:'月亮', kind:'moon', source:'solar',
    glyph:moonGlyph(moon.phase, moon.waxing), magnitude:-12.7, phase:moon.phase,
    raHours:moon.raHours, decDeg:moon.decDeg
  });
  for (const [id, orbitalElements] of Object.entries(elements)) {
    const heliocentric = orbitalPosition(orbitalElements, d);
    const geocentric = { x:heliocentric.x+sun.x, y:heliocentric.y+sun.y, z:heliocentric.z+sun.z };
    objects.push({
      id:`solar-${id}`, kind:'planet', source:'solar',
      ...planetMeta[id], ...eclipticToEquatorial(geocentric.x, geocentric.y, geocentric.z, d)
    });
  }
  return objects;
}
