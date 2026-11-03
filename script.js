// ===== مولّد الفيديو المحلي — بلا إنترنت، بلا كوطا، بلا مفتاح =====
const $ = id => document.getElementById(id);
const promptInput=$('promptInput'), numImagesInput=$('numImagesInput'), durationInput=$('durationInput');
const generateBtn=$('generateBtn'), createVideoBtn=$('createVideoBtn');
const status=$('status'), imagesPreview=$('imagesPreview'), outputCanvas=$('outputCanvas'), downloadLink=$('downloadLink');

// إخفاء خانة الموسيقى (ما محتاجينهاش)
const mg=$('musicToggle'); if(mg) mg.closest('.input-group').style.display='none';
const h1=document.querySelector('h1'); if(h1) h1.textContent='🎬 مولّد الفيديو المحلي (بلا إنترنت)';
const sub=document.querySelector('.subtitle'); if(sub) sub.textContent='اكتب وصفاً → مشهد متحرك على جهازك، بلا حدود';

const ctx=outputCanvas.getContext('2d');
let scenes=[], mediaRecorder=null, recordedChunks=[], stopReq=false;

// عشوائية بذرة ثابتة
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const R=(r,a,b)=>a+(b-a)*r();

// تحليل الوصف
function analyze(t){
  t=t.toLowerCase(); const has=(...w)=>w.some(x=>t.includes(x));
  let time='day';
  if(has('night','dark','moon','starry','stars'))time='night';
  else if(has('sunset','golden','dusk','evening'))time='sunset';
  else if(has('sunrise','dawn'))time='sunrise';
  let env='nature';
  if(has('city','neon','cyberpunk','street','building'))env='city';
  else if(has('ocean','sea','underwater','wave','fish','coral'))env='ocean';
  else if(has('forest','tree','jungle'))env='forest';
  else if(has('desert','savanna','sand','lion','dune'))env='desert';
  else if(has('space','galaxy','planet','astronaut','mars'))env='space';
  else if(has('mountain','snow','ice','peak','hill'))env='mountain';
  else if(has('fire','lava','volcano','ember'))env='fire';
  let part='dust';
  if(has('rain','storm'))part='rain';
  else if(has('snow','winter','ice','frost'))part='snow';
  else if(has('fire','ember','spark','volcano'))part='ember';
  else if(time==='night'||env==='space')part='stars';
  else if(env==='ocean')part='bubbles';
  const sil=[];
  if(has('lion')&&(env==='desert'||env==='nature'))sil.push('lion');
  if(has('bird','eagle','flock'))sil.push('bird');
  if(has('astronaut','cosmonaut'))sil.push('astronaut');
  if(has('fish')&&env==='ocean')sil.push('fish');
  if(has('boat','ship','sail')&&env==='ocean')sil.push('boat');
  if(has('person','man','woman','figure','silhouette'))sil.push('person');
  if(has('tree','forest','jungle')&&env!=='forest')sil.push('tree');
  return {time,env,part,sil};
}

// بناء تكوين مشهد
function build(i,a,prompt){
  const r=rng32((hash(prompt)+i*7919)>>>0);
  const sky={
    day:['#3a7bd5','#8ecae6'], sunset:['#2b1055','#7597de','#f7797d','#fbd786'],
    sunrise:['#ff9966','#ff5e62'], night:['#0f2027','#203a43','#2c5364']
  }[a.time]||['#3a7bd5','#8ecae6'];
  const ground={
    desert:'#c98f4a',forest:'#2e7d32',ocean:'#0277bd',mountain:'#5d6d7e',
    city:'#1a1a2e',fire:'#3e1a00',space:'#1a1a2e',nature:'#558b2f'
  }[a.env]||'#558b2f';
  const parts=[]; const n=a.part==='stars'?90:a.part==='rain'?120:a.part==='snow'?90:a.part==='ember'?60:a.part==='bubbles'?40:50;
  for(let k=0;k<n;k++)parts.push({x:r(),y:r(),sz:R(r,0.5,2.5),sp:R(r,0.3,1.2),tw:r()*6.28});
  // تضاريس
  const hills=[]; if(a.env==='mountain'||a.env==='desert'){for(let L=0;L<3;L++){const pts=[];for(let s=0;s<=6;s++)pts.push({x:s/6,y:R(r,0.5,0.8)});hills.push({pts,d:L});}}
  // مباني المدينة
  const blds=[]; if(a.env==='city'){for(let k=0;k<18;k++)blds.push({x:k/18+R(r,-0.01,0.01),w:R(r,0.03,0.07),h:R(r,0.15,0.5)});}
  // أشجار الغابة
  const trs=[]; if(a.env==='forest'){for(let k=0;k<14;k++)trs.push({x:r(),s:R(r,0.5,1)});}
  // كواكب الفضاء
  const plns=[]; if(a.env==='space'){for(let k=0;k<3;k++)plns.push({x:R(r,0.1,0.9),y:R(r,0.1,0.5),rad:R(r,0.04,0.15),col:['#ff7043','#ba68c8','#4fc3f7','#ffd54f'][Math.floor(r()*4)]});}
  const sun=a.time==='night'||a.env==='space'?null:{x:R(r,0.15,0.85),y:R(r,0.12,0.35),rad:R(r,0.05,0.1)};
  const moon=(a.time==='night'||a.env==='space')?{x:R(r,0.1,0.9),y:R(r,0.1,0.3),rad:R(r,0.04,0.08)}:null;
  return {...a,sky,ground,parts,hills,blds,trs,plns,sun,moon,seed:(hash(prompt)+i)>>>0};
}

