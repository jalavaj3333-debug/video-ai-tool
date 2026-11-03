// ============ استوديو الفيديو السينمائي — واقعي ومتناسق ============
const $ = id => document.getElementById(id);
const promptInput=$('promptInput'), numImagesInput=$('numImagesInput'), durationInput=$('durationInput');
const generateBtn=$('generateBtn'), createVideoBtn=$('createVideoBtn');
const status=$('status'), imagesPreview=$('imagesPreview'), outputCanvas=$('outputCanvas'), downloadLink=$('downloadLink');

const mg=$('musicToggle'); if(mg) mg.closest('.input-group').style.display='none';
const h1=document.querySelector('h1'); if(h1) h1.textContent='🎬 استوديو الفيديو السينمائي';
const sub=document.querySelector('.subtitle'); if(sub) sub.textContent='وصف واحد → لقطات متناسقة من نفس العالم، بإضاءة واقعية';

const ctx=outputCanvas.getContext('2d');
let world=null, shots=[], mediaRecorder=null, recordedChunks=[], stopReq=false;

// ===== عشوائية بذرة ثابتة =====
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R=(r,a,b)=>a+(b-a)*r();
const RI=(r,a,b)=>Math.floor(R(r,a,b+1));
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function mix(c1,c2,t){const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 const r=Math.round(((a>>16)&255)+(((b>>16)&255)-((a>>16)&255))*t);
 const g=Math.round(((a>>8)&255)+(((b>>8)&255)-((a>>8)&255))*t);
 const bl=Math.round((a&255)+((b&255)-(a&255))*t);return `rgb(${r},${g},${bl})`;}

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
  if(has('lion'))hero='lion';
  else if(has('dragon'))hero='dragon';
  else if(has('elephant'))hero='elephant';
  else if(has('eagle','bird','flock','hawk'))hero='bird';
  else if(has('astronaut','cosmonaut'))hero='astronaut';
  else if(has('fish','shark'))hero='fish';
  else if(has('boat','ship','sail','sailing','yacht'))hero='boat';
  else if(has('castle','palace','ruins','tower'))hero='castle';
  else if(has('horse','deer','wolf','fox','animal','cat','cow'))hero='quadruped';
  else if(has('person','man','woman','figure','silhouette','walker','girl','boy'))hero='person';
  return {time,env,part,hero,raw:t};
}

