// ============================================================
//  مولّد الفيديو المحلي (إجرائي) — بلا إنترنت، بلا كوطا
// ============================================================
const promptInput = document.getElementById('promptInput');
const numImagesInput = document.getElementById('numImagesInput');
const durationInput = document.getElementById('durationInput');
const generateBtn = document.getElementById('generateBtn');
const createVideoBtn = document.getElementById('createVideoBtn');
const status = document.getElementById('status');
const imagesPreview = document.getElementById('imagesPreview');
const outputCanvas = document.getElementById('outputCanvas');
const downloadLink = document.getElementById('downloadLink');

// تنظيف الواجهة: نخفي خانة الموسيقى (ما كنحتاجوهاش فالنسخة المحلية)
const mg = document.getElementById('musicToggle');
if (mg) mg.closest('.input-group').style.display = 'none';
// تحديث العناوين
const h1 = document.querySelector('h1');
if (h1) h1.textContent = '🎬 مولّد الفيديو المحلي (بلا إنترنت)';
const sub = document.querySelector('.subtitle');
if (sub) sub.textContent = 'اكتب وصفاً → كيتولّد مشهد متحرك على جهازك، بلا حدود';

const ctx = outputCanvas.getContext('2d');
let scenes = [];          // التكوينات المولدة
let mediaRecorder;
let recordedChunks = [];
let stopRequested = false;

// ---------- أدوات عشوائية بذرة ثابتة (mulberry32) ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const rr=(rng,a,b)=>a+(b-a)*rng();
const ri=(rng,a,b)=>Math.floor(rr(rng,a,b+1));
const pick=(rng,arr)=>arr[Math.floor(rng()*arr.length)];

// ---------- تحليل الـ prompt ----------
function analyzePrompt(raw){
  const t=raw.toLowerCase();
  const has=(...w)=>w.some(x=>t.includes(x));
  let time='day';
  if(has('night','midnight','dark','moon','starry','stars')) time='night';
  else if(has('sunset','golden hour','dusk','evening')) time='sunset';
  else if(has('sunrise','dawn','morning')) time='sunrise';
  let env='nature';
  if(has('city','urban','cyberpunk','neon','street','building','skyscraper','tokyo','ny')) env='city';
  else if(has('ocean','sea','water','beach','wave','underwater','lake','river','coral')) env='ocean';
  else if(has('forest','tree','jungle','woods','rainforest')) env='forest';
  else if(has('desert','savanna','sand','dune','lion','sahara')) env='desert';
  else if(has('space','galaxy','nebula','planet','cosmic','astronaut','mars','moon surface')) env='space';
  else if(has('mountain','peak','hill','valley','snow','winter','ice','glacier','alps')) env='mountain';
  else if(has('fire','lava','volcano','ember','burning','hell')) env='fire';
  let particles='dust';
  if(has('rain','storm','rainy','drizzle')) particles='rain';
  else if(has('snow','winter','ice','frost','blizzard')) particles='snow';
  else if(has('fire','ember','spark','volcano','burning')) particles='ember';
  else if(time==='night'||env==='space') particles='stars';
  else if(env==='ocean') particles='bubbles';
  const flags={
    lion:has('lion'), bird:has('bird','eagle','flock'), tree:has('tree','forest','jungle'),
    acacia:has('savanna','acacia','desert','lion'), astronaut:has('astronaut','cosmonaut','mars'),
    fish:has('fish','underwater','coral','ocean'), boat:has('boat','ship','sail'),
    castle:has('castle','palace','ruins'), person:has('person','man','woman','figure','silhouette')
  };
  return {time,env,particles,flags};
}

