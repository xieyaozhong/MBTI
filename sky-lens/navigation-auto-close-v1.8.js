const LOCK_DISTANCE_DEG = 4;
const HOLD_DURATION_MS = 900;
const CHECK_INTERVAL_MS = 100;

const $ = selector => document.querySelector(selector);

const lockState = {
  targetName: '',
  startedAt: 0,
  completed: false,
};

function resetLock() {
  lockState.targetName = '';
  lockState.startedAt = 0;
  lockState.completed = false;
  $('#navigationHud')?.classList.remove('locking');
}

function parseDistance() {
  const text = $('#navigationDistance')?.textContent || '';
  const value = Number.parseFloat(text.replace('°', ''));
  return Number.isFinite(value) ? value : Infinity;
}

function announceFound(name) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = `已找到${name}，導航已自動關閉`;
  toast.classList.add('show');
  clearTimeout(announceFound.timer);
  announceFound.timer = setTimeout(() => toast.classList.remove('show'), 4200);
}

function closeNavigation(name) {
  if (lockState.completed) return;
  lockState.completed = true;

  // 先觸發主程式的停止按鈕，確保搜尋目標從內部狀態清除。
  $('#cancelNavigation')?.click();

  // 再立即清除所有導航視覺，避免下一幀留下定位圈或箭頭。
  const hud = $('#navigationHud');
  const marker = $('#targetMarker');
  const arrow = $('#navigationArrow');
  hud?.classList.add('hidden');
  hud?.classList.remove('locking', 'below-horizon');
  marker?.classList.add('hidden');
  marker?.classList.remove('arrived', 'below-horizon');
  arrow?.classList.remove('arrived');

  navigator.vibrate?.([70, 40, 120]);
  setTimeout(() => announceFound(name), 30);
  setTimeout(resetLock, 250);
}

function checkNavigationLock() {
  const hud = $('#navigationHud');
  const arrow = $('#navigationArrow');
  const marker = $('#targetMarker');
  const hint = $('#navigationHint');
  const name = $('#navigationName')?.textContent?.trim() || '';

  if (!hud || hud.classList.contains('hidden') || !name) {
    resetLock();
    return;
  }

  const hintText = hint?.textContent || '';
  const belowHorizon = hud.classList.contains('below-horizon') || /地平線下/.test(hintText);
  const distance = parseDistance();
  const explicitlyArrived = arrow?.classList.contains('arrived') || marker?.classList.contains('arrived') || /已找到/.test(hintText);
  const locked = !belowHorizon && distance <= LOCK_DISTANCE_DEG && explicitlyArrived;

  if (!locked) {
    resetLock();
    return;
  }

  if (lockState.targetName !== name || !lockState.startedAt) {
    lockState.targetName = name;
    lockState.startedAt = performance.now();
    lockState.completed = false;
    hud.classList.add('locking');
    return;
  }

  if (performance.now() - lockState.startedAt >= HOLD_DURATION_MS) {
    closeNavigation(name);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') resetLock();
});

setInterval(checkNavigationLock, CHECK_INTERVAL_MS);