// رسم ظل
function sil(g,type,x,y,s,col){
  g.fillStyle=col; g.strokeStyle=col; g.lineWidth=2*s;
  if(type==='lion'){g.beginPath();g.ellipse(x,y,20*s,11*s,0,0,6.3);g.fill();g.beginPath();g.arc(x+18*s,y-7*s,8*s,0,6.3);g.fill();g.fillRect(x-14*s,y+7*s,4*s,11*s);g.fillRect(x+6*s,y+7*s,4*s,11*s);}
  else if(type==='bird'){g.beginPath();g.moveTo(x-7*s,y);g.quadraticCurveTo(x-3*s,y-5*s,x,y);g.quadraticCurveTo(x+3*s,y-5*s,x+7*s,y);g.stroke();}
  else if(type==='astronaut'){g.beginPath();g.arc(x,y-20*s,6*s,0,6.3);g.fill();g.fillRect(x-5*s,y-14*s,10*s,16*s);}
  else if(type==='fish'){g.beginPath();g.ellipse(x,y,11*s,5*s,0,0,6.3);g.fill();g.beginPath();g.moveTo(x+9*s,y);g.lineTo(x+16*s,y-4*s);g.lineTo(x+16*s,y+4*s);g.fill();}
  else if(type==='boat'){g.beginPath();g.moveTo(x-12*s,y);g.lineTo(x+12*s,y);g.lineTo(x+8*s,y+5*s);g.lineTo(x-8*s,y+5*s);g.fill();g.fillRect(x-1*s,y-18*s,2*s,18*s);}
  else if(type==='person'){g.beginPath();g.arc(x,y-20*s,4*s,0,6.3);g.fill();g.fillRect(x-3*s,y-16*s,6*s,13*s);}
  else if(type==='tree'){g.fillRect(x-2*s,y-8*s,4*s,8*s);g.beginPath();g.moveTo(x,y-30*s);g.lineTo(x-10*s,y-6*s);g.lineTo(x+10*s,y-6*s);g.fill();}
}

