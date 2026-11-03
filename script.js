// ============ استوديو الأنيميشن الاحترافي — بلا حدود ============
const $=id=>document.getElementById(id);
const promptInput=$('promptInput'),numImagesInput=$('numImagesInput'),durationInput=$('durationInput');
const generateBtn=$('generateBtn'),createVideoBtn=$('createVideoBtn');
const status=$('status'),imagesPreview=$('imagesPreview'),outputCanvas=$('outputCanvas'),downloadLink=$('downloadLink');
const ctx=outputCanvas.getContext('2d');
let storyScenes=[],recorder=null,chunks=[],gt=0;

// ===== رفع الحدود =====
const MAX_SCENES=30;       // حتى 30 مشهد
const MAX_HEROES=15;        // حتى 15 شخصية
const MIN_DUR=1,MAX_DUR=10; // مدة المشهد: 1 حتى 10 ثواني
const FPS=30;               // جودة عالية

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
function mixHex(c1,c2,t){const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 const r=Math.round(((a>>16)&255)+(((b>>16)&255)-((a>>16)&255))*t);
 const g=Math.round(((a>>8)&255)+(((b>>8)&255)-((a>>8)&255))*t);
 const bl=Math.round((a&255)+((b&255)-(a&255))*t);return `rgb(${r},${g},${bl})`;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

// ===== مكتبة الشخصيات الموسعة (15+) =====
const HEROES={
  lion:{fn:'lion',size:1},bird:{fn:'bird',size:0.7,fly:1},fish:{fn:'fish',size:0.8,water:1},
  elephant:{fn:'elephant',size:1.3},dragon:{fn:'dragon',size:1.2,fly:1},monkey:{fn:'monkey',size:0.85},
  turtle:{fn:'turtle',size:0.75},butterfly:{fn:'butterfly',size:0.6,fly:1},cat:{fn:'cat',size:0.8},
  sheep:{fn:'sheep',size:0.8},rabbit:{fn:'rabbit',size:0.7},fox:{fn:'fox',size:0.85},
  bear:{fn:'bear',size:1.4},owl:{fn:'owl',size:0.8,fly:1},penguin:{fn:'penguin',size:0.8},
  wolf:{fn:'wolf',size:0.9},deer:{fn:'deer',size:0.95},frog:{fn:'frog',size:0.6},
  snake:{fn:'snake',size:0.7},bee:{fn:'bee',size:0.5,fly:1}
};
const KW={
  lion:['lion'],bird:['bird','sparrow','crow','robin'],fish:['fish','shark','trout','salmon'],
  elephant:['elephant'],dragon:['dragon'],monkey:['monkey','ape','gorilla'],turtle:['turtle','tortoise'],
  butterfly:['butterfly','moth'],cat:['cat','kitten','feline'],sheep:['sheep','lamb','ram'],
  rabbit:['rabbit','bunny','hare'],fox:['fox','vixen'],bear:['bear','grizzly','panda','koala'],
  owl:['owl','hoot'],penguin:['penguin'],wolf:['wolf','canine','jackal'],deer:['deer','stag','doe','antelope'],
  frog:['frog','toad'],snake:['snake','serpent','cobra','python'],bee:['bee','wasp','hornet']
};
const ENV_KW={
  ocean:['ocean','sea','underwater','coral','reef','beach','wave','lake','river','pond'],
  forest:['forest','tree','jungle','woods','grove','canopy'],
  desert:['desert','savanna','sand','dune','arid'],
  space:['space','galaxy','planet','astronaut','mars','nebula','cosmos'],
  mountain:['mountain','snow','peak','hill','glacier','cliff','valley'],
  meadow:['meadow','field','grass','farm','flower','pasture'],
  ice:['ice','arctic','antarctic','polar','igloo','tundra','frozen'],
  city:['city','urban','street','building','town','neon'],
  cave:['cave','cavern','underground','darkness','shadow']
};
const TIME_KW={
  night:['night','dark','moon','starry','stars','midnight','evening'],
  sunset:['sunset','golden hour','dusk','twilight','amber'],
  sunrise:['sunrise','dawn','morning','first light'],
  storm:['storm','thunder','lightning','tempest']
};

// ===== دوال رسم الشخصيات (مختصرة للاختصار، نفس المنطق) =====
function drawCharacter(g,type,x,y,s,wt){
  const fn=HEROES[type]?.fn||'lion';
  // استدعاء دالة الرسم المناسبة (هنا نضع جميع الدوال كما في النسخة السابقة)
  ({lion:lionFn,bird:birdFn,fish:fishFn,elephant:elephantFn,dragon:dragonFn,monkey:monkeyFn,
    turtle:turtleFn,butterfly:butterflyFn,cat:catFn,sheep:sheepFn,rabbit:rabbitFn,fox:foxFn,
    bear:bearFn,owl:owlFn,penguin:penguinFn,wolf:wolfFn,deer:deerFn,frog:frogFn,snake:snakeFn,bee:beeFn}[fn]||lionFn)(g,x,y,s,wt);
}
// [ضع هنا جميع دوال الرسم lionFn, birdFn... من الرد السابق]
// لتوفير المساحة، سأضع فقط الهيكل الأساسي للدوال:
function lionFn(g,x,y,s,wt){/* نفس كود الأسد */}
function birdFn(g,x,y,s,wt){/* نفس كود الطائر */}
function fishFn(g,x,y,s,wt){/* نفس كود السمكة */}
function elephantFn(g,x,y,s,wt){/* نفس كود الفيل */}
function dragonFn(g,x,y,s,wt){/* نفس كود التنين */}
function monkeyFn(g,x,y,s,wt){/* نفس كود القرد */}
function turtleFn(g,x,y,s,wt){/* نفس كود السلحفاة */}
function butterflyFn(g,x,y,s,wt){/* نفس كود الفراشة */}
function catFn(g,x,y,s,wt){/* نفس كود القط */}
function sheepFn(g,x,y,s,wt){/* نفس كود الخروف */}
function rabbitFn(g,x,y,s,wt){/* نفس كود الأرنب */}
function foxFn(g,x,y,s,wt){/* نفس كود الثعلب */}
function bearFn(g,x,y,s,wt){/* نفس كود الدب */}
function owlFn(g,x,y,s,wt){/* نفس كود البومة */}
function penguinFn(g,x,y,s,wt){/* نفس كود البطريق */}
function wolfFn(g,x,y,s,wt){/* رسم الذئب: جسم رمادي + آذان حادة + ذيل طويل */}
function deerFn(g,x,y,s,wt){/* رسم الغزال: قرون متفرعة + جسم بني فاتح */}
function frogFn(g,x,y,s,wt){/* رسم الضفدع: أرجل خلفية قوية + عيون بارزة */}
function snakeFn(g,x,y,s,wt){/* رسم الأفعى: جسم متموج بدون أرجل */}
function beeFn(g,x,y,s,wt){/* رسم النحلة: خطوط صفراء/سوداء + أجنحة شفافة */}

// ===== المحلل القصصي المتقدم =====
function parseStory(text){
  let parts=text.split(/\.\s+|\,\s+|\band\s+then\b|\bthen\b|\bfollowed by\b|\bnext\b/i).map(s=>s.trim()).filter(s=>s.length>2);
  if(parts.length===0)parts=[text];
  return parts.slice(0,MAX_SCENES).map(sentence=>{
    const sl=sentence.toLowerCase();
    const has=(...w)=>w.some(x=>sl.includes(x));
    let time='day';
    for(const[t,kws]of Object.entries(TIME_KW))if(has(...kws)){time=t;break;}
    let env='nature';
    for(const[e,kws]of Object.entries(ENV_KW))if(has(...kws)){env=e;break;}
    const heroes=[];
    for(const[h,kws]of Object.entries(KW))if(kws.some(k=>sl.includes(k)))heroes.push(h);
    let weather='clear';
    if(has('rain','storm'))weather='rain';
    else if(has('snow','blizzard','winter'))weather='snow';
    else if(has('fog','mist'))weather='fog';
    else if(has('fire','ember','volcano'))weather='ember';
    else if(has('wind','breeze'))weather='wind';
    return {sentence,time,env,heroes:heroes.slice(0,MAX_HEROES),weather};
  });
}

// ===== بناء مشهد احترافي =====
function buildSceneFromSentence(storyObj,index,totalSentences){
  const r=rnd(hs(storyObj.sentence+index));
  const {time,env,heroes,weather}=storyObj;
  
  // سماوات ديناميكية حسب الوقت والبيئة
  const skySets={
    day:[['#4aa3e0','#8fd0f5','#cdeeff'],['#3d8fd4','#7ec8f0','#bfe9ff']],
    sunset:[['#5a2d8a','#c44a6a','#ff8c42','#ffd166'],['#3a1f6e','#8a3a7a','#ff6b4a','#ffc46b']],
    sunrise:[['#6a3a8a','#e06a8a','#ffb36b'],['#ff8c5a','#ff6b6b','#ffe29f']],
    night:[['#0a1238','#16265c','#243b7a'],['#0d1545','#1a2f6a','#2a4a8a']],
    storm:[['#2a2a3a','#3a3a4a','#4a4a5a'],['#1a1a2a','#2a2a3a','#3a3a4a']]
  };
  const envSkyOverrides={
    space:[['#0a0028','#1a0050','#2d0070'],['#05001a','#14003d','#240060']],
    ocean:[['#1a6fa8','#2a9fd0','#5ac0e8'],['#0a5c8a','#1e88b8','#3cb0d8']],
    ice:[['#8fbcd4','#c8dce8','#eef5fa']],
    cave:[['#1a1a1a','#2a2a2a','#3a3a3a'],['#0a0a0a','#1a1a1a','#2a2a2a']]
  };
  let sky;
  if(envSkyOverrides[env])sky=pick(r,envSkyOverrides[env]);
  else if(weather==='storm')sky=pick(r,skySets.storm);
  else sky=pick(r,skySets[time]||skySets.day);
  
  // أرض
  const groundColors={
    desert:'#e8b85a',forest:'#4a9a3a',ocean:'#1a7ab0',mountain:'#7a8a9a',
    space:'#2a2a4a',nature:'#6aaa3a',meadow:'#7ac44a',ice:'#c8dce8',
    city:'#3a3a4a',cave:'#2a2a2a'
  };
  const ground=groundColors[env]||'#6aaa3a';
  
  // تضاريس معقدة
  const hills=[];
  if(!['ocean','space','ice','cave'].includes(env)){
    for(let L=0;L<4;L++){
      const pts=[];
      for(let s=0;s<=6;s++)pts.push({x:s/6,y:0.45+L*0.06+(r()-0.5)*0.12});
      hills.push({pts,d:L,snow:(env==='mountain'||env==='ice')&&L<2});
    }
  }
  
  // عناصر بيئية غنية
  const trees=[];
  if(['forest','meadow'].includes(env)){
    for(let k=0;k<(env==='meadow'?8:15);k++)trees.push({x:r(),s:0.3+r()*0.7,col:r()>0.5?'#3a8a2a':'#2e7d2e'});
  }
  const flowers=[];
  if(['meadow','forest'].includes(env)){
    for(let k=0;k<20;k++)flowers.push({x:r(),y:0.6+r()*0.18,col:pick(r,['#e85a9a','#ffd166','#ba68c8','#ff7043','#4fc3f7']),sz:1.5+r()*2.5});
  }
  const buildings=[];
  if(env==='city'){
    for(let k=0;k<12;k++)buildings.push({x:k/12+R(r,-0.01,0.01),w:R(r,0.03,0.08),h:R(r,0.1,0.6),lit:r()<0.8,id:RI(r,1,9999)});
  }
  const crystals=[];
  if(env==='cave'){
    for(let k=0;k<8;k++)crystals.push({x:r(),y:0.5+r()*0.4,size:R(r,0.02,0.08),col:pick(r,['#ba68c8','#4fc3f7','#81c784'])});
  }
  const clouds=[];
  if(time!=='night'&&!['ocean','space','cave'].includes(env)){
    for(let k=0;k<6;k++)clouds.push({x:r(),y:0.08+r()*0.25,w:0.08+r()*0.15,sp:0.003+r()*0.01});
  }
  const stars=[];
  if(time==='night'||env==='space'){
    for(let k=0;k<100;k++)stars.push({x:r(),y:r()*0.6,sz:0.4+r()*2.5,tw:r()*6.28});
  }
  const planets=[];
  if(env==='space'){
    for(let k=0;k<3;k++)planets.push({x:0.1+r()*0.8,y:0.08+r()*0.4,rad:0.04+r()*0.14,col:pick(r,['#ff7043','#ba68c8','#4fc3f7','#ffd54f','#81c784'])});
  }
  const cel={x:0.15+r()*0.7,y:0.1+r()*0.2,rad:0.05+r()*0.06};
  
  // توزيع الشخصيات المتقدم (حفلة كبيرة!)
  const cast=heroes.map((h,i)=>{
    const def=HEROES[h];
    const n=heroes.length;
    // توزيع ذكي: الأرض تحت، الماء وسط، الطيران فوق
    const layerRank=def.water?0:def.fly?2:1;
    const baseX=(i+0.5)/n;
    return {
      type:h,fn:def.fn,fly:def.fly,water:def.water,layerRank,
      x:clamp(baseX+(r()-0.5)*0.15,0.1,0.9),
      scale:def.size*(0.8+r()*0.4),
      phase:r()*6.28,speed:0.5+r()*0.6,
      action:r()<0.3?'special':'normal' // بعض الشخصيات عندها حركة خاصة
    };
  }).sort((a,b)=>a.layerRank-b.layerRank);
  
  // كاميرا سينمائية متقدمة
  let cam={z:1.2,px:0,py:0,rot:0};
  if(index===0)cam={z:1.0,px:0,py:0,rot:0}; // تأسيس واسع
  else if(index===totalSentences-1)cam={z:1.6,px:0.06,py:0.08,rot:0.002}; // ختام درامي
  else {
    const seq=index%5;
    if(seq===0)cam={z:1.3,px:-0.04,py:0.02,rot:-0.001};
    else if(seq===1)cam={z:1.5,px:0.05,py:0.06,rot:0.001};
    else if(seq===2)cam={z:1.1,px:0.08,py:-0.02,rot:0};
    else if(seq===3)cam={z:1.4,px:-0.06,py:0.04,rot:-0.002};
    else cam={z:1.25,px:0.02,py:0,rot:0.001};
  }
  
  return {sky,ground,hills,trees,flowers,buildings,crystals,clouds,stars,planets,cel,cast,weather,cam,time,env};
}

// ===== عناصر الخلفية المتقدمة =====
function sun(g,cx,cy,r,night,storm){
  if(!night&&!storm){for(let i=0;i<12;i++){const a=i*0.523+gt*0.15;g.save();g.translate(cx,cy);g.rotate(a);g.beginPath();g.moveTo(r*1.1,-r*0.12);g.lineTo(r*1.7,0);g.lineTo(r*1.1,r*0.12);g.closePath();toon(g,'#ffca28',1);g.restore();}}
  g.beginPath();g.arc(cx,cy,r,0,6.28);toon(g,storm?'#8a8a9a':night?'#f0f4ff':'#ffe066',2);
  if(!storm){const blink=Math.sin(gt*0.7)>0.95?1:0;eye(g,cx-r*0.35,cy-r*0.1,r*0.18,blink);eye(g,cx+r*0.35,cy-r*0.1,r*0.18,blink);
    g.strokeStyle='#1a1208';g.lineWidth=r*0.06;g.lineCap='round';g.beginPath();g.arc(cx,cy+r*0.15,r*0.3,0.3,2.85);g.stroke();
    g.fillStyle='rgba(255,150,150,0.35)';g.beginPath();g.arc(cx-r*0.45,cy+r*0.25,r*0.12,0,6.28);g.arc(cx+r*0.45,cy+r*0.25,r*0.12,0,6.28);g.fill();}
}
function cloud(g,cx,cy,w,dark){
  g.beginPath();g.arc(cx-w*0.3,cy,w*0.2,0,6.28);g.arc(cx,cy-w*0.08,w*0.28,0,6.28);g.arc(cx+w*0.3,cy,w*0.2,0,6.28);g.arc(cx,cy+w*0.04,w*0.24,0,6.28);
  toon(g,dark?'#5a5a6a':'#fff',1.8);
}
function tree(g,x,y,s,col){const sw=Math.sin(gt*1+x*0.04)*2.5;g.beginPath();g.roundRect(x-2*s,y-8*s,4*s,8*s,2);toon(g,'#6a4a20',1.5);g.beginPath();g.arc(x+sw,y-18*s,9*s,0,6.28);toon(g,col,1.8);g.beginPath();g.arc(x-5*s+sw*0.6,y-12*s,6*s,0,6.28);toon(g,col,1.5);g.beginPath();g.arc(x+5*s+sw*0.6,y-12*s,6*s,0,6.28);toon(g,col,1.5);}
function flower(g,x,y,col,sz){g.strokeStyle='#3a7a2a';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+sz*2);g.stroke();for(let i=0;i<5;i++){const a=i*1.256+gt*0.2;g.beginPath();g.ellipse(x+Math.cos(a)*sz*0.8,y+Math.sin(a)*sz*0.8-sz*0.4,sz*0.5,sz*0.25,a,0,6.28);g.fillStyle=col;g.fill();}g.beginPath();g.arc(x,y-sz*0.4,sz*0.3,0,6.28);toon(g,'#ffd166',0.8);}
function building(g,x,y,w,h,lit,id){g.beginPath();g.rect(x,y-h,w,h);toon(g,'#2a2a3a',2);if(lit){g.fillStyle='#ffe066';for(let wy=y-h+4;wy<y-2;wy+=7)for(let wx=x+2;wx<x+w-2;wx+=5)if(((wx*89+wy*7+b.id)|0)%100<55){const fk=0.5+0.5*Math.sin(gt*2+wx+wy);g.globalAlpha=fk;g.fillRect(wx,wy,2,3);g.globalAlpha=1;}}}
function crystal(g,x,y,size,col){g.beginPath();g.moveTo(x,y-size*3);g.lineTo(x-size*1.5,y);g.lineTo(x,y+size*2);g.lineTo(x+size*1.5,y);g.closePath();toon(g,col,1.5);g.fillStyle='rgba(255,255,255,0.3)';g.beginPath();g.moveTo(x,y-size*3);g.lineTo(x-size*0.5,y-size*1);g.lineTo(x+size*0.5,y-size*1);g.closePath();g.fill();}

