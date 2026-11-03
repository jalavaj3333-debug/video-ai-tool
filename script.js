// ============ استوديو الأنيميشن الكرتوني 🎬 ============
const $ = id => document.getElementById(id);
const promptInput=$('promptInput'), numImagesInput=$('numImagesInput'), durationInput=$('durationInput');
const generateBtn=$('generateBtn'), createVideoBtn=$('createVideoBtn');
const status=$('status'), imagesPreview=$('imagesPreview'), outputCanvas=$('outputCanvas'), downloadLink=$('downloadLink');

const mg=$('musicToggle'); if(mg) mg.closest('.input-group').style.display='none';
const h1=document.querySelector('h1'); if(h1) h1.textContent='🎬 استوديو الأنيميشن الكرتوني';
const sub=document.querySelector('.subtitle'); if(sub) sub.textContent='شخصيات كرتونية بحال ديزني: ألوان، outlines، تعبيرات، squash & stretch';

const ctx=outputCanvas.getContext('2d');
let MODE='local';
let world=null, shots=[], aiImages=[];
let mediaRecorder=null, recordedChunks=[], stopReq=false, globalT=0;

// ===== زر الوضع =====
const modeBox=document.createElement('div');
modeBox.style.cssText='display:flex;gap:8px;margin-top:10px;';
const mkBtn=(txt,on)=>{const b=document.createElement('button');b.textContent=txt;b.style.cssText=`flex:1;padding:10px;border:none;border-radius:6px;font-weight:bold;cursor:pointer;background:${on?'#03dac6':'#2c2c2c'};color:${on?'#000':'#bbb'}`;return b;};
const bLocal=mkBtn('🎬 كرتون محلي (فوري)',true);
const bAI=mkBtn('🖼️ واقعي AI (بطيء)',false);
bLocal.onclick=()=>{MODE='local';bLocal.style.background='#03dac6';bLocal.style.color='#000';bAI.style.background='#2c2c2c';bAI.style.color='#bbb';status.textContent='🎬 وضع كرتون: شخصيات ملونة بoutlines، فوري وبلا إنترنت.';};
bAI.onclick=()=>{MODE='ai';bAI.style.background='#03dac6';bAI.style.color='#000';bLocal.style.background='#2c2c2c';bLocal.style.color='#bbb';status.textContent='🖼️ وضع AI: صور حقيقية، صبر ~48 ثانية بين كل صورة.';};
modeBox.append(bLocal,bAI);
document.querySelector('.buttons').after(modeBox);

// ===== أدوات =====
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R=(r,a,b)=>a+(b-a)*r();
const RI=(r,a,b)=>Math.floor(R(r,a,b+1));
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
const ease=t=>t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const OUT='#1a1208'; // لون الoutline الكرتوني

// ===== رسم شكل كرتوني (fill + outline) =====
function toon(g,fn,fill,lw=2.4){
  g.lineJoin='round'; g.lineCap='round';
  fn(); g.fillStyle=fill; g.fill();
  g.strokeStyle=OUT; g.lineWidth=lw; g.stroke();
}
// تظليل بسيط (highlight فوق / shadow تحت)
function shade(g,cx,cy,rx,ry,hi,sh){
  const gr=g.createLinearGradient(cx,cy-ry,cx,cy+ry);
  gr.addColorStop(0,hi); gr.addColorStop(0.5,'rgba(0,0,0,0)'); gr.addColorStop(1,sh);
  g.fillStyle=gr; g.beginPath(); g.ellipse(cx,cy,rx,ry,0,0,6.28); g.fill();
}
// عين كرتونية (بـ blink)
function toonEye(g,x,y,r,blink,lookX=0){
  toon(g,()=>{g.beginPath();g.ellipse(x,y,r*0.8,r,0,0,6.28);},' #ffffff',1.6);
  if(blink>0.5){ // مغمضة
    g.strokeStyle=OUT; g.lineWidth=1.8; g.beginPath(); g.moveTo(x-r*0.7,y); g.quadraticCurveTo(x,y+r*0.4,x+r*0.7,y); g.stroke();
    return;
  }
  toon(g,()=>{g.beginPath();g.arc(x+lookX*r*0.3,y+r*0.1,r*0.5,0,6.28);},'#2a1a0a',1.2);
  g.fillStyle='#fff'; g.beginPath(); g.arc(x+lookX*r*0.3-r*0.18,y-r*0.05,r*0.18,0,6.28); g.fill();
  g.globalAlpha=0.5; g.beginPath(); g.arc(x+lookX*r*0.3+r*0.12,y+r*0.25,r*0.1,0,6.28); g.fill(); g.globalAlpha=1;
}

// ===== palettes كرتونية للشخصيات =====
const PAL={
  lion:{body:'#e8a33d',belly:'#f7d9a0',mane:'#b5651d',maneHi:'#d98a3d',nose:'#5a2d0c'},
  quadruped:{body:'#9c6b3f',belly:'#c99a6b',nose:'#3a2410'},
  elephant:{body:'#9a9aa8',belly:'#c2c2cc',nose:'#7a7a88'},
  person:{body:'#4a7fc4',skin:'#f2c9a0',hair:'#3a2410'},
  astronaut:{body:'#eef0f6',visor:'#2a4a6a',pack:'#c0c4d0'},
  bird:{body:'#3a6ea5',beak:'#f4a82a'},
  eagle:{body:'#5a3a1a',beak:'#f4a82a'},
  fish:{body:'#3aa6c4',fin:'#2a7a94'},
  shark:{body:'#7a8a9a',belly:'#dfe6ec'},
  boat:{body:'#8a5a2a',sail:'#f5f0e0'},
  dragon:{body:'#3a8a4a',wing:'#2a6a3a',belly:'#a8d48a'},
  castle:{body:'#8a8a9a',roof:'#5a3a6a'},
};