// ===== بناء العالم (مرة وحدة لكل الفيديو = التناسق) =====
function buildWorld(a, prompt){
  const r=rng32(hash(prompt)); const W={a, seed:hash(prompt)};
  const skySets={
    day:[['#2a6fb0','#6fb3e0','#bfe3f5'],['#3a7bd5','#8ecae6','#d4ecfb']],
    sunset:[['#1a1147','#7b2d6b','#e8654f','#ffc46b'],['#2b1055','#7597de','#f7797d','#fbd786'],['#0f0c29','#302b63','#ff512f']],
    sunrise:[['#2c1e4a','#c94b6b','#ffb36b'],['#ff9966','#ff5e62','#ffe29f']],
    night:[['#050a1f','#10204a','#1d3a6e'],['#0b1026','#1a2f5a','#243b6b']]
  };
  const envSky={
    space:[['#01000a','#0a0025','#1a0040'],['#000010','#0d0033','#240046']],
    fire:[['#1a0000','#4d0a00','#a32600'],['#2b0000','#7a1f00','#c43e00']],
    ocean:[['#0a3d62','#1e6f9f','#3c9dc4'],['#0288d1','#29b6f6','#81d4fa']]
  };
  W.sky = envSky[a.env]?pick(r,envSky[a.env]):pick(r,skySets[a.time]||skySets.day);
  const gs={
    desert:['#caa05a','#a8763e','#8a5a2a'],forest:['#2f6b2f','#1b4d1b','#3d7a3d'],
    ocean:['#0a5c8a','#084d75','#0d6a9c'],mountain:['#5a6b7a','#465663','#6b7d8c'],
    city:['#16162a','#1e1e38','#0f0f1f'],fire:['#3a1500','#5a2400','#2a0d00'],
    space:['#1a1a2e','#252542','#12121f'],nature:['#4a7a2a','#3a6320','#5a8a3a']
  };
  W.ground=pick(r,gs[a.env]||gs.nature); W.ground2=pick(r,gs[a.env]||gs.nature);
  W.lightColor = a.time==='night'?'#9fb8ff':a.time==='sunset'?'#ffb066':a.time==='sunrise'?'#ffd9a0':'#fff6d8';
  if(a.env==='fire')W.lightColor='#ff7a33'; if(a.env==='ocean')W.lightColor='#7fd4ff'; if(a.env==='space')W.lightColor='#b39ddb';
  W.hills=[];
  if(['mountain','desert','nature'].includes(a.env)){
    const n=RI(r,3,4);
    for(let L=0;L<n;L++){const pts=[];const seg=RI(r,5,7);const by=0.5+L*0.06;
      for(let s=0;s<=seg;s++)pts.push({x:s/seg,y:by+R(r,-0.06,0.12)});
      W.hills.push({pts,depth:L/n,snow:a.env==='mountain'&&L<2});}
  }
  W.blds=[];
  if(a.env==='city'){for(let k=0;k<20;k++)W.blds.push({x:k/20+R(r,-0.008,0.008),w:R(r,0.025,0.06),h:R(r,0.12,0.5),lit:r()<0.7,win:R(r,0.3,0.7),id:RI(r,1,9999)});}
  W.trees=[];
  if(a.env==='forest'){for(let k=0;k<16;k++)W.trees.push({x:r(),s:R(r,0.4,1),far:r()<0.4}); W.trees.sort((x,y)=>x.s-y.s);}
  W.planets=[];
  if(a.env==='space'){for(let k=0;k<RI(r,2,3);k++)W.planets.push({x:R(r,0.1,0.9),y:R(r,0.08,0.45),rad:R(r,0.04,0.16),col:pick(r,['#ff7043','#ba68c8','#4fc3f7','#ffd54f','#81c784','#ef5350']),ring:r()<0.3});}
  W.volcano=a.env==='fire'?{x:R(r,0.35,0.65),w:R(r,0.28,0.45),h:R(r,0.28,0.42)}:null;
  W.sun=(a.time==='night'||a.env==='space')?null:{x:R(r,0.12,0.88),y:R(r,0.1,0.32),rad:R(r,0.05,0.1)};
  W.moon=(a.time==='night'||a.env==='space')?{x:R(r,0.1,0.9),y:R(r,0.08,0.28),rad:R(r,0.04,0.08),phase:R(r,0.3,1)}:null;
  const pn=a.part==='stars'?110:a.part==='rain'?140:a.part==='snow'?100:a.part==='ember'?70:a.part==='bubbles'?45:55;
  W.parts=[];
  for(let k=0;k<pn;k++)W.parts.push({x:r(),y:r(),sz:R(r,0.4,2.4),sp:R(r,0.3,1.3),tw:r()*6.28,drift:R(r,-1,1)});
  W.fog=a.env!=='space'&&(a.time==='night'||a.env==='ocean'||a.env==='forest'||a.env==='mountain'||a.raw.includes('fog')||a.raw.includes('mist'));
  return W;
}

// ===== اللقطات السينمائية (نفس العالم، كاميرات مختلفة) =====
function buildShots(n){
  const cams=[
    {name:'واسع (تأسيس)',zoom:1.0,panX:0,panY:0,heroScale:0.7,heroX:0.62},
    {name:'متوسط',zoom:1.25,panX:-0.04,panY:0.02,heroScale:1.0,heroX:0.5},
    {name:'قريب (تفصيل)',zoom:1.7,panX:0.05,panY:0.06,heroScale:1.5,heroX:0.42},
    {name:'زاوية معاكسة',zoom:1.15,panX:0.12,panY:-0.02,heroScale:0.85,heroX:0.72},
    {name:'درامي (من تحت)',zoom:1.35,panX:-0.02,panY:0.1,heroScale:1.2,heroX:0.35},
  ];
  const out=[]; for(let i=0;i<n;i++)out.push({...cams[i%cams.length]}); return out;
}

