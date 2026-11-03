// ============ استوديو الأنيميشن v4 — نظيف ومختبر ============
const $=id=>document.getElementById(id);
const promptInput=$('promptInput'),numImagesInput=$('numImagesInput'),durationInput=$('durationInput');
const generateBtn=$('generateBtn'),createVideoBtn=$('createVideoBtn');
const status=$('status'),imagesPreview=$('imagesPreview'),outputCanvas=$('outputCanvas'),downloadLink=$('downloadLink');
const ctx=outputCanvas.getContext('2d');
let storyScenes=[],recorder=null,chunks=[],gt=0,audioCtx=null;

function rnd(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hs(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function toon(g,fill,lw){g.fillStyle=fill;g.fill();g.strokeStyle='#1a1208';g.lineWidth=lw||2.2;g.lineJoin='round';g.stroke();}
function eye(g,x,y,r,blink){
  g.beginPath();g.ellipse(x,y,r*0.8,r,0,0,6.28);toon(g,'#fff',1.4);
  if(blink){g.strokeStyle='#1a1208';g.lineWidth=1.6;g.beginPath();g.moveTo(x-r*0.6,y);g.quadraticCurveTo(x,y+r*0.4,x+r*0.6,y);g.stroke();return;}
  g.beginPath();g.arc(x+r*0.2,y+r*0.1,r*0.45,0,6.28);toon(g,'#2a1a0a',1);
  g.fillStyle='#fff';g.beginPath();g.arc(x,y-r*0.1,r*0.16,0,6.28);g.fill();
}
function smile(g,x,y,w){g.strokeStyle='#1a1208';g.lineWidth=1.4;g.lineCap='round';g.beginPath();g.arc(x,y,w,0.2,2.9);g.stroke();}
function pick(r,arr){return arr[Math.floor(r()*arr.length)];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function mixHex(c1,c2,t){const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 const r=Math.round(((a>>16)&255)+(((b>>16)&255)-((a>>16)&255))*t);
 const g=Math.round(((a>>8)&255)+(((b>>8)&255)-((a>>8)&255))*t);
 const bl=Math.round((a&255)+((b&255)-(a&255))*t);return `rgb(${r},${g},${bl})`;}

// ===== الشخصيات (مبسطة لكن كاملة) =====
const HEROES={
  lion:{size:1},bird:{size:0.7,fly:1},fish:{size:0.8,water:1},elephant:{size:1.3},dragon:{size:1.2,fly:1},
  monkey:{size:0.85},turtle:{size:0.75},butterfly:{size:0.6,fly:1},cat:{size:0.8},sheep:{size:0.8},
  rabbit:{size:0.7},fox:{size:0.85},bear:{size:1.4},owl:{size:0.8,fly:1},penguin:{size:0.8},
  wolf:{size:0.9},deer:{size:0.95},frog:{size:0.6},snake:{size:0.7},bee:{size:0.5,fly:1}
};
const KW={
  lion:['lion'],bird:['bird','sparrow','crow'],fish:['fish','shark'],elephant:['elephant'],dragon:['dragon'],
  monkey:['monkey','ape'],turtle:['turtle','tortoise'],butterfly:['butterfly'],cat:['cat','kitten'],
  sheep:['sheep','lamb'],rabbit:['rabbit','bunny'],fox:['fox'],bear:['bear','panda'],owl:['owl'],
  penguin:['penguin'],wolf:['wolf'],deer:['deer','stag'],frog:['frog','toad'],snake:['snake'],bee:['bee']
};
const ENV_KW={ocean:['ocean','sea','underwater','coral','beach'],forest:['forest','tree','jungle'],desert:['desert','savanna','sand'],space:['space','galaxy','planet','mars'],mountain:['mountain','snow','peak','hill'],meadow:['meadow','field','grass','flower'],ice:['ice','arctic','polar','frozen'],city:['city','neon','street','building'],cave:['cave','crystal','underground']};
const TIME_KW={night:['night','dark','moon','stars'],sunset:['sunset','golden','dusk'],sunrise:['sunrise','dawn','morning'],storm:['storm','thunder','lightning']};

// ===== دالة رسم عامة للشخصيات (مبسطة) =====
function drawChar(g,type,x,y,s,wt){
  const body={lion:'#e8a33d',bird:'#3a6ea5',fish:'#3aa6c4',elephant:'#9a9aa8',dragon:'#3a8a4a',monkey:'#a06a3a',turtle:'#5a8a4a',butterfly:'#e85a9a',cat:'#5a5a6a',sheep:'#f5f0e8',rabbit:'#f0e8e0',fox:'#e86a2a',bear:'#7a5a3a',owl:'#6a5a4a',penguin:'#2a2a3a',wolf:'#7a7a8a',deer:'#a06a3a',frog:'#4a9a3a',snake:'#3a8a4a',bee:'#ffd54f'}[type]||'#e8a33d';
  g.save();g.translate(x,y);g.scale(s,s);
  
  // جسم أساسي لكل الحيوانات
  if(['lion','cat','fox','wolf','deer','bear','elephant','monkey','rabbit','sheep','penguin'].includes(type)){
    g.beginPath();g.ellipse(0,-4,16,10,0,0,6.28);toon(g,body,2);
    g.beginPath();g.arc(12,-12,7,0,6.28);toon(g,body,1.8);
    eye(g,10,-13,2,Math.sin(gt*1.3)>0.97?1:0);eye(g,15,-13,2,0);
    smile(g,12.5,-8,2);
    // أرجل
    [[-8,Math.sin(wt*6.28)*0.5],[8,-Math.sin(wt*6.28)*0.5]].forEach(([lx,sw])=>{
      g.save();g.translate(lx,4);g.rotate(sw);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,body,1.5);g.restore();});
    if(type==='lion'){const mx=16,my=-13,mr=14;g.beginPath();for(let a=0;a<6.28;a+=0.2){const rr=mr+Math.sin(a*7+gt*2.5)*2.5;g.lineTo(mx+Math.cos(a)*rr,my+Math.sin(a)*rr);}g.closePath();toon(g,'#b5651d',2);}
    if(type==='elephant'){g.strokeStyle='#1a1208';g.lineWidth=4;g.beginPath();g.moveTo(18,-10);g.quadraticCurveTo(26,-2,22,6);g.stroke();}
    if(type==='bear'){g.beginPath();g.arc(-9,-20,4,0,6.28);toon(g,body,1.5);g.beginPath();g.arc(9,-20,4,0,6.28);toon(g,body,1.5);}
    if(type==='rabbit'){g.beginPath();g.ellipse(-3,-22,3,8,-0.2,0,6.28);toon(g,body,1.5);g.beginPath();g.ellipse(3,-22,3,8,0.2,0,6.28);toon(g,body,1.5);}
    if(type==='sheep'){g.fillStyle='#f5f0e8';for(let k=0;k<5;k++)g.beginPath(),g.arc(-8+k*4,-2+(k%2)*3,5,0,6.28),g.fill();}
    if(type==='penguin'){g.fillStyle='#fff';g.beginPath();g.ellipse(0,-2,8,10,0,0,6.28);g.fill();g.fillStyle='#f4a82a';g.beginPath();g.moveTo(0,-8);g.lineTo(-3,-5);g.lineTo(3,-5);g.fill();}
  }
  else if(['bird','owl','bee','butterfly'].includes(type)){
    const fl=Math.sin(gt*(type==='bee'?15:type==='butterfly'?12:9))*0.6;
    if(type!=='bee'&&type!=='butterfly'){
      g.beginPath();g.moveTo(-2,0);g.quadraticCurveTo(-14,-8-fl*8,-20,-2-fl*4);g.quadraticCurveTo(-12,2,-2,1);g.closePath();toon(g,body,1.8);
      g.beginPath();g.moveTo(2,0);g.quadraticCurveTo(14,-8-fl*8,20,-2-fl*4);g.quadraticCurveTo(12,2,2,1);g.closePath();toon(g,body,1.8);
    }
    g.beginPath();g.ellipse(0,0,7,5,0,0,6.28);toon(g,body,1.8);
    g.beginPath();g.arc(5,-2,3,0,6.28);toon(g,body,1.5);
    if(type==='bee'){g.fillStyle='#1a1208';for(let k=0;k<3;k++)g.fillRect(-4+k*3,-2,1.5,4);g.beginPath();g.ellipse(-3,-5,5,2.5,-0.3,0,6.28);toon(g,'rgba(200,220,255,0.5)',1);g.beginPath();g.ellipse(3,-5,5,2.5,0.3,0,6.28);toon(g,'rgba(200,220,255,0.5)',1);}
    if(type==='butterfly'){g.beginPath();g.ellipse(-8,-3,8,5,-0.3,0,6.28);toon(g,body,1.5);g.beginPath();g.ellipse(8,-3,8,5,0.3,0,6.28);toon(g,body,1.5);g.beginPath();g.ellipse(-6,3,5,3,-0.2,0,6.28);toon(g,'#c44a7a',1.2);g.beginPath();g.ellipse(6,3,5,3,0.2,0,6.28);toon(g,'#c44a7a',1.2);}
    if(type==='owl'){g.fillStyle='#ffd54f';g.beginPath();g.arc(-3,-2,3,0,6.28);g.arc(3,-2,3,0,6.28);g.fill();g.fillStyle='#1a1208';g.beginPath();g.arc(-3,-2,1.5,0,6.28);g.arc(3,-2,1.5,0,6.28);g.fill();}
    else{eye(g,4.5,-3,1.6,0);smile(g,6,-1,1.5);}
  }
  else if(type==='fish'||type==='snake'){
    if(type==='fish'){g.beginPath();g.ellipse(0,0,12,6,0,0,6.28);toon(g,body,2);g.beginPath();g.moveTo(10,0);g.lineTo(18,-5);g.lineTo(18,5);g.closePath();toon(g,body,1.5);eye(g,-6,-2,2,0);}
    else{g.strokeStyle=body;g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(-15,0);for(let k=0;k<6;k++)g.lineTo(-15+k*5,Math.sin(gt*4+k)*3);g.stroke();g.beginPath();g.arc(15,Math.sin(gt*4+5)*3,3,0,6.28);toon(g,body,1.5);eye(g,17,Math.sin(gt*4+5)*3-1,1.2,0);}
  }
  else if(type==='dragon'){
    const wn=Math.sin(gt*5)*0.5;
    g.save();g.translate(-4,-6);g.rotate(wn);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-6,-18,6,-22);g.quadraticCurveTo(2,-12,3,0);g.closePath();toon(g,'#2a6a3a',1.8);g.restore();
    g.beginPath();g.ellipse(0,-2,20,8,0,0,6.28);toon(g,body,2.2);
    g.beginPath();g.arc(18,-8,6,0,6.28);toon(g,body,1.8);eye(g,20,-10,2,0);
    g.strokeStyle='#1a1208';g.lineWidth=2.5;g.beginPath();g.moveTo(-18,-2);g.quadraticCurveTo(-28,2,-24,8);g.stroke();
  }
  else if(type==='turtle'){
    g.beginPath();g.ellipse(0,-2,16,10,0,Math.PI,0);g.closePath();toon(g,body,2.2);
    g.strokeStyle='#2a5a2a';g.lineWidth=1.2;for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(i*4,-2);g.lineTo(i*3,-8);g.stroke();}
    g.beginPath();g.arc(16,-4,5,0,6.28);toon(g,body,1.5);eye(g,18,-5,1.8,0);
    [[-8,Math.sin(wt*3)*0.3],[8,-Math.sin(wt*3)*0.3]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw);g.beginPath();g.roundRect(-2,0,4,6,2);toon(g,body,1.2);g.restore();});
  }
  else if(type==='frog'){
    g.beginPath();g.ellipse(0,-2,10,7,0,0,6.28);toon(g,body,1.8);
    g.beginPath();g.arc(-4,-7,3,0,6.28);g.arc(4,-7,3,0,6.28);toon(g,body,1.2);
    eye(g,-4,-7,2,0);eye(g,4,-7,2,0);smile(g,0,-3,2.5);
    g.beginPath();g.ellipse(-7,3,3,1.5,0.3,0,6.28);g.ellipse(7,3,3,1.5,-0.3,0,6.28);toon(g,body,1.2);
  }
  g.restore();
}

