const APP_VERSION = '1.5.0';
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const RELOAD_GUARD = 'sky-lens-controller-reload';

let registration = null;
let checking = false;
let activating = false;

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

function timeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

function activateWorker(worker) {
  if (!worker || activating) return;
  activating = true;
  notify('新版已下載，正在安全切換…', 5000);
  worker.postMessage({ type: 'SKIP_WAITING' });
}

function watchWorker(worker) {
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed') {
      if (navigator.serviceWorker.controller) activateWorker(registration?.waiting || worker);
      else setVersionText(`v${APP_VERSION} · 已可離線使用`);
    }
    if (worker.state === 'redundant') {
      activating = false;
      setVersionText(`v${APP_VERSION} · 更新稍後重試`);
    }
  });
}

async function checkForUpdate({ manual = false } = {}) {
  if (!registration || checking || activating) return;
  if (!navigator.onLine) {
    if (manual) notify('目前離線；連線後會自動檢查更新。');
    return;
  }

  checking = true;
  try {
    if (manual) notify('正在檢查更新…');
    await timeout(registration.update(), 12000, '更新伺服器暫時沒有回應');

    if (registration.waiting) {
      activateWorker(registration.waiting);
      return;
    }

    if (registration.installing) {
      watchWorker(registration.installing);
      setVersionText(`v${APP_VERSION} · 正在下載更新`);
      if (manual) notify('發現新版，下載完成後會自動套用。');
      return;
    }

    setVersionText(`v${APP_VERSION} · 自動更新正常`);
    if (manual) notify(`目前已是最新版 v${APP_VERSION}`);
  } catch (error) {
    setVersionText(`v${APP_VERSION} · 離線可用`);
    if (manual) notify(error.message || '暫時無法檢查更新');
  } finally {
    checking = false;
  }
}

async function repairLocalApp() {
  const button = document.querySelector('#repairAppButton');
  if (button) {
    button.disabled = true;
    button.textContent = '正在修復…';
  }
  notify('正在重建離線快取…', 5000);
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('sky-lens-pwa-')).map(key => caches.delete(key)));
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(item => item.scope.includes('/sky-lens/')).map(item => item.unregister()));
  } catch {}
  location.replace(`./?repaired=${Date.now()}`);
}

async function initializeUpdates() {
  if (!('serviceWorker' in navigator)) {
    setVersionText(`v${APP_VERSION} · 不支援背景更新`);
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (sessionStorage.getItem(RELOAD_GUARD) === '1') return;
    sessionStorage.setItem(RELOAD_GUARD, '1');
    notify('更新完成，正在重新開啟…', 5000);
    setTimeout(() => location.reload(), 450);
  });

  registration = await navigator.serviceWorker.register('./service-worker.js', {
    scope: './',
    updateViaCache: 'none',
  });

  registration.addEventListener('updatefound', () => watchWorker(registration.installing));
  if (registration.waiting) activateWorker(registration.waiting);

  setTimeout(() => sessionStorage.removeItem(RELOAD_GUARD), 5000);
  setVersionText(`v${APP_VERSION} · 自動更新正常`);
  setTimeout(() => checkForUpdate(), 1200);
  setInterval(() => checkForUpdate(), CHECK_INTERVAL_MS);
}

window.addEventListener('online', () => checkForUpdate());
window.addEventListener('focus', () => checkForUpdate());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});

document.querySelector('#checkUpdateButton')?.addEventListener('click', () => checkForUpdate({ manual: true }));
document.querySelector('#repairAppButton')?.addEventListener('click', repairLocalApp);

initializeUpdates().catch(() => setVersionText(`v${APP_VERSION} · 離線可用`));
