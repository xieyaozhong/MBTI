(() => {
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const minFrameMs = 1000 / 30;
  let lastFrame = 0;
  let sequence = 1;
  const pending = new Map();

  window.requestAnimationFrame = callback => {
    const id = sequence++;
    const nativeId = nativeRAF(timestamp => {
      const wait = Math.max(0, minFrameMs - (timestamp - lastFrame));
      const run = () => {
        if (!pending.has(id)) return;
        pending.delete(id);
        lastFrame = performance.now();
        callback(lastFrame);
      };
      if (wait > 1) {
        const timer = setTimeout(run, wait);
        pending.set(id, { type: 'timer', id: timer });
      } else {
        pending.set(id, { type: 'raf', id: nativeId });
        run();
      }
    });
    pending.set(id, { type: 'raf', id: nativeId });
    return id;
  };

  window.cancelAnimationFrame = id => {
    const handle = pending.get(id);
    if (!handle) return;
    pending.delete(id);
    if (handle.type === 'timer') clearTimeout(handle.id);
    else nativeCancel(handle.id);
  };

  const mediaDevices = navigator.mediaDevices;
  if (mediaDevices?.getUserMedia) {
    const original = mediaDevices.getUserMedia.bind(mediaDevices);
    mediaDevices.getUserMedia = constraints => {
      const next = typeof structuredClone === 'function'
        ? structuredClone(constraints || {})
        : JSON.parse(JSON.stringify(constraints || {}));
      if (next.video && typeof next.video === 'object') {
        next.video.width = { ideal: 1280, max: 1280 };
        next.video.height = { ideal: 720, max: 720 };
        next.video.frameRate = { ideal: 30, max: 30 };
      }
      return original(next);
    };
  }

  document.documentElement.dataset.performanceMode = 'balanced';
})();