// ===== فقاعة الحوار =====
function drawBubble(g,x,y,text,alpha){
  if(!text||alpha<=0)return;
  g.save();g.globalAlpha=alpha;
  g.font='bold 12px Arial';
  const words=text.split(' '),lines=[];let cur='';
  for(const w of words){const test=cur?cur+' '+w:w;if(g.measureText(test).width>140&&cur){lines.push(cur);cur=w;}else cur=test;}
  if(cur)lines.push(cur);
  const lh=16,pad=6,bw=150,bh=lines.length*lh+pad*2;
  const bx=x-bw/2,by=y-bh-12;
  g.fillStyle='#fff';g.strokeStyle='#1a1208';g.lineWidth=1.8;
  g.beginPath();g.roundRect(bx,by,bw,bh,8);g.fill();g.stroke();
  g.beginPath();g.moveTo(x-6,by+bh);g.lineTo(x,by+bh+10);g.lineTo(x+6,by+bh);g.fill();g.stroke();
  g.fillStyle='#1a1208';g.textAlign='center';g.textBaseline='top';
  lines.forEach((ln,i)=>g.fillText(ln,x,by+pad+i*lh));
  g.restore();
}

// ===== الصوت البسيط =====
function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
function playTone(freq,dur,type){
  if(!audioCtx)initAudio();
  try{
    const o=audioCtx.createOscillator(),gn=audioCtx.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    gn.gain.setValueAtTime(0,audioCtx.currentTime);
    gn.gain.linearRampToValueAtTime(0.15,audioCtx.currentTime+0.05);
    gn.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(gn);gn.connect(audioCtx.destination);
    o.start();o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}
function playMood(mood){
  const sc={happy:[261,329,392],sad:[220,261,311],tense:[233,277,329],calm:[261,329,392]}[mood]||[261,329,392];
  sc.forEach((f,i)=>setTimeout(()=>playTone(f,1.5,'triangle'),i*200));
}

// ===== تحليل القصة + الحوارات =====
function parseStory(text){
  let parts=text.split(/\.\s+|\,\s+|\band\s+then\b|\bthen\b/i).map(s=>s.trim()).filter(s=>s.length>2);
  if(parts.length===0)parts=[text];
  return parts.slice(0,30).map(sentence=>{
    const sl=sentence.toLowerCase();
    const has=(...w)=>w.some(x=>sl.includes(x));
    let time='day';for(const[t,kws]of Object.entries(TIME_KW))if(has(...kws)){time=t;break;}
    let env='nature';for(const[e,kws]of Object.entries(ENV_KW))if(has(...kws)){env=e;break;}
    const heroes=[];for(const[h,kws]of Object.entries(KW))if(kws.some(k=>sl.includes(k)))heroes.push(h);
    let weather='clear';
    if(has('rain','storm'))weather='rain';else if(has('snow','winter'))weather='snow';
    else if(has('fog','mist'))weather='fog';else if(has('fire','ember'))weather='ember';
    // استخراج الحوارات: "the lion says hello" أو "lion: hello"
    const dialogues=[];
    const dm=/(\w+)\s+(?:says|said)\s+"([^"]+)"/gi;let m;
    while((m=dm.exec(sentence))!==null){
      const sp=m[1].toLowerCase(),line=m[2].trim();
      const hk=Object.keys(KW).find(k=>KW[k].some(w=>sp.includes(w)));
      if(hk)dialogues.push({hero:hk,text:line});
    }
    return {sentence,time,env,heroes:heroes.slice(0,15),weather,dialogues};
  });
}

