// ============ استوديو الكرتون — نسخة مختصرة ============
const $=id=>document.getElementById(id);
const promptInput=$('promptInput'),numImagesInput=$('numImagesInput'),durationInput=$('durationInput');
const generateBtn=$('generateBtn'),createVideoBtn=$('createVideoBtn');
const status=$('status'),imagesPreview=$('imagesPreview'),outputCanvas=$('outputCanvas'),downloadLink=$('downloadLink');
const ctx=outputCanvas.getContext('2d');
let scenes=[],recorder=null,chunks=[],gt=0;

function rnd(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hs(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function toon(g,fill,lw){g.fillStyle=fill;g.fill();g.strokeStyle='#1a1208';g.lineWidth=lw||2.2;g.lineJoin='round';g.stroke();}
function eye(g,x,y,r,blink){
  g.beginPath();g.ellipse(x,y,r*0.8,r,0,0,6.28);toon(g,'#fff',1.4);
  if(blink){g.strokeStyle='#1a1208';g.lineWidth=1.6;g.beginPath();g.moveTo(x-r*0.6,y);g.quadraticCurveTo(x,y+r*0.4,x+r*0.6,y);g.stroke();return;}
  g.beginPath();g.arc(x+r*0.2,y+r*0.1,r*0.45,0,6.28);toon(g,'#2a1a0a',1);
  g.fillStyle='#fff';g.beginPath();g.arc(x,y-r*0.1,r*0.16,0,6.28);g.fill();
}
function lion(g,x,y,s,wt){
  const step=Math.sin(wt*6.28),step2=Math.sin(wt*6.28+3.14);
  const bob=Math.abs(step)*2,sq=1+Math.sin(wt*12.56)*0.04;
  g.save();g.translate(x,y-bob);g.scale(s*sq,s/sq);
  g.strokeStyle='#e8a33d';g.lineWidth=4;g.lineCap='round';
  g.beginPath();g.moveTo(-22,-2);g.quadraticCurveTo(-32,-10,-28,-18);g.stroke();
  g.beginPath();g.arc(-28,-19,3.5,0,6.28);toon(g,'#3a1f08',1.5);
  [[-13,step2],[9,step2]].forEach(([lx,sw])=>{g.save();g.translate(lx,6);g.rotate(sw*0.5);g.beginPath();g.roundRect(-3,0,6,14,2);toon(g,'#c98a2e',1.8);g.restore();});
  g.beginPath();g.ellipse(-2,-3,23,12,0,0,6.28);toon(g,'#e8a33d',2.4);
  g.fillStyle='#f7d9a0';g.globalAlpha=0.7;g.beginPath();g.ellipse(-2,3,15,5,0,0,6.28);g.fill();g.globalAlpha=1;
  [[-6,step],[14,step]].forEach(([lx,sw])=>{g.save();g.translate(lx,6);g.rotate(sw*0.5);g.beginPath();g.roundRect(-3,0,6,14,2);toon(g,'#e8a33d',1.8);g.restore();});
  const mx=16,my=-13,mr=15;
  g.beginPath();
  for(let a=0;a<6.28;a+=0.2){const rr=mr+Math.sin(a*7+gt*2.5)*3;const px=mx+Math.cos(a)*rr,py=my+Math.sin(a)*rr;a===0?g.moveTo(px,py):g.lineTo(px,py);}
  g.closePath();toon(g,'#b5651d',2.4);
  g.beginPath();g.arc(mx,my,9,0,6.28);toon(g,'#e8a33d',2.2);
  g.beginPath();g.arc(mx-5,my-7,3,0,6.28);toon(g,'#b5651d',1.5);
  g.beginPath();g.arc(mx+3,my-8,3,0,6.28);toon(g,'#b5651d',1.5);
  const blink=Math.sin(gt*1.3)>0.97?1:0;
  eye(g,mx-3,my-1,2.8,blink);eye(g,mx+4,my-1,2.8,blink);
  g.beginPath();g.moveTo(mx+0.5,my+3);g.lineTo(mx-1.5,my+5);g.lineTo(mx+2.5,my+5);g.closePath();toon(g,'#5a2d0c',1.2);
  g.strokeStyle='#1a1208';g.lineWidth=1.4;g.beginPath();g.moveTo(mx+0.5,my+5);g.lineTo(mx+0.5,my+6.5);g.quadraticCurveTo(mx-2,my+8.5,mx-3.5,my+6.5);g.moveTo(mx+0.5,my+6.5);g.quadraticCurveTo(mx+3,my+8.5,mx+4.5,my+6.5);g.stroke();
  g.restore();
}
function bird(g,x,y,s){
  const fl=Math.sin(gt*9)*0.7;
  g.save();g.translate(x,y);g.scale(s,s);
  g.beginPath();g.moveTo(-2,0);g.quadraticCurveTo(-14,-8-fl*8,-20,-2-fl*4);g.quadraticCurveTo(-12,2,-2,1);g.closePath();toon(g,'#3a6ea5',1.8);
  g.beginPath();g.moveTo(2,0);g.quadraticCurveTo(14,-8-fl*8,20,-2-fl*4);g.quadraticCurveTo(12,2,2,1);g.closePath();toon(g,'#3a6ea5',1.8);
  g.beginPath();g.ellipse(0,0,6,4,0,0,6.28);toon(g,'#3a6ea5',1.8);
  g.beginPath();g.arc(5,-2,3,0,6.28);toon(g,'#3a6ea5',1.5);
  g.beginPath();g.moveTo(7,-2);g.lineTo(11,-1);g.lineTo(7,0);g.closePath();toon(g,'#f4a82a',1.2);
  eye(g,4.5,-3,1.6,0);
  g.restore();
}
function sun(g,cx,cy,r,night){
  if(!night){for(let i=0;i<10;i++){const a=i*0.628+gt*0.2;g.save();g.translate(cx,cy);g.rotate(a);g.beginPath();g.moveTo(r*1.15,-r*0.15);g.lineTo(r*1.6,0);g.lineTo(r*1.15,r*0.15);g.closePath();toon(g,'#ffca28',1.2);g.restore();}}
  g.beginPath();g.arc(cx,cy,r,0,6.28);toon(g,night?'#f0f4ff':'#ffe066',2.2);
  const blink=Math.sin(gt*0.8)>0.96?1:0;
  eye(g,cx-r*0.35,cy-r*0.1,r*0.2,blink);eye(g,cx+r*0.35,cy-r*0.1,r*0.2,blink);
  g.strokeStyle='#1a1208';g.lineWidth=r*0.07;g.lineCap='round';g.beginPath();g.arc(cx,cy+r*0.15,r*0.35,0.3,2.85);g.stroke();
  g.fillStyle='rgba(255,150,150,0.4)';g.beginPath();g.arc(cx-r*0.5,cy+r*0.25,r*0.13,0,6.28);g.arc(cx+r*0.5,cy+r*0.25,r*0.13,0,6.28);g.fill();
}
function cloud(g,cx,cy,w){
  g.beginPath();
  g.arc(cx-w*0.3,cy,w*0.22,0,6.28);g.arc(cx,cy-w*0.1,w*0.3,0,6.28);g.arc(cx+w*0.3,cy,w*0.22,0,6.28);g.arc(cx,cy+w*0.05,w*0.26,0,6.28);
  toon(g,'#fff',2);
}
function tree(g,x,y,s,col){
  const sw=Math.sin(gt*1.2+x*0.05)*2;
  g.beginPath();g.roundRect(x-2.5*s,y-9*s,5*s,9*s,2);toon(g,'#7a4a20',1.8);
  g.beginPath();g.arc(x+sw,y-20*s,10*s,0,6.28);toon(g,col,2);
  g.beginPath();g.arc(x-6*s+sw*0.7,y-14*s,7*s,0,6.28);toon(g,col,1.8);
  g.beginPath();g.arc(x+6*s+sw*0.7,y-14*s,7*s,0,6.28);toon(g,col,1.8);
}
function analyze(t){
  t=t.toLowerCase();const has=(...w)=>w.some(x=>t.includes(x));
  let time='day';
  if(has('night','dark','moon','starry','stars'))time='night';
  else if(has('sunset','golden','dusk','evening'))time='sunset';
  let env='nature';
  if(has('ocean','sea','underwater','fish','coral'))env='ocean';
  else if(has('forest','tree','jungle'))env='forest';
  else if(has('desert','savanna','sand','lion','dune'))env='desert';
  else if(has('space','galaxy','planet','astronaut','mars'))env='space';
  else if(has('mountain','snow','peak','hill'))env='mountain';
  let hero='lion';
  if(has('bird','eagle','flock'))hero='bird';
  else if(has('fish','shark'))hero='fish';
  else if(has('elephant'))hero='elephant';
  else if(has('dragon'))hero='dragon';
  return {time,env,hero};
}
function build(a,prompt){
  const r=rnd(hs(prompt));
  const sky={day:['#4aa3e0','#8fd0f5','#cdeeff'],sunset:['#5a2d8a','#c44a6a','#ff8c42','#ffd166'],night:['#0a1238','#16265c','#243b7a']}[a.time];
  const ground={desert:'#e8b85a',forest:'#4a9a3a',ocean:'#1a7ab0',mountain:'#7a8a9a',space:'#2a2a4a',nature:'#6aaa3a'}[a.env];
  const hills=[];
  if(a.env!=='ocean'&&a.env!=='space'){for(let L=0;L<3;L++){const pts=[];for(let s=0;s<=5;s++)pts.push({x:s/5,y:0.5+L*0.05+(r()-0.5)*0.1});hills.push({pts,d:L});}}
  const trees=[];if(a.env==='forest'){for(let k=0;k<10;k++)trees.push({x:r(),s:0.5+r()*0.5,col:r()>0.5?'#3a8a2a':'#2e7d2e'});}
  const clouds=[];if(a.time!=='night'&&a.env!=='ocean'&&a.env!=='space'){for(let k=0;k<4;k++)clouds.push({x:r(),y:0.1+r()*0.2,w:0.1+r()*0.12,sp:0.004+r()*0.008});}
  const stars=[];if(a.time==='night'||a.env==='space'){for(let k=0;k<70;k++)stars.push({x:r(),y:r()*0.55,sz:0.6+r()*2,tw:r()*6.28});}
  const planets=[];if(a.env==='space'){for(let k=0;k<2;k++)planets.push({x:0.1+r()*0.8,y:0.1+r()*0.35,rad:0.05+r()*0.12,col:['#ff7043','#ba68c8','#4fc3f7','#ffd54f'][Math.floor(r()*4)]});}
  const cel={x:0.2+r()*0.6,y:0.12+r()*0.18,rad:0.06+r()*0.05};
  return {...a,sky,ground,hills,trees,clouds,stars,planets,cel,seed:hs(prompt)};
}
function cams(n){
  const base=[{z:1,px:0,hs:0.75,hx:0.62},{z:1.25,px:-0.04,hs:1.05,hx:0.5},{z:1.6,px:0.05,hs:1.5,hx:0.42},{z:1.15,px:0.12,hs:0.9,hx:0.72}];
  const out=[];for(let i=0;i<n;i++)out.push(base[i%base.length]);return out;
}
function render(g,W,cam,ph,w,h){
  g.clearRect(0,0,w,h);g.save();
  const e=ph<0.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/2;
  const z=cam.z*(1+e*0.05);
  const dx=Math.sin(e*Math.PI)*0.03;
  g.translate(w/2+(cam.px+dx)*w+Math.sin(gt*1.7)*1,h/2+Math.cos(gt*1.3)*0.8);
  g.scale(z,z);g.translate(-w/2,-h/2);
  const gr=g.createLinearGradient(0,0,0,h);W.sky.forEach((c,i)=>gr.addColorStop(i/(W.sky.length-1),c));g.fillStyle=gr;g.fillRect(-w,-h,w*3,h*3);
  W.stars.forEach(p=>{const tw=Math.abs(Math.sin(gt*2+p.tw));g.fillStyle=`rgba(255,255,255,${0.4+0.6*tw})`;g.beginPath();g.arc(p.x*w,p.y*h,p.sz*0.8,0,6.28);g.fill();});
  W.planets.forEach(p=>{g.beginPath();g.arc(p.x*w,p.y*h,p.rad*w,0,6.28);toon(g,p.col,2.2);});
  W.clouds.forEach(cl=>{const cx=((cl.x+gt*cl.sp)%1.3-0.15)*w;cloud(g,cx,cl.y*h,cl.w*w);});
  sun(g,W.cel.x*w,W.cel.y*h,W.cel.rad*w,W.time==='night'||W.env==='space');
  const hor=h*0.6;
  if(W.env==='ocean'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    g.strokeStyle='rgba(255,255,255,0.3)';g.lineWidth=2.5;g.lineCap='round';
    for(let L=0;L<4;L++){g.beginPath();for(let x=0;x<=w;x+=8){const y=hor+L*(h-hor)/4+Math.sin(x*0.03+gt*2+L*1.3)*(4+L*2);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  } else if(W.hills.length){
    W.hills.forEach((H,idx)=>{const off=e*(6+idx*10);
      g.beginPath();g.moveTo(-w,h+h);H.pts.forEach(p=>g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();
      toon(g,idx===W.hills.length-1?W.ground:'#d49a3a',2.4);});
  } else if(W.env==='forest'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    W.trees.forEach(t=>tree(g,t.x*w*1.3-w*0.15-e*16,hor+(1-t.s)*h*0.06,t.s*1.1,t.col));
  } else {
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
  }
  if(W.hero==='lion')lion(g,cam.hx*w,hor-2,cam.hs,(gt*0.8)%1);
  else if(W.hero==='bird')bird(g,((0.3+e*0.4)%1)*w,h*0.22+Math.sin(gt*1.5)*6,cam.hs);
  else if(W.hero==='fish'){g.save();g.translate(cam.hx*w,hor+(h-hor)*0.45+Math.sin(gt*1.2)*4);g.scale(cam.hs,cam.hs);const wg=Math.sin(gt*6)*0.25;g.rotate(wg*0.3);g.beginPath();g.ellipse(0,0,14,7,0,0,6.28);toon(g,'#3aa6c4',2.2);g.beginPath();g.moveTo(12,0);g.lineTo(22,-7);g.lineTo(22,7);g.closePath();toon(g,'#2a7a94',1.8);eye(g,-7,-2,2.4,0);g.restore();}
  else if(W.hero==='elephant'){g.save();g.translate(cam.hx*w,hor-2);g.scale(cam.hs,cam.hs);const st=Math.sin(gt*5);g.beginPath();g.ellipse(0,-6,26,16,0,0,6.28);toon(g,'#9a9aa8',2.4);g.beginPath();g.arc(22,-14,10,0,6.28);toon(g,'#9a9aa8',2.2);g.strokeStyle='#1a1208';g.lineWidth=5;g.beginPath();g.moveTo(30,-10);g.quadraticCurveTo(38+Math.sin(gt*2)*3,0,34,8);g.stroke();eye(g,25,-16,2.6,0);[[-14,st],[14,-st]].forEach(([lx,sw])=>{g.save();g.translate(lx,8);g.rotate(sw*0.3);g.beginPath();g.roundRect(-3.5,0,7,15,2);toon(g,'#9a9aa8',2);g.restore();});g.restore();}
  else if(W.hero==='dragon'){g.save();g.translate(cam.hx*w,hor-4);g.scale(cam.hs,cam.hs);const wn=Math.sin(gt*5)*0.6;g.save();g.translate(-4,-8);g.rotate(wn);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-8,-22,8,-26);g.quadraticCurveTo(2,-14,4,0);g.closePath();toon(g,'#2a6a3a',2);g.restore();g.beginPath();g.ellipse(0,-2,24,9,0,0,6.28);toon(g,'#3a8a4a',2.4);g.beginPath();g.arc(22,-9,7,0,6.28);toon(g,'#3a8a4a',2.2);eye(g,24,-11,2.4,0);g.restore();}
  g.restore();
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,40,0.35)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.07;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}
generateBtn.addEventListener('click',()=>{
  const prompt=promptInput.value.trim();const n=parseInt(numImagesInput.value)||4;
  if(!prompt){alert('اكتب وصفاً');return;}
  const a=analyze(prompt);const W=build(a,prompt);const CM=cams(n);
  scenes=CM.map(c=>({W,cam:c}));
  imagesPreview.innerHTML='';
  scenes.forEach(s=>{const tc=document.createElement('canvas');tc.width=180;tc.height=101;render(tc.getContext('2d'),s.W,s.cam,0.4,180,101);const el=document.createElement('img');el.src=tc.toDataURL();imagesPreview.appendChild(el);});
  status.textContent=`✅ ${n} لقطات كرتونية! (بيئة:${a.env} وقت:${a.time} بطل:${a.hero})`;
  createVideoBtn.disabled=false;downloadLink.style.display='none';
});
createVideoBtn.addEventListener('click',()=>{
  if(!scenes.length)return;
  chunks=[];createVideoBtn.disabled=true;
  const dur=parseInt(durationInput.value)||2,fps=30,per=dur*fps,total=scenes.length*per;
  let fr=0;gt=0;status.textContent='🎬 جاري التسجيل...';
  const stream=outputCanvas.captureStream(fps);
  let mime='video/webm; codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});const u=URL.createObjectURL(blob);downloadLink.href=u;downloadLink.download='cartoon-video.webm';downloadLink.style.display='inline-block';status.textContent='✅ الفيديو جاهز! حمّلو 🎬';createVideoBtn.disabled=false;};
  recorder.start();
  (function loop(){
    if(fr>=total){recorder.stop();return;}
    gt=fr/fps;
    const idx=Math.min(Math.floor(fr/per),scenes.length-1),lp=(fr%per)/per;
    render(ctx,scenes[idx].W,scenes[idx].cam,lp,outputCanvas.width,outputCanvas.height);
    if(idx<scenes.length-1&&lp>0.82){const t=(lp-0.82)/0.18;ctx.save();ctx.globalAlpha=t*t*(3-2*t);render(ctx,scenes[idx+1].W,scenes[idx+1].cam,0,outputCanvas.width,outputCanvas.height);ctx.restore();}
    fr++;status.textContent=`🎬 إطار ${fr}/${total}`;
    requestAnimationFrame(loop);
  })();
});