// ===== الأسد الكرتوني (المفصل!) =====
function drawLionToon(g,x,y,s,dir,wt,walking){
  const P=PAL.lion;
  const ls=walking?Math.sin(wt*6.28):0, ls2=walking?Math.sin(wt*6.28+3.14):0;
  const bob=walking?Math.abs(Math.sin(wt*6.28))*2:0;
  const sq=walking?1+Math.sin(wt*12.56)*0.04:1; // squash & stretch
  const tail=Math.sin(wt*6.28+1)*0.5+(walking?0:Math.sin(globalT*1.5)*0.2);
  const maneWave=Math.sin(globalT*2)*0.15;
  g.save(); g.translate(x,y-bob); g.scale(dir*s*sq,s/sq); // انعكاس حسب الاتجاه
  // ---- الذيل (خلف الجسم) ----
  g.save(); g.translate(-22,-2); g.rotate(tail*0.5);
  toon(g,()=>{g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-12,-6,-16,-16);g.lineWidth=4;g.strokeStyle=P.body;g.stroke();},P.body,0);
  g.strokeStyle=OUT; g.lineWidth=2; g.beginPath(); g.moveTo(0,0); g.quadraticCurveTo(-12,-6,-16,-16); g.stroke();
  toon(g,()=>{g.beginPath();g.arc(-16,-17,4,0,6.28);},'#3a1f08',1.8); // طرف الذيل أسود
  g.restore();
  // ---- الأرجل الخلفية ----
  const leg=(lx,sw,col)=>{g.save();g.translate(lx,6);g.rotate(sw*0.55);
    toon(g,()=>{g.beginPath();g.roundRect(-3.5,0,7,15,3);},col,2);
    toon(g,()=>{g.beginPath();g.ellipse(0,15,4.5,2.5,0,0,6.28);},P.belly,1.8); // قدم
    g.restore();};
  leg(-13,ls2,'#c98a2e'); leg(9,ls2,'#c98a2e');
  // ---- الجسم ----
  toon(g,()=>{g.beginPath();g.ellipse(-2,-3,24,13,0,0,6.28);},P.body,2.6);
  shade(g,-2,-3,24,13,'rgba(255,240,200,0.35)','rgba(90,40,0,0.25)');
  // بطن فاتح
  g.fillStyle=P.belly; g.globalAlpha=0.7; g.beginPath(); g.ellipse(-2,3,16,6,0,0,6.28); g.fill(); g.globalAlpha=1;
  // ---- الأرجل الأمامية ----
  leg(-6,ls,P.body); leg(14,ls,P.body);
  // ---- mane منفرجة (السر ديال الأسد!) ----
  const mx=17,my=-13,mr=16;
  g.save();
  toon(g,()=>{g.beginPath();
    for(let a=0;a<6.28;a+=0.18){const rr=mr+Math.sin(a*7+globalT*2.5+maneWave*4)*3.2;const px=mx+Math.cos(a)*rr,py=my+Math.sin(a)*rr*1.05;a===0?g.moveTo(px,py):g.lineTo(px,py);}
    g.closePath();},P.mane,2.6);
  // highlights فالmane
  g.fillStyle=P.maneHi; g.globalAlpha=0.5;
  for(let k=0;k<6;k++){const a=k*1.05+globalT*0.5;g.beginPath();g.ellipse(mx+Math.cos(a)*mr*0.7,my+Math.sin(a)*mr*0.7,3,5,a,0,6.28);g.fill();}
  g.globalAlpha=1; g.restore();
  // ---- الرأس ----
  toon(g,()=>{g.beginPath();g.arc(mx,my,10,0,6.28);},P.body,2.4);
  shade(g,mx,my,10,10,'rgba(255,240,200,0.3)','rgba(90,40,0,0.2)');
  // أذنين
  toon(g,()=>{g.beginPath();g.arc(mx-6,my-8,3.5,0,6.28);},P.mane,1.8);
  toon(g,()=>{g.beginPath();g.arc(mx+4,my-9,3.5,0,6.28);},P.mane,1.8);
  toon(g,()=>{g.beginPath();g.arc(mx-6,my-8,1.8,0,6.28);},P.belly,1);
  toon(g,()=>{g.beginPath();g.arc(mx+4,my-9,1.8,0,6.28);},P.belly,1);
  // ---- الوجه ----
  const blink=(Math.sin(globalT*1.3)>0.97)?1:0; // رمش دوري
  toonEye(g,mx-3,my-1,3,blink,0.3);
  toonEye(g,mx+4,my-1,3,blink,0.3);
  // أنف
  toon(g,()=>{g.beginPath();g.moveTo(mx+0.5,my+3);g.lineTo(mx-2,my+5.5);g.lineTo(mx+3,my+5.5);g.closePath();},P.nose,1.4);
  // فم (ابتسامة كرتونية)
  g.strokeStyle=OUT; g.lineWidth=1.6; g.beginPath();
  g.moveTo(mx+0.5,my+5.5); g.lineTo(mx+0.5,my+7);
  g.quadraticCurveTo(mx-2.5,my+9,mx-4,my+7);
  g.moveTo(mx+0.5,my+7); g.quadraticCurveTo(mx+3,my+9,mx+4.5,my+7); g.stroke();
  // شوارب
  g.strokeStyle='rgba(40,20,5,0.6)'; g.lineWidth=1;
  for(const sy of [my+5,my+6.5]){g.beginPath();g.moveTo(mx-3,sy);g.lineTo(mx-11,sy-1.5);g.stroke();g.beginPath();g.moveTo(mx+4,sy);g.lineTo(mx+12,sy-1.5);g.stroke();}
  g.restore();
}