// ===== بناء المشهد =====
function buildScene(storyObj,index,total){
  const r=rnd(hs(storyObj.sentence+index));
  const {time,env,heroes,weather,dialogues}=storyObj;
  let mood='calm';
  if(weather==='storm'||time==='night')mood='tense';
  else if(time==='sunset'||time==='sunrise')mood='happy';
  
  const sky={day:['#4aa3e0','#8fd0f5','#cdeeff'],sunset:['#5a2d8a','#c44a6a','#ff8c42','#ffd166'],sunrise:['#6a3a8a','#e06a8a','#ffb36b'],night:['#0a1238','#16265c','#243b7a'],storm:['#2a2a3a','#3a3a4a','#4a4a5a']}[weather==='storm'?'storm':time]||['#4aa3e0','#8fd0f5'];
  const ground={desert:'#e8b85a',forest:'#4a9a3a',ocean:'#1a7ab0',mountain:'#7a8a9a',space:'#2a2a4a',nature:'#6aaa3a',meadow:'#7ac44a',ice:'#c8dce8',city:'#3a3a4a',cave:'#2a2a2a'}[env]||'#6aaa3a';
  
  const hills=[];if(!['ocean','space','ice','cave'].includes(env)){for(let L=0;L<3;L++){const pts=[];for(let s=0;s<=5;s++)pts.push({x:s/5,y:0.5+L*0.05+(r()-0.5)*0.1});hills.push({pts,d:L,snow:(env==='mountain'||env==='ice')&&L<2});}}
  const trees=[];if(['forest','meadow'].includes(env)){for(let k=0;k<(env==='meadow'?6:12);k++)trees.push({x:r(),s:0.4+r()*0.6,col:r()>0.5?'#3a8a2a':'#2e7d2e'});}
  const flowers=[];if(['meadow','forest'].includes(env)){for(let k=0;k<15;k++)flowers.push({x:r(),y:0.62+r()*0.15,col:pick(r,['#e85a9a','#ffd166','#ba68c8','#ff7043']),sz:2+r()*2});}
  const clouds=[];if(time!=='night'&&!['ocean','space','cave'].includes(env)){for(let k=0;k<4;k++)clouds.push({x:r(),y:0.1+r()*0.2,w:0.1+r()*0.12,sp:0.004+r()*0.008});}
  const stars=[];if(time==='night'||env==='space'){for(let k=0;k<70;k++)stars.push({x:r(),y:r()*0.55,sz:0.6+r()*2,tw:r()*6.28});}
  const planets=[];if(env==='space'){for(let k=0;k<2;k++)planets.push({x:0.1+r()*0.8,y:0.1+r()*0.35,rad:0.05+r()*0.12,col:pick(r,['#ff7043','#ba68c8','#4fc3f7','#ffd54f'])});}
  const cel={x:0.2+r()*0.6,y:0.12+r()*0.18,rad:0.06+r()*0.05};
  
  const cast=heroes.map((h,i)=>{
    const def=HEROES[h];const n=heroes.length;
    const dialogue=dialogues.find(d=>d.hero===h);
    return {type:h,fly:def.fly,water:def.water,x:clamp((i+0.5)/n+(r()-0.5)*0.12,0.12,0.88),scale:def.size*(0.85+r()*0.3),phase:r()*6.28,speed:0.6+r()*0.5,dialogue:dialogue?dialogue.text:null,bubbleT:0};
  }).sort((a,b)=>{const rk=x=>x.water?0:x.fly?2:1;return rk(a)-rk(b);});
  
  let cam={z:1.2,px:0};
  if(index===0)cam={z:1.0,px:0};
  else if(index===total-1)cam={z:1.5,px:0.05};
  else cam={z:1.2+(index%2)*0.2,px:(index%2?-0.03:0.04)};
  
  return {sky,ground,hills,trees,flowers,clouds,stars,planets,cel,cast,weather,cam,time,env,mood};
}

