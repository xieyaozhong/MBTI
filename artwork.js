(() => {
  const CHARACTERS = {
    INTJ:{accent:'#765df8',hair:'#302243',skin:'#f2bd91',coat:'#171125',prop:'stars'},
    INTP:{accent:'#44bdec',hair:'#d9dde5',skin:'#f0c39c',coat:'#26313b',prop:'flask'},
    ENTJ:{accent:'#e84f87',hair:'#231b2d',skin:'#e9b78e',coat:'#24151f',prop:'staff'},
    ENTP:{accent:'#ff8b3d',hair:'#684027',skin:'#f0bd91',coat:'#2b211b',prop:'spark'},
    INFJ:{accent:'#9a5de2',hair:'#493652',skin:'#efc09c',coat:'#21172b',prop:'moon'},
    INFP:{accent:'#62c483',hair:'#6b4433',skin:'#f2c59f',coat:'#203025',prop:'leaf'},
    ENFJ:{accent:'#ff6868',hair:'#4c2c2c',skin:'#efb88f',coat:'#301d21',prop:'sun'},
    ENFP:{accent:'#ffd166',hair:'#7a4d26',skin:'#f3c18f',coat:'#332718',prop:'rainbow'},
    ISTJ:{accent:'#557a95',hair:'#222b35',skin:'#e6b58c',coat:'#1d2833',prop:'clock'},
    ISFJ:{accent:'#f4a261',hair:'#704834',skin:'#f2c5a0',coat:'#3a2a20',prop:'lantern'},
    ESTJ:{accent:'#3985f5',hair:'#3b2923',skin:'#edba91',coat:'#17263b',prop:'clipboard'},
    ESFJ:{accent:'#ff70a6',hair:'#714531',skin:'#f2c39b',coat:'#35202d',prop:'flower'},
    ISTP:{accent:'#778da9',hair:'#bbc1c9',skin:'#e8b68c',coat:'#23272c',prop:'wrench'},
    ISFP:{accent:'#90be6d',hair:'#72503a',skin:'#f0c39d',coat:'#293224',prop:'palette'},
    ESTP:{accent:'#ef476f',hair:'#563522',skin:'#efb88d',coat:'#352027',prop:'bolt'},
    ESFP:{accent:'#00bbf9',hair:'#5e3a28',skin:'#f2bd91',coat:'#182b36',prop:'mic'}
  };

  const THEMES = {
    NT:{accent:'#a78bfa',dark:'#171126'},
    NF:{accent:'#78c96b',dark:'#102217'},
    SJ:{accent:'#68a5ef',dark:'#0d1b2c'},
    SP:{accent:'#e8b448',dark:'#241807'}
  };

  const groupOf = type => type[1] === 'N' ? (type[2] === 'T' ? 'NT' : 'NF') : (type[3] === 'J' ? 'SJ' : 'SP');
  const rect = (ctx,x,y,w,h,color) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,h); };

  function pixelBackground(ctx, type, profile) {
    const theme = THEMES[groupOf(type)];
    rect(ctx,0,0,32,32,theme.dark);
    rect(ctx,1,1,30,30,'#0a0811');
    for(let i=0;i<32;i+=4){
      rect(ctx,i,0,1,32,`${theme.accent}18`);
      rect(ctx,0,i,32,1,`${theme.accent}18`);
    }
    const seed = [...type].reduce((sum,ch)=>sum+ch.charCodeAt(0),0);
    for(let i=0;i<18;i++){
      const x=(seed*(i+3)*7+i*11)%30+1;
      const y=(seed*(i+5)*5+i*13)%30+1;
      rect(ctx,x,y,i%4===0?2:1,1,i%3===0?profile.accent:'#fff3b055');
    }
    rect(ctx,2,2,7,1,profile.accent);
    rect(ctx,2,3,1,5,profile.accent);
    rect(ctx,23,29,7,1,profile.accent);
    rect(ctx,29,24,1,5,profile.accent);
  }

  function face(ctx, type, p) {
    rect(ctx,12,7,8,7,p.skin);
    rect(ctx,11,8,1,5,p.skin);
    rect(ctx,20,8,1,5,p.skin);
    rect(ctx,13,10,1,1,'#17121d');
    rect(ctx,18,10,1,1,'#17121d');
    if(type[0] === 'E'){
      rect(ctx,15,13,3,1,'#9f5d58');
      rect(ctx,16,14,1,1,'#eeb9a4');
    } else {
      rect(ctx,15,13,2,1,'#a66d66');
    }
  }

  function hair(ctx, type, p) {
    rect(ctx,11,5,10,3,p.hair);
    rect(ctx,10,7,3,5,p.hair);
    rect(ctx,19,7,3,5,p.hair);
    rect(ctx,13,4,2,2,p.hair);
    rect(ctx,17,4,2,2,p.hair);
    if(type[1] === 'N'){
      rect(ctx,10,6,2,2,p.hair);
      rect(ctx,20,5,2,3,p.hair);
      rect(ctx,15,3,2,2,p.hair);
    } else {
      rect(ctx,12,4,8,2,p.hair);
    }
    rect(ctx,13,7,2,1,p.hair);
    rect(ctx,18,7,2,1,p.hair);
    rect(ctx,15,6,2,1,p.hair);
  }

  function body(ctx, type, p) {
    const extrovert = type[0] === 'E';
    const judging = type[3] === 'J';
    const intuitive = type[1] === 'N';

    rect(ctx,10,15,12,9,p.coat);
    rect(ctx,12,15,8,7,'#17141c');
    rect(ctx,15,15,2,7,'#f2eee4');
    rect(ctx,10,16,2,7,p.accent);
    rect(ctx,20,16,2,7,p.accent);
    rect(ctx,12,17,8,1,p.accent);
    rect(ctx,15,19,2,1,p.accent);
    rect(ctx,12,22,8,2,'#17121b');
    rect(ctx,15,22,2,2,p.accent);

    if(intuitive){
      rect(ctx,8,16,2,10,p.coat);
      rect(ctx,22,16,2,10,p.coat);
      rect(ctx,7,20,2,7,p.accent);
      rect(ctx,23,20,2,7,p.accent);
    } else {
      rect(ctx,9,17,2,7,p.coat);
      rect(ctx,21,17,2,7,p.coat);
    }

    const armY=extrovert?16:18;
    rect(ctx,7,armY,4,3,p.coat);
    rect(ctx,21,armY,4,3,p.coat);
    rect(ctx,6,armY+1,2,2,p.skin);
    rect(ctx,24,armY+1,2,2,p.skin);
    if(extrovert){
      rect(ctx,5,15,3,2,p.coat);
      rect(ctx,24,14,2,3,p.coat);
      rect(ctx,26,13,2,2,p.skin);
    }

    rect(ctx,12,24,3,5,'#24212a');
    rect(ctx,17,24,3,5,'#24212a');
    rect(ctx,11,28,4,2,'#17131a');
    rect(ctx,17,28,4,2,'#17131a');
    rect(ctx,12,27,3,1,p.accent);
    rect(ctx,17,27,3,1,p.accent);

    if(judging){
      rect(ctx,9,15,2,2,'#c89d54');
      rect(ctx,21,15,2,2,'#c89d54');
      rect(ctx,14,16,4,1,'#c89d54');
    } else {
      rect(ctx,11,23,10,1,'#8a633f');
      rect(ctx,9,22,2,3,'#6f4b32');
    }
  }

  function drawProp(ctx, kind, accent) {
    switch(kind){
      case 'stars':
        rect(ctx,24,8,1,5,'#b69cff'); rect(ctx,22,9,5,1,'#b69cff');
        rect(ctx,25,6,1,1,'#fff'); rect(ctx,27,11,1,1,'#fff'); rect(ctx,22,13,1,1,'#fff');
        break;
      case 'flask':
        rect(ctx,25,7,2,2,'#e8f7ff'); rect(ctx,24,9,4,1,'#cdeeff'); rect(ctx,23,10,6,5,'#dff7ff');
        rect(ctx,24,12,4,3,accent); rect(ctx,25,11,2,1,'#fff');
        break;
      case 'staff':
        rect(ctx,26,7,1,17,'#b98b52'); rect(ctx,24,6,5,1,'#dcb06a'); rect(ctx,25,4,3,3,accent); rect(ctx,26,3,1,1,'#fff');
        break;
      case 'spark':
        rect(ctx,25,7,1,3,accent); rect(ctx,24,9,2,1,accent); rect(ctx,23,10,2,3,accent); rect(ctx,22,12,2,1,'#fff1a8'); rect(ctx,27,8,1,1,'#fff');
        break;
      case 'moon':
        rect(ctx,24,6,4,1,accent); rect(ctx,23,7,2,4,accent); rect(ctx,24,11,4,1,accent); rect(ctx,26,8,2,3,'#0a0811');
        break;
      case 'leaf':
        rect(ctx,24,7,1,7,'#7bcf77'); rect(ctx,25,7,3,2,'#9be38f'); rect(ctx,22,10,3,2,'#66b565'); rect(ctx,26,12,2,2,'#9be38f');
        break;
      case 'sun':
        rect(ctx,24,7,4,4,accent); rect(ctx,25,6,2,1,'#ffd9a0'); rect(ctx,25,11,2,1,'#ffd9a0'); rect(ctx,23,8,1,2,'#ffd9a0'); rect(ctx,28,8,1,2,'#ffd9a0');
        break;
      case 'rainbow':
        rect(ctx,22,8,6,1,'#ff6868'); rect(ctx,23,9,5,1,'#ffd166'); rect(ctx,24,10,4,1,'#62c483'); rect(ctx,25,11,3,1,'#44bdec');
        break;
      case 'clock':
        rect(ctx,23,7,6,6,'#c99b55'); rect(ctx,24,8,4,4,'#d9ecff'); rect(ctx,26,9,1,3,'#557a95'); rect(ctx,26,10,2,1,'#557a95');
        break;
      case 'lantern':
        rect(ctx,24,7,4,1,'#aa7444'); rect(ctx,23,8,6,6,'#82552f'); rect(ctx,24,9,4,4,'#ffcf72'); rect(ctx,25,10,2,2,'#fff3ad');
        break;
      case 'clipboard':
        rect(ctx,23,6,6,9,'#815d3b'); rect(ctx,24,7,4,7,'#d9e9f8'); rect(ctx,25,8,2,1,accent); rect(ctx,25,10,3,1,'#7292ad'); rect(ctx,25,12,2,1,'#7292ad');
        break;
      case 'flower':
        rect(ctx,25,10,1,5,'#6fbf67'); rect(ctx,23,7,2,2,accent); rect(ctx,26,7,2,2,accent); rect(ctx,24,8,3,3,'#ffd166');
        break;
      case 'wrench':
        rect(ctx,24,7,2,7,'#aab4c0'); rect(ctx,23,6,4,2,'#d6dce2'); rect(ctx,24,13,2,2,'#6d7782');
        break;
      case 'palette':
        rect(ctx,22,8,7,5,'#b88a55'); rect(ctx,23,9,5,3,'#d6aa70'); rect(ctx,24,9,1,1,'#ff6868'); rect(ctx,26,9,1,1,'#ffd166'); rect(ctx,25,11,1,1,'#62c483');
        break;
      case 'bolt':
        rect(ctx,25,6,2,3,accent); rect(ctx,24,8,2,3,accent); rect(ctx,23,10,2,4,accent); rect(ctx,25,10,2,1,'#fff1a8');
        break;
      case 'mic':
        rect(ctx,24,6,4,4,'#d5e9f1'); rect(ctx,25,7,2,2,accent); rect(ctx,25,10,2,7,'#8a6c4c'); rect(ctx,24,16,4,1,'#c79b57');
        break;
    }
  }

  function renderSprite(ctx, type) {
    const p=CHARACTERS[type];
    pixelBackground(ctx,type,p);
    rect(ctx,9,29,14,1,'#0008');
    body(ctx,type,p);
    face(ctx,type,p);
    hair(ctx,type,p);
    drawProp(ctx,p.prop,p.accent);
    rect(ctx,3,27,3,1,p.accent);
    rect(ctx,4,26,1,3,p.accent);
    rect(ctx,27,3,2,1,p.accent);
  }

  function paint(canvas, type) {
    if(!canvas || !CHARACTERS[type]) return false;
    const sprite=document.createElement('canvas');
    sprite.width=sprite.height=32;
    const s=sprite.getContext('2d');
    s.imageSmoothingEnabled=false;
    renderSprite(s,type);

    canvas.width=640;
    canvas.height=640;
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,640,640);
    ctx.drawImage(sprite,0,0,640,640);
    canvas.style.imageRendering='pixelated';
    return true;
  }

  function updateFrame(type) {
    const theme=THEMES[groupOf(type)];
    const frame=document.querySelector('.frame');
    if(!frame || !theme) return;
    frame.style.borderColor=theme.accent;
    frame.style.boxShadow=`0 0 0 2px ${theme.dark}, 8px 8px #070611, 0 0 28px ${theme.accent}55`;
  }

  const originalResult=result;
  result=function pixelResult(){
    originalResult();
    updateFrame(state.type);
    paint(document.querySelector('#avatar'),state.type);
  };
})();