// ===== شخصية كرتونية عامة (شخص / حيوان رباعي / إلخ) =====
function drawToonHero(g,type,x,y,s,dir,wt,walking){
  if(type==='lion'){drawLionToon(g,x,y,s,dir,wt,walking);return;}
  const P=PAL[type]||PAL.quadruped;
  const ls=walking?Math.sin(wt*6.28):0, ls2=walking?Math.sin(wt*6.28+3.14):0;
  const bob=walking?Math.abs(Math.sin(wt*6.28))*2:0;
  const sq=walking?1+Math.sin(wt*12.56)*0.05:1;
  g.save(); g.translate(x,y-bob); g.scale(dir*s*sq,s/sq);
  g.lineJoin='round'; g.lineCap='round';
  if(type==='person'||type==='astronaut'){
    // أرجل
    const leg=(lx,sw,col)=>{g.save();g.translate(lx,2);g.rotate(sw*0.6);toon(g,()=>{g.beginPath();g.roundRect(-3,0,6,14,2);},col,2);g.restore();};
    leg(-3,ls2,type==='astronaut'?P.pack:'#2a3a5a'); leg(3,ls,type==='astronaut'?P.pack:'#2a3a5a');
    // جسم
    toon(g,()=>{g.beginPath();g.roundRect(-7,-18,14,22,4);},P.body,2.4);
    shade(g,0,-7,7,11,'rgba(255,255,255,0.25)','rgba(0,0,0,0.15)');
    if(type==='astronaut'){toon(g,()=>{g.beginPath();g.roundRect(-11,-16,4,12,2);},P.pack,2);}
    // ذراعين
    g.save();g.translate(-7,-15);g.rotate(ls*0.5);toon(g,()=>{g.beginPath();g.roundRect(-2.5,0,5,11,2);},P.body,2);g.restore();
    g.save();g.translate(7,-15);g.rotate(ls2*0.5);toon(g,()=>{g.beginPath();g.roundRect(-2.5,0,5,11,2);},P.body,2);g.restore();
    // رأس
    toon(g,()=>{g.beginPath();g.arc(0,-24,7,0,6.28);},type==='astronaut'?P.body:P.skin,2.4);
    if(type==='astronaut'){
      toon(g,()=>{g.beginPath();g.arc(1.5,-24,5,0,6.28);},P.visor,2);
      g.fillStyle='rgba(180,220,255,0.7)';g.beginPath();g.arc(3,-25.5,1.8,0,6.28);g.fill();
    } else {
      // شعر
      g.fillStyle=P.hair;g.beginPath();g.arc(0,-26,7,3.3,6.1);g.fill();
      const blink=(Math.sin(globalT*1.3)>0.97)?1:0;
      toonEye(g,-2.5,-24,2.4,blink,0.3); toonEye(g,2.5,-24,2.4,blink,0.3);
      g.strokeStyle=OUT;g.lineWidth=1.3;g.beginPath();g.arc(0,-21,2.5,0.3,2.85);g.stroke(); // فم
    }
  } else if(type==='bird'||type==='eagle'){
    const fl=Math.sin(globalT*9)*0.7;
    // جناحين
    g.save();g.translate(-3,-2);g.rotate(-fl);toon(g,()=>{g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-16,-6,-22,2);g.quadraticCurveTo(-12,4,0,2);},P.body,2);g.restore();
    g.save();g.translate(3,-2);g.rotate(fl);toon(g,()=>{g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(16,-6,22,2);g.quadraticCurveTo(12,4,0,2);},P.body,2);g.restore();
    toon(g,()=>{g.beginPath();g.ellipse(0,0,7,5,0,0,6.28);},P.body,2.2);
    toon(g,()=>{g.beginPath();g.arc(5,-3,3.5,0,6.28);},P.body,2);
    toon(g,()=>{g.beginPath();g.moveTo(8,-3);g.lineTo(13,-2);g.lineTo(8,-1);g.closePath();},P.beak,1.6);
    toonEye(g,4.5,-4,1.8,0,0.3);
  } else if(type==='fish'||type==='shark'){
    const wg=Math.sin(globalT*6)*0.25;
    g.rotate(wg*0.3);
    toon(g,()=>{g.beginPath();g.moveTo(12,0);g.lineTo(22+wg*4,-7);g.lineTo(22+wg*4,7);g.closePath();},type==='shark'?P.body:P.fin,2);
    toon(g,()=>{g.beginPath();g.ellipse(0,0,14,7,0,0,6.28);},P.body,2.4);
    if(type==='shark'){toon(g,()=>{g.beginPath();g.ellipse(0,3,12,4,0,0,6.28);},P.belly,0);}
    else toon(g,()=>{g.beginPath();g.moveTo(-2,-6);g.lineTo(2,-13);g.lineTo(6,-6);g.closePath();},P.fin,2);
    if(type==='shark'){toon(g,()=>{g.beginPath();g.moveTo(-2,-6);g.lineTo(0,-16);g.lineTo(4,-6);g.closePath();},P.body,2);}
    toonEye(g,-7,-2,2.4,0,0.3);
    g.strokeStyle=OUT;g.lineWidth=1.3;g.beginPath();g.arc(-11,1,2,0.2,2.9);g.stroke();
  } else if(type==='boat'){
    const rk=Math.sin(globalT*1.5)*0.06; g.rotate(rk);
    toon(g,()=>{g.beginPath();g.moveTo(-16,0);g.lineTo(16,0);g.lineTo(11,8);g.lineTo(-11,8);g.closePath();},P.body,2.4);
    g.strokeStyle=OUT;g.lineWidth=2.4;g.beginPath();g.moveTo(0,-2);g.lineTo(0,-26);g.stroke();
    toon(g,()=>{g.beginPath();g.moveTo(0,-26);g.quadraticCurveTo(16,-14,12,-2);g.lineTo(0,-2);g.closePath();},P.sail,2);
    toon(g,()=>{g.beginPath();g.moveTo(0,-22);g.quadraticCurveTo(-12,-12,-9,-2);g.lineTo(0,-2);g.closePath();},P.sail,2);
  } else if(type==='dragon'){
    const wn=Math.sin(globalT*5)*0.6;
    g.save();g.translate(-4,-8);g.rotate(wn);toon(g,()=>{g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-8,-24,8,-28);g.quadraticCurveTo(2,-16,4,0);},P.wing,2.2);g.restore();
    toon(g,()=>{g.beginPath();g.ellipse(0,-2,26,10,0,0,6.28);},P.body,2.6);
    shade(g,0,-2,26,10,'rgba(255,255,255,0.2)','rgba(0,0,0,0.2)');
    g.fillStyle=P.belly;g.globalAlpha=0.8;g.beginPath();g.ellipse(0,3,20,5,0,0,6.28);g.fill();g.globalAlpha=1;
    toon(g,()=>{g.beginPath();g.arc(24,-10,8,0,6.28);},P.body,2.4);
    toon(g,()=>{g.beginPath();g.moveTo(28,-14);g.lineTo(37,-17);g.lineTo(30,-9);g.closePath();},P.wing,2);
    toonEye(g,26,-12,2.6,0,0.3);
    g.strokeStyle=OUT;g.lineWidth=3;g.beginPath();g.moveTo(-24,-2);g.quadraticCurveTo(-38,2,-34,12);g.stroke();
  } else if(type==='elephant'){
    const leg=(lx,sw)=>{g.save();g.translate(lx,8);g.rotate(sw*0.4);toon(g,()=>{g.beginPath();g.roundRect(-4,0,8,16,3);},P.body,2.2);g.restore();};
    leg(-16,ls2);leg(-4,ls);leg(8,ls2);leg(18,ls);
    toon(g,()=>{g.beginPath();g.ellipse(0,-6,28,18,0,0,6.28);},P.body,2.6);
    shade(g,0,-6,28,18,'rgba(255,255,255,0.2)','rgba(0,0,0,0.18)');
    toon(g,()=>{g.beginPath();g.arc(24,-16,11,0,6.28);},P.body,2.4);
    toon(g,()=>{g.beginPath();g.ellipse(16,-14,8,11,0.3,0,6.28);},P.nose,2.2);
    g.strokeStyle=OUT;g.lineWidth=5;g.beginPath();g.moveTo(32,-12);g.quadraticCurveTo(40+Math.sin(globalT*2)*3,-2,36,8);g.stroke();
    toonEye(g,27,-18,2.8,0,0.3);
    g.strokeStyle='#e8e0d0';g.lineWidth=2.5;g.beginPath();g.moveTo(30,-6);g.lineTo(33,2);g.stroke();
  } else if(type==='castle'){
    toon(g,()=>{g.beginPath();g.rect(-22,-20,44,20);},P.body,2.4);
    for(let i=-1;i<=1;i++){toon(g,()=>{g.beginPath();g.rect(i*14-4,-34,8,14);},P.body,2);toon(g,()=>{g.beginPath();g.moveTo(i*14-5,-34);g.lineTo(i*14,-44);g.lineTo(i*14+5,-34);g.closePath();},P.roof,2);}
    g.fillStyle='#2a1a0a';g.fillRect(-3,-12,6,12); // باب
  } else { // quadruped عام
    const leg=(lx,sw,col)=>{g.save();g.translate(lx,6);g.rotate(sw*0.5);toon(g,()=>{g.beginPath();g.roundRect(-2.5,0,5,14,2);},col,2);g.restore();};
    leg(-14,ls2,'#7a5230');leg(14,ls2,'#7a5230');
    toon(g,()=>{g.beginPath();g.ellipse(0,-4,22,11,0,0,6.28);},P.body,2.4);
    shade(g,0,-4,22,11,'rgba(255,255,255,0.2)','rgba(0,0,0,0.18)');
    leg(-4,ls,P.body);leg(6,ls,P.body);
    toon(g,()=>{g.beginPath();g.arc(20,-12,8,0,6.28);},P.body,2.2);
    toon(g,()=>{g.beginPath();g.moveTo(16,-18);g.lineTo(19,-26);g.lineTo(23,-18);g.closePath();},P.body,1.8);
    toon(g,()=>{g.beginPath();g.moveTo(22,-18);g.lineTo(25,-26);g.lineTo(28,-18);g.closePath();},P.body,1.8);
    toonEye(g,22,-13,2.4,0,0.3);
    toon(g,()=>{g.beginPath();g.arc(26,-10,1.6,0,6.28);},P.nose,1.2);
    g.strokeStyle=OUT;g.lineWidth=3;const tl=Math.sin(wt*6.28+1)*0.4;g.beginPath();g.moveTo(-22,-6);g.quadraticCurveTo(-30+tl*6,-14,-26+tl*8,-20);g.stroke();
  }
  g.restore();
}