// ---------- بناء تكوين مشهد (positions ثابتات) ----------
function buildScene(i, ap, prompt){
  const seed=(hashStr(prompt)+i*9973)>>>0;
  const rng=mulberry32(seed);
  const c={...ap, seed, items:{}};

  // ألوان السماء (تدرجات)
  const skyMap={
    day:   [['#3a7bd5','#7ec8f0'],['#4facfe','#a1e3ff'],['#2c5aa0','#6db3e8']],
    sunset:[['#1a2a6c','#b21f1f','#fdbb2d'],['#41295a','#f953c6','#fad0c4'],['#0f2027','#2c5364','#fd746c']],
    sunrise:[['#ff512f','#f09819'],['#ee9ca7','#ffdde1'],['#f7971e','#ffd200']],
    night: [['#0b1026','#243b6b'],['#000428','#004e92'],['#141e30','#243b55']],
  };
  const envSky={
    space:[['#000010','#1a0033','#3d0066'],['#020111','#1a0033','#4a0072']],
    fire: [['#1a0000','#4d0000','#ff3d00'],['#2b0000','#7a1f00','#ff6d00']],
    ocean:[['#87ceeb','#e0f7fa'],['#4fc3f7','#b3e5fc'],['#0288d1','#81d4fa']],
  };
  let stops;
  if(envSky[c.env]) stops=pick(rng,envSky[c.env]);
  else if(c.time==='day'&&c.env==='city') stops=['#1a1a2e','#16213e','#0f3460'];
  else stops=pick(rng,skyMap[c.time]||skyMap.day);
  c.sky=stops;

  // ألوان الأرض
  const groundMap={
    desert:['#e0b070','#c98f4a','#a8763e'], forest:['#2e7d32','#1b5e20','#388e3c'],
    ocean:['#0277bd','#01579b','#0288d1'], mountain:['#607d8b','#455a64','#78909c'],
    city:['#1c1c28','#263238','#0d0d15'], fire:['#3e1a00','#5d2a00','#2b0d00'],
    space:['#1a1a2e','#0d0d1a','#2a2a4a'], nature:['#558b2f','#33691e','#689f38'],
  };
  c.ground=pick(rng,groundMap[c.env]||groundMap.nature);
  c.ground2=pick(rng,groundMap[c.env]||groundMap.nature);

  // نجوم / جسيمات
  const nP = c.particles==='stars'?ri(rng,70,120): c.particles==='rain'?ri(rng,90,140):
             c.particles==='snow'?ri(rng,70,110): c.particles==='ember'?ri(rng,50,90):
             c.particles==='bubbles'?ri(rng,30,55): ri(rng,40,70);
  c.items.parts=[];
  for(let k=0;k<nP;k++) c.items.parts.push({x:rng(),y:rng(),r:rr(rng,0.4,2.2),v:rr(rng,0.4,1.4),tw:rng()*6.28,ph:rng()});

  // تضاريس حسب البيئة
  c.items.layers=[];
  if(c.env==='mountain'||c.env==='desert'){
    const n=ri(rng,3,5);
    for(let L=0;L<n;L++){
      const pts=[]; const seg=ri(rng,5,8);
      for(let s=0;s<=seg;s++) pts.push({x:s/seg, y:rr(rng,0.55,0.85)});
      c.items.layers.push({pts, depth:L/n, snow:c.env==='mountain'&&L<2});
    }
  }
  if(c.env==='ocean'){
    for(let L=0;L<4;L++) c.items.layers.push({wave:true, depth:L/4, amp:rr(rng,0.01,0.04), base:0.6+L*0.08});
  }
  if(c.env==='city'){
    const n=ri(rng,14,26); const b=[];
    for(let k=0;k<n;k++) b.push({x:k/n+rr(rng,-0.01,0.01), w:rr(rng,0.03,0.08), h:rr(rng,0.15,0.55), lit:rng()<0.6});
    c.items.buildings=b;
  }
  if(c.env==='forest'){
    const n=ri(rng,10,18); const t=[];
    for(let k=0;k<n;k++) t.push({x:rng(), s:rr(rng,0.4,1), shade:rng()});
    c.items.trees=t;
  }
  if(c.env==='space'){
    const n=ri(rng,2,4); const p=[];
    for(let k=0;k<n;k++) p.push({x:rr(rng,0.1,0.9),y:rr(rng,0.1,0.6),r:rr(rng,0.05,0.18),col:pick(rng,['#ff7043','#ba68c8','#4fc3f7','#ffd54f','#81c784'])});
    c.items.planets=p;
  }
  if(c.env==='fire'){ c.items.volcano={x:rr(rng,0.3,0.7), w:rr(rng,0.3,0.5), h:rr(rng,0.3,0.5)}; }

  // أجسام سماوية
  if(c.time==='night'||c.env==='space') c.items.moon={x:rr(rng,0.1,0.9),y:rr(rng,0.1,0.35),r:rr(rng,0.04,0.09)};
  else c.items.sun={x:rr(rng,0.15,0.85),y:rr(rng,0.12,0.4),r:rr(rng,0.05,0.12)};

  // ظلال (silhouettes)
  c.items.sil=[];
  const addSil=(type,x,y,s)=>c.items.sil.push({type,x,y,s});
  if(c.flags.lion&&(c.env==='desert'||c.env==='nature')) addSil('lion',rr(rng,0.2,0.8),0.78,rr(rng,0.7,1.1));
  if(c.flags.acacia&&c.env==='desert') for(let k=0;k<ri(rng,1,3);k++) addSil('acacia',rng(),rr(rng,0.7,0.82),rr(rng,0.6,1));
  if(c.flags.tree&&c.env==='forest'){} // الأشجار مرسومة كطبقة
  if(c.flags.bird) for(let k=0;k<ri(rng,3,7);k++) addSil('bird',rng(),rr(rng,0.1,0.4),rr(rng,0.4,0.9));
  if(c.flags.astronaut&&(c.env==='space'||c.env==='mountain')) addSil('astronaut',rr(rng,0.3,0.7),0.8,rr(rng,0.8,1.1));
  if(c.flags.fish&&c.env==='ocean') for(let k=0;k<ri(rng,2,5);k++) addSil('fish',rng(),rr(rng,0.5,0.85),rr(rng,0.4,0.8));
  if(c.flags.boat&&c.env==='ocean') addSil('boat',rr(rng,0.2,0.8),0.55,rr(rng,0.6,1));
  if(c.flags.castle&&(c.env==='mountain'||c.env==='nature')) addSil('castle',rr(rng,0.3,0.7),0.62,rr(rng,0.6,1));
  if(c.flags.person) addSil('person',rr(rng,0.2,0.8),0.8,rr(rng,0.7,1));

  return c;
}

