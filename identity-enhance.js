const originalRender=render;
render=function enhancedRender(){
  originalRender();
  const q=Q[state.i];
  if(q&&q[0]==='AT')$('#chip').textContent=tr('chipAT');
};

calc=function enhancedCalc(){
  const raw={EI:0,SN:0,TF:0,JP:0,AT:0};
  const max={EI:0,SN:0,TF:0,JP:0,AT:0};
  Q.forEach((q,index)=>{
    raw[q[0]]+=(q[1]===q[0][0]?1:-1)*(state.a[index]??0);
    max[q[0]]+=2;
  });
  state.type=(raw.EI>=0?'E':'I')+(raw.SN>=0?'S':'N')+(raw.TF>=0?'T':'F')+(raw.JP>=0?'J':'P');
  state.suffix=raw.AT>=0?'A':'T';
  state.fullType=`${state.type}-${state.suffix}`;
  Object.keys(raw).forEach(key=>{
    const first=Math.round(((raw[key]+max[key])/(max[key]*2))*100);
    state.scores[key]=[first,100-first];
  });
  result();
};

result=function enhancedIdentityResult(){
  const p=P[state.type];
  const detail=DETAIL[state.type];
  const identity=IDENTITY[state.suffix];
  const fullType=state.fullType||state.type;
  $('#rtype').textContent=fullType;
  $('#rtitle').textContent=`${p[0]} · ${identity.label}`;
  $('#rtag').textContent=p[1];
  $('#rsum').textContent=tr('resultSummary',{name:resultNamePrefix(state.name),type:fullType});
  $('#identity').innerHTML=`<b>${identity.label}</b><span>${identity.short}</span>`;
  $('#tags').innerHTML=[...p[3].split(','),...identity.tags].map(tag=>`<span class="tagpill"># ${tag}</span>`).join('');
  $('#overview').textContent=`${detail.overview} ${identity.overview}`;
  $('#strong').textContent=p[4];
  $('#blind').textContent=p[5];
  $('#work').textContent=p[6];
  $('#love').textContent=p[7];
  $('#stress').textContent=`${detail.stress} ${identity.stress}`;
  $('#growth').textContent=`${detail.growth} ${identity.growth}`;
  draw($('#avatar'),state.type,20);
  $('#dims').innerHTML='';
  Object.keys(DN).forEach(key=>{
    const score=state.scores[key];
    const element=document.createElement('div');
    element.className='dim';
    element.innerHTML=`<div class="dimtop"><span>${DN[key][0]} ${score[0]}%</span><span>${DN[key][1]} ${score[1]}%</span></div><div class="dbar"><div class="dfill" style="width:${score[0]}%"></div></div>`;
    $('#dims').appendChild(element);
  });
  show('result');
};

$('#share').onclick=async()=>{
  const p=P[state.type];
  const text=localizedShareText(state.name,state.fullType,p[0],p[1]);
  try{
    navigator.share
      ? await navigator.share({title:tr('shareTitle'),text,url:location.href})
      : await navigator.clipboard.writeText(text+'\n'+location.href);
    toast(tr('shareReady'));
  }catch(error){}
};