// ===== تحليل الوصف =====
function analyze(t){
  t=t.toLowerCase(); const has=(...w)=>w.some(x=>t.includes(x));
  let time='day';
  if(has('night','dark','moon','starry','stars','midnight'))time='night';
  else if(has('sunset','golden hour','dusk','evening','golden'))time='sunset';
  else if(has('sunrise','dawn','morning'))time='sunrise';
  let env='nature';
  if(has('city','neon','cyberpunk','street','building','skyscraper','tokyo'))env='city';
  else if(has('ocean','sea','underwater','wave','coral','reef','lake'))env='ocean';
  else if(has('forest','tree','jungle','woods'))env='forest';
  else if(has('desert','savanna','sand','dune','sahara'))env='desert';
  else if(has('space','galaxy','planet','cosmic','mars','nebula'))env='space';
  else if(has('mountain','peak','hill','valley','snow','winter','ice','glacier','alps'))env='mountain';
  else if(has('fire','lava','volcano','ember','burning','hell'))env='fire';
  let part='dust';
  if(has('rain','storm','rainy','drizzle'))part='rain';
  else if(has('snow','winter','ice','frost','blizzard'))part='snow';
  else if(has('fire','ember','spark','volcano','burning'))part='ember';
  else if(time==='night'||env==='space')part='stars';
  else if(env==='ocean')part='bubbles';
  let hero=null;
  if(has('lion'))hero='lion';else if(has('dragon'))hero='dragon';else if(has('elephant'))hero='elephant';
  else if(has('eagle','hawk'))hero='eagle';else if(has('bird','flock'))hero='bird';
  else if(has('astronaut','cosmonaut'))hero='astronaut';else if(has('shark'))hero='shark';else if(has('fish'))hero='fish';
  else if(has('boat','ship','sail','yacht'))hero='boat';else if(has('castle','palace','ruins','tower'))hero='castle';
  else if(has('horse','deer','wolf','fox','animal','cat','cow'))hero='quadruped';
  else if(has('person','man','woman','figure','silhouette','walker','girl','boy'))hero='person';
  const walk=['lion','quadruped','elephant','person','astronaut','dragon'].includes(hero);
  return {time,env,part,hero,walk,raw:t};
}