// ---------- دوال رسم الظلال ----------
function drawLion(g,x,y,s,col){
  g.fillStyle=col; g.strokeStyle=col; g.lineWidth=2*s;
  g.beginPath(); g.ellipse(x,y,22*s,12*s,0,0,6.28); g.fill();           // جسم
  g.beginPath(); g.arc(x+20*s,y-8*s,9*s,0,6.28); g.fill();              // رأس
  g.beginPath(); g.arc(x+22*s,y-9*s,13*s,0,6.28); g.globalAlpha*=0.9; g.fill(); g.globalAlpha/=0.9; // mane
  g.fillRect(x-16*s,y+8*s,4*s,12*s); g.fillRect(x-4*s,y+8*s,4*s,12*s);   // أرجل
  g.fillRect(x+8*s,y+8*s,4*s,12*s); g.fillRect(x+16*s,y+8*s,4*s,12*s);
  g.beginPath(); g.moveTo(x-22*s,y); g.quadraticCurveTo(x-32*s,y-6*s,x-30*s,y-14*s); g.stroke(); // ذيل
}
function drawAcacia(g,x,y,s,col){
  g.fillStyle=col; g.fillRect(x-1.5*s,y-26*s,3*s,26*s);                 // جذع
  g.beginPath(); g.ellipse(x,y-28*s,20*s,7*s,0,0,6.28); g.fill();       // مظلة مسطحة
}
function drawTree(g,x,y,s,col){
  g.fillStyle=col; g.fillRect(x-2*s,y-10*s,4*s,10*s);
  g.beginPath(); g.moveTo(x,y-34*s); g.lineTo(x-12*s,y-8*s); g.lineTo(x+12*s,y-8*s); g.closePath(); g.fill();
}
function drawBird(g,x,y,s,col){
  g.strokeStyle=col; g.lineWidth=2*s; g.beginPath();
  g.moveTo(x-8*s,y); g.quadraticCurveTo(x-3*s,y-5*s,x,y); g.quadraticCurveTo(x+3*s,y-5*s,x+8*s,y); g.stroke();
}
function drawAstronaut(g,x,y,s,col){
  g.fillStyle=col; g.beginPath(); g.roundRect(x-7*s,y-22*s,14*s,22*s,4*s); g.fill();   // جسم
  g.beginPath(); g.arc(x,y-26*s,7*s,0,6.28); g.fill();                                 // خوذة
  g.fillStyle='rgba(120,200,255,0.5)'; g.beginPath(); g.arc(x+2*s,y-26*s,3.5*s,0,6.28); g.fill(); // زجاج
  g.fillStyle=col; g.fillRect(x-9*s,y-18*s,3*s,12*s);                                  // حقيبة
}
function drawFish(g,x,y,s,col){
  g.fillStyle=col; g.beginPath(); g.ellipse(x,y,12*s,6*s,0,0,6.28); g.fill();
  g.beginPath(); g.moveTo(x+10*s,y); g.lineTo(x+18*s,y-5*s); g.lineTo(x+18*s,y+5*s); g.closePath(); g.fill();
}
function drawBoat(g,x,y,s,col){
  g.fillStyle=col; g.beginPath(); g.moveTo(x-14*s,y); g.lineTo(x+14*s,y); g.lineTo(x+9*s,y+6*s); g.lineTo(x-9*s,y+6*s); g.closePath(); g.fill();
  g.fillRect(x-1*s,y-22*s,2*s,22*s);
  g.beginPath(); g.moveTo(x,y-22*s); g.lineTo(x+12*s,y-4*s); g.lineTo(x,y-4*s); g.closePath(); g.fill();
}
function drawCastle(g,x,y,s,col){
  g.fillStyle=col; g.fillRect(x-16*s,y-20*s,32*s,20*s);
  for(let i=-1;i<=1;i++){ g.fillRect(x+i*10*s-3*s,y-30*s,6*s,12*s); g.beginPath(); g.moveTo(x+i*10*s-3*s,y-30*s); g.lineTo(x+i*10*s,y-38*s); g.lineTo(x+i*10*s+3*s,y-30*s); g.closePath(); g.fill(); }
}
function drawPerson(g,x,y,s,col){
  g.fillStyle=col; g.beginPath(); g.arc(x,y-22*s,4*s,0,6.28); g.fill();
  g.fillRect(x-3*s,y-18*s,6*s,14*s); g.fillRect(x-3*s,y-4*s,2.5*s,10*s); g.fillRect(x+0.5*s,y-4*s,2.5*s,10*s);
}
function drawSil(g,type,x,y,s,col){
  ({lion:drawLion,acacia:drawAcacia,tree:drawTree,bird:drawBird,astronaut:drawAstronaut,
    fish:drawFish,boat:drawBoat,castle:drawCastle,person:drawPerson}[type]||(()=>{}))(g,x,y,s,col);
}