// ===== رسم البطل بأسلوب واقعي =====
function drawHero(g,type,x,y,s,lightDir,lightCol){
  const body='#0d0b08';
  g.save(); g.translate(x,y); g.scale(s,s); if(lightDir<0)g.scale(-1,1);
  g.fillStyle=body; g.strokeStyle=body; g.lineWidth=3; g.lineCap='round';
  if(type==='lion'){
    g.beginPath(); const mx=18,my=-12,mr=15;
    for(let a=0;a<6.28;a+=0.22){const rr=mr+Math.sin(a*9)*2.4;const px=mx+Math.cos(a)*rr,py=my+Math.sin(a)*rr;a===0?g.moveTo(px,py):g.lineTo(px,py);}
    g.closePath(); g.fill();
    g.beginPath(); g.ellipse(-2,-2,24,12,0,0,6.28); g.fill();
    g.beginPath(); g.arc(mx,my,9,0,6.28); g.fill();
    g.beginPath(); g.arc(mx-5,my-8,3,0,6.28); g.arc(mx+3,my-9,3,0,6.28); g.fill();
    g.fillRect(-18,8,5,14); g.fillRect(-8,9,5,13); g.fillRect(6,9,5,13); g.fillRect(14,8,5,14);
    g.beginPath(); g.moveTo(-24,-4); g.quadraticCurveTo(-34,-12,-30,-20); g.stroke();
    g.beginPath(); g.arc(-30,-21,3,0,6.28); g.fill();
  } else if(type==='quadruped'){
    g.beginPath(); g.ellipse(0,-4,22,11,0,0,6.28); g.fill();
    g.beginPath(); g.arc(20,-12,8,0,6.28); g.fill();
    g.beginPath(); g.moveTo(16,-18); g.lineTo(20,-26); g.lineTo(24,-18); g.fill();
    g.fillRect(-16,6,4,14); g.fillRect(-6,7,4,13); g.fillRect(6,7,4,13); g.fillRect(14,6,4,14);
    g.beginPath(); g.moveTo(-22,-6); g.quadraticCurveTo(-30,-14,-26,-20); g.stroke();
  } else if(type==='elephant'){
    g.beginPath(); g.ellipse(0,-6,28,18,0,0,6.28); g.fill();
    g.beginPath(); g.arc(24,-16,11,0,6.28); g.fill();
    g.lineWidth=6; g.beginPath(); g.moveTo(32,-12); g.quadraticCurveTo(40,-2,36,8); g.stroke();
    g.beginPath(); g.ellipse(18,-14,9,12,0.3,0,6.28); g.fill();
    g.fillRect(-18,10,6,16); g.fillRect(-4,11,6,15); g.fillRect(8,11,6,15); g.fillRect(18,10,6,16);
    g.strokeStyle='#d8cfc0'; g.lineWidth=2.5; g.beginPath(); g.moveTo(30,-6); g.lineTo(33,2); g.stroke();
  } else if(type==='bird'){
    g.lineWidth=3; g.beginPath(); g.ellipse(0,0,5,3,0,0,6.28); g.fill();
    g.beginPath(); g.moveTo(-2,0); g.quadraticCurveTo(-14,-8,-22,-2); g.stroke();
    g.beginPath(); g.moveTo(2,0); g.quadraticCurveTo(14,-8,22,-2); g.stroke();
  } else if(type==='astronaut'){
    g.fillStyle='#e8e8ee'; g.beginPath(); g.arc(0,-26,9,0,6.28); g.fill();
    g.fillStyle='#2a4a6a'; g.beginPath(); g.arc(2,-26,6,0,6.28); g.fill();
    g.fillStyle='rgba(180,220,255,0.6)'; g.beginPath(); g.arc(3.5,-27.5,2,0,6.28); g.fill();
    g.fillStyle='#e8e8ee'; g.beginPath(); g.roundRect(-8,-18,16,22,4); g.fill();
    g.fillStyle='#c0c0cc'; g.fillRect(-12,-16,4,14);
    g.fillStyle='#e8e8ee'; g.fillRect(-7,4,5,12); g.fillRect(2,4,5,12); g.fillRect(-11,-14,4,12); g.fillRect(8,-14,4,12);
    g.fillStyle='#888'; g.fillRect(-8,-6,16,3);
  } else if(type==='fish'){
    g.beginPath(); g.ellipse(0,0,14,7,0,0,6.28); g.fill();
    g.beginPath(); g.moveTo(12,0); g.lineTo(22,-7); g.lineTo(22,7); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-2,-6); g.lineTo(2,-13); g.lineTo(6,-6); g.closePath(); g.fill();
    g.fillStyle=lightCol; g.globalAlpha=0.85; g.beginPath(); g.arc(-8,-2,2,0,6.28); g.fill(); g.globalAlpha=1;
  } else if(type==='boat'){
    g.beginPath(); g.moveTo(-16,0); g.lineTo(16,0); g.lineTo(11,7); g.lineTo(-11,7); g.closePath(); g.fill();
    g.fillRect(-1,-26,2,26);
    g.beginPath(); g.moveTo(0,-26); g.quadraticCurveTo(16,-14,12,-2); g.lineTo(0,-2); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(0,-22); g.quadraticCurveTo(-12,-12,-9,-2); g.lineTo(0,-2); g.closePath(); g.fill();
  } else if(type==='person'){
    g.beginPath(); g.arc(0,-24,5,0,6.28); g.fill();
    g.beginPath(); g.roundRect(-5,-19,10,16,3); g.fill();
    g.fillRect(-5,-3,4,12); g.fillRect(1,-3,4,12); g.fillRect(-8,-17,3,11); g.fillRect(5,-17,3,11);
  } else if(type==='dragon'){
    g.beginPath(); g.ellipse(0,-2,26,10,0,0,6.28); g.fill();
    g.beginPath(); g.arc(24,-10,8,0,6.28); g.fill();
    g.beginPath(); g.moveTo(28,-14); g.lineTo(36,-18); g.lineTo(30,-10); g.fill();
    g.beginPath(); g.moveTo(-4,-8); g.quadraticCurveTo(-10,-30,8,-26); g.quadraticCurveTo(2,-16,4,-8); g.fill();
    g.lineWidth=4; g.beginPath(); g.moveTo(-24,-2); g.quadraticCurveTo(-38,2,-34,12); g.stroke();
    g.fillRect(-12,6,4,10); g.fillRect(2,6,4,10); g.fillRect(12,6,4,10);
  } else if(type==='castle'){
    g.fillRect(-22,-20,44,20);
    for(let i=-1;i<=1;i++){g.fillRect(i*14-4,-34,8,14);g.beginPath();g.moveTo(i*14-4,-34);g.lineTo(i*14,-42);g.lineTo(i*14+4,-34);g.fill();}
    g.fillRect(-22,-24,6,4);g.fillRect(-8,-24,6,4);g.fillRect(6,-24,6,4);g.fillRect(16,-24,6,4);
  } else { g.beginPath(); g.arc(0,-22,5,0,6.28); g.fill(); g.fillRect(-4,-17,8,14); g.fillRect(-4,-3,3,10); g.fillRect(1,-3,3,10); }
  g.restore();
  // rim light
  g.save(); g.translate(x,y); g.scale(s,s); if(lightDir<0)g.scale(-1,1);
  g.strokeStyle=lightCol; g.globalAlpha=0.55; g.lineWidth=1.6; g.lineCap='round';
  if(type==='lion'){g.beginPath();g.arc(18,-12,15,3.6,5.8);g.stroke();g.beginPath();g.ellipse(-2,-2,24,12,0,3.3,6.0);g.stroke();}
  else if(type==='quadruped'){g.beginPath();g.ellipse(0,-4,22,11,0,3.3,6.0);g.stroke();}
  else if(type==='elephant'){g.beginPath();g.ellipse(0,-6,28,18,0,3.4,6.0);g.stroke();}
  else if(type==='astronaut'){g.beginPath();g.arc(0,-26,9,3.6,5.9);g.stroke();}
  else if(type==='person'){g.beginPath();g.arc(0,-24,5,3.6,5.9);g.stroke();}
  else if(type==='bird'){g.beginPath();g.moveTo(-2,0);g.quadraticCurveTo(-14,-8,-22,-2);g.stroke();g.beginPath();g.moveTo(2,0);g.quadraticCurveTo(14,-8,22,-2);g.stroke();}
  else if(type==='fish'){g.beginPath();g.ellipse(0,0,14,7,0,3.4,6.0);g.stroke();}
  else if(type==='boat'){g.beginPath();g.moveTo(0,-26);g.quadraticCurveTo(16,-14,12,-2);g.stroke();}
  else if(type==='dragon'){g.beginPath();g.ellipse(0,-2,26,10,0,3.4,6.0);g.stroke();}
  g.restore(); g.globalAlpha=1;
}
function drawTree(g,x,y,s,col){g.fillStyle=col;g.fillRect(x-2*s,y-9*s,4*s,9*s);
 g.beginPath();g.moveTo(x,y-32*s);g.lineTo(x-11*s,y-7*s);g.lineTo(x+11*s,y-7*s);g.closePath();g.fill();
 g.beginPath();g.moveTo(x,y-26*s);g.lineTo(x-9*s,y-14*s);g.lineTo(x+9*s,y-14*s);g.closePath();g.fill();}

