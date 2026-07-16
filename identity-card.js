(() => {
  const THEMES = {
    NT:{accent:'#b79cff',accent2:'#72ddf7',dark:'#171126'},
    NF:{accent:'#8cda7d',accent2:'#f6d365',dark:'#102217'},
    SJ:{accent:'#78b4ff',accent2:'#a9d6ff',dark:'#0d1b2c'},
    SP:{accent:'#f0c15b',accent2:'#ff8f70',dark:'#241807'}
  };
  const groupOf=type=>type[1]==='N'?(type[2]==='T'?'NT':'NF'):(type[3]==='J'?'SJ':'SP');

  function roundedPath(ctx,x,y,w,h,r){
    const radius=Math.max(0,Math.min(r,w/2,h/2));
    ctx.beginPath();
    ctx.moveTo(x+radius,y);
    ctx.arcTo(x+w,y,x+w,y+h,radius);
    ctx.arcTo(x+w,y+h,x,y+h,radius);
    ctx.arcTo(x,y+h,x,y,radius);
    ctx.arcTo(x,y,x+w,y,radius);
    ctx.closePath();
  }
  function fillRound(ctx,x,y,w,h,r,fill){
    roundedPath(ctx,x,y,w,h,r);
    ctx.fillStyle=fill;
    ctx.fill();
  }
  function strokeRound(ctx,x,y,w,h,r,stroke,width=1){
    roundedPath(ctx,x,y,w,h,r);
    ctx.strokeStyle=stroke;
    ctx.lineWidth=width;
    ctx.stroke();
  }
  function rgba(hex,alpha){
    const value=hex.replace('#','');
    const normalized=value.length===3?value.split('').map(ch=>ch+ch).join(''):value;
    const number=Number.parseInt(normalized,16);
    return `rgba(${(number>>16)&255},${(number>>8)&255},${number&255},${alpha})`;
  }
  function fitFont(ctx,text,maxWidth,startSize,minSize,weight=800,family='sans-serif'){
    let size=startSize;
    while(size>minSize){
      ctx.font=`${weight} ${size}px ${family}`;
      if(ctx.measureText(text).width<=maxWidth)break;
      size-=2;
    }
    return size;
  }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=3){
    const value=String(text||'');
    const tokens=/\s/.test(value)?value.split(/(\s+)/).filter(Boolean):Array.from(value);
    const lines=[];
    let line='';
    tokens.forEach(token=>{
      const next=line+token;
      if(line&&ctx.measureText(next).width>maxWidth){
        lines.push(line.trim());
        line=token.trimStart();
      }else{
        line=next;
      }
    });
    if(line.trim())lines.push(line.trim());
    const visible=lines.slice(0,maxLines);
    if(lines.length>maxLines&&visible.length){
      let last=visible[visible.length-1];
      while(last&&ctx.measureText(last+'…').width>maxWidth)last=last.slice(0,-1);
      visible[visible.length-1]=last+'…';
    }
    visible.forEach((lineText,index)=>ctx.fillText(lineText,x,y+index*lineHeight));
  }
  function drawGrid(ctx,accent){
    ctx.save();
    ctx.strokeStyle=rgba(accent,.075);
    ctx.lineWidth=1;
    for(let gx=0;gx<=1080;gx+=54){
      ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,1350);ctx.stroke();
    }
    for(let gy=0;gy<=1350;gy+=54){
      ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(1080,gy);ctx.stroke();
    }
    ctx.restore();
  }
  function drawStars(ctx,accent){
    const points=[[76,108,3],[168,71,2],[991,112,3],[938,244,2],[59,613,2],[1021,670,3],[92,1186,2],[982,1241,2]];
    ctx.save();
    points.forEach(([px,py,r],index)=>{
      ctx.fillStyle=index%2?'#fff8e8':accent;
      ctx.globalAlpha=index%2?.42:.7;
      ctx.fillRect(px-r,py,r*2+1,1);
      ctx.fillRect(px,py-r,1,r*2+1);
    });
    ctx.restore();
  }
  function drawCornerMarks(ctx,accent){
    const marks=[[54,54,1,1],[1026,54,-1,1],[54,1296,1,-1],[1026,1296,-1,-1]];
    ctx.save();
    ctx.strokeStyle=accent;
    ctx.lineWidth=5;
    marks.forEach(([mx,my,dx,dy])=>{
      ctx.beginPath();
      ctx.moveTo(mx,my+34*dy);
      ctx.lineTo(mx,my);
      ctx.lineTo(mx+34*dx,my);
      ctx.stroke();
    });
    ctx.restore();
  }
  function drawDimension(ctx,key,x,y,width,theme){
    const score=state.scores[key]||[50,50];
    const names=DN[key]||[key[0],key[1]];
    const leftWins=score[0]>=score[1];
    const labelSize=fitFont(ctx,`${names[0]}  ${score[0]}%`,width*.47,22,15,700);
    ctx.font=`700 ${labelSize}px sans-serif`;
    ctx.textBaseline='alphabetic';
    ctx.textAlign='left';
    ctx.fillStyle=leftWins?'#fff8e8':'#aaa3bd';
    ctx.fillText(`${names[0]}  ${score[0]}%`,x,y);
    ctx.textAlign='right';
    ctx.fillStyle=leftWins?'#aaa3bd':'#fff8e8';
    ctx.fillText(`${names[1]}  ${score[1]}%`,x+width,y);
    const barY=y+17;
    fillRound(ctx,x,barY,width,17,9,'rgba(255,255,255,.09)');
    const gradient=ctx.createLinearGradient(x,barY,x+width,barY);
    gradient.addColorStop(0,theme.accent);
    gradient.addColorStop(1,theme.accent2);
    fillRound(ctx,x,barY,Math.max(17,width*score[0]/100),17,9,gradient);
    ctx.fillStyle='#0b0911';
    ctx.fillRect(x+width/2-1,barY-3,2,23);
  }
  function drawTag(ctx,text,x,y,width,accent){
    fillRound(ctx,x,y,width,54,18,rgba(accent,.16));
    strokeRound(ctx,x,y,width,54,18,rgba(accent,.52),2);
    const size=fitFont(ctx,`# ${text}`,width-24,24,14,700);
    ctx.font=`700 ${size}px sans-serif`;
    ctx.fillStyle='#fff8e8';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(`# ${text}`,x+width/2,y+28);
  }
  function downloadCanvas(canvas,filename){
    const link=document.createElement('a');
    link.download=filename.replace(/[\\/:*?"<>|]/g,'-');
    link.href=canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function fullCard(){
    const p=P[state.type];
    const identity=IDENTITY[state.suffix];
    const fullType=state.fullType||`${state.type}-${state.suffix||'A'}`;
    const group=groupOf(state.type);
    const theme=THEMES[group];
    const source=document.querySelector('#avatar');
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    canvas.width=1080;
    canvas.height=1350;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';

    const background=ctx.createLinearGradient(0,0,1080,1350);
    background.addColorStop(0,theme.dark);
    background.addColorStop(.54,'#0d0a16');
    background.addColorStop(1,'#07060b');
    ctx.fillStyle=background;
    ctx.fillRect(0,0,1080,1350);
    drawGrid(ctx,theme.accent);
    drawStars(ctx,theme.accent);

    fillRound(ctx,36,36,1008,1278,42,'rgba(7,6,13,.34)');
    strokeRound(ctx,36,36,1008,1278,42,rgba(theme.accent,.9),5);
    strokeRound(ctx,52,52,976,1246,34,rgba(theme.accent,.22),2);
    drawCornerMarks(ctx,theme.accent);

    ctx.textBaseline='alphabetic';
    ctx.textAlign='left';
    ctx.fillStyle=theme.accent;
    ctx.font='900 25px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    ctx.fillText('✦ PIXEL TYPE LAB',78,101);
    ctx.fillStyle='#81799a';
    ctx.font='700 19px sans-serif';
    ctx.fillText('5-DIMENSION PERSONALITY STYLE TEST',78,128);

    fillRound(ctx,790,78,212,50,18,rgba(theme.accent,.13));
    strokeRound(ctx,790,78,212,50,18,rgba(theme.accent,.44),2);
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillStyle='#fff8e8';
    const badgeSize=fitFont(ctx,tr('cardCompleteResult'),188,20,13,800);
    ctx.font=`800 ${badgeSize}px sans-serif`;
    ctx.fillText(tr('cardCompleteResult'),896,104);

    fillRound(ctx,72,158,936,526,32,'rgba(255,255,255,.035)');
    strokeRound(ctx,72,158,936,526,32,rgba(theme.accent,.24),2);

    const artX=92,artY=178,artSize=486;
    ctx.save();
    roundedPath(ctx,artX,artY,artSize,artSize,26);
    ctx.clip();
    ctx.fillStyle=theme.dark;
    ctx.fillRect(artX,artY,artSize,artSize);
    if(source&&source.width&&source.height){
      ctx.drawImage(source,artX,artY,artSize,artSize);
    }else{
      const fallback=document.createElement('canvas');
      draw(fallback,state.type,24);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(fallback,artX,artY,artSize,artSize);
      ctx.imageSmoothingEnabled=true;
    }
    const shade=ctx.createLinearGradient(artX,artY,artX,artY+artSize);
    shade.addColorStop(.68,'rgba(0,0,0,0)');
    shade.addColorStop(1,'rgba(0,0,0,.38)');
    ctx.fillStyle=shade;
    ctx.fillRect(artX,artY,artSize,artSize);
    ctx.restore();
    strokeRound(ctx,artX,artY,artSize,artSize,26,theme.accent,4);
    strokeRound(ctx,artX+10,artY+10,artSize-20,artSize-20,20,rgba(theme.accent,.28),2);

    fillRound(ctx,artX+22,artY+artSize-70,268,44,15,'rgba(7,6,13,.82)');
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillStyle=theme.accent;
    const groupLabel=tr('group'+group);
    const groupSize=fitFont(ctx,groupLabel,244,18,12,800);
    ctx.font=`800 ${groupSize}px sans-serif`;
    ctx.fillText(groupLabel,artX+156,artY+artSize-48);

    const infoX=620,infoWidth=346;
    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#81799a';
    const fullLabelSize=fitFont(ctx,tr('cardFullType'),infoWidth,18,12,800);
    ctx.font=`800 ${fullLabelSize}px sans-serif`;
    ctx.fillText(tr('cardFullType'),infoX,209);

    const typeSize=fitFont(ctx,fullType,infoWidth,82,58,900,'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace');
    ctx.fillStyle=theme.accent;
    ctx.font=`900 ${typeSize}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
    ctx.fillText(fullType,infoX,296);

    ctx.fillStyle='#fff8e8';
    const titleSize=fitFont(ctx,p[0],infoWidth,42,24,800);
    ctx.font=`800 ${titleSize}px sans-serif`;
    ctx.fillText(p[0],infoX,355);

    const identityText=identity?identity.label:'';
    const identitySize=fitFont(ctx,identityText,infoWidth-34,19,12,700);
    ctx.font=`700 ${identitySize}px sans-serif`;
    const identityWidth=Math.min(infoWidth,Math.max(150,ctx.measureText(identityText).width+34));
    fillRound(ctx,infoX,382,identityWidth,43,14,rgba(theme.accent2,.13));
    strokeRound(ctx,infoX,382,identityWidth,43,14,rgba(theme.accent2,.42),2);
    ctx.fillStyle=theme.accent2;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(identityText,infoX+identityWidth/2,404);

    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#d8d1e6';
    const taglineSize=fitFont(ctx,p[1],infoWidth*2.5,27,20,600);
    ctx.font=`600 ${taglineSize}px sans-serif`;
    wrapText(ctx,p[1],infoX,478,infoWidth,40,3);

    ctx.fillStyle='#8e86a5';
    const record=tr('cardRecord',{name:cardOwner(state.name)});
    const recordSize=fitFont(ctx,record,infoWidth,21,13,600);
    ctx.font=`600 ${recordSize}px sans-serif`;
    ctx.fillText(record,infoX,628);

    ctx.textAlign='left';
    ctx.fillStyle='#fff8e8';
    const dimensionsSize=fitFont(ctx,tr('cardDimensions'),480,28,18,900);
    ctx.font=`900 ${dimensionsSize}px sans-serif`;
    ctx.fillText(tr('cardDimensions'),78,746);
    ctx.fillStyle='#81799a';
    const noteSize=fitFont(ctx,tr('cardDimensionNote'),410,18,12,600);
    ctx.font=`600 ${noteSize}px sans-serif`;
    ctx.textAlign='right';
    ctx.fillText(tr('cardDimensionNote'),1002,746);

    ['EI','SN','TF','JP','AT'].forEach((key,index)=>drawDimension(ctx,key,78,797+index*66,924,theme));

    ctx.textAlign='left';
    ctx.fillStyle='#81799a';
    const keywordSize=fitFont(ctx,tr('cardKeywords'),500,18,12,800);
    ctx.font=`800 ${keywordSize}px sans-serif`;
    ctx.fillText(tr('cardKeywords'),78,1137);
    const tags=p[3].split(',').slice(0,3);
    const tagWidth=(924-32)/3;
    tags.forEach((tag,index)=>drawTag(ctx,tag,78+index*(tagWidth+16),1156,tagWidth,theme.accent));

    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
    ctx.fillStyle='#81799a';
    const disclaimerSize=fitFont(ctx,tr('cardDisclaimer'),560,18,11,600);
    ctx.font=`600 ${disclaimerSize}px sans-serif`;
    ctx.fillText(tr('cardDisclaimer'),78,1264);
    ctx.textAlign='right';
    ctx.fillStyle=theme.accent;
    ctx.font='800 18px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    ctx.fillText('xieyaozhong.github.io/MBTI',1002,1264);

    downloadCanvas(canvas,`${cardOwner(state.name)}-${fullType}-${tr('cardFileSuffix')}.png`);
    toast(tr('cardDownloaded'));
  }

  card=fullCard;
  const button=document.querySelector('#download');
  if(button)button.onclick=fullCard;
})();