// ---------- رسم مشهد كامل عند مرحلة phase∈[0,1] ----------
function renderScene(g,w,h,c,phase){
  g.clearRect(0,0,w,h);
  g.save();
  // زوم سينمائي خفيف (Ken Burns)
  const z=1+phase*0.06;
  g.translate(w/2,h/2); g.scale(z,z); g.translate(-w/2,-h/2);

  // 1) السماء
  const grd=g.createLinearGradient(0,0,0,h);
  c.sky.forEach((col,i)=>grd.addColorStop(i/(c.sky.length-1),col));
  g.fillStyle=grd; g.fillRect(-w,-h,w*3,h*3);

  // 2) سديم للفضاء
  if(c.env==='space'){
    for(let k=0;k<3;k++){ const px=rr(mulberry32(c.seed+k),0.1,0.9)*w, py=rr(mulberry32(c.seed+k+50),0.1,0.7)*h;
      const rg=g.createRadialGradient(px,py,0,px,py,w*0.4); rg.addColorStop(0,'rgba(120,40,180,0.25)'); rg.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=rg; g.fillRect(0,0,w,h); }
  }

  // 3) الجسم السماوي (parallax بطيء)
  const cel=c.items.sun||c.items.moon;
  if(cel){
    const cx=cel.x*w + phase*8, cy=cel.y*h;
    const isMoon=!!c.items.moon;
    const rg=g.createRadialGradient(cx,cy,0,cx,cy,cel.r*w*2.2);
    rg.addColorStop(0,isMoon?'rgba(220,230,255,0.95)':'rgba(255,240,180,0.95)');
    rg.addColorStop(0.4,isMoon?'rgba(180,200,255,0.5)':'rgba(255,180,80,0.5)');
    rg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=rg; g.beginPath(); g.arc(cx,cy,cel.r*w*2.2,0,6.28); g.fill();
    g.fillStyle=isMoon?'#e8eefc':'#fff3c4'; g.beginPath(); g.arc(cx,cy,cel.r*w,0,6.28); g.fill();
    if(isMoon){ g.fillStyle=c.sky[0]; g.beginPath(); g.arc(cx+cel.r*w*0.4,cy-cel.r*w*0.2,cel.r*w*0.9,0,6.28); g.fill(); }
  }

  // 4) كواكب الفضاء
  if(c.items.planets) c.items.planets.forEach(p=>{
    const px=p.x*w+phase*4, py=p.y*h;
    const rg=g.createRadialGradient(px-p.r*w*0.3,py-p.r*w*0.3,p.r*w*0.1,px,py,p.r*w);
    rg.addColorStop(0,'#ffffff'); rg.addColorStop(0.3,p.col); rg.addColorStop(1,'rgba(0,0,0,0.6)');
    g.fillStyle=rg; g.beginPath(); g.arc(px,py,p.r*w,0,6.28); g.fill();
  });

  // 5) الأرض / التضاريس
  const horizon=h*0.62;
  if(c.env==='ocean'){
    c.items.layers.forEach(L=>{
      const base=L.base*h;
      g.fillStyle=L.depth<0.5?c.ground:c.ground2;
      g.beginPath(); g.moveTo(-10,h+10);
      for(let x=-10;x<=w+10;x+=8){ const y=base+Math.sin(x*0.02+phase*6+L.depth*10)*L.amp*h; g.lineTo(x,y); }
      g.lineTo(w+10,h+10); g.closePath(); g.fill();
    });
    // انعكاس الشمس
    if(c.items.sun){ g.globalAlpha=0.3; g.fillStyle='#fff3c4';
      for(let y=horizon;y<h;y+=6){ const ww=(y-horizon)*0.6+4; g.fillRect(c.items.sun.x*w-ww/2+Math.sin(y*0.2+phase*8)*4,y,ww,3); } g.globalAlpha=1; }
  } else if(c.items.layers.length){
    c.items.layers.forEach((L,idx)=>{
      const off=phase*(10+idx*18)*(L.depth); // parallax
      g.fillStyle=idx%2?c.ground:c.ground2;
      g.beginPath(); g.moveTo(-10,h+10);
      L.pts.forEach(p=>g.lineTo(p.x*w - off, p.y*h));
      g.lineTo(w+10,h+10); g.closePath(); g.fill();
      if(L.snow){ g.fillStyle='rgba(255,255,255,0.85)';
        g.beginPath(); L.pts.forEach((p,i)=>{ const x=p.x*w-off,y=p.y*h; i===0?g.moveTo(x,y):g.lineTo(x,y); });
        L.pts.slice().reverse().forEach((p,i)=>g.lineTo(p.x*w-off, p.y*h+ (i<2? -h*0.04:0))); g.closePath(); g.fill(); }
    });
  } else if(c.env==='city'){
    g.fillStyle=c.ground; g.fillRect(0,horizon,w,h-horizon);
    c.items.buildings.forEach(b=>{
      const bx=b.x*w - phase*12, bw=b.w*w, bh=b.h*h;
      g.fillStyle='#0a0a14'; g.fillRect(bx,horizon-bh,bw,bh+h);
      if(b.lit){ g.fillStyle=c.env==='city'?'#ffd54f':'#fff';
        for(let wy=horizon-bh+6;wy<horizon-4;wy+=10) for(let wx=bx+3;wx<bx+bw-3;wx+=8) if(((wx*wy)|0)%3===0) g.fillRect(wx,wy,3,4); }
    });
    // توهج نيون
    const ng=g.createLinearGradient(0,horizon-40,0,horizon); ng.addColorStop(0,'rgba(255,45,149,0)'); ng.addColorStop(1,'rgba(255,45,149,0.25)');
    g.fillStyle=ng; g.fillRect(0,horizon-40,w,40);
  } else if(c.env==='forest'){
    g.fillStyle=c.ground; g.fillRect(0,horizon,w,h-horizon);
    c.items.trees.forEach(t=>{ const tx=t.x*w - phase*20*t.s, ty=horizon+ (1-t.s)*h*0.1;
      drawTree(g,tx,ty,t.s*1.2, t.shade>0.5?'#1b5e20':'#2e7d32'); });
  } else if(c.env==='fire'){
    g.fillStyle=c.ground; g.fillRect(0,horizon,w,h-horizon);
    const v=c.items.volcano, vx=v.x*w, vw=v.w*w, vh=v.h*h;
    g.fillStyle='#1a0d00'; g.beginPath(); g.moveTo(vx-vw,horizon+40); g.lineTo(vx,horizon-vh); g.lineTo(vx+vw,horizon+40); g.closePath(); g.fill();
    const fg=g.createRadialGradient(vx,horizon-vh,0,vx,horizon-vh,vw); fg.addColorStop(0,'rgba(255,120,0,0.9)'); fg.addColorStop(1,'rgba(255,0,0,0)');
    g.fillStyle=fg; g.beginPath(); g.arc(vx,horizon-vh,vw,0,6.28); g.fill();
  } else { // nature / desert أرض بسيطة
    g.fillStyle=c.ground; g.fillRect(0,horizon,w,h-horizon);
    g.fillStyle=c.ground2; g.beginPath(); g.moveTo(0,horizon);
    for(let x=0;x<=w;x+=20) g.lineTo(x,horizon+Math.sin(x*0.01+c.seed)*8);
    g.lineTo(w,h); g.lineTo(0,h); g.fill();
  }

  // 6) الظلال
  c.items.sil.forEach(s=>{ const sx=s.x*w - phase*14, sy=s.y*h; drawSil(g,s.type,sx,sy,s.s,'rgba(10,8,6,0.9)'); });

  // 7) الجسيمات
  g.save();
  c.items.parts.forEach(p=>{
    const px=p.x*w, baseY=p.y;
    if(c.particles==='stars'){ const a=0.4+0.6*Math.abs(Math.sin(phase*6+p.tw)); g.globalAlpha=a; g.fillStyle='#fff'; g.beginPath(); g.arc(px,baseY*h,p.r,0,6.28); g.fill(); }
    else if(c.particles==='rain'){ const y=((baseY+phase*p.v*2)%1)*h; g.globalAlpha=0.5; g.strokeStyle='#bcd'; g.lineWidth=1; g.beginPath(); g.moveTo(px,y); g.lineTo(px-3,y+10); g.stroke(); }
    else if(c.particles==='snow'){ const y=((baseY+phase*p.v)%1)*h; const x=px+Math.sin(phase*4+p.tw)*10; g.globalAlpha=0.85; g.fillStyle='#fff'; g.beginPath(); g.arc(x,y,p.r,0,6.28); g.fill(); }
    else if(c.particles==='ember'){ const y=((baseY-phase*p.v*1.5)%1+1)%1*h; const x=px+Math.sin(phase*5+p.tw)*8; g.globalAlpha=y/h; g.fillStyle=pick(mulberry32(p.tw*100|0),['#ff6d00','#ffd54f','#ff3d00']); g.beginPath(); g.arc(x,y,p.r,0,6.28); g.fill(); }
    else if(c.particles==='bubbles'){ const y=((baseY-phase*p.v)%1+1)%1*h; g.globalAlpha=0.5; g.strokeStyle='#cfe'; g.lineWidth=1; g.beginPath(); g.arc(px+Math.sin(phase*3+p.tw)*6,y,p.r+1,0,6.28); g.stroke(); }
    else { const y=((baseY+phase*p.v*0.3)%1)*h; g.globalAlpha=0.25; g.fillStyle='#fff'; g.beginPath(); g.arc(px+Math.sin(phase*2+p.tw)*15,y,p.r*0.8,0,6.28); g.fill(); }
  });
  g.restore();

  // 8) vignette
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.8); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.45)');
  g.fillStyle=vg; g.fillRect(0,0,w,h);

  g.restore();
}