// ===== العالم الكرتوني =====
function buildWorld(a,prompt){
  const r=rng32(hash(prompt)); const W={a,seed:hash(prompt)};
  // سماوات كرتونية مشبعة
  const skySets={
    day:[['#4aa3e0','#8fd0f5','#cdeeff'],['#3d8fd4','#7ec8f0','#bfe9ff']],
    sunset:[['#5a2d8a','#c44a6a','#ff8c42','#ffd166'],['#3a1f6e','#8a3a7a','#ff6b4a','#ffc46b']],
    sunrise:[['#6a3a8a','#e06a8a','#ffb36b'],['#ff8c5a','#ff6b6b','#ffe29f']],
    night:[['#0a1238','#16265c','#243b7a'],['#0d1545','#1a2f6a','#2a4a8a']]
  };
  const envSky={
    space:[['#0a0028','#1a0050','#2d0070'],['#05001a','#14003d','#240060']],
    fire:[['#3a0a00','#7a1f00','#c43e00'],['#2b0000','#6a1a00','#a83200']],
    ocean:[['#1a6fa8','#2a9fd0','#5ac0e8'],['#0a5c8a','#1e88b8','#3cb0d8']]
  };
  W.sky=envSky[a.env]?pick(r,envSky[a.env]):pick(r,skySets[a.time]||skySets.day);
  // أرض كرتونية مشبعة
  const gs={
    desert:['#e8b85a','#d49a3a'],forest:['#4a9a3a','#2e7d2e'],ocean:['#1a7ab0','#0d5a8a'],
    mountain:['#7a8a9a','#5a6a7a'],city:['#2a2a4a','#1a1a30'],fire:['#5a2400','#3a1500'],
    space:['#2a2a4a','#1a1a30'],nature:['#6aaa3a','#4a8a2a']
  };
  W.ground=pick(r,gs[a.env]||gs.nature); W.ground2=pick(r,gs[a.env]||gs.nature);
  W.hills=[];
  if(['mountain','desert','nature'].includes(a.env)){
    const n=RI(r,3,4);
    for(let L=0;L<n;L++){const pts=[];const seg=RI(r,4,6);const by=0.52+L*0.05;
      for(let s=0;s<=seg;s++)pts.push({x:s/seg,y:by+R(r,-0.05,0.1)});
      W.hills.push({pts,depth:L/n,snow:a.env==='mountain'&&L<2});}
  }
  W.blds=[];
  if(a.env==='city'){for(let k=0;k<16;k++)W.blds.push({x:k/16+R(r,-0.01,0.01),w:R(r,0.04,0.08),h:R(r,0.12,0.45),col:pick(r,['#3a3a5a','#4a3a5a','#3a4a5a','#5a3a4a']),lit:r()<0.8,id:RI(r,1,9999)});}
  W.trees=[];
  if(a.env==='forest'){for(let k=0;k<12;k++)W.trees.push({x:r(),s:R(r,0.5,1),far:r()<0.4,sway:R(r,0.5,1.5),col:pick(r,['#3a8a2a','#2e7d2e','#4a9a3a'])});W.trees.sort((x,y)=>x.s-y.s);}
  W.planets=[];
  if(a.env==='space'){for(let k=0;k<RI(r,2,3);k++)W.planets.push({x:R(r,0.1,0.9),y:R(r,0.08,0.4),rad:R(r,0.05,0.16),col:pick(r,['#ff7043','#ba68c8','#4fc3f7','#ffd54f','#81c784']),ring:r()<0.4});}
  W.volcano=a.env==='fire'?{x:R(r,0.35,0.65),w:R(r,0.28,0.42),h:R(r,0.28,0.4)}:null;
  W.sun=(a.time==='night'||a.env==='space')?null:{x:R(r,0.12,0.88),y:R(r,0.1,0.3),rad:R(r,0.06,0.1)};
  W.moon=(a.time==='night'||a.env==='space')?{x:R(r,0.1,0.9),y:R(r,0.08,0.26),rad:R(r,0.05,0.09)}:null;
  const pn=a.part==='stars'?90:a.part==='rain'?120:a.part==='snow'?90:a.part==='ember'?60:a.part==='bubbles'?40:50;
  W.parts=[];for(let k=0;k<pn;k++)W.parts.push({x:r(),y:r(),sz:R(r,0.6,2.6),sp:R(r,0.3,1.3),tw:r()*6.28,drift:R(r,-1,1)});
  // غيوم كرتونية منفوخة
  W.clouds=[];
  if(['day','sunset','sunrise'].includes(a.time)&&a.env!=='ocean'&&a.env!=='space'){
    for(let k=0;k<RI(r,3,5);k++)W.clouds.push({x:r(),y:R(r,0.08,0.32),w:R(r,0.1,0.22),sp:R(r,0.004,0.01),puffs:RI(r,4,6)});
  }
  W.birds=[];
  if(a.hero==='bird'||a.hero==='eagle'||a.raw.includes('flock')||a.raw.includes('birds')){
    const n=a.hero==='eagle'?1:RI(r,3,6);
    for(let k=0;k<n;k++)W.birds.push({x:r(),y:R(r,0.1,0.35),sp:R(r,0.02,0.05),size:R(r,0.6,1.1),ph:r()*6.28});
  }
  W.fog=a.env!=='space'&&(a.time==='night'||a.env==='ocean'||a.env==='forest'||a.env==='mountain');
  W.wind=a.env==='forest'||a.raw.includes('wind')||a.raw.includes('storm');
  return W;
}
function buildShots(n){
  const cams=[{name:'واسع',zoom:1.0,panX:0,panY:0,heroScale:0.75,heroX:0.62,drift:0.03},
    {name:'متوسط',zoom:1.25,panX:-0.04,panY:0.02,heroScale:1.05,heroX:0.5,drift:0.05},
    {name:'قريب',zoom:1.65,panX:0.05,panY:0.06,heroScale:1.5,heroX:0.42,drift:0.04},
    {name:'معاكس',zoom:1.15,panX:0.12,panY:-0.02,heroScale:0.9,heroX:0.72,drift:0.06},
    {name:'درامي',zoom:1.3,panX:-0.02,panY:0.1,heroScale:1.25,heroX:0.35,drift:0.03}];
  const out=[];for(let i=0;i<n;i++)out.push({...cams[i%cams.length]});return out;
}

// ===== شمس/قمر كرتوني بوجه =====
function drawToonSun(g,cx,cy,rad,isMoon){
  // أشعة مثلثة
  if(!isMoon){
    g.fillStyle='#ffd54f';
    for(let i=0;i<10;i++){const a=i*0.628+globalT*0.2;
      g.save();g.translate(cx,cy);g.rotate(a);
      g.beginPath();g.moveTo(rad*1.15,-rad*0.18);g.lineTo(rad*1.7,0);g.lineTo(rad*1.15,rad*0.18);g.closePath();
      g.fillStyle='#ffca28';g.fill();g.strokeStyle=OUT;g.lineWidth=1.5;g.stroke();g.restore();}
  }
  toon(g,()=>{g.beginPath();g.arc(cx,cy,rad,0,6.28);},isMoon?'#f0f4ff':'#ffe066',2.4);
  shade(g,cx,cy,rad,rad,isMoon?'rgba(255,255,255,0.4)':'rgba(255,255,220,0.5)','rgba(180,120,0,0.15)');
  if(isMoon){g.fillStyle='#c8d4e8';for(let k=0;k<4;k++){const mr=rng32(k+cx);g.beginPath();g.arc(cx+R(mr,-rad*0.5,rad*0.5),cy+R(mr,-rad*0.5,rad*0.5),R(mr,rad*0.1,rad*0.22),0,6.28);g.fill();}}
  // وجه سعيد (السر الكرتوني!)
  const blink=(Math.sin(globalT*0.8)>0.96)?1:0;
  toonEye(g,cx-rad*0.35,cy-rad*0.1,rad*0.22,blink,0);
  toonEye(g,cx+rad*0.35,cy-rad*0.1,rad*0.22,blink,0);
  g.strokeStyle=OUT;g.lineWidth=rad*0.08;g.lineCap='round';
  g.beginPath();g.arc(cx,cy+rad*0.15,rad*0.4,0.3,2.85);g.stroke();
  // خدود
  g.fillStyle='rgba(255,150,150,0.4)';g.beginPath();g.arc(cx-rad*0.5,cy+rad*0.25,rad*0.15,0,6.28);g.arc(cx+rad*0.5,cy+rad*0.25,rad*0.15,0,6.28);g.fill();
}

