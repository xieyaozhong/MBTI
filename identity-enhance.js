const originalRender = render;
render = function enhancedRender() {
  originalRender();
  const q = Q[state.i];
  if (q && q[0] === 'AT') $('#chip').textContent = '身分傾向 A / T';
};

calc = function enhancedCalc() {
  const raw = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
  const max = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
  Q.forEach((q, i) => {
    raw[q[0]] += (q[1] === q[0][0] ? 1 : -1) * (state.a[i] ?? 0);
    max[q[0]] += 2;
  });
  state.type = (raw.EI >= 0 ? 'E' : 'I') + (raw.SN >= 0 ? 'S' : 'N') + (raw.TF >= 0 ? 'T' : 'F') + (raw.JP >= 0 ? 'J' : 'P');
  state.suffix = raw.AT >= 0 ? 'A' : 'T';
  state.fullType = `${state.type}-${state.suffix}`;
  Object.keys(raw).forEach(d => {
    const first = Math.round(((raw[d] + max[d]) / (max[d] * 2)) * 100);
    state.scores[d] = [first, 100 - first];
  });
  result();
};

result = function enhancedIdentityResult() {
  const p = P[state.type];
  const detail = DETAIL[state.type];
  const identity = IDENTITY[state.suffix];
  const fullType = state.fullType || state.type;
  $('#rtype').textContent = fullType;
  $('#rtitle').textContent = `${p[0]} · ${identity.label}`;
  $('#rtag').textContent = p[1];
  $('#rsum').textContent = `${state.name ? state.name + '，' : ''}你最接近 ${fullType}。四字母描述你的偏好方式，A／T 則補充你面對壓力、自我評價與變動時的傾向。`;
  $('#identity').innerHTML = `<b>${identity.label}</b><span>${identity.short}</span>`;
  $('#tags').innerHTML = [...p[3].split(','), ...identity.tags].map(x => `<span class="tagpill"># ${x}</span>`).join('');
  $('#overview').textContent = `${detail.overview} ${identity.overview}`;
  $('#strong').textContent = p[4];
  $('#blind').textContent = p[5];
  $('#work').textContent = p[6];
  $('#love').textContent = p[7];
  $('#stress').textContent = `${detail.stress} ${identity.stress}`;
  $('#growth').textContent = `${detail.growth} ${identity.growth}`;
  draw($('#avatar'), state.type, 20);
  $('#dims').innerHTML = '';
  Object.keys(DN).forEach(d => {
    const s = state.scores[d];
    const e = document.createElement('div');
    e.className = 'dim';
    e.innerHTML = `<div class="dimtop"><span>${DN[d][0]} ${s[0]}%</span><span>${DN[d][1]} ${s[1]}%</span></div><div class="dbar"><div class="dfill" style="width:${s[0]}%"></div></div>`;
    $('#dims').appendChild(e);
  });
  show('result');
};

$('#share').onclick = async () => {
  const p = P[state.type];
  const text = `${state.name || '我的'}人格是 ${state.fullType}「${p[0]}」：${p[1]}`;
  try {
    navigator.share ? await navigator.share({ title: '我的完整人格結果', text, url: location.href }) : await navigator.clipboard.writeText(text + '\n' + location.href);
    toast('分享內容已準備');
  } catch (e) {}
};