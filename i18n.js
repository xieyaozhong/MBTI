(() => {
  const UI=window.I18N_UI;
  const PACKS=window.I18N_PACKS;
  const BASE={
    questions:Q.map(item=>item[2]),
    people:Object.fromEntries(Object.entries(P).map(([type,value])=>[type,[...value]])),
    details:Object.fromEntries(Object.entries(DETAIL).map(([type,value])=>[type,{...value}])),
    identities:Object.fromEntries(Object.entries(IDENTITY).map(([key,value])=>[key,{...value,tags:[...value.tags]}])),
    dims:Object.fromEntries(Object.entries(DN).map(([key,value])=>[key,[...value]]))
  };
  let language=localStorage.getItem('pixel-type-language')||'zh';
  if(!['zh','en','th'].includes(language))language='zh';

  function interpolate(text,vars={}){
    return String(text??'').replace(/\{(\w+)\}/g,(_,key)=>vars[key]??'');
  }
  function tr(key,vars={}){
    return interpolate((UI[language]&&UI[language][key])||UI.zh[key]||key,vars);
  }
  function applyLocalizedData(){
    if(language==='zh'){
      Q.forEach((item,index)=>{item[2]=BASE.questions[index]});
      Object.keys(BASE.people).forEach(type=>{P[type]=[...BASE.people[type]]});
      Object.keys(BASE.details).forEach(type=>{DETAIL[type]={...BASE.details[type]}});
      Object.keys(BASE.identities).forEach(key=>{IDENTITY[key]={...BASE.identities[key],tags:[...BASE.identities[key].tags]}});
      Object.keys(BASE.dims).forEach(key=>{DN[key]=[...BASE.dims[key]]});
      return;
    }
    const pack=PACKS[language];
    Q.forEach((item,index)=>{item[2]=pack.questions[index]||BASE.questions[index]});
    Object.keys(BASE.people).forEach(type=>{
      const translated=pack.people[type];
      P[type]=[translated[0],translated[1],BASE.people[type][2],translated[2],translated[3],translated[4],translated[5],translated[6]];
    });
    Object.keys(BASE.details).forEach(type=>{
      const translated=pack.details[type];
      DETAIL[type]={overview:translated[0],stress:translated[1],growth:translated[2]};
    });
    Object.keys(BASE.identities).forEach(key=>{
      IDENTITY[key]={...pack.identities[key],tags:[...pack.identities[key].tags]};
    });
    Object.keys(BASE.dims).forEach(key=>{DN[key]=[...pack.dims[key]]});
  }
  function applyStaticText(){
    document.documentElement.lang=language==='zh'?'zh-Hant':language;
    document.body.dataset.lang=language;
    document.title=tr('pageTitle');
    document.querySelectorAll('[data-i18n]').forEach(node=>{node.textContent=tr(node.dataset.i18n)});
    document.querySelectorAll('[data-i18n-html]').forEach(node=>{node.innerHTML=tr(node.dataset.i18nHtml)});
    document.querySelectorAll('[data-i18n-placeholder]').forEach(node=>{node.placeholder=tr(node.dataset.i18nPlaceholder)});
    document.querySelectorAll('[data-lang]').forEach(button=>{
      const active=button.dataset.lang===language;
      button.classList.toggle('active',active);
      button.setAttribute('aria-pressed',String(active));
    });
  }
  function resultNamePrefix(name){
    if(!name)return'';
    if(language==='zh')return`${name}，`;
    if(language==='en')return`${name}, `;
    return`${name} `;
  }
  function localizedShareText(name,type,title,tagline){
    if(language==='zh')return`${name||'我的'}人格是 ${type}「${title}」：${tagline}`;
    if(language==='en')return`${name?name+"'s":'My'} personality is ${type} “${title}”: ${tagline}`;
    return`บุคลิกภาพของ ${name||'ฉัน'} คือ ${type} “${title}”: ${tagline}`;
  }
  function cardOwner(name){
    if(name)return name;
    return language==='zh'?'我的':language==='en'?'My result':'ของฉัน';
  }
  function refreshActiveView(){
    const quiz=document.querySelector('#quiz');
    const resultScreen=document.querySelector('#result');
    if(quiz&&quiz.classList.contains('on')&&typeof render==='function')render();
    if(resultScreen&&resultScreen.classList.contains('on')&&typeof state!=='undefined'&&state.type&&typeof result==='function')result();
  }
  function setLanguage(nextLanguage,refresh=true){
    if(!['zh','en','th'].includes(nextLanguage))return;
    language=nextLanguage;
    localStorage.setItem('pixel-type-language',language);
    applyLocalizedData();
    applyStaticText();
    if(refresh)refreshActiveView();
  }
  window.tr=tr;
  window.setLanguage=setLanguage;
  window.getLanguage=()=>language;
  window.resultNamePrefix=resultNamePrefix;
  window.localizedShareText=localizedShareText;
  window.cardOwner=cardOwner;
  document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
  setLanguage(language,false);
})();