// ===== شجرة كرتونية =====
function drawToonTree(g,x,y,s,col,sway){
  const sw=Math.sin(globalT*1.2+x*0.05)*sway*2;
  toon(g,()=>{g.beginPath();g.roundRect(x-2.5*s,y-9*s,5*s,9*s,2);},'#7a4a20',2);
  toon(g,()=>{g.beginPath();g.arc(x+sw,y-22*s,11*s,0,6.28);},col,2.4);
  toon(g,()=>{g.beginPath();g.arc(x-7*s+sw*0.7,y-15*s,8*s,0,6.28);},col,2.2);
  toon(g,()=>{g.beginPath();g.arc(x+7*s+sw*0.7,y-15*s,8*s,0,6.28);},col,2.2);
  shade(g,x+sw,y-20*s,11*s,9*s,'rgba(255,255,255,0.25)','rgba(0,0,0,0.15)');
}

// ===== غيمة كرتونية منفوخة =====
function drawToonCloud(g,cx,cy,w,puffs,seed){
  const r=rng32(seed);
  g.save();
  // ظل خفيف تحت
  g.fillStyle='rgba(120,140,180,0.3)';
  for(let p=0;p<puffs;p++){const ox=R(r,-w*0.4,w*0.4),oy=R(r,-w*0.08,w*0.08)+w*0.06,orad=R(r,w*0.18,w*0.32);g.beginPath();g.arc(cx+ox,cy+oy,orad,0,6.28);g.fill();}
  // الجسم الأبيض
  toon(g,()=>{g.beginPath();for(let p=0;p<puffs;p++){const ox=R(r,-w*0.4,w*0.4),oy=R(r,-w*0.1,w*0.05),orad=R(r,w*0.18,w*0.32);g.moveTo(cx+ox+orad,cy+oy);g.arc(cx+ox,cy+oy,orad,0,6.28);}},'#ffffff',2.2);
  g.restore();
}

