(() => {
  const assets = {
    INTJ: { src: 'assets/characters/nt.webp', x: 0, y: 0, cols: 2, rows: 2 },
    INTP: { src: 'assets/characters/nt.webp', x: 1, y: 0, cols: 2, rows: 2 },
    ENTJ: { src: 'assets/characters/nt.webp', x: 0, y: 1, cols: 2, rows: 2 },
    ENTP: { src: 'assets/characters/nt.webp', x: 1, y: 1, cols: 2, rows: 2 },
    INFJ: { src: 'assets/characters/nf.webp', x: 0, y: 0, cols: 2, rows: 2 },
    INFP: { src: 'assets/characters/nf.webp', x: 1, y: 0, cols: 2, rows: 2 },
    ENFJ: { src: 'assets/characters/nf.webp', x: 0, y: 1, cols: 2, rows: 2 },
    ENFP: { src: 'assets/characters/nf.webp', x: 1, y: 1, cols: 2, rows: 2 },
    ISTJ: { src: 'assets/characters/sj1.webp', x: 0, y: 0, cols: 2, rows: 1 },
    ISFJ: { src: 'assets/characters/sj1.webp', x: 1, y: 0, cols: 2, rows: 1 },
    ESTJ: { src: 'assets/characters/estj.webp', x: 0, y: 0, cols: 1, rows: 1 },
    ESFJ: { src: 'assets/characters/esfj.webp', x: 0, y: 0, cols: 1, rows: 1 },
    ISTP: { src: 'assets/characters/istp.webp', x: 0, y: 0, cols: 1, rows: 1 },
    ISFP: { src: 'assets/characters/isfp.webp', x: 0, y: 0, cols: 1, rows: 1 },
    ESTP: { src: 'assets/characters/estp.webp', x: 0, y: 0, cols: 1, rows: 1 },
    ESFP: { src: 'assets/characters/esfp.webp', x: 0, y: 0, cols: 1, rows: 1 }
  };

  const groupTheme = {
    NT: { accent: '#a78bfa', dark: '#171126' },
    NF: { accent: '#78c96b', dark: '#102217' },
    SJ: { accent: '#68a5ef', dark: '#0d1b2c' },
    SP: { accent: '#e8b448', dark: '#241807' }
  };

  const cache = new Map();
  const groupOf = type => (type[1] === 'N' ? (type[2] === 'T' ? 'NT' : 'NF') : (type[3] === 'J' ? 'SJ' : 'SP'));

  function load(src) {
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    cache.set(src, promise);
    return promise;
  }

  async function paint(canvas, type) {
    const meta = assets[type];
    if (!meta || !canvas) return false;
    try {
      const img = await load(meta.src);
      const sw = img.naturalWidth / meta.cols;
      const sh = img.naturalHeight / meta.rows;
      canvas.width = 640;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, meta.x * sw, meta.y * sh, sw, sh, 0, 0, canvas.width, canvas.height);
      return true;
    } catch (error) {
      console.warn('Artwork loading failed:', error);
      return false;
    }
  }

  function updateFrame(type) {
    const theme = groupTheme[groupOf(type)];
    const frame = document.querySelector('.frame');
    if (!frame || !theme) return;
    frame.style.borderColor = theme.accent;
    frame.style.boxShadow = `0 0 0 2px ${theme.dark}, 8px 8px #070611, 0 0 28px ${theme.accent}55`;
  }

  const originalResult = result;
  result = function enhancedResult() {
    originalResult();
    updateFrame(state.type);
    paint(document.querySelector('#avatar'), state.type);
  };

  async function enhancedCard() {
    const type = state.type;
    const p = P[type];
    const theme = groupTheme[groupOf(type)];
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    c.width = 1080;
    c.height = 1350;

    const bg = x.createLinearGradient(0, 0, 1080, 1350);
    bg.addColorStop(0, theme.dark);
    bg.addColorStop(1, '#08070d');
    x.fillStyle = bg;
    x.fillRect(0, 0, 1080, 1350);

    x.strokeStyle = theme.accent;
    x.lineWidth = 8;
    x.strokeRect(36, 36, 1008, 1278);
    x.strokeStyle = `${theme.accent}66`;
    x.lineWidth = 2;
    x.strokeRect(54, 54, 972, 1242);

    const art = document.createElement('canvas');
    const loaded = await paint(art, type);
    if (loaded) {
      x.save();
      x.beginPath();
      x.roundRect(190, 90, 700, 700, 34);
      x.clip();
      x.drawImage(art, 190, 90, 700, 700);
      x.restore();
      x.strokeStyle = theme.accent;
      x.lineWidth = 6;
      x.roundRect(190, 90, 700, 700, 34);
      x.stroke();
    } else {
      const fallback = document.createElement('canvas');
      draw(fallback, type, 24);
      x.imageSmoothingEnabled = false;
      x.drawImage(fallback, 300, 160, 480, 480);
    }

    x.textAlign = 'center';
    x.fillStyle = theme.accent;
    x.font = '900 112px monospace';
    x.fillText(type, 540, 920);
    x.fillStyle = '#fff8e8';
    x.font = '700 50px sans-serif';
    x.fillText(p[0], 540, 990);
    x.fillStyle = '#bcb3d4';
    x.font = '30px sans-serif';
    x.fillText((state.name || '我的') + '像素人格', 540, 1050);

    p[3].split(',').slice(0, 3).forEach((v, i) => {
      x.fillStyle = theme.accent;
      x.roundRect(105 + i * 300, 1110, 270, 68, 18);
      x.fill();
      x.fillStyle = '#17120a';
      x.font = '700 27px sans-serif';
      x.fillText('# ' + v, 240 + i * 300, 1154);
    });

    x.fillStyle = '#81799a';
    x.font = '24px monospace';
    x.fillText('PIXEL TYPE LAB · MBTI STYLE TEST', 540, 1260);

    const link = document.createElement('a');
    link.download = `${state.name || '我的'}-${type}-人格角色卡.png`;
    link.href = c.toDataURL('image/png');
    link.click();
    toast('新版角色卡已下載');
  }

  card = enhancedCard;
  const download = document.querySelector('#download');
  if (download) download.onclick = enhancedCard;

  Object.values(assets).forEach(meta => load(meta.src).catch(() => {}));
})();