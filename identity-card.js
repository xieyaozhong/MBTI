(() => {
  const THEMES = {
    NT: { accent: '#b79cff', accent2: '#72ddf7', dark: '#171126', label: 'NT · 分析家群' },
    NF: { accent: '#8cda7d', accent2: '#f6d365', dark: '#102217', label: 'NF · 外交家群' },
    SJ: { accent: '#78b4ff', accent2: '#a9d6ff', dark: '#0d1b2c', label: 'SJ · 守護者群' },
    SP: { accent: '#f0c15b', accent2: '#ff8f70', dark: '#241807', label: 'SP · 探險家群' }
  };

  const groupOf = type => (type[1] === 'N' ? (type[2] === 'T' ? 'NT' : 'NF') : (type[3] === 'J' ? 'SJ' : 'SP'));

  function roundedPath(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function fillRound(ctx, x, y, w, h, r, fill) {
    roundedPath(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function strokeRound(ctx, x, y, w, h, r, stroke, width = 1) {
    roundedPath(ctx, x, y, w, h, r);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace('#', '');
    const normalized = value.length === 3 ? value.split('').map(ch => ch + ch).join('') : value;
    const n = Number.parseInt(normalized, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }

  function drawGrid(ctx, accent) {
    ctx.save();
    ctx.strokeStyle = hexToRgba(accent, 0.075);
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1080; x += 54) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1350);
      ctx.stroke();
    }
    for (let y = 0; y <= 1350; y += 54) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStars(ctx, accent) {
    const points = [
      [76, 108, 3], [168, 71, 2], [991, 112, 3], [938, 244, 2],
      [59, 613, 2], [1021, 670, 3], [92, 1186, 2], [982, 1241, 2]
    ];
    ctx.save();
    points.forEach(([px, py, r], i) => {
      ctx.fillStyle = i % 2 ? '#fff8e8' : accent;
      ctx.globalAlpha = i % 2 ? 0.42 : 0.7;
      ctx.fillRect(px - r, py, r * 2 + 1, 1);
      ctx.fillRect(px, py - r, 1, r * 2 + 1);
    });
    ctx.restore();
  }

  function fitFont(ctx, text, maxWidth, startSize, minSize, weight = 800, family = 'sans-serif') {
    let size = startSize;
    while (size > minSize) {
      ctx.font = `${weight} ${size}px ${family}`;
      if (ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }
    return size;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
    const chars = Array.from(text || '');
    const lines = [];
    let line = '';
    chars.forEach(char => {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);

    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines && visible.length) {
      let last = visible[visible.length - 1];
      while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      visible[visible.length - 1] = last + '…';
    }
    visible.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  }

  function drawTag(ctx, text, x, y, maxWidth, accent) {
    ctx.font = '700 24px sans-serif';
    const label = `# ${text}`;
    const width = Math.min(maxWidth, Math.max(126, ctx.measureText(label).width + 42));
    fillRound(ctx, x, y, width, 54, 18, hexToRgba(accent, 0.16));
    strokeRound(ctx, x, y, width, 54, 18, hexToRgba(accent, 0.52), 2);
    ctx.fillStyle = '#fff8e8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + 28, width - 24);
    return width;
  }

  function drawDimension(ctx, key, x, y, width, theme) {
    const score = state.scores[key] || [50, 50];
    const names = DN[key] || [key[0], key[1]];
    const leftWins = score[0] >= score[1];

    ctx.textBaseline = 'alphabetic';
    ctx.font = '700 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = leftWins ? '#fff8e8' : '#aaa3bd';
    ctx.fillText(`${names[0]}  ${score[0]}%`, x, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = leftWins ? '#aaa3bd' : '#fff8e8';
    ctx.fillText(`${names[1]}  ${score[1]}%`, x + width, y);

    const barY = y + 17;
    fillRound(ctx, x, barY, width, 17, 9, 'rgba(255,255,255,.09)');
    const gradient = ctx.createLinearGradient(x, barY, x + width, barY);
    gradient.addColorStop(0, theme.accent);
    gradient.addColorStop(1, theme.accent2);
    fillRound(ctx, x, barY, Math.max(17, width * score[0] / 100), 17, 9, gradient);

    const center = x + width / 2;
    ctx.fillStyle = '#0b0911';
    ctx.fillRect(center - 1, barY - 3, 2, 23);
  }

  function drawCornerMarks(ctx, accent) {
    const marks = [
      [54, 54, 1, 1], [1026, 54, -1, 1], [54, 1296, 1, -1], [1026, 1296, -1, -1]
    ];
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    marks.forEach(([mx, my, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(mx, my + 34 * dy);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + 34 * dx, my);
      ctx.stroke();
    });
    ctx.restore();
  }

  function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function fullCard() {
    const p = P[state.type];
    const identity = IDENTITY[state.suffix];
    const fullType = state.fullType || `${state.type}-${state.suffix || 'A'}`;
    const theme = THEMES[groupOf(state.type)];
    const source = document.querySelector('#avatar');
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    c.width = 1080;
    c.height = 1350;
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = 'high';

    const bg = x.createLinearGradient(0, 0, 1080, 1350);
    bg.addColorStop(0, theme.dark);
    bg.addColorStop(0.54, '#0d0a16');
    bg.addColorStop(1, '#07060b');
    x.fillStyle = bg;
    x.fillRect(0, 0, 1080, 1350);
    drawGrid(x, theme.accent);
    drawStars(x, theme.accent);

    fillRound(x, 36, 36, 1008, 1278, 42, 'rgba(7,6,13,.34)');
    strokeRound(x, 36, 36, 1008, 1278, 42, hexToRgba(theme.accent, 0.9), 5);
    strokeRound(x, 52, 52, 976, 1246, 34, hexToRgba(theme.accent, 0.22), 2);
    drawCornerMarks(x, theme.accent);

    x.textBaseline = 'alphabetic';
    x.textAlign = 'left';
    x.fillStyle = theme.accent;
    x.font = '900 25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    x.fillText('✦ PIXEL TYPE LAB', 78, 101);
    x.fillStyle = '#81799a';
    x.font = '700 19px sans-serif';
    x.fillText('5-DIMENSION PERSONALITY STYLE TEST', 78, 128);

    fillRound(x, 806, 78, 196, 50, 18, hexToRgba(theme.accent, 0.13));
    strokeRound(x, 806, 78, 196, 50, 18, hexToRgba(theme.accent, 0.44), 2);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#fff8e8';
    x.font = '800 20px sans-serif';
    x.fillText('完整人格結果', 904, 104);

    fillRound(x, 72, 158, 936, 526, 32, 'rgba(255,255,255,.035)');
    strokeRound(x, 72, 158, 936, 526, 32, hexToRgba(theme.accent, 0.24), 2);

    const artX = 92;
    const artY = 178;
    const artSize = 486;
    x.save();
    roundedPath(x, artX, artY, artSize, artSize, 26);
    x.clip();
    x.fillStyle = theme.dark;
    x.fillRect(artX, artY, artSize, artSize);
    if (source && source.width && source.height) {
      x.drawImage(source, artX, artY, artSize, artSize);
    } else {
      const fallback = document.createElement('canvas');
      draw(fallback, state.type, 24);
      x.imageSmoothingEnabled = false;
      x.drawImage(fallback, artX, artY, artSize, artSize);
      x.imageSmoothingEnabled = true;
    }
    const shade = x.createLinearGradient(artX, artY, artX, artY + artSize);
    shade.addColorStop(0.68, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,.38)');
    x.fillStyle = shade;
    x.fillRect(artX, artY, artSize, artSize);
    x.restore();
    strokeRound(x, artX, artY, artSize, artSize, 26, theme.accent, 4);
    strokeRound(x, artX + 10, artY + 10, artSize - 20, artSize - 20, 20, hexToRgba(theme.accent, 0.28), 2);

    fillRound(x, artX + 22, artY + artSize - 70, 190, 44, 15, 'rgba(7,6,13,.78)');
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = theme.accent;
    x.font = '800 18px sans-serif';
    x.fillText(theme.label, artX + 117, artY + artSize - 48);

    const infoX = 620;
    const infoWidth = 346;
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#81799a';
    x.font = '800 18px sans-serif';
    x.fillText('YOUR COMPLETE TYPE', infoX, 209);

    const typeSize = fitFont(x, fullType, infoWidth, 82, 62, 900, 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace');
    x.fillStyle = theme.accent;
    x.font = `900 ${typeSize}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
    x.fillText(fullType, infoX, 296);

    x.fillStyle = '#fff8e8';
    const titleSize = fitFont(x, p[0], infoWidth, 42, 32, 800, 'sans-serif');
    x.font = `800 ${titleSize}px sans-serif`;
    x.fillText(p[0], infoX, 355);

    const identityText = identity ? identity.label : '';
    x.font = '700 19px sans-serif';
    const identityWidth = Math.min(infoWidth, x.measureText(identityText).width + 34);
    fillRound(x, infoX, 382, identityWidth, 43, 14, hexToRgba(theme.accent2, 0.13));
    strokeRound(x, infoX, 382, identityWidth, 43, 14, hexToRgba(theme.accent2, 0.42), 2);
    x.fillStyle = theme.accent2;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(identityText, infoX + identityWidth / 2, 404);

    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#d8d1e6';
    x.font = '600 27px sans-serif';
    wrapText(x, `「${p[1]}」`, infoX, 478, infoWidth, 42, 3);

    x.fillStyle = '#8e86a5';
    x.font = '600 21px sans-serif';
    x.fillText(`${state.name || '我的'} · 人格探索紀錄`, infoX, 628);

    x.textAlign = 'left';
    x.fillStyle = '#fff8e8';
    x.font = '900 28px sans-serif';
    x.fillText('五個人格向度', 78, 746);
    x.fillStyle = '#81799a';
    x.font = '600 18px sans-serif';
    x.textAlign = 'right';
    x.fillText('偏好比例不是能力高低', 1002, 746);

    ['EI', 'SN', 'TF', 'JP', 'AT'].forEach((key, index) => drawDimension(x, key, 78, 797 + index * 66, 924, theme));

    x.textAlign = 'left';
    x.fillStyle = '#81799a';
    x.font = '800 18px sans-serif';
    x.fillText('PERSONALITY KEYWORDS', 78, 1137);
    let tagX = 78;
    const tags = p[3].split(',').slice(0, 3);
    tags.forEach((tag, index) => {
      const remaining = 1002 - tagX - (tags.length - index - 1) * 16;
      const width = drawTag(x, tag, tagX, 1156, Math.min(286, remaining), theme.accent);
      tagX += width + 16;
    });

    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    x.fillStyle = '#81799a';
    x.font = '600 18px sans-serif';
    x.fillText('非官方 MBTI 風格自我探索測驗', 78, 1264);
    x.textAlign = 'right';
    x.fillStyle = theme.accent;
    x.font = '800 18px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    x.fillText('xieyaozhong.github.io/MBTI', 1002, 1264);

    downloadCanvas(c, `${state.name || '我的'}-${fullType}-完整人格結果.png`);
    toast('新版完整人格結果卡已下載');
  }

  card = fullCard;
  const button = document.querySelector('#download');
  if (button) button.onclick = fullCard;
})();