// ===== الرسم الرئيسي الكرتوني =====
function renderWorld(g,W,cam,ph,w,h){
  g.clearRect(0,0,w,h);g.save();
  const ePh=ease(ph);const zoom=cam.zoom*(1+ePh*0.05);const drift=Math.sin(ePh*Math.PI)*cam.drift;
  const bX=Math.sin(globalT*1.7)*1.0, bY=Math.cos(globalT*1.3)*0.8, rot=Math.sin(globalT*0.7)*0.0012;
  g.translate(w/2+(cam.panX+drift)*w+bX,h/2+cam.panY*h+bY);g.rotate(rot);g.scale(zoom,zoom);g.translate(-w/2,-h/2);
  const a=W.a;
  const dir=W.sun?(W.sun.x<0.5?1:-1):(W.moon?(W.moon.x<0.5?1:-1):1);
  // سماء
  const gr=g.createLinearGradient(0,0,0,h);W.sky.forEach((c,i)=>gr.addColorStop(i/(W.sky.length-1),c));g.fillStyle=gr;g.fillRect(-w,-h,w*3,h*3);
  // سديم فضائي
  if(a.env==='space'){for(let k=0;k<3;k++){const pr=rng32(W.seed+k);const cx=R(pr,0.1,0.9)*w,cy=R(pr,0.05,0.6)*h;const rg=g.createRadialGradient(cx,cy,0,cx,cy,w*0.4);rg.addColorStop(0,'rgba(160,80,220,0.3)');rg.addColorStop(0.5,'rgba(80,50,180,0.15)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);}}
  // نجوم sparkle
  if(a.time==='night'||a.env==='space'){
    W.parts.filter(p=>a.part==='stars').forEach(p=>{const tw=Math.abs(Math.sin(globalT*2+p.tw));const px=p.x*w,py=p.y*h*0.55;
      g.fillStyle=`rgba(255,255,255,${0.4+0.6*tw})`;
      if(p.sz>1.8){ // نجمة بأربعة رؤوس
        g.save();g.translate(px,py);g.rotate(globalT*0.3+p.tw);
        g.beginPath();for(let i=0;i<4;i++){const an=i*1.57;g.lineTo(Math.cos(an)*p.sz*2.2,Math.sin(an)*p.sz*2.2);g.lineTo(Math.cos(an+0.78)*p.sz*0.7,Math.sin(an+0.78)*p.sz*0.7);}g.closePath();g.fill();g.restore();
      } else {g.beginPath();g.arc(px,py,p.sz*0.7,0,6.28);g.fill();}
    });
  }
  // غيوم كرتونية
  W.clouds.forEach(cl=>{const cx=((cl.x+globalT*cl.sp)%1.3-0.15)*w;drawToonCloud(g,cx,cl.y*h,cl.w*w,cl.puffs,W.seed+cl.x*1000);});
  // شمس/قمر
  const cel=W.sun||W.moon;
  if(cel)drawToonSun(g,cel.x*w,cel.y*h,cel.rad*w,!W.sun);
  // كواكب
  W.planets.forEach(p=>{const cx=p.x*w,cy=p.y*h,rad=p.rad*w;
    toon(g,()=>{g.beginPath();g.arc(cx,cy,rad,0,6.28);},p.col,2.4);
    shade(g,cx,cy,rad,rad,'rgba(255,255,255,0.4)','rgba(0,0,0,0.3)');
    if(p.ring){g.strokeStyle=hexA('#ffffff',0.7);g.lineWidth=rad*0.14;g.beginPath();g.ellipse(cx,cy,rad*1.7,rad*0.4,0.3,0,6.28);g.stroke();}});
  const hor=h*0.6;
  // أرض
  if(a.env==='ocean'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    for(let L=0;L<4;L++){const base=hor+L*(h-hor)/4;g.strokeStyle=`rgba(255,255,255,${0.25-L*0.04})`;g.lineWidth=2.5;g.lineCap='round';g.beginPath();
      for(let x=0;x<=w;x+=8){const y=base+Math.sin(x*0.03+globalT*2+L*1.3)*(4+L*2);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  } else if(W.hills.length){
    W.hills.forEach((H,idx)=>{const off=ePh*(6+idx*10)*cam.zoom*0.5;
      const col=idx===W.hills.length-1?W.ground:mix(W.ground,W.ground2,idx/Math.max(1,W.hills.length-1));
      toon(g,()=>{g.beginPath();g.moveTo(-w,h+h);H.pts.forEach(p=>g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();},col,2.6);
      shade(g,w/2,h*0.75,w*0.7,h*0.2,'rgba(255,255,255,0.12)','rgba(0,0,0,0.12)');
      if(H.snow){g.fillStyle='rgba(255,255,255,0.95)';g.beginPath();H.pts.forEach((p,i)=>{const x=p.x*w*1.4-w*0.2-off,y=p.y*h;i===0?g.moveTo(x,y):g.lineTo(x,y);});for(let i=H.pts.length-1;i>=0;i--){const p=H.pts[i];g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h+h*0.025);}g.closePath();g.fill();}});
  } else if(a.env==='city'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    W.blds.forEach(b=>{const bx=b.x*w*1.3-w*0.15-ePh*8,bw=b.w*w,bh=b.h*h;
      toon(g,()=>{g.beginPath();g.rect(bx,hor-bh,bw,bh+h);},b.col,2.4);
      if(b.lit){g.fillStyle='#ffe066';for(let wy=hor-bh+6;wy<hor-4;wy+=9)for(let wx=bx+3;wx<bx+bw-3;wx+=7)if(((wx*97+wy*13+b.id)|0)%100<60){const fk=0.6+0.4*Math.sin(globalT*3+wx+wy);g.globalAlpha=fk;g.fillRect(wx,wy,3,4);g.globalAlpha=1;}}});
  } else if(a.env==='forest'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    W.trees.forEach(t=>{const tx=t.x*w*1.3-w*0.15-ePh*(10+t.s*20),ty=hor+(1-t.s)*h*0.06;drawToonTree(g,tx,ty,t.s*1.1,t.far?mix(t.col,'#aaccaa',0.4):t.col,W.wind?t.sway:0.3);});
  } else if(a.env==='fire'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    const v=W.volcano,vx=v.x*w,vw=v.w*w,vh=v.h*h;
    toon(g,()=>{g.beginPath();g.moveTo(vx-vw,hor+30);g.lineTo(vx,hor-vh);g.lineTo(vx+vw,hor+30);g.closePath();},'#4a2810',2.6);
    const pu=0.7+0.3*Math.sin(globalT*2);
    g.fillStyle=`rgba(255,120,0,${0.9*pu})`;g.beginPath();g.arc(vx,hor-vh,vw*0.25,0,6.28);g.fill();
    g.strokeStyle='#ff5500';g.lineWidth=3;g.lineCap='round';const hr=rng32(W.seed+5);
    for(let k=0;k<3;k++){g.beginPath();let lx=vx+R(hr,-vw*0.2,vw*0.2),ly=hor-vh*0.9;g.moveTo(lx,ly);for(let s=0;s<5;s++){lx+=R(hr,-10,10);ly+=vh*0.16;g.lineTo(lx,ly);}g.stroke();}
  } else {
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    shade(g,w/2,hor+ (h-hor)/2,w*0.6,(h-hor)/2,'rgba(255,255,255,0.12)','rgba(0,0,0,0.12)');
  }
  // البطل الكرتوني
  if(a.hero){
    let hx=cam.heroX*w,yy=hor-2;
    if(a.hero==='bird'||a.hero==='eagle')yy=h*0.22+Math.sin(globalT*1.5)*6;
    if(a.hero==='fish'||a.hero==='shark')yy=hor+(h-hor)*0.45+Math.sin(globalT*1.2)*4;
    if(a.hero==='boat')yy=hor+6;
    if(a.hero==='astronaut'&&a.env==='space')yy=h*0.7;
    if(a.walk&&a.hero!=='astronaut')hx=((cam.heroX+ePh*0.12)%1.1)*w;
    drawToonHero(g,a.hero,hx,yy,cam.heroScale,dir,(globalT*0.8)%1,a.walk);
  }
  // طيور
  W.birds.forEach(b=>{const bx=((b.x+globalT*b.sp)%1.2-0.1)*w,by=b.y*h+Math.sin(globalT*1.2+b.ph)*8;drawToonHero(g,'bird',bx,by,b.size,dir,0,false);});
  // ضباب
  if(W.fog){for(let L=0;L<2;L++){const fy=hor-8+L*16;const fgr=g.createLinearGradient(0,fy-18,0,fy+18);fgr.addColorStop(0,'rgba(0,0,0,0)');fgr.addColorStop(0.5,hexA(a.time==='night'?'#334':'#dde',0.22-L*0.06));fgr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fgr;g.fillRect(0,fy-18,w,36);}}
  // جسيمات (مطر/ثلج/شرر/فقاعات)
  g.save();
  W.parts.filter(p=>a.part!=='stars').forEach(p=>{const px=p.x*w,sp=p.sp;
    if(a.part==='rain'){const y=((p.y+globalT*sp*0.6)%1)*h;g.strokeStyle='rgba(180,210,255,0.8)';g.lineWidth=2;g.lineCap='round';g.beginPath();g.moveTo(px,y);g.lineTo(px-4,y+13);g.stroke();}
    else if(a.part==='snow'){const y=((p.y+globalT*sp*0.15)%1)*h;const x=px+Math.sin(globalT*1.5+p.tw)*12*p.drift;g.fillStyle='#fff';g.strokeStyle='rgba(150,170,200,0.5)';g.lineWidth=0.8;g.beginPath();g.arc(x,y,p.sz,0,6.28);g.fill();g.stroke();}
    else if(a.part==='ember'){const y=((p.y-globalT*sp*0.25)%1+1)%1*h;const x=px+Math.sin(globalT*2+p.tw)*10*p.drift;g.globalAlpha=Math.max(0,1-y/h);g.fillStyle=pick(rng32((p.tw*100)|0),['#ff6d00','#ffd54f','#ff3d00']);g.beginPath();g.arc(x,y,p.sz,0,6.28);g.fill();g.globalAlpha=1;}
    else if(a.part==='bubbles'){const y=((p.y-globalT*sp*0.2)%1+1)%1*h;const x=px+Math.sin(globalT*1.5+p.tw)*7*p.drift;g.strokeStyle='rgba(220,255,255,0.8)';g.lineWidth=1.4;g.beginPath();g.arc(x,y,p.sz+1.5,0,6.28);g.stroke();g.fillStyle='rgba(255,255,255,0.3)';g.beginPath();g.arc(x-p.sz*0.3,y-p.sz*0.3,p.sz*0.4,0,6.28);g.fill();}
    else{const y=((p.y+globalT*sp*0.04)%1)*h;const x=px+Math.sin(globalT+p.tw)*18*p.drift;g.globalAlpha=0.3;g.fillStyle='#fff';g.beginPath();g.arc(x,y,p.sz*0.7,0,6.28);g.fill();g.globalAlpha=1;}});
  g.restore();
  g.restore();
  // ما بعد المعالجة الكرتوني
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,40,0.4)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.07;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== AI helpers =====
function wait(sec,msg){return new Promise(res=>{let l=sec;const tick=()=>{status.textContent=`${msg} (${l})`;if(l<=0||stopReq){res();return;}l--;setTimeout(tick,1000);};tick();});}
function loadImageTO(url,ms=90000){return new Promise((res,rej)=>{const img=new Image();img.crossOrigin='anonymous';const t=setTimeout(()=>{img.src='';rej(new Error('timeout'));},ms);img.onload=()=>{clearTimeout(t);res(img);};img.onerror=()=>{clearTimeout(t);rej(new Error('fail'));};img.src=url;});}
function isPlaceholder(img){try{const c=document.createElement('canvas');c.width=32;c.height=32;const x=c.getContext('2d');x.drawImage(img,0,0,32,32);const d=x.getImageData(0,0,32,32).data;const tot=32*32;let y=0,p=0;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(r>225&&g>175&&b<160)y++;if(r>225&&g>175&&b>=160&&b<235)p++;}return y/tot>0.45||p/tot>0.45;}catch(e){return false;}}
function drawCover(g,img,w,h){const ir=img.width/img.height,cr=w/h;let dx=0,dy=0,dw=w,dh=h;if(ir>cr){dw=img.height*cr;dx=(img.width-dw)/2;}else{dh=img.width/cr;dy=(img.height-dh)/2;}g.drawImage(img,dx,dy,dw,dh,0,0,w,h);}

// ===== 1) توليد =====
generateBtn.addEventListener('click',async()=>{
  const prompt=promptInput.value.trim();const n=parseInt(numImagesInput.value)||4;
  if(!prompt){alert('اكتب وصفاً أولاً');return;}
  stopReq=false;downloadLink.style.display='none';imagesPreview.innerHTML='';aiImages=[];
  generateBtn.disabled=true;createVideoBtn.disabled=true;
  if(MODE==='ai'){
    status.textContent='🖼️ وضع AI: صبر ~48 ثانية بين كل صورة...';
    for(let i=0;i<n;i++){
      if(stopReq)break;
      if(i>0)await wait(48,'⏳ الحد المجاني، صبر... باقي');
      if(stopReq)break;
      status.textContent=`🖼️ جاري توليد المشهد ${i+1}/${n}...`;
      const url=`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Date.now()+i}`;
      let got=null;
      for(let att=1;att<=3&&!got&&!stopReq;att++){
        try{const img=await loadImageTO(url);if(!isPlaceholder(img)){got=img;}else{status.textContent=`⚠️ مشهد ${i+1} مزيف (محاولة ${att}/3)...`;if(att<3)await wait(48,'⏳ باقي');}}
        catch(e){status.textContent=`⚠️ خطأ ${i+1}، محاولة ${att}/3...`;if(att<3)await wait(20,'⏳');}}
      if(got){aiImages.push(got);const el=document.createElement('img');el.src=got.src;imagesPreview.appendChild(el);}
    }
    status.textContent=`🏁 AI: ${aiImages.length}/${n} صورة جاهزة.`;
    generateBtn.disabled=false;if(aiImages.length>0)createVideoBtn.disabled=false;
  } else {
    const a=analyze(prompt);world=buildWorld(a,prompt);shots=buildShots(n);
    shots.forEach(cam=>{const tc=document.createElement('canvas');tc.width=180;tc.height=101;renderWorld(tc.getContext('2d'),world,cam,0.4,180,101);const el=document.createElement('img');el.src=tc.toDataURL();el.title='لقطة: '+cam.name;imagesPreview.appendChild(el);});
    status.textContent=`✅ ${n} لقطات كرتونية! (بيئة:${a.env} · وقت:${a.time} · بطل:${a.hero||'—'}).`;
    generateBtn.disabled=false;createVideoBtn.disabled=false;
  }
});

// ===== 2) تسجيل =====
createVideoBtn.addEventListener('click',()=>{
  const isAI=MODE==='ai'&&aiImages.length>0;
  if(!isAI&&(!world||!shots.length))return;
  recordedChunks=[];stopReq=false;createVideoBtn.disabled=true;
  const dur=parseInt(durationInput.value)||2,fps=30;
  const list=isAI?aiImages:shots;
  const per=dur*fps,total=list.length*per;let fr=0;globalT=0;
  status.textContent=isAI?'🖼️ تسجيل الفيديو الواقعي...':'🎬 تسجيل الفيديو الكرتوني...';
  const stream=outputCanvas.captureStream(fps);
  let mime='video/webm; codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  mediaRecorder=new MediaRecorder(stream,{mimeType:mime});
  mediaRecorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
  mediaRecorder.onstop=()=>{const blob=new Blob(recordedChunks,{type:'video/webm'});const u=URL.createObjectURL(blob);downloadLink.href=u;downloadLink.download=isAI?'realistic-video.webm':'cartoon-video.webm';downloadLink.style.display='inline-block';status.textContent='✅ الفيديو جاهز! حمّلو من الزر الأخضر 🎬';createVideoBtn.disabled=false;};
  mediaRecorder.start();
  (function loop(){
    if(stopReq||fr>=total){mediaRecorder.stop();return;}
    globalT=fr/fps;
    const idx=Math.min(Math.floor(fr/per),list.length-1),lp=(fr%per)/per,e=ease(lp);
    const w=outputCanvas.width,h=outputCanvas.height;
    if(isAI){
      ctx.clearRect(0,0,w,h);ctx.save();
      const z=1+e*0.12,panX=Math.sin(e*Math.PI)*w*0.03*(idx%2?1:-1);
      ctx.translate(w/2+panX,h/2);ctx.scale(z,z);ctx.translate(-w/2,-h/2);
      drawCover(ctx,list[idx],w,h);ctx.restore();
      if(idx<list.length-1&&lp>0.82){const t=(lp-0.82)/0.18;ctx.save();ctx.globalAlpha=t*t*(3-2*t);drawCover(ctx,list[idx+1],w,h);ctx.restore();}
      ctx.fillStyle='#0a0812';const lb=h*0.07;ctx.fillRect(0,0,w,lb);ctx.fillRect(0,h-lb,w,lb);
    } else {
      renderWorld(ctx,world,shots[idx],lp,w,h);
      if(idx<shots.length-1&&lp>0.82){const t=(lp-0.82)/0.18;ctx.save();ctx.globalAlpha=t*t*(3-2*t);renderWorld(ctx,world,shots[idx+1],0,w,h);ctx.restore();}
    }
    fr++;if(fr%6===0)status.textContent=`${isAI?'🖼️':'🎬'} إطار ${fr}/${total} — مشهد ${idx+1}/${list.length}`;
    requestAnimationFrame(loop);
  })();
});

const sb=document.createElement('button');sb.textContent='⏹️ إيقاف';
sb.style.cssText='margin-top:8px;padding:10px;border:none;border-radius:6px;background:#cf6679;color:#000;font-weight:bold;cursor:pointer;width:100%;';
sb.onclick=()=>{stopReq=true;status.textContent='⏹️ تم الإيقاف.';};
document.querySelector('.buttons').after(sb);