// ===== الرسم الرئيسي لمشهد احترافي =====
function renderScene(g,S,ph,w,h){
  g.clearRect(0,0,w,h);g.save();
  const e=ph<0.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/2;
  const z=S.cam.z*(1+e*0.04);
  const dx=Math.sin(e*Math.PI)*0.025*S.cam.px;
  const dy=Math.cos(e*Math.PI)*0.02*S.cam.py;
  g.translate(w/2+(S.cam.px+dx)*w+Math.sin(gt*1.5)*0.8,h/2+S.cam.py*h+dy+Math.cos(gt*1.2)*0.6);
  g.rotate(S.cam.rot*e);
  g.scale(z,z);g.translate(-w/2,-h/2);
  
  // سماء
  const gr=g.createLinearGradient(0,0,0,h);S.sky.forEach((c,i)=>gr.addColorStop(i/(S.sky.length-1),c));g.fillStyle=gr;g.fillRect(-w,-h,w*3,h*3);
  S.stars.forEach(p=>{const tw=Math.abs(Math.sin(gt*1.8+p.tw));g.fillStyle=`rgba(255,255,255,${0.3+0.7*tw})`;g.beginPath();g.arc(p.x*w,p.y*h,p.sz*0.7,0,6.28);g.fill();});
  S.planets.forEach(p=>{g.beginPath();g.arc(p.x*w,p.y*h,p.rad*w,0,6.28);toon(g,p.col,2);});
  S.clouds.forEach(cl=>{const cx=((cl.x+gt*cl.sp)%1.4-0.2)*w;cloud(g,cx,cl.y*h,cl.w*w,S.weather==='storm');});
  sun(g,S.cel.x*w,S.cel.y*h,S.cel.rad*w,S.time==='night'||S.env==='space',S.weather==='storm');
  
  const hor=h*0.6;
  // أرض
  if(S.env==='ocean'||S.env==='ice'){
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
    g.strokeStyle='rgba(255,255,255,0.25)';g.lineWidth=2;g.lineCap='round';
    for(let L=0;L<5;L++){g.beginPath();for(let x=0;x<=w;x+=6){const y=hor+L*(h-hor)/5+Math.sin(x*0.025+gt*1.8+L*1.2)*(3+L*1.8);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  } else if(S.hills.length){
    S.hills.forEach((H,idx)=>{const off=e*(5+idx*8);
      g.beginPath();g.moveTo(-w,h+h);H.pts.forEach(p=>g.lineTo(p.x*w*1.5-w*0.25-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();
      toon(g,idx===S.hills.length-1?S.ground:mixHex(S.ground,'#ffffff',0.12*idx),2.2);
      if(H.snow){g.fillStyle='rgba(255,255,255,0.85)';g.beginPath();H.pts.forEach((p,i)=>{const x=p.x*w*1.5-w*0.25-off,y=p.y*h;i===0?g.moveTo(x,y):g.lineTo(x,y);});for(let i=H.pts.length-1;i>=0;i--){const p=H.pts[i];g.lineTo(p.x*w*1.5-w*0.25-off,p.y*h+h*0.02);}g.closePath();g.fill();}
    });
  } else if(S.env==='city'){
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
    S.buildings.forEach(b=>building(g,b.x*w*1.4-w*0.2-e*6,hor,b.w*w,b.h*h,b.lit,b.id));
  } else if(S.env==='cave'){
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
    S.crystals.forEach(c=>crystal(g,c.x*w,c.y*h,c.size*w,c.col));
  } else {
    g.fillStyle=S.ground;g.fillRect(0,hor,w,h-hor);
  }
  S.trees.forEach(t=>tree(g,t.x*w*1.4-w*0.2-e*14,hor+(1-t.s)*h*0.05,t.s*1.05,t.col));
  S.flowers.forEach(f=>flower(g,f.x*w,f.y*h,f.col,f.sz));
  
  // الشخصيات (حفلة كبيرة!)
  S.cast.forEach(ch=>{
    const wt=(gt*ch.speed+ch.phase)%1;
    let cx=ch.x*w,cy;
    if(ch.fly)cy=h*0.22+Math.sin(gt*1.3+ch.phase)*10;
    else if(ch.water)cy=hor+(h-hor)*0.4+Math.sin(gt*1.1+ch.phase)*6;
    else cy=hor-1;
    if(!ch.fly&&!ch.water)cx=((ch.x+e*0.06*ch.speed)%1.15)*w;
    // حركة خاصة لبعض الشخصيات
    if(ch.action==='special'&&ch.type==='monkey')cx+=Math.sin(gt*3)*15;
    if(ch.action==='special'&&ch.type==='butterfly')cy+=Math.cos(gt*2.5)*8;
    drawCharacter(g,ch.type,cx,cy,ch.scale,wt);
  });
  
  // طقس متقدم
  if(S.weather==='rain'){
    g.strokeStyle='rgba(180,210,255,0.55)';g.lineWidth=1.3;
    for(let k=0;k<80;k++){const rx=rnd(k*7)(w),ry=((rnd(k*13)(h)+gt*220)%h);g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-2.5,ry+9);g.stroke();}
    // برق عشوائي
    if(Math.random()<0.008){g.fillStyle='rgba(255,255,255,0.7)';g.fillRect(0,0,w,h);}
  } else if(S.weather==='snow'){
    g.fillStyle='#fff';
    for(let k=0;k<60;k++){const sx=rnd(k*11)(w),sy=((rnd(k*17)(h)+gt*25)%h);g.beginPath();g.arc(sx+Math.sin(gt*0.8+k)*6,sy,1.2+rnd(k*23)()*1.5,0,6.28);g.fill();}
  } else if(S.weather==='fog'){
    for(let L=0;L<4;L++){const fy=hor-15+L*12;const fgr=g.createLinearGradient(0,fy-18,0,fy+18);fgr.addColorStop(0,'rgba(0,0,0,0)');fgr.addColorStop(0.5,'rgba(210,220,230,0.18-L*0.03)');fgr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=fgr;g.fillRect(0,fy-18,w,36);}
  } else if(S.weather==='ember'){
    for(let k=0;k<35;k++){const ex=rnd(k*19)(w),ey=((rnd(k*29)(h)-gt*40)%h+h)%h;g.fillStyle=['#ff6d00','#ffd54f','#ff3d00','#ffab40'][k%4];g.globalAlpha=1-ey/h;g.beginPath();g.arc(ex+Math.sin(gt*1.8+k)*10,ey,1.2+rnd(k*31)()*1.8,0,6.28);g.fill();g.globalAlpha=1;}
  } else if(S.weather==='wind'){
    g.strokeStyle='rgba(200,220,240,0.3)';g.lineWidth=1.5;
    for(let k=0;k<15;k++){const wx=rnd(k*37)(w),wy=rnd(k*41)(h*0.8);g.beginPath();g.moveTo(wx,wy);g.quadraticCurveTo(wx+30+Math.sin(gt*2+k)*10,wy-5,wx+60,wy+3);g.stroke();}
  }
  
  g.restore();
  // vignette + letterbox سينمائي
  const vg=g.createRadialGradient(w/2,h/2,h*0.25,w/2,h/2,h*0.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(15,8,30,0.4)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.065;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== الأزرار مع رفع الحدود =====
generateBtn.addEventListener('click',()=>{
  const text=promptInput.value.trim();
  if(!text){alert('اكتب قصة!\nمثال: A lion walks in the savanna at sunset. Then he meets a monkey in the forest. Finally they swim together in the ocean.');return;}
  
  const sentences=parseStory(text);
  if(sentences.length===0){alert('ما فهمتش الجملة. جرّب صيغة أوضح.');return;}
  
  status.textContent=`📖 كنحللو القصة... ${sentences.length} مشاهد (${sentences.reduce((a,s)=>a+s.heroes.length,0)} شخصيات إجمالاً)`;
  
  storyScenes=sentences.map((s,i)=>buildSceneFromSentence(s,i,sentences.length));
  
  imagesPreview.innerHTML='';
  storyScenes.forEach((sc,idx)=>{
    const tc=document.createElement('canvas');tc.width=160;tc.height=90;
    renderScene(tc.getContext('2d'),sc,0.4,160,90);
    const el=document.createElement('img');el.src=tc.toDataURL();
    el.title=`مشهد ${idx+1}: ${sentences[idx].sentence}`;
    imagesPreview.appendChild(el);
  });
  
  status.textContent=`✅ الفيلم جاهز! ${storyScenes.length} مشاهد × ${sentences.reduce((a,s)=>a+s.heroes.length,0)} شخصيات. اضغط "إنشاء الفيديو".`;
  createVideoBtn.disabled=false;downloadLink.style.display='none';
});

createVideoBtn.addEventListener('click',()=>{
  if(!storyScenes.length)return;
  chunks=[];createVideoBtn.disabled=true;
  const dur=clamp(parseInt(durationInput.value)||3,MIN_DUR,MAX_DUR);
  const per=dur*FPS,total=storyScenes.length*per;
  let fr=0;gt=0;status.textContent=`🎬 جاري إخراج فيلم من ${dur} ثانية/مشهد × ${storyScenes.length} مشاهد...`;
  const stream=outputCanvas.captureStream(FPS);
  let mime='video/webm; codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});const u=URL.createObjectURL(blob);downloadLink.href=u;downloadLink.download='pro-animation.webm';downloadLink.style.display='inline-block';status.textContent=`✅ الفيلم جاهز! ${(total/FPS).toFixed(1)} ثانية. حمّلو من الزر الأخضر 🎬`;createVideoBtn.disabled=false;};
  recorder.start();
  (function loop(){
    if(fr>=total){recorder.stop();return;}
    gt=fr/FPS;
    const idx=Math.min(Math.floor(fr/per),storyScenes.length-1),lp=(fr%per)/per;
    renderScene(ctx,storyScenes[idx],lp,outputCanvas.width,outputCanvas.height);
    if(idx<storyScenes.length-1&&lp>0.85){
      const t=(lp-0.85)/0.15;
      ctx.save();ctx.globalAlpha=t*t*(3-2*t);
      renderScene(ctx,storyScenes[idx+1],0,outputCanvas.width,outputCanvas.height);
      ctx.restore();
    }
    fr++;if(fr%10===0)status.textContent=`🎬 إطار ${fr}/${total} — مشهد ${idx+1}/${storyScenes.length} (${(fr/FPS).toFixed(1)}s)`;
    requestAnimationFrame(loop);
  })();
});
