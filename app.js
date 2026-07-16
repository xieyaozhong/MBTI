const state={i:0,a:Array(Q.length).fill(null),name:'',type:'',scores:{},locked:false};
const $=selector=>document.querySelector(selector);

const guardStyle=document.createElement('style');
guardStyle.textContent='body,body *{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}input,textarea{-webkit-touch-callout:default;-webkit-user-select:text;user-select:text}.ans{touch-action:manipulation}.ans:disabled{cursor:default}';
document.head.appendChild(guardStyle);
document.addEventListener('contextmenu',event=>{if(!event.target.closest('input,textarea'))event.preventDefault()});

function show(id){
  document.querySelectorAll('.screen').forEach(screen=>screen.classList.remove('on'));
  $('#'+id).classList.add('on');
  scrollTo(0,0);
}

function render(){
  state.locked=false;
  const q=Q[state.i];
  const pct=Math.round(state.i/Q.length*100);
  $('#pt').textContent=tr('progressQuestion',{current:state.i+1,total:Q.length});
  $('#pc').textContent=tr('progressDone',{pct});
  $('#pf').style.width=pct+'%';
  $('#chip').textContent=tr('chip'+q[0]);
  $('#qn').textContent=tr('questionLabel')+' '+String(state.i+1).padStart(2,'0');
  $('#qt').textContent=q[2];
  $('#back').style.opacity=state.i?1:.35;
  const box=$('#answers');
  box.innerHTML='';
  [-2,-1,0,1,2].forEach((value,index)=>{
    const button=document.createElement('button');
    button.className='ans'+(state.a[state.i]===value?' sel':'');
    button.textContent=['◀◀','◀','◆','▶','▶▶'][index];
    button.onclick=()=>answer(value,button);
    box.appendChild(button);
  });
}

function answer(value,selected){
  if(state.locked)return;
  state.locked=true;
  state.a[state.i]=value;
  document.querySelectorAll('.ans').forEach(button=>button.disabled=true);
  if(selected)selected.classList.add('sel');
  setTimeout(()=>{
    if(state.i<Q.length-1){
      state.i++;
      render();
    }else{
      state.locked=false;
      calc();
    }
  },180);
}

function calc(){
  const raw={EI:0,SN:0,TF:0,JP:0};
  Q.forEach((q,index)=>raw[q[0]]+=(q[1]===q[0][0]?1:-1)*(state.a[index]??0));
  state.type=(raw.EI>=0?'E':'I')+(raw.SN>=0?'S':'N')+(raw.TF>=0?'T':'F')+(raw.JP>=0?'J':'P');
  Object.keys(raw).forEach(key=>{
    const first=Math.round((raw[key]+12)/24*100);
    state.scores[key]=[first,100-first];
  });
  result();
}

function result(){
  const p=P[state.type];
  $('#rtype').textContent=state.type;
  $('#rtitle').textContent=p[0];
  $('#rtag').textContent=p[1];
  $('#rsum').textContent=tr('resultSummary',{name:resultNamePrefix(state.name),type:state.type});
  $('#tags').innerHTML=p[3].split(',').map(tag=>`<span class="tagpill"># ${tag}</span>`).join('');
  ['strong','blind','work','love'].forEach((id,index)=>$('#'+id).textContent=p[index+4]);
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
}

function draw(c,t,px){
  const x=c.getContext('2d'),p=P[t],col=p[2],dark='#171125',skin='#ffd1ad',hair=t[1]==='N'?'#40345b':'#5c3829';
  c.width=c.height=16*px;
  x.imageSmoothingEnabled=false;
  const r=(a,b,w,h,color)=>{x.fillStyle=color;x.fillRect(a*px,b*px,w*px,h*px)};
  r(0,0,16,16,dark);
  for(let i=0;i<16;i+=3)r(i,(i*5)%10,1,1,i%2?col:'#fff1a8');
  r(0,12,16,4,col);r(4,3,8,4,hair);r(5,4,6,4,skin);r(6,5,1,1,dark);r(9,5,1,1,dark);
  r(7,7,2,1,'#e69b78');r(5,8,6,1,skin);r(4,9,8,4,col);r(3,10,2,3,'#fff8');r(11,10,2,3,'#fff8');
  r(6,9,4,1,'#fff');r(5,13,2,2,dark);r(9,13,2,2,dark);r(4,15,3,1,'#08060e');r(9,15,3,1,'#08060e');
  const prop=t.charCodeAt(0)+t.charCodeAt(3);
  if(prop%4===0){r(12,7,2,5,'#fff');r(11,10,4,1,'#ffd166')}
  else if(prop%4===1){r(11,8,4,4,'#fff3c8');r(12,9,2,1,col);r(12,11,2,1,col)}
  else if(prop%4===2){r(12,7,1,6,'#80ed99');r(11,8,3,2,'#ff8fab');r(12,7,1,1,'#ffd166')}
  else{r(11,8,4,4,'#34304a');r(12,9,2,2,'#72ddf7')}
}

function card(){}

function toast(message){
  const t=$('#toast');
  t.textContent=message;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1600);
}

$('#go').onclick=()=>{
  state.name=$('#name').value.trim();
  state.i=0;
  state.a.fill(null);
  render();
  show('quiz');
};
$('#back').onclick=()=>{if(!state.locked&&state.i){state.i--;render()}};
$('#quit').onclick=()=>{if(!state.locked)show('start')};
$('#again').onclick=()=>{state.i=0;state.a.fill(null);render();show('quiz')};
$('#download').onclick=card;
$('#share').onclick=async()=>{
  const p=P[state.type];
  const text=localizedShareText(state.name,state.type,p[0],p[1]);
  try{
    navigator.share
      ? await navigator.share({title:tr('shareTitle'),text,url:location.href})
      : await navigator.clipboard.writeText(text+'\n'+location.href);
    toast(tr('shareReady'));
  }catch(error){}
};
$('#name').onkeydown=event=>{if(event.key==='Enter')$('#go').click()};