// ===== عناصر الخلفية =====
function drawSun(g,cx,cy,r,night,storm){
  if(!night&&!storm){for(let i=0;i<10;i++){const a=i*0.628+gt*0.2;g.save();g.translate(cx,cy);g.rotate(a);g.beginPath();g.moveTo(r*1.15,-r*0.15);g.lineTo(r*1.6,0);g.lineTo(r*1.15,r*0.15);g.closePath();toon(g,'#ffca28',1.2);g.restore();}}
  g.beginPath();g.arc(cx,cy,r,0,6.28);toon(g,storm?'#8a8a9a':night?'#f0f4ff':'#ffe066',2.2);
  if(!storm){const blink=Math.sin(gt*0.8)>0.96?1:0;eye(g,cx-r*0.35,cy-r*0.1,r*0.2,blink);eye(g,cx+r*0.35,cy-r*0.1,r*0.2,blink);
    g.strokeStyle='#1a1208';g.lineWidth=r*0.07;g.lineCap='round';g.beginPath();g.arc(cx,cy+r*0.15,r*0.35,0.3,2.85);g.stroke();
    g.fillStyle='rgba(255,150,150,0.4)';g.beginPath();g.arc(cx-r*0.5,cy+r*0.25,r*0.13,0,6.28);g.arc(cx+r*0.5,cy+r*0.25,r*0.13,0,6.28);g.fill();}
}
function drawCloud(g,cx,cy,w,dark){g.beginPath();g.arc(cx-w*0.3,cy,w*0.22,0,6.28);g.arc(cx,cy-w*0.1,w*0.3,0,6.28);g.arc(cx+w*0.3,cy,w*0.22,0,6.28);g.arc(cx,cy+w*0.05,w*0.26,0,6.28);toon(g,dark?'#5a5a6a':'#fff',2);}
function drawTree(g,x,y,s,col){const sw=Math.sin(gt*1.2+x*0.05)*2;g.beginPath();g.roundRect(x-2.5*s,y-9*s,5*s,9*s,2);toon(g,'#7a4a20',1.8);g.beginPath();g.arc(x+sw,y-20*s,10*s,0,6.28);toon(g,col,2);g.beginPath();g.arc(x-6*s+sw*0.7,y-14*s,7*s,0,6.28);toon(g,col,1.8);g.beginPath();g.arc(x+6*s+sw*0.7,y-14*s,7*s,0,6.28);toon(g,col,1.8);}
function drawFlower(g,x,y,col,sz){g.strokeStyle='#3a7a2a';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+sz*2.5);g.stroke();for(let i=0;i<5;i++){const a=i*1.256+gt*0.3;g.beginPath();g.ellipse(x+Math.cos(a)*sz,y+Math.sin(a)*sz-sz*0.5,sz*0.6,sz*0.3,a,0,6.28);g.fillStyle=col;g.fill();}g.beginPath();g.arc(x,y-sz*0.5,sz*0.4,0,6.28);toon(g,'#ffd166',1);}