// ---------- 1) توليد المشاهد (فوري، محلي) ----------
generateBtn.addEventListener('click',()=>{
  const prompt=promptInput.value.trim();
  const n=parseInt(numImagesInput.value)||4;
  if(!prompt){ alert('اكتب وصفاً أولاً'); return; }
  stopRequested=false;
  const ap=analyzePrompt(prompt);
  scenes=[]; imagesPreview.innerHTML='';
  for(let i=0;i<n;i++){
    const c=buildScene(i,ap,prompt);
    scenes.push(c);
    // thumbnail محلي
    const tc=document.createElement('canvas'); tc.width=160; tc.height=90;
    renderScene(tc.getContext('2d'),160,90,c,0.35);
    const el=document.createElement('img'); el.src=tc.toDataURL();
    imagesPreview.appendChild(el);
  }
  status.textContent=`✅ تولّدوا ${scenes.length} مشهد محلي! (بيئة: ${ap.env} · وقت: ${ap.time} · جسيمات: ${ap.particles}) — دابا اضغط "إنشاء الفيديو".`;
  createVideoBtn.disabled=false;
  downloadLink.style.display='none';
});

// ---------- 2) إنشاء الفيديو (تسجيل Canvas) ----------
createVideoBtn.addEventListener('click',()=>{
  if(scenes.length===0) return;
  recordedChunks=[]; stopRequested=false;
  createVideoBtn.disabled=true;
  status.textContent='🎬 جاري تسجيل الفيديو...';
  const dur=parseInt(durationInput.value)||2, fps=30;
  const perScene=dur*fps, total=scenes.length*perScene;
  let frame=0;
  const stream=outputCanvas.captureStream(fps);
  let mime='video/webm; codecs=vp9';
  if(!MediaRecorder.isTypeSupported(mime)) mime='video/webm';
  mediaRecorder=new MediaRecorder(stream,{mimeType:mime});
  mediaRecorder.ondataavailable=e=>{ if(e.data.size>0) recordedChunks.push(e.data); };
  mediaRecorder.onstop=()=>{
    const blob=new Blob(recordedChunks,{type:'video/webm'});
    const u=URL.createObjectURL(blob);
    downloadLink.href=u; downloadLink.download='local-video.webm';
    downloadLink.style.display='inline-block';
    status.textContent='✅ الفيديو جاهز! حمّلو من الزر الأخضر. 🎉';
    createVideoBtn.disabled=false;
  };
  mediaRecorder.start();
  (function loop(){
    if(stopRequested){ mediaRecorder.stop(); return; }
    if(frame>=total){ mediaRecorder.stop(); return; }
    const idx=Math.min(Math.floor(frame/perScene),scenes.length-1);
    const lp=(frame%perScene)/perScene;
    renderScene(ctx,outputCanvas.width,outputCanvas.height,scenes[idx],lp);
    // crossfade للمشهد التالي
    if(idx<scenes.length-1 && lp>0.85){
      const a=(lp-0.85)/0.15;
      ctx.save(); ctx.globalAlpha=a;
      renderScene(ctx,outputCanvas.width,outputCanvas.height,scenes[idx+1],0);
      ctx.restore();
    }
    frame++;
    status.textContent=`🎬 تسجيل... إطار ${frame}/${total}`;
    requestAnimationFrame(loop);
  })();
});

// زر إيقاف
const stopBtn=document.createElement('button');
stopBtn.textContent='⏹️ إيقاف';
stopBtn.style.cssText='margin-top:8px;padding:8px 14px;border:none;border-radius:6px;background:#cf6679;color:#000;font-weight:bold;cursor:pointer;flex:1;';
stopBtn.onclick=()=>{ stopRequested=true; status.textContent='⏹️ تم الإيقاف.'; };
document.querySelector('.buttons').after(stopBtn);
