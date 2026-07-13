(() => {
  async function fullCard() {
    const p = P[state.type];
    const identity = IDENTITY[state.suffix];
    const source = document.querySelector('#avatar');
    const c = document.createElement('canvas');
    const x = c.getContext('2d');
    c.width = 1080;
    c.height = 1350;
    const group = state.type[1] === 'N' ? (state.type[2] === 'T' ? ['#171126','#a78bfa'] : ['#102217','#78c96b']) : (state.type[3] === 'J' ? ['#0d1b2c','#68a5ef'] : ['#241807','#e8b448']);
    const bg = x.createLinearGradient(0,0,1080,1350);
    bg.addColorStop(0,group[0]); bg.addColorStop(1,'#08070d');
    x.fillStyle = bg; x.fillRect(0,0,1080,1350);
    x.strokeStyle = group[1]; x.lineWidth = 8; x.strokeRect(36,36,1008,1278);
    x.save(); x.beginPath(); x.roundRect(190,75,700,700,34); x.clip(); x.drawImage(source,190,75,700,700); x.restore();
    x.strokeStyle = group[1]; x.lineWidth = 6; x.roundRect(190,75,700,700,34); x.stroke();
    x.textAlign = 'center';
    x.fillStyle = group[1]; x.font = '900 102px monospace'; x.fillText(state.fullType,540,900);
    x.fillStyle = '#fff8e8'; x.font = '700 48px sans-serif'; x.fillText(p[0],540,970);
    x.fillStyle = group[1]; x.font = '700 28px sans-serif'; x.fillText(identity.label,540,1025);
    x.fillStyle = '#bcb3d4'; x.font = '29px sans-serif'; x.fillText((state.name || '我的') + '完整人格結果',540,1080);
    p[3].split(',').slice(0,3).forEach((v,i) => { x.fillStyle = group[1]; x.roundRect(105+i*300,1130,270,66,18); x.fill(); x.fillStyle = '#17120a'; x.font = '700 27px sans-serif'; x.fillText('# '+v,240+i*300,1173); });
    x.fillStyle = '#81799a'; x.font = '24px monospace'; x.fillText('PIXEL TYPE LAB · 5-DIMENSION STYLE TEST',540,1270);
    const link = document.createElement('a');
    link.download = `${state.name || '我的'}-${state.fullType}-人格角色卡.png`;
    link.href = c.toDataURL('image/png'); link.click(); toast('完整人格角色卡已下載');
  }
  card = fullCard;
  const button = document.querySelector('#download');
  if (button) button.onclick = fullCard;
})();