// ===== الرسم الرئيسي =====
function renderScene(g,S,ph,w,h){
  g.clearRect(0,0,w,h);g.save();
  const e=ph<0.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/2;
  const z=S.cam.z*(1+e*0.05);
  const dx=Math.sin(e*Math.PI)*0.03;
  g.translate(w/2+(S.cam.px+dx)*w+Math.sin(gt*1.7)*1,h/2+Math.cos(gt*1.3)*0.8);
  g.scale(z,z);g.translate(-w/2,-h/2);
  
  const gr=g.createLinearGradient(0,0,0,h);S.sky.forEach((c,i)=>gr.addColorStop(i/(S.sky.length-1),c));g.fillStyle=gr;g.fillRect(-w,-h,w*3,h*3);
  S.stars.forEach(p=>{const tw=Math.abs(Math.sin(gt*2+p.tw));g.fillStyle=`rgba(255,255,255,${0.4+0.6*tw})`;g.beginPath();g.arc(p.x*w,p.y*h,p.sz*0.8,0,6.28);g.fill();});
  S.planets.forEach(p=>{g.beginPath();g.arc(p.x*w,p.y*h,p.rad*w,0,6.28);toon(g,p.col,2.2);});
  S.clouds.forEach(cl=>{const cx=((cl.x+gt*cl.sp)%1.3-0.15)*w;drawCloud(g,cx,cl.y*h,cl.w*w,S.weather==='storm');});
  drawSun(g,S.cel.x*w,S.cel.y*h,S.cel.rad*w,S.time==='night'||S.env==='space',S.weather==='storm');
  
  const hor=h*0.6;
  if(S.env==='ocean'||S.env==='ice'){
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
    g.strokeStyle='rgba(255,255,255,0.3)';g.lineWidth=2.5;g.lineCap='round';
    for(let L=0;L<4;L++){g.beginPath();for(let x=0;x<=w;x+=8){const y=hor+L*(h-hor)/4+Math.sin(x*0.03+gt*2+L*1.3)*(4+L*2);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  } else if(S.hills.length){
    S.hills.forEach((H,idx)=>{const off=e*(6+idx*10);
      g.beginPath();g.moveTo(-w,h+h);H.pts.forEach(p=>g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();
      toon(g,idx===S.hills.length-1?S.ground:mixHex(S.ground,'#ffffff',0.15*idx),2.4);
      if(H.snow){g.fillStyle='rgba(255,255,255,0.9)';g.beginPath();H.pts.forEach((p,i)=>{const x=p.x*w*1.4-w*0.2-off,y=p.y*h;i===0?g.moveTo(x,y):g.lineTo(x,y);});for(let i=H.pts.length-1;i>=0;i--){const p=H.pts[i];g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h+h*0.025);}g.closePath();g.fill();}
    });
  } else {
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
  }
  S.trees.forEach(t=>drawTree(g,t.x*w*1.3-w*0.15-e*16,hor+(1-t.s)*h*0.06,t.s*1.1,t.col));
  S.flowers.forEach(f=>drawFlower(g,f.x*w,f.y*h,f.col,f.sz));
  
  // الشخصيات + الحوارات
  S.cast.forEach(ch=>{
    const wt=(gt*ch.speed+ch.phase)%1;
    let cx=ch.x*w,cy;
    if(ch.fly)cy=h*0.25+Math.sin(gt*1.5+ch.phase)*8;
    else if(ch.water)cy=hor+(h-hor)*0.45+Math.sin(gt*1.2+ch.phase)*4;
    else cy=hor-2;
    if(!ch.fly&&!ch.water)cx=((ch.x+e*0.08*ch.speed)%1.1)*w;
    
    // فقاعة الحوار
    if(ch.dialogue){
      ch.bubbleT+=1/30;
      if(ch.bubbleT>0.5&&ch.bubbleT<3.5){
        const alpha=ch.bubbleT<1?(ch.bubbleT-0.5)*2:ch.bubbleT>3?1-(ch.bubbleT-3):1;
        drawBubble(g,cx,cy-ch.scale*30,ch.dialogue,alpha);
      }
    }
    drawChar(g,ch.type,cx,cy,ch.scale,wt);
  });
  
  // طقس
  if(S.weather==='rain'){
    g.strokeStyle='rgba(180,210,255,0.6)';g.lineWidth=1.5;
    for(let k=0;k<60;k++){const rx=rnd(k*7)(w),ry=((rnd(k*13)(h)+gt*200)%h);g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-3,ry+10);g.stroke();}
  } else if(S.weather==='snow'){
    g.fillStyle='#fff';
    for(let k=0;k<40;k++){const sx=rnd(k*11)(w),sy=((rnd(k*17)(h)+gt*30)%h);g.beginPath();g.arc(sx+Math.sin(gt+k)*5,sy,1.5+rnd(k*23)(),0,6.28);g.fill();}
  } else if(S.weather==='fog'){
    for(let L=0;L<3;L++){const fy=hor-10+L*14;const fgr=g.createLinearGradient(0,fy-20,0,fy+20);fgr.addColorStop(0,'rgba(0,0,0,0)');fgr.addColorStop(0.5,'rgba(200,210,220,0.2-L*0.05)');fgr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fgr;g.fillRect(0,fy-20,w,40);}
  } else if(S.weather==='ember'){
    for(let k=0;k<25;k++){const ex=rnd(k*19)(w),ey=((rnd(k*29)(h)-gt*50)%h+h)%h;g.fillStyle=['#ff6d00','#ffd54f','#ff3d00'][k%3];g.globalAlpha=1-ey/h;g.beginPath();g.arc(ex+Math.sin(gt*2+k)*8,ey,1.5+rnd(k*31)(),0,6.28);g.fill();g.globalAlpha=1;}
  }
  
  g.restore();
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,40,0.35)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.07;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== الأزرار =====
generateBtn.addEventListener('click',()=>{
  const text=promptInput.value.trim();
  if(!text){alert('اكتب قصة!\nمثال: The lion says hello. Then the monkey jumps in the forest.');return;}
  
  const sentences=parseStory(text);
  if(sentences.length===0){alert('ما فهمتش الجملة.');return;}
  
  status.textContent=`📖 ${sentences.length} مشاهد (${sentences.reduce((a,s)=>a+s.heroes.length,0)} شخصيات)`;
  storyScenes=sentences.map((s,i)=>buildScene(s,i,sentences.length));
  
  imagesPreview.innerHTML='';
  storyScenes.forEach((sc,idx)=>{
    const tc=document.createElement('canvas');tc.width=160;tc.height=90;
    renderScene(tc.getContext('2d'),sc,0.4,160,90);
    const el=document.createElement('img');el.src=tc.toDataURL();
    el.title=`مشهد ${idx+1}: ${sentences[idx].sentence}`;
    imagesPreview.appendChild(el);
  });
  
  status.textContent=`✅ الفيلم جاهز! ${storyScenes.length} مشاهد. اضغط "إنشاء الفيديو".`;
  createVideoBtn.disabled=false;downloadLink.style.display='none';
});

createVideoBtn.addEventListener('click',()=>{
  if(!storyScenes.length)return;
  chunks=[];createVideoBtn.disabled=true;
  const dur=clamp(parseInt(durationInput.value)||3,1,10);
  const per=dur*30,total=storyScenes.length*per;
  let fr=0;gt=0;
  
  initAudio();
  playMood(storyScenes[0]?.mood||'calm');
  
  status.textContent=`🎬 جاري إخراج فيلم ${dur}s × ${storyScenes.length} مشاهد...`;
  const stream=outputCanvas.captureStream(30);
  let mime='video/webm; codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:'video/webm'});
    const u=URL.createObjectURL(blob);
    downloadLink.href=u;downloadLink.download='animation.webm';
    downloadLink.style.display='inline-block';
    status.textContent=`✅ الفيديو جاهز! ${(total/30).toFixed(1)} ثانية. حمّلو 🎬`;
    createVideoBtn.disabled=false;
  };
  recorder.start();
  
  (function loop(){
    if(fr>=total){recorder.stop();return;}
    gt=fr/30;
    const idx=Math.min(Math.floor(fr/per),storyScenes.length-1),lp=(fr%per)/per;
    if(fr%per===0&&storyScenes[idx])playMood(storyScenes[idx].mood);
    renderScene(ctx,storyScenes[idx],lp,outputCanvas.width,outputCanvas.height);
    if(idx<storyScenes.length-1&&lp>0.85){
      const t=(lp-0.85)/0.15;
      ctx.save();ctx.globalAlpha=t*t*(3-2*t);
      renderScene(ctx,storyScenes[idx+1],0,outputCanvas.width,outputCanvas.height);
      ctx.restore();
    }
    fr++;if(fr%10===0)status.textContent=`🎬 إطار ${fr}/${total} — مشهد ${idx+1}/${storyScenes.length}`;
    requestAnimationFrame(loop);
  })();
});
