const APP_VERSION = '1.5.0';
const VERSION_URL = './version.json';
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const RELOAD_GUARD = 'sky-lens-update-reloading';
const VERSION_KEY = 'sky-lens-installed-version';

let registration = null;
let refreshing = false;
let updateInProgress = false;
let hadController = Boolean(navigator.serviceWorker?.controller);

function notify(message, duration = 3200) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function setVersionText(text) {
  const element = document.querySelector('#appVersionText');
  if (element) element.textContent = text;
}

function activateWaitingWorker(worker) {
  if (!worker) return;
  updateInProgress = true;
  notify('發現新版本，正在同步更新…', 5000);
  worker.postMessage({ type: 'SKIP_WAITING' });
}

async function fetchRemoteVersion() {
  const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) throw new Error(`版本檢查失敗（${response.status}）`);
  return response.json();
}

async function checkForUpdate({ manual = false } = {}) {
  if (!registration || updateInProgress || !navigator.onLine) {
    if (manual && !navigator.onLine) notify('目前離線，恢復網路後會自動檢查更新。');
    return;
  }

  try {
    if (manual) notify('正在檢查更新…');
    const remote = await fetchRemoteVersion();
    await registration.update();

    if (registration.waiting) {
      activateWaitingWorker(registration.waiting);
      return;
    }

    const installed = localStorage.getItem(VERSION_KEY);
    if (remote.version !== APP_VERSION || (installed && installed !== remote.version)) {
      updateInProgress = true;
      notify(`正在套用 v${remote.version}…`, 5000);
      setTimeout(() => location.reload(), 900);
      return;
    }

    localStorage.setItem(VERSION_KEY, APP_VERSION);
    setVersionText(`v${APP_VERSION} · 自動更新`);
    if (manual) notify(`已是最新版 v${APP_VERSION}`);
  } catch (error) {
    if (manual) notify(error.message || '暫時無法檢查更新');
  }
}

function watchInstallingWorker(worker) {
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      activateWaitingWorker(registration?.waiting || worker);
    }
  });
}

async function initializeUpdates() {
  if (!('serviceWorker' in navigator)) {
    setVersionText(`v${APP_VERSION} · 不支援自動更新`);
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) {
      hadController = true;
      return;
    }
    refreshing = true;
    sessionStorage.setItem(RELOAD_GUARD, '1');
    notify('更新完成，正在重新開啟最新版…', 5000);
    setTimeout(() => location.reload(), 500);
  });

  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'SW_ACTIVATED') {
      localStorage.setItem(VERSION_KEY, event.data.version || APP_VERSION);
      setVersionText(`v${event.data.version || APP_VERSION} · 已更新`);
    }
  });

  registration = await navigator.serviceWorker.register('./service-worker.js', {
    scope: './',
    updateViaCache: 'none',
  });

  registration.addEventListener('updatefound', () => {
    watchInstallingWorker(registration.installing);
  });

  if (registration.waiting) activateWaitingWorker(registration.waiting);

  const justReloaded = sessionStorage.getItem(RELOAD_GUARD) === '1';
  if (justReloaded) {
    sessionStorage.removeItem(RELOAD_GUARD);
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    notify(`已更新至 v${APP_VERSION}`);
  }

  setVersionText(`v${APP_VERSION} · 自動更新`);
  await checkForUpdate();
  setInterval(() => checkForUpdate(), CHECK_INTERVAL_MS);
}

window.addEventListener('online', () => checkForUpdate());
window.addEventListener('focus', () => checkForUpdate());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});

document.querySelector('#checkUpdateButton')?.addEventListener('click', () => {
  checkForUpdate({ manual: true });
});

initializeUpdates().catch(() => {
  setVersionText(`v${APP_VERSION} · 稍後重試`);
});