// رسم مشهد كامل عند phase 0..1
function draw(g,w,h,c,ph){
  g.clearRect(0,0,w,h);
  g.save();
  const z=1+ph*0.06; g.translate(w/2,h/2); g.scale(z,z); g.translate(-w/2,-h/2);
  // سماء
  const gr=g.createLinearGradient(0,0,0,h); c.sky.forEach((col,i)=>gr.addColorStop(i/(c.sky.length-1),col));
  g.fillStyle=gr; g.fillRect(-w,-h,w*3,h*3);
  // سديم فضائي
  if(c.env==='space'){for(let k=0;k<2;k++){const px=R(rng32(c.seed+k),0.1,0.9)*w,py=R(rng32(c.seed+k+9),0.1,0.6)*h;const rg=g.createRadialGradient(px,py,0,px,py,w*0.35);rg.addColorStop(0,'rgba(150,60,200,0.3)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(0,0,w,h);}}
  // شمس/قمر
  const cel=c.sun||c.moon;
  if(cel){const cx=cel.x*w+ph*6,cy=cel.y*h;const rg=g.createRadialGradient(cx,cy,0,cx,cy,cel.rad*w*2);rg.addColorStop(0,c.sun?'rgba(255,240,170,0.9)':'rgba(220,230,255,0.9)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.beginPath();g.arc(cx,cy,cel.rad*w*2,0,6.3);g.fill();g.fillStyle=c.sun?'#fff3c4':'#e8eefc';g.beginPath();g.arc(cx,cy,cel.rad*w,0,6.3);g.fill();if(c.moon){g.fillStyle=c.sky[0];g.beginPath();g.arc(cx+cel.rad*w*0.4,cy-cel.rad*w*0.2,cel.rad*w*0.85,0,6.3);g.fill();}}
  // كواكب
  c.plns.forEach(p=>{const px=p.x*w+ph*3,py=p.y*h;const rg=g.createRadialGradient(px-p.rad*w*0.3,py-p.rad*w*0.3,0,px,py,p.rad*w);rg.addColorStop(0,'#fff');rg.addColorStop(0.3,p.col);rg.addColorStop(1,'rgba(0,0,0,0.5)');g.fillStyle=rg;g.beginPath();g.arc(px,py,p.rad*w,0,6.3);g.fill();});
  const hor=h*0.62;
  // محيط
  if(c.env==='ocean'){for(let L=0;L<4;L++){const base=(0.6+L*0.08)*h;g.fillStyle=L%2?c.ground:'#01579b';g.beginPath();g.moveTo(-10,h+10);for(let x=-10;x<=w+10;x+=8)g.lineTo(x,base+Math.sin(x*0.02+ph*6+L)*0.02*h);g.lineTo(w+10,h+10);g.fill();}}
  // تلال
  else if(c.hills.length){c.hills.forEach((H,idx)=>{const off=ph*(8+idx*14);g.fillStyle=idx%2?c.ground:'#8d6e63';g.beginPath();g.moveTo(-10,h+10);H.pts.forEach(p=>g.lineTo(p.x*w-off,p.y*h));g.lineTo(w+10,h+10);g.fill();});}
  // مدينة
  else if(c.env==='city'){g.fillStyle=c.ground;g.fillRect(0,hor,w,h-hor);c.blds.forEach(b=>{const bx=b.x*w-ph*10,bw=b.w*w,bh=b.h*h;g.fillStyle='#0a0a14';g.fillRect(bx,hor-bh,bw,bh+h);g.fillStyle='#ffd54f';for(let wy=hor-bh+5;wy<hor-3;wy+=9)for(let wx=bx+2;wx<bx+bw-2;wx+=7)if(((wx*wy)|0)%3===0)g.fillRect(wx,wy,2,3);});}
  // غابة
  else if(c.env==='forest'){g.fillStyle=c.ground;g.fillRect(0,hor,w,h-hor);c.trs.forEach(t=>sil(g,'tree',t.x*w-ph*16,hor+(1-t.s)*h*0.08,t.s*1.1,t.s>0.7?'#1b5e20':'#2e7d32'));}
  // بركان
  else if(c.env==='fire'){g.fillStyle=c.ground;g.fillRect(0,hor,w,h-hor);const vx=w*0.5;g.fillStyle='#1a0d00';g.beginPath();g.moveTo(vx-w*0.3,hor+30);g.lineTo(vx,hor-h*0.35);g.lineTo(vx+w*0.3,hor+30);g.fill();const fg=g.createRadialGradient(vx,hor-h*0.35,0,vx,hor-h*0.35,w*0.2);fg.addColorStop(0,'rgba(255,120,0,0.9)');fg.addColorStop(1,'rgba(255,0,0,0)');g.fillStyle=fg;g.beginPath();g.arc(vx,hor-h*0.35,w*0.2,0,6.3);g.fill();}
  // طبيعة/صحراء
  else{g.fillStyle=c.ground;g.fillRect(0,hor,w,h-hor);}
  // ظلال
  c.sil.forEach((tp,k)=>{const r=rng32(c.seed+k*31);sil(g,tp,R(r,0.2,0.8)*w-ph*12,hor*R(r,0.85,1),R(r,0.7,1.1),'rgba(8,6,4,0.92)');});
  // جسيمات
  g.save();
  c.parts.forEach(p=>{
    if(c.part==='stars'){g.globalAlpha=0.4+0.6*Math.abs(Math.sin(ph*6+p.tw));g.fillStyle='#fff';g.beginPath();g.arc(p.x*w,p.y*h*0.6,p.sz,0,6.3);g.fill();}
    else if(c.part==='rain'){const y=((p.y+ph*p.sp*2)%1)*h;g.globalAlpha=0.5;g.strokeStyle='#bcd';g.lineWidth=1;g.beginPath();g.moveTo(p.x*w,y);g.lineTo(p.x*w-3,y+9);g.stroke();}
    else if(c.part==='snow'){const y=((p.y+ph*p.sp)%1)*h;g.globalAlpha=0.85;g.fillStyle='#fff';g.beginPath();g.arc(p.x*w+Math.sin(ph*4+p.tw)*8,y,p.sz,0,6.3);g.fill();}
    else if(c.part==='ember'){const y=((p.y-ph*p.sp)%1+1)%1*h;g.globalAlpha=1-y/h;g.fillStyle='#ff6d00';g.beginPath();g.arc(p.x*w+Math.sin(ph*5+p.tw)*6,y,p.sz,0,6.3);g.fill();}
    else if(c.part==='bubbles'){const y=((p.y-ph*p.sp)%1+1)%1*h;g.globalAlpha=0.5;g.strokeStyle='#cfe';g.lineWidth=1;g.beginPath();g.arc(p.x*w+Math.sin(ph*3+p.tw)*5,y,p.sz+1,0,6.3);g.stroke();}
    else{const y=((p.y+ph*p.sp*0.3)%1)*h;g.globalAlpha=0.25;g.fillStyle='#fff';g.beginPath();g.arc(p.x*w+Math.sin(ph*2+p.tw)*12,y,p.sz*0.7,0,6.3);g.fill();}
  });
  g.restore();
  // vignette
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.8);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.4)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.restore();
}

// 1) توليد المشاهد (فوري)
generateBtn.addEventListener('click',()=>{
  const prompt=promptInput.value.trim(); const n=parseInt(numImagesInput.value)||4;
  if(!prompt){alert('اكتب وصفاً أولاً');return;}
  stopReq=false; const a=analyze(prompt); scenes=[]; imagesPreview.innerHTML='';
  for(let i=0;i<n;i++){
    const c=build(i,a,prompt); scenes.push(c);
    const tc=document.createElement('canvas'); tc.width=160; tc.height=90;
    draw(tc.getContext('2d'),160,90,c,0.35);
    const el=document.createElement('img'); el.src=tc.toDataURL(); imagesPreview.appendChild(el);
  }
  status.textContent=`✅ تولّدوا ${scenes.length} مشهد محلي! (بيئة:${a.env} وقت:${a.time} جسيمات:${a.part}) — اضغط "إنشاء الفيديو".`;
  createVideoBtn.disabled=false; downloadLink.style.display='none';
});

// 2) إنشاء الفيديو
createVideoBtn.addEventListener('click',()=>{
  if(!scenes.length)return;
  recordedChunks=[]; stopReq=false; createVideoBtn.disabled=true; status.textContent='🎬 جاري التسجيل...';
  const dur=parseInt(durationInput.value)||2, fps=30, per=dur*fps, total=scenes.length*per;
  let fr=0;
  const stream=outputCanvas.captureStream(fps);
  let mime='video/webm; codecs=vp9'; if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  mediaRecorder=new MediaRecorder(stream,{mimeType:mime});
  mediaRecorder.ondataavailable=e=>{if(e.data.size>0)recordedChunks.push(e.data);};
  mediaRecorder.onstop=()=>{
    const blob=new Blob(recordedChunks,{type:'video/webm'}); const u=URL.createObjectURL(blob);
    downloadLink.href=u; downloadLink.download='local-video.webm'; downloadLink.style.display='inline-block';
    status.textContent='✅ الفيديو جاهز! حمّلو من الزر الأخضر 🎉'; createVideoBtn.disabled=false;
  };
  mediaRecorder.start();
  (function loop(){
    if(stopReq||fr>=total){mediaRecorder.stop();return;}
    const idx=Math.min(Math.floor(fr/per),scenes.length-1), lp=(fr%per)/per;
    draw(ctx,outputCanvas.width,outputCanvas.height,scenes[idx],lp);
    if(idx<scenes.length-1&&lp>0.85){g_alpha=(lp-0.85)/0.15;ctx.save();ctx.globalAlpha=g_alpha;draw(ctx,outputCanvas.width,outputCanvas.height,scenes[idx+1],0);ctx.restore();}
    fr++; status.textContent=`🎬 تسجيل... إطار ${fr}/${total}`; requestAnimationFrame(loop);
  })();
});

// زر إيقاف
const sb=document.createElement('button'); sb.textContent='⏹️ إيقاف';
sb.style.cssText='margin-top:8px;padding:10px;border:none;border-radius:6px;background:#cf6679;color:#000;font-weight:bold;cursor:pointer;width:100%;';
sb.onclick=()=>{stopReq=true;status.textContent='⏹️ تم الإيقاف.';};
document.querySelector('.buttons').after(sb);
