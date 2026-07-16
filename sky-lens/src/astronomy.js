const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
export const degToRad = degrees => degrees * DEG;
export const radToDeg = radians => radians * RAD;
export const normalizeDegrees = degrees => { const value = degrees % 360; return value < 0 ? value + 360 : value; };
export const normalizeSignedDegrees = degrees => { const value = normalizeDegrees(degrees); return value > 180 ? value - 360 : value; };
export const shortestAngleLerp = (from, to, amount) => normalizeSignedDegrees(from + normalizeSignedDegrees(to - from) * amount);
export const worldVectorToHorizontal = vector => {
  const horizontal = Math.hypot(vector.east, vector.north);
  return { altitudeDeg: radToDeg(Math.atan2(vector.up, horizontal)), azimuthDeg: normalizeDegrees(radToDeg(Math.atan2(vector.east, vector.north))) };
};
export const horizontalToWorldVector = (altitudeDeg, azimuthDeg) => {
  const altitude = degToRad(altitudeDeg), azimuth = degToRad(azimuthDeg), horizontal = Math.cos(altitude);
  return { east: horizontal * Math.sin(azimuth), north: horizontal * Math.cos(azimuth), up: Math.sin(altitude) };
};
const julianDate = date => date.getTime() / 86400000 + 2440587.5;
export const localSiderealTimeDeg = (date, longitudeDeg) => {
  const jd = julianDate(date), days = jd - 2451545, centuries = days / 36525;
  const gmst = 280.46061837 + 360.98564736629 * days + 0.000387933 * centuries * centuries - (centuries ** 3) / 38710000;
  return normalizeDegrees(gmst + longitudeDeg);
};
export const equatorialToHorizontal = (raHours, decDeg, observer, date) => {
  const latitude = degToRad(observer.latitudeDeg), declination = degToRad(decDeg);
  const hourAngle = degToRad(normalizeSignedDegrees(localSiderealTimeDeg(date, observer.longitudeDeg) - raHours * 15));
  const sinAltitude = Math.sin(declination) * Math.sin(latitude) + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  const azimuth = Math.atan2(-Math.sin(hourAngle), Math.tan(declination) * Math.cos(latitude) - Math.sin(latitude) * Math.cos(hourAngle));
  return { altitudeDeg: radToDeg(altitude), azimuthDeg: normalizeDegrees(radToDeg(azimuth)) };
};
export const horizontalToEquatorial = (altitudeDeg, azimuthDeg, observer, date) => {
  const altitude = degToRad(altitudeDeg), azimuth = degToRad(azimuthDeg), latitude = degToRad(observer.latitudeDeg);
  const sinDeclination = Math.sin(altitude) * Math.sin(latitude) + Math.cos(altitude) * Math.cos(latitude) * Math.cos(azimuth);
  const declination = Math.asin(Math.max(-1, Math.min(1, sinDeclination)));
  const hourAngle = Math.atan2(-Math.sin(azimuth) * Math.cos(altitude), Math.sin(altitude) * Math.cos(latitude) - Math.cos(altitude) * Math.sin(latitude) * Math.cos(azimuth));
  const rightAscensionDeg = normalizeDegrees(localSiderealTimeDeg(date, observer.longitudeDeg) - radToDeg(hourAngle));
  return { raHours: rightAscensionDeg / 15, decDeg: radToDeg(declination) };
};
const dotWorld = (a, b) => a.east * b.east + a.north * b.north + a.up * b.up;
export const projectWorldToScreen = (target, cameraRight, cameraUp, cameraForward, width, height, verticalFovDeg) => {
  const depth = dotWorld(target, cameraForward); if (depth <= 0.12) return null;
  const cameraX = dotWorld(target, cameraRight), cameraY = dotWorld(target, cameraUp);
  const focalLength = height / (2 * Math.tan(degToRad(verticalFovDeg) / 2));
  return { x: width / 2 + (cameraX / depth) * focalLength, y: height / 2 - (cameraY / depth) * focalLength, depth };
};