// ===== رسم العالم بلقطة كاميرا معينة =====
function renderWorld(g,W,cam,ph,w,h){
  g.clearRect(0,0,w,h); g.save();
  const zoom=cam.zoom*(1+ph*0.05);
  const drift=Math.sin(ph*Math.PI)*0.012;
  g.translate(w/2+(cam.panX+drift)*w, h/2+cam.panY*h);
  g.scale(zoom,zoom); g.translate(-w/2,-h/2);
  const a=W.a;
  const lightDir=W.sun?(W.sun.x<0.5?1:-1):(W.moon?(W.moon.x<0.5?1:-1):1);
  // سماء
  const gr=g.createLinearGradient(0,0,0,h);
  W.sky.forEach((c,i)=>gr.addColorStop(i/(W.sky.length-1),c));
  g.fillStyle=gr; g.fillRect(-w,-h,w*3,h*3);
  // سديم
  if(a.env==='space'){for(let k=0;k<3;k++){const pr=rng32(W.seed+k);const cx=R(pr,0.1,0.9)*w,cy=R(pr,0.05,0.6)*h;
    const rg=g.createRadialGradient(cx,cy,0,cx,cy,w*0.4);rg.addColorStop(0,'rgba(140,60,200,0.22)');rg.addColorStop(0.5,'rgba(60,40,160,0.1)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);}}
  if(a.time==='sunset'||a.time==='sunrise'){const hg=g.createLinearGradient(0,h*0.45,0,h*0.7);hg.addColorStop(0,'rgba(0,0,0,0)');hg.addColorStop(1,hexA(W.lightColor,0.25));g.fillStyle=hg;g.fillRect(0,h*0.45,w,h*0.25);}
  // شمس/قمر
  const cel=W.sun||W.moon;
  if(cel){const cx=cel.x*w,cy=cel.y*h,rad=cel.rad*w;
    const rg=g.createRadialGradient(cx,cy,rad*0.3,cx,cy,rad*3.2);
    rg.addColorStop(0,hexA(W.lightColor,0.85));rg.addColorStop(0.3,hexA(W.lightColor,0.35));rg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=rg;g.beginPath();g.arc(cx,cy,rad*3.2,0,6.28);g.fill();
    g.fillStyle=W.sun?'#fff4cf':'#eef2ff';g.beginPath();g.arc(cx,cy,rad,0,6.28);g.fill();
    if(W.moon){g.fillStyle='rgba(150,160,190,0.4)';const mr=rng32(W.seed+77);
      for(let k=0;k<5;k++){const fx=cx+R(mr,-rad*0.6,rad*0.6),fy=cy+R(mr,-rad*0.6,rad*0.6),fr=R(mr,rad*0.08,rad*0.2);g.beginPath();g.arc(fx,fy,fr,0,6.28);g.fill();}
      if(W.moon.phase<0.9){g.fillStyle=W.sky[0];g.beginPath();g.arc(cx+rad*0.5,cy-rad*0.1,rad*0.92,0,6.28);g.fill();}}}
  // كواكب
  W.planets.forEach(p=>{const cx=p.x*w,cy=p.y*h,rad=p.rad*w;
    const rg=g.createRadialGradient(cx-rad*0.35,cy-rad*0.35,rad*0.1,cx,cy,rad);
    rg.addColorStop(0,'#fff');rg.addColorStop(0.25,p.col);rg.addColorStop(1,'rgba(0,0,0,0.55)');
    g.fillStyle=rg;g.beginPath();g.arc(cx,cy,rad,0,6.28);g.fill();
    if(p.ring){g.strokeStyle=hexA(p.col,0.6);g.lineWidth=rad*0.12;g.beginPath();g.ellipse(cx,cy,rad*1.7,rad*0.45,0.3,0,6.28);g.stroke();}});
  const hor=h*0.6;
  // أرض
  if(a.env==='ocean'){
    const og=g.createLinearGradient(0,hor,0,h);og.addColorStop(0,W.ground);og.addColorStop(1,W.ground2);g.fillStyle=og;g.fillRect(0,hor,w,h-hor);
    for(let L=0;L<5;L++){const base=hor+L*(h-hor)/5;g.strokeStyle=hexA('#ffffff',0.12-L*0.015);g.lineWidth=1.5;g.beginPath();
      for(let x=0;x<=w;x+=6){const y=base+Math.sin(x*0.025+ph*5+L*1.3)*(3+L*1.5);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
    if(W.sun){g.save();g.globalAlpha=0.3;g.fillStyle=W.lightColor;
      for(let y=hor;y<h;y+=5){const ww=(y-hor)*0.5+3;const ox=Math.sin(y*0.15+ph*8)*4;g.fillRect(W.sun.x*w-ww/2+ox,y,ww,2.5);}g.restore();}
  } else if(W.hills.length){
    W.hills.forEach((H,idx)=>{const off=ph*(6+idx*10)*cam.zoom*0.5;
      const col=idx===W.hills.length-1?W.ground:mix(W.ground,W.ground2,idx/Math.max(1,W.hills.length-1));
      g.fillStyle=col;g.beginPath();g.moveTo(-w,h+h);
      H.pts.forEach(p=>g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();g.fill();
      if(H.snow){g.fillStyle='rgba(240,245,255,0.9)';g.beginPath();
        H.pts.forEach((p,i)=>{const x=p.x*w*1.4-w*0.2-off,y=p.y*h;i===0?g.moveTo(x,y):g.lineTo(x,y);});
        for(let i=H.pts.length-1;i>=0;i--){const p=H.pts[i];g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h+h*0.03);}g.closePath();g.fill();}});
  } else if(a.env==='city'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    W.blds.forEach(b=>{const bx=b.x*w*1.3-w*0.15-ph*8,bw=b.w*w,bh=b.h*h;
      g.fillStyle='#08080f';g.fillRect(bx,hor-bh,bw,bh+h);
      if(b.lit){g.fillStyle=W.lightColor;
        for(let wy=hor-bh+5;wy<hor-3;wy+=8)for(let wx=bx+2;wx<bx+bw-2;wx+=6)
          if(((wx*97+wy*13+b.id)|0)%100<b.win*100)g.fillRect(wx,wy,2.5,3.5);}});
    const ng=g.createLinearGradient(0,hor-50,0,hor);ng.addColorStop(0,'rgba(0,0,0,0)');ng.addColorStop(1,hexA('#ff2d95',0.18));g.fillStyle=ng;g.fillRect(0,hor-50,w,50);
  } else if(a.env==='forest'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    W.trees.forEach(t=>{const tx=t.x*w*1.3-w*0.15-ph*(10+t.s*20),ty=hor+(1-t.s)*h*0.06;
      const col=t.far?mix(W.ground,'#88aa88',0.4):W.ground2;drawTree(g,tx,ty,t.s*1.2,col);});
  } else if(a.env==='fire'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    const v=W.volcano,vx=v.x*w,vw=v.w*w,vh=v.h*h;
    g.fillStyle='#120800';g.beginPath();g.moveTo(vx-vw,hor+30);g.lineTo(vx,hor-vh);g.lineTo(vx+vw,hor+30);g.closePath();g.fill();
    g.strokeStyle='#ff5500';g.lineWidth=3;g.globalAlpha=0.7;const hr=rng32(W.seed+5);
    for(let k=0;k<4;k++){g.beginPath();let lx=vx+R(hr,-vw*0.3,vw*0.3),ly=hor-vh*0.9;g.moveTo(lx,ly);
      for(let s=0;s<6;s++){lx+=R(hr,-12,12);ly+=vh*0.15;g.lineTo(lx,ly);}g.stroke();}g.globalAlpha=1;
    const fg=g.createRadialGradient(vx,hor-vh,0,vx,hor-vh,vw*0.8);fg.addColorStop(0,'rgba(255,140,0,0.9)');fg.addColorStop(0.4,'rgba(255,60,0,0.4)');fg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fg;g.beginPath();g.arc(vx,hor-vh,vw*0.8,0,6.28);g.fill();
  } else {
    const gg=g.createLinearGradient(0,hor,0,h);gg.addColorStop(0,W.ground);gg.addColorStop(1,W.ground2);g.fillStyle=gg;g.fillRect(0,hor,w,h-hor);
    g.strokeStyle=hexA('#000000',0.12);g.lineWidth=2;
    for(let L=0;L<3;L++){g.beginPath();for(let x=0;x<=w;x+=10){const y=hor+L*18+Math.sin(x*0.012+W.seed+L)*6;x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  }
  // البطل
  if(a.hero){let hx=cam.heroX*w,yy=hor-2;
    if(a.hero==='bird')yy=h*0.25+Math.sin(ph*4)*8;
    if(a.hero==='fish')yy=hor+(h-hor)*0.45;
    if(a.hero==='boat')yy=hor+6;
    if(a.hero==='astronaut'&&a.env==='space')yy=h*0.7;
    drawHero(g,a.hero,hx,yy,cam.heroScale,lightDir,W.lightColor);}
  if(a.hero==='bird'||a.raw.includes('flock')){const br=rng32(W.seed+3);
    for(let k=0;k<5;k++)drawHero(g,'bird',R(br,0.1,0.9)*w-ph*30,R(br,0.12,0.4)*h,R(br,0.5,1),lightDir,W.lightColor);}
  // ضباب
  if(W.fog){for(let L=0;L<3;L++){const fy=hor-10+L*14;
    const fgr=g.createLinearGradient(0,fy-20,0,fy+20);fgr.addColorStop(0,'rgba(0,0,0,0)');
    fgr.addColorStop(0.5,hexA(a.time==='night'?'#222233':'#ccccdd',0.18-L*0.04));
    fgr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fgr;g.fillRect(0,fy-20,w,40);}}
  // جسيمات
  g.save();
  W.parts.forEach(p=>{const px=p.x*w,sp=p.sp;
    if(a.part==='stars'){g.globalAlpha=0.35+0.65*Math.abs(Math.sin(ph*5+p.tw));g.fillStyle='#fff';g.beginPath();g.arc(px,p.y*h*0.55,p.sz*0.8,0,6.28);g.fill();}
    else if(a.part==='rain'){const y=((p.y+ph*sp*2.2)%1)*h;g.globalAlpha=0.45;g.strokeStyle=hexA('#cfe0ff',0.7);g.lineWidth=1.2;g.beginPath();g.moveTo(px,y);g.lineTo(px-4,y+12);g.stroke();}
    else if(a.part==='snow'){const y=((p.y+ph*sp)%1)*h;const x=px+Math.sin(ph*3+p.tw)*12*p.drift;g.globalAlpha=0.85;g.fillStyle='#fff';g.beginPath();g.arc(x,y,p.sz,0,6.28);g.fill();}
    else if(a.part==='ember'){const y=((p.y-ph*sp*1.4)%1+1)%1*h;const x=px+Math.sin(ph*4+p.tw)*10*p.drift;g.globalAlpha=Math.max(0,1-y/h);g.fillStyle=pick(rng32((p.tw*100)|0),['#ff6d00','#ffd54f','#ff3d00','#ffab40']);g.beginPath();g.arc(x,y,p.sz,0,6.28);g.fill();}
    else if(a.part==='bubbles'){const y=((p.y-ph*sp)%1+1)%1*h;const x=px+Math.sin(ph*2.5+p.tw)*7*p.drift;g.globalAlpha=0.5;g.strokeStyle=hexA('#ddffff',0.8);g.lineWidth=1;g.beginPath();g.arc(x,y,p.sz+1.5,0,6.28);g.stroke();}
    else{const y=((p.y+ph*sp*0.25)%1)*h;const x=px+Math.sin(ph*1.5+p.tw)*18*p.drift;g.globalAlpha=0.22;g.fillStyle='#fff';g.beginPath();g.arc(x,y,p.sz*0.7,0,6.28);g.fill();}});
  g.restore();
  g.restore(); // نهاية الكاميرا
  // ما بعد المعالجة
  const vg=g.createRadialGradient(w/2,h/2,h*0.28,w/2,h/2,h*0.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.5)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.save();g.globalAlpha=0.05;g.fillStyle='#000';const gn=rng32((ph*1000)|0);
  for(let k=0;k<120;k++)g.fillRect(gn()*w,gn()*h,1.3,1.3);g.restore();
  g.fillStyle='#000';const lb=h*0.06;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== 1) توليد العالم + اللقطات =====
generateBtn.addEventListener('click',()=>{
  const prompt=promptInput.value.trim(); const n=parseInt(numImagesInput.value)||4;
  if(!prompt){alert('اكتب وصفاً أولاً');return;}
  stopReq=false; const a=analyze(prompt);
  world=buildWorld(a,prompt); shots=buildShots(n);
  imagesPreview.innerHTML='';
  shots.forEach(cam=>{const tc=document.createElement('canvas');tc.width=180;tc.height=101;
    renderWorld(tc.getContext('2d'),world,cam,0.4,180,101);
    const el=document.createElement('img');el.src=tc.toDataURL();el.title='لقطة: '+cam.name;imagesPreview.appendChild(el);});
  status.textContent=`✅ العالم جاهز! ${n} لقطات متناسقة (بيئة:${a.env} · وقت:${a.time} · بطل:${a.hero||'—'}) — اضغط "إنشاء الفيديو".`;
  createVideoBtn.disabled=false; downloadLink.style.display='none';
});

// ===== 2) تسجيل الفيديو السينمائي =====
createVideoBtn.addEventListener('click',()=>{
  if(!world||!shots.length)return;
  recordedChunks=[]; stopReq=false; createVideoBtn.disabled=true;
  const dur=parseInt(durationInput.value)||2, fps=30, per=dur*fps, total=shots.length*per;
  let fr=0; status.textContent='🎬 جاري التسجيل السينمائي...';
  const stream=outputCanvas.captureStream(fps);
  let mime='video/webm; codecs=vp9'; if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  mediaRecorder=new MediaRecorder(stream,{mimeType:mime});
  mediaRecorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
  mediaRecorder.onstop=()=>{const blob=new Blob(recordedChunks,{type:'video/webm'});const u=URL.createObjectURL(blob);
    downloadLink.href=u;downloadLink.download='cinematic-video.webm';downloadLink.style.display='inline-block';
    status.textContent='✅ الفيديو السينمائي جاهز! حمّلو من الزر الأخضر 🎬';createVideoBtn.disabled=false;};
  mediaRecorder.start();
  (function loop(){
    if(stopReq||fr>=total){mediaRecorder.stop();return;}
    const idx=Math.min(Math.floor(fr/per),shots.length-1), lp=(fr%per)/per;
    renderWorld(ctx,world,shots[idx],lp,outputCanvas.width,outputCanvas.height);
    if(idx<shots.length-1&&lp>0.82){const t=(lp-0.82)/0.18;ctx.save();ctx.globalAlpha=t*t*(3-2*t);
      renderWorld(ctx,world,shots[idx+1],0,outputCanvas.width,outputCanvas.height);ctx.restore();}
    fr++; if(fr%6===0)status.textContent=`🎬 إطار ${fr}/${total} — لقطة ${idx+1}/${shots.length}: ${shots[idx].name}`;
    requestAnimationFrame(loop);
  })();
});

const sb=document.createElement('button'); sb.textContent='⏹️ إيقاف';
sb.style.cssText='margin-top:8px;padding:10px;border:none;border-radius:6px;background:#cf6679;color:#000;font-weight:bold;cursor:pointer;width:100%;';
sb.onclick=()=>{stopReq=true;status.textContent='⏹️ تم الإيقاف.';};
document.querySelector('.buttons').after(sb);
