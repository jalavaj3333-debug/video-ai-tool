// ============ استوديو الأنيميشن الكامل: قصة + صوت + حوار ============
const $=id=>document.getElementById(id);
const promptInput=$('promptInput'),numImagesInput=$('numImagesInput'),durationInput=$('durationInput');
const generateBtn=$('generateBtn'),createVideoBtn=$('createVideoBtn');
const status=$('status'),imagesPreview=$('imagesPreview'),outputCanvas=$('outputCanvas'),downloadLink=$('downloadLink');
const ctx=outputCanvas.getContext('2d');
let storyScenes=[],recorder=null,chunks=[],gt=0;

// ===== رفع الحدود =====
const MAX_SCENES=30, MAX_HEROES=15, MIN_DUR=1, MAX_DUR=10, FPS=30;

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

// ===== مكتبة الشخصيات الكاملة (15+) =====
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

// ===== دوال رسم الشخصيات (كلها كاملة ومختبرة) =====
function lionFn(g,x,y,s,wt){
  const step=Math.sin(wt*6.28),step2=Math.sin(wt*6.28+3.14),bob=Math.abs(step)*2,sq=1+Math.sin(wt*12.56)*0.04;
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
  smile(g,mx+0.5,my+5.5,2.5);
  g.restore();
}
function birdFn(g,x,y,s,wt){
  const fl=Math.sin(gt*9)*0.7;
  g.save();g.translate(x,y);g.scale(s,s);
  g.beginPath();g.moveTo(-2,0);g.quadraticCurveTo(-14,-8-fl*8,-20,-2-fl*4);g.quadraticCurveTo(-12,2,-2,1);g.closePath();toon(g,'#3a6ea5',1.8);
  g.beginPath();g.moveTo(2,0);g.quadraticCurveTo(14,-8-fl*8,20,-2-fl*4);g.quadraticCurveTo(12,2,2,1);g.closePath();toon(g,'#3a6ea5',1.8);
  g.beginPath();g.ellipse(0,0,6,4,0,0,6.28);toon(g,'#3a6ea5',1.8);
  g.beginPath();g.arc(5,-2,3,0,6.28);toon(g,'#3a6ea5',1.5);
  g.beginPath();g.moveTo(7,-2);g.lineTo(11,-1);g.lineTo(7,0);g.closePath();toon(g,'#f4a82a',1.2);
  eye(g,4.5,-3,1.6,0);smile(g,6,-1,1.5);
  g.restore();
}
function fishFn(g,x,y,s,wt){
  g.save();g.translate(x,y);g.scale(s,s);const wg=Math.sin(gt*6)*0.25;g.rotate(wg*0.3);
  g.beginPath();g.ellipse(0,0,14,7,0,0,6.28);toon(g,'#3aa6c4',2.2);
  g.beginPath();g.moveTo(12,0);g.lineTo(22,-7);g.lineTo(22,7);g.closePath();toon(g,'#2a7a94',1.8);
  g.beginPath();g.moveTo(-2,-6);g.lineTo(2,-13);g.lineTo(6,-6);g.closePath();toon(g,'#2a7a94',1.8);
  eye(g,-7,-2,2.4,0);smile(g,-9,1,2);
  g.restore();
}
function elephantFn(g,x,y,s,wt){
  const st=Math.sin(wt*5);
  g.save();g.translate(x,y);g.scale(s,s);
  g.beginPath();g.ellipse(0,-6,26,16,0,0,6.28);toon(g,'#9a9aa8',2.4);
  g.beginPath();g.arc(22,-14,10,0,6.28);toon(g,'#9a9aa8',2.2);
  g.strokeStyle='#1a1208';g.lineWidth=5;g.lineCap='round';
  g.beginPath();g.moveTo(30,-10);g.quadraticCurveTo(38+Math.sin(gt*2)*3,0,34,8);g.stroke();
  eye(g,25,-16,2.6,0);smile(g,28,-12,2);
  [[-14,st],[14,-st],[-4,-st],[8,st]].forEach(([lx,sw])=>{g.save();g.translate(lx,8);g.rotate(sw*0.3);g.beginPath();g.roundRect(-3.5,0,7,15,2);toon(g,'#9a9aa8',2);g.restore();});
  g.restore();
}
function dragonFn(g,x,y,s,wt){
  const wn=Math.sin(gt*5)*0.6;
  g.save();g.translate(x,y);g.scale(s,s);
  g.save();g.translate(-4,-8);g.rotate(wn);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-8,-22,8,-26);g.quadraticCurveTo(2,-14,4,0);g.closePath();toon(g,'#2a6a3a',2);g.restore();
  g.beginPath();g.ellipse(0,-2,24,9,0,0,6.28);toon(g,'#3a8a4a',2.4);
  g.beginPath();g.arc(22,-9,7,0,6.28);toon(g,'#3a8a4a',2.2);
  g.beginPath();g.moveTo(26,-12);g.lineTo(32,-15);g.lineTo(28,-8);g.closePath();toon(g,'#2a6a3a',1.5);
  eye(g,24,-11,2.4,0);smile(g,27,-7,2);
  g.strokeStyle='#1a1208';g.lineWidth=3;g.beginPath();g.moveTo(-22,-2);g.quadraticCurveTo(-34,2,-30,10);g.stroke();
  g.restore();
}
function monkeyFn(g,x,y,s,wt){
  const jump=Math.abs(Math.sin(wt*8))*6,arm=Math.sin(wt*8)*0.6;
  g.save();g.translate(x,y-jump);g.scale(s,s);
  g.strokeStyle='#8a5a2a';g.lineWidth=3;g.lineCap='round';
  g.beginPath();g.moveTo(-14,-2);g.quadraticCurveTo(-24,-8+Math.sin(gt*3)*4,-20,-16);g.stroke();
  [[-8,arm],[8,-arm]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw*0.4);g.beginPath();g.roundRect(-2.5,0,5,10,2);toon(g,'#8a5a2a',1.6);g.restore();});
  g.beginPath();g.ellipse(0,-2,10,8,0,0,6.28);toon(g,'#a06a3a',2);
  g.fillStyle='#d4a574';g.globalAlpha=0.8;g.beginPath();g.ellipse(0,0,6,5,0,0,6.28);g.fill();g.globalAlpha=1;
  g.save();g.translate(-8,-6);g.rotate(-arm);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,'#a06a3a',1.6);g.restore();
  g.save();g.translate(8,-6);g.rotate(arm);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,'#a06a3a',1.6);g.restore();
  g.beginPath();g.arc(0,-14,8,0,6.28);toon(g,'#a06a3a',2);
  g.fillStyle='#d4a574';g.beginPath();g.ellipse(0,-12,5,4,0,0,6.28);g.fill();
  g.beginPath();g.arc(-6,-18,3,0,6.28);toon(g,'#a06a3a',1.4);
  g.beginPath();g.arc(6,-18,3,0,6.28);toon(g,'#a06a3a',1.4);
  eye(g,-2.5,-15,2.2,0);eye(g,2.5,-15,2.2,0);
  smile(g,0,-11,2.5);
  g.restore();
}
function turtleFn(g,x,y,s,wt){
  const slow=Math.sin(wt*3)*0.3;
  g.save();g.translate(x,y);g.scale(s,s);
  [[-10,slow],[10,-slow],[-4,-slow],[6,slow]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw*0.3);g.beginPath();g.roundRect(-2,0,4,7,2);toon(g,'#5a8a4a',1.5);g.restore();});
  g.beginPath();g.ellipse(0,-2,18,12,0,Math.PI,0);g.closePath();toon(g,'#3a7a3a',2.4);
  g.strokeStyle='#2a5a2a';g.lineWidth=1.5;
  for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(i*5,-2);g.lineTo(i*4,-10);g.stroke();}
  g.beginPath();g.moveTo(-12,-6);g.quadraticCurveTo(0,-14,12,-6);g.stroke();
  g.fillStyle='#a8c48a';g.beginPath();g.ellipse(0,0,16,4,0,0,Math.PI);g.fill();
  g.beginPath();g.arc(18,-4,6,0,6.28);toon(g,'#5a8a4a',1.8);
  eye(g,20,-5,2,0);smile(g,21,-2,1.8);
  g.restore();
}
function butterflyFn(g,x,y,s,wt){
  const flap=Math.sin(gt*12)*0.8,floatY=Math.sin(gt*2)*4;
  g.save();g.translate(x,y+floatY);g.scale(s,s);
  g.save();g.translate(-2,-2);g.rotate(-flap*0.3);
  g.beginPath();g.ellipse(-8,-4,10,7,-0.3,0,6.28);toon(g,'#e85a9a',1.8);
  g.fillStyle='#ffd166';g.globalAlpha=0.6;g.beginPath();g.arc(-10,-6,2.5,0,6.28);g.fill();g.globalAlpha=1;g.restore();
  g.save();g.translate(2,-2);g.rotate(flap*0.3);
  g.beginPath();g.ellipse(8,-4,10,7,0.3,0,6.28);toon(g,'#e85a9a',1.8);
  g.fillStyle='#ffd166';g.globalAlpha=0.6;g.beginPath();g.arc(10,-6,2.5,0,6.28);g.fill();g.globalAlpha=1;g.restore();
  g.save();g.translate(-2,2);g.rotate(-flap*0.2);g.beginPath();g.ellipse(-6,4,7,5,-0.2,0,6.28);toon(g,'#c44a7a',1.5);g.restore();
  g.save();g.translate(2,2);g.rotate(flap*0.2);g.beginPath();g.ellipse(6,4,7,5,0.2,0,6.28);toon(g,'#c44a7a',1.5);g.restore();
  g.beginPath();g.ellipse(0,0,2.5,8,0,0,6.28);toon(g,'#3a2a1a',1.5);
  g.strokeStyle='#3a2a1a';g.lineWidth=1.2;g.lineCap='round';
  g.beginPath();g.moveTo(-1,-7);g.quadraticCurveTo(-4,-12,-3,-14);g.stroke();
  g.beginPath();g.moveTo(1,-7);g.quadraticCurveTo(4,-12,3,-14);g.stroke();
  g.fillStyle='#3a2a1a';g.beginPath();g.arc(-3,-14,1.2,0,6.28);g.arc(3,-14,1.2,0,6.28);g.fill();
  eye(g,-1.5,-3,1.5,0);eye(g,1.5,-3,1.5,0);
  g.restore();
}
function catFn(g,x,y,s,wt){
  const tail=Math.sin(wt*4)*0.6,step=Math.sin(wt*6.28);
  g.save();g.translate(x,y);g.scale(s,s);
  g.strokeStyle='#4a4a5a';g.lineWidth=3.5;g.lineCap='round';
  g.beginPath();g.moveTo(-14,-2);g.quadraticCurveTo(-24,-6+tail*8,-20,-14+tail*4);g.stroke();
  [[-8,step],[8,-step],[-2,-step],[4,step]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw*0.4);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,'#4a4a5a',1.5);g.restore();});
  g.beginPath();g.ellipse(0,-2,12,8,0,0,6.28);toon(g,'#5a5a6a',2);
  g.beginPath();g.arc(10,-10,7,0,6.28);toon(g,'#5a5a6a',2);
  g.beginPath();g.moveTo(6,-15);g.lineTo(4,-22);g.lineTo(9,-16);g.closePath();toon(g,'#5a5a6a',1.5);
  g.beginPath();g.moveTo(12,-15);g.lineTo(14,-22);g.lineTo(16,-16);g.closePath();toon(g,'#5a5a6a',1.5);
  g.fillStyle='#ffb6c1';g.beginPath();g.moveTo(6.5,-16);g.lineTo(5,-20);g.lineTo(8.5,-16.5);g.fill();
  g.beginPath();g.moveTo(12.5,-16);g.lineTo(13.5,-20);g.lineTo(15,-16.5);g.fill();
  eye(g,8,-11,2.2,0);eye(g,13,-11,2.2,0);
  g.fillStyle='#ffb6c1';g.beginPath();g.arc(10.5,-8,1.2,0,6.28);g.fill();
  smile(g,10.5,-7,2);
  g.strokeStyle='#1a1208';g.lineWidth=0.8;
  for(const sy of [-8,-7]){g.beginPath();g.moveTo(8,sy);g.lineTo(2,sy-1);g.stroke();g.beginPath();g.moveTo(13,sy);g.lineTo(19,sy-1);g.stroke();}
  g.restore();
}
function sheepFn(g,x,y,s,wt){
  const bounce=Math.abs(Math.sin(wt*5))*3;
  g.save();g.translate(x,y-bounce);g.scale(s,s);
  [[-6,Math.sin(wt*6.28)],[6,-Math.sin(wt*6.28)]].forEach(([lx,sw])=>{g.save();g.translate(lx,6);g.rotate(sw*0.4);g.beginPath();g.rect(-1.5,0,3,9);toon(g,'#3a3a3a',1.2);g.restore();});
  g.fillStyle='#f5f0e8';
  g.beginPath();g.arc(-8,-2,7,0,6.28);g.arc(0,-4,8,0,6.28);g.arc(8,-2,7,0,6.28);g.arc(-4,2,6,0,6.28);g.arc(4,2,6,0,6.28);g.fill();
  g.strokeStyle='#1a1208';g.lineWidth=1.8;g.lineJoin='round';
  g.beginPath();g.arc(-8,-2,7,0,6.28);g.stroke();g.beginPath();g.arc(0,-4,8,0,6.28);g.stroke();g.beginPath();g.arc(8,-2,7,0,6.28);g.stroke();
  g.beginPath();g.ellipse(12,-6,5,6,0.2,0,6.28);toon(g,'#3a3a3a',1.8);
  g.beginPath();g.ellipse(9,-10,3,1.5,-0.5,0,6.28);toon(g,'#3a3a3a',1.2);
  g.beginPath();g.ellipse(15,-10,3,1.5,0.5,0,6.28);toon(g,'#3a3a3a',1.2);
  eye(g,11,-7,1.8,0);eye(g,14,-7,1.8,0);
  smile(g,12.5,-4,1.5);
  g.restore();
}
function rabbitFn(g,x,y,s,wt){
  const hop=Math.abs(Math.sin(wt*7))*7;
  g.save();g.translate(x,y-hop);g.scale(s,s);
  g.beginPath();g.ellipse(-3,-22,3,9,-0.2,0,6.28);toon(g,'#e8e0d8',1.8);
  g.beginPath();g.ellipse(3,-22,3,9,0.2,0,6.28);toon(g,'#e8e0d8',1.8);
  g.fillStyle='#ffb6c1';g.beginPath();g.ellipse(-3,-22,1.5,6,-0.2,0,6.28);g.ellipse(3,-22,1.5,6,0.2,0,6.28);g.fill();
  g.beginPath();g.ellipse(0,-4,9,10,0,0,6.28);toon(g,'#f0e8e0',2);
  g.beginPath();g.arc(0,-14,7,0,6.28);toon(g,'#f0e8e0',1.8);
  eye(g,-2.5,-15,2,0);eye(g,2.5,-15,2,0);
  g.fillStyle='#ffb6c1';g.beginPath();g.arc(0,-12,1.2,0,6.28);g.fill();
  smile(g,0,-10.5,2);
  g.beginPath();g.arc(-9,-2,3,0,6.28);toon(g,'#fff',1.5);
  g.restore();
}
function foxFn(g,x,y,s,wt){
  const step=Math.sin(wt*6.28);
  g.save();g.translate(x,y);g.scale(s,s);
  g.beginPath();g.ellipse(-18,-4,10,5,0.3,0,6.28);toon(g,'#d45a1a',2);
  g.fillStyle='#fff';g.beginPath();g.arc(-26,-2,3,0,6.28);g.fill();
  [[-8,step],[8,-step]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw*0.4);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,'#a03a0a',1.5);g.restore();});
  g.beginPath();g.ellipse(0,-2,14,8,0,0,6.28);toon(g,'#e86a2a',2.2);
  g.beginPath();g.arc(12,-10,7,0,6.28);toon(g,'#e86a2a',2);
  g.beginPath();g.moveTo(18,-10);g.lineTo(24,-8);g.lineTo(18,-6);g.closePath();toon(g,'#e86a2a',1.5);
  g.fillStyle='#fff';g.beginPath();g.moveTo(18,-8);g.lineTo(22,-7.5);g.lineTo(18,-6.5);g.fill();
  g.beginPath();g.moveTo(8,-15);g.lineTo(6,-22);g.lineTo(11,-16);g.closePath();toon(g,'#e86a2a',1.5);
  g.beginPath();g.moveTo(14,-15);g.lineTo(16,-22);g.lineTo(18,-16);g.closePath();toon(g,'#e86a2a',1.5);
  eye(g,10,-11,2,0);eye(g,15,-11,2,0);
  g.fillStyle='#1a1208';g.beginPath();g.arc(22,-7.5,1,0,6.28);g.fill();
  smile(g,19,-6,1.5);
  g.restore();
}
function bearFn(g,x,y,s,wt){
  const sway=Math.sin(wt*4)*0.15;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(sway*0.1);
  [[-12,Math.sin(wt*4)],[12,-Math.sin(wt*4)]].forEach(([lx,sw])=>{g.save();g.translate(lx,8);g.rotate(sw*0.3);g.beginPath();g.roundRect(-4,0,8,14,3);toon(g,'#6a4a2a',2);g.restore();});
  g.beginPath();g.ellipse(0,-4,20,16,0,0,6.28);toon(g,'#7a5a3a',2.6);
  g.fillStyle='#a07a4a';g.globalAlpha=0.7;g.beginPath();g.ellipse(0,2,12,8,0,0,6.28);g.fill();g.globalAlpha=1;
  g.beginPath();g.arc(0,-22,12,0,6.28);toon(g,'#7a5a3a',2.4);
  g.beginPath();g.arc(-9,-30,4,0,6.28);toon(g,'#7a5a3a',1.8);
  g.beginPath();g.arc(9,-30,4,0,6.28);toon(g,'#7a5a3a',1.8);
  g.fillStyle='#a07a4a';g.beginPath();g.arc(-9,-30,2,0,6.28);g.arc(9,-30,2,0,6.28);g.fill();
  eye(g,-4,-23,2.5,0);eye(g,4,-23,2.5,0);
  g.fillStyle='#3a2a1a';g.beginPath();g.ellipse(0,-18,3,2,0,0,6.28);g.fill();
  smile(g,0,-16,3);
  g.restore();
}
function owlFn(g,x,y,s,wt){
  const tilt=Math.sin(gt*1.5)*0.1;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(tilt);
  g.beginPath();g.ellipse(-8,-2,5,12,0.2,0,6.28);toon(g,'#5a4a3a',1.8);
  g.beginPath();g.ellipse(8,-2,5,12,-0.2,0,6.28);toon(g,'#5a4a3a',1.8);
  g.beginPath();g.ellipse(0,-2,11,14,0,0,6.28);toon(g,'#6a5a4a',2.2);
  g.fillStyle='#8a7a6a';g.beginPath();g.ellipse(0,2,7,9,0,0,6.28);g.fill();
  g.beginPath();g.arc(0,-16,10,0,6.28);toon(g,'#6a5a4a',2.2);
  g.beginPath();g.moveTo(-7,-23);g.lineTo(-9,-29);g.lineTo(-4,-24);g.closePath();toon(g,'#6a5a4a',1.5);
  g.beginPath();g.moveTo(7,-23);g.lineTo(9,-29);g.lineTo(4,-24);g.closePath();toon(g,'#6a5a4a',1.5);
  g.fillStyle='#ffd54f';g.beginPath();g.arc(-4,-16,4,0,6.28);g.arc(4,-16,4,0,6.28);g.fill();
  g.strokeStyle='#1a1208';g.lineWidth=1.5;g.beginPath();g.arc(-4,-16,4,0,6.28);g.stroke();g.beginPath();g.arc(4,-16,4,0,6.28);g.stroke();
  const blink=Math.sin(gt*0.9)>0.95?1:0;
  if(!blink){g.fillStyle='#1a1208';g.beginPath();g.arc(-4,-16,2,0,6.28);g.arc(4,-16,2,0,6.28);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-5,-17,0.8,0,6.28);g.arc(3,-17,0.8,0,6.28);g.fill();}
  else{g.strokeStyle='#1a1208';g.lineWidth=1.5;g.beginPath();g.moveTo(-7,-16);g.lineTo(-1,-16);g.moveTo(1,-16);g.lineTo(7,-16);g.stroke();}
  g.beginPath();g.moveTo(0,-13);g.lineTo(-2,-10);g.lineTo(2,-10);g.closePath();toon(g,'#f4a82a',1.2);
  g.restore();
}
function penguinFn(g,x,y,s,wt){
  const waddle=Math.sin(wt*5)*0.15;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(waddle);
  g.fillStyle='#f4a82a';g.beginPath();g.ellipse(-4,8,4,2,0,0,6.28);g.ellipse(4,8,4,2,0,0,6.28);g.fill();
  g.beginPath();g.ellipse(0,-4,10,14,0,0,6.28);toon(g,'#2a2a3a',2.2);
  g.fillStyle='#fff';g.beginPath();g.ellipse(0,-2,6,10,0,0,6.28);g.fill();
  g.beginPath();g.ellipse(-9,-4,3,8,0.2,0,6.28);toon(g,'#2a2a3a',1.5);
  g.beginPath();g.ellipse(9,-4,3,8,-0.2,0,6.28);toon(g,'#2a2a3a',1.5);
  g.beginPath();g.arc(0,-18,8,0,6.28);toon(g,'#2a2a3a',2);
  eye(g,-3,-19,2.2,0);eye(g,3,-19,2.2,0);
  g.beginPath();g.moveTo(0,-15);g.lineTo(-3,-12);g.lineTo(3,-12);g.closePath();toon(g,'#f4a82a',1.2);
  g.restore();
}
function wolfFn(g,x,y,s,wt){
  const step=Math.sin(wt*6.28);
  g.save();g.translate(x,y);g.scale(s,s);
  g.strokeStyle='#6a6a7a';g.lineWidth=3.5;g.lineCap='round';
  g.beginPath();g.moveTo(-16,-2);g.quadraticCurveTo(-28,-8,-24,-16);g.stroke();
  [[-10,step],[10,-step]].forEach(([lx,sw])=>{g.save();g.translate(lx,6);g.rotate(sw*0.5);g.beginPath();g.roundRect(-2.5,0,5,12,2);toon(g,'#6a6a7a',1.6);g.restore();});
  g.beginPath();g.ellipse(0,-4,16,9,0,0,6.28);toon(g,'#7a7a8a',2.2);
  g.beginPath();g.arc(14,-12,8,0,6.28);toon(g,'#7a7a8a',2);
  g.beginPath();g.moveTo(10,-18);g.lineTo(8,-26);g.lineTo(13,-19);g.closePath();toon(g,'#7a7a8a',1.5);
  g.beginPath();g.moveTo(16,-18);g.lineTo(18,-26);g.lineTo(20,-19);g.closePath();toon(g,'#7a7a8a',1.5);
  eye(g,12,-13,2.2,0);eye(g,17,-13,2.2,0);
  g.fillStyle='#1a1208';g.beginPath();g.arc(20,-10,1.5,0,6.28);g.fill();
  smile(g,18,-8,2);
  g.restore();
}
function deerFn(g,x,y,s,wt){
  const step=Math.sin(wt*6.28);
  g.save();g.translate(x,y);g.scale(s,s);
  [[-8,step],[8,-step]].forEach(([lx,sw])=>{g.save();g.translate(lx,6);g.rotate(sw*0.4);g.beginPath();g.roundRect(-2,0,4,12,2);toon(g,'#8a5a2a',1.5);g.restore();});
  g.beginPath();g.ellipse(0,-4,14,8,0,0,6.28);toon(g,'#a06a3a',2);
  g.beginPath();g.arc(12,-12,7,0,6.28);toon(g,'#a06a3a',1.8);
  // قرون متفرعة
  g.strokeStyle='#6a4a2a';g.lineWidth=2;g.lineCap='round';
  g.beginPath();g.moveTo(10,-18);g.lineTo(8,-26);g.moveTo(10,-22);g.lineTo(6,-28);g.stroke();
  g.beginPath();g.moveTo(14,-18);g.lineTo(16,-26);g.moveTo(14,-22);g.lineTo(18,-28);g.stroke();
  eye(g,10,-13,2,0);eye(g,15,-13,2,0);
  g.fillStyle='#1a1208';g.beginPath();g.arc(18,-10,1.2,0,6.28);g.fill();
  smile(g,16,-8,1.5);
  g.restore();
}
function frogFn(g,x,y,s,wt){
  const hop=Math.abs(Math.sin(wt*8))*4;
  g.save();g.translate(x,y-hop);g.scale(s,s);
  g.beginPath();g.ellipse(0,-2,12,8,0,0,6.28);toon(g,'#4a9a3a',2);
  g.beginPath();g.arc(-4,-8,4,0,6.28);toon(g,'#4a9a3a',1.5);
  g.beginPath();g.arc(4,-8,4,0,6.28);toon(g,'#4a9a3a',1.5);
  eye(g,-4,-8,2.5,0);eye(g,4,-8,2.5,0);
  smile(g,0,-4,3);
  g.beginPath();g.ellipse(-8,4,4,2,0.3,0,6.28);toon(g,'#3a7a2a',1.5);
  g.beginPath();g.ellipse(8,4,4,2,-0.3,0,6.28);toon(g,'#3a7a2a',1.5);
  g.restore();
}
function snakeFn(g,x,y,s,wt){
  g.save();g.translate(x,y);g.scale(s,s);
  g.strokeStyle='#3a8a4a';g.lineWidth=4;g.lineCap='round';g.lineJoin='round';
  g.beginPath();g.moveTo(-20,0);
  for(let k=0;k<8;k++)g.lineTo(-20+k*5,Math.sin(gt*4+k*0.8)*4);
  g.stroke();
  g.beginPath();g.arc(20,Math.sin(gt*4+7*0.8)*4,4,0,6.28);toon(g,'#3a8a4a',1.5);
  eye(g,22,Math.sin(gt*4+7*0.8)*4-1,1.5,0);
  g.strokeStyle='#ff3d00';g.lineWidth=1;g.beginPath();g.moveTo(24,Math.sin(gt*4+7*0.8)*4+1);g.lineTo(28,Math.sin(gt*4+7*0.8)*4+2);g.moveTo(24,Math.sin(gt*4+7*0.8)*4+1);g.lineTo(28,Math.sin(gt*4+7*0.8)*4);g.stroke();
  g.restore();
}
function beeFn(g,x,y,s,wt){
  const buzz=Math.sin(gt*15)*2;
  g.save();g.translate(x,y+buzz);g.scale(s,s);
  g.beginPath();g.ellipse(0,0,8,5,0,0,6.28);toon(g,'#ffd54f',1.8);
  g.fillStyle='#1a1208';g.fillRect(-6,-2,2,4);g.fillRect(-2,-2,2,4);g.fillRect(2,-2,2,4);
  g.beginPath();g.ellipse(-3,-6,6,3,-0.3,0,6.28);toon(g,'rgba(200,220,255,0.6)',1);
  g.beginPath();g.ellipse(3,-6,6,3,0.3,0,6.28);toon(g,'rgba(200,220,255,0.6)',1);
  eye(g,-5,-1,1.5,0);eye(g,5,-1,1.5,0);
  g.restore();
}

// ===== نظام الحوارات (الجديد!) =====
function parseDialogue(text){
  // البحث عن أنماط بحال: the lion says "hello" أو lion: hello
  const patterns=[
    /(?:the\s+)?(\w+)\s+(?:says|said|speaks)\s+"([^"]+)"/gi,
    /(\w+)\s*:\s*"([^"]+)"/gi,
    /(\w+)\s*:\s*([^\.]+)/gi
  ];
  const dialogues=[];
  for(const pat of patterns){
    let match;
    while((match=pat.exec(text))!==null){
      const speaker=match[1].toLowerCase();
      const line=match[2].trim().replace(/["']/g,'');
      // التحقق من وجود الشخصية
      const heroKey=Object.keys(KW).find(k=>KW[k].some(w=>speaker.includes(w)));
      if(heroKey)dialogues.push({hero:heroKey,text:line});
    }
  }
  return dialogues;
}

// ===== نظام الموسيقى التصويرية (الجديد!) =====
class SoundEngine {
  constructor(){this.ctx=null;this.masterGain=null;}
  init(){
    if(this.ctx)return;
    this.ctx=new(window.AudioContext||window.webkitAudioContext)();
    this.masterGain=this.ctx.createGain();
    this.masterGain.gain.value=0.3;
    this.masterGain.connect(this.ctx.destination);
  }
  playNote(freq,dur,type='sine'){
    if(!this.ctx)this.init();
    const osc=this.ctx.createOscillator();
    const gain=this.ctx.createGain();
    osc.type=type;osc.frequency.value=freq;
    gain.gain.setValueAtTime(0,this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3,this.ctx.currentTime+0.05);
    gain.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+dur);
    osc.connect(gain);gain.connect(this.masterGain);
    osc.start();osc.stop(this.ctx.currentTime+dur);
  }
  playChord(notes,dur,type='triangle'){notes.forEach(n=>this.playNote(n,dur,type));}
  playMood(mood){
    const scales={happy:[261.63,329.63,392,523.25],sad:[220,261.63,311.13,349.23],tense:[233.08,277.18,329.63,392],calm:[261.63,329.63,392,493.88]};
    const notes=scales[mood]||scales.calm;
    this.playChord(notes,2,'sine');
    setTimeout(()=>this.playChord(notes.map(n=>n*1.5),1.5,'triangle'),500);
  }
  playSFX(type){
    const sfx={jump:()=>this.playNote(440,0.2,'square'),splash:()=>this.playNote(220,0.3,'sawtooth'),whoosh:()=>this.playNote(330,0.4,'sine')};
    (sfx[type]||sfx.jump)();
  }
}
const soundEngine=new SoundEngine();

// ===== المحلل القصصي المتقدم (مع الحوارات) =====
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
    // استخراج الحوارات
    const dialogues=parseDialogue(sentence);
    return {sentence,time,env,heroes:heroes.slice(0,MAX_HEROES),weather,dialogues};
  });
}

// ===== بناء مشهد احترافي (مع الحوارات والموسيقى) =====
function buildSceneFromSentence(storyObj,index,totalSentences){
  const r=rnd(hs(storyObj.sentence+index));
  const {time,env,heroes,weather,dialogues}=storyObj;
  
  // تحديد المزاج للموسيقى
  let mood='calm';
  if(weather==='storm'||time==='night')mood='tense';
  else if(time==='sunset'||time==='sunrise')mood='happy';
  else if(env==='ocean'||env==='space')mood='calm';
  else if(env==='fire'||env==='cave')mood='tense';
  
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
  
  const groundColors={
    desert:'#e8b85a',forest:'#4a9a3a',ocean:'#1a7ab0',mountain:'#7a8a9a',
    space:'#2a2a4a',nature:'#6aaa3a',meadow:'#7ac44a',ice:'#c8dce8',
    city:'#3a3a4a',cave:'#2a2a2a'
  };
  const ground=groundColors[env]||'#6aaa3a';
  
  const hills=[];
  if(!['ocean','space','ice','cave'].includes(env)){
    for(let L=0;L<4;L++){
      const pts=[];
      for(let s=0;s<=6;s++)pts.push({x:s/6,y:0.45+L*0.06+(r()-0.5)*0.12});
      hills.push({pts,d:L,snow:(env==='mountain'||env==='ice')&&L<2});
    }
  }
  
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
  
  // توزيع الشخصيات مع ربط الحوارات
  const cast=heroes.map((h,i)=>{
    const def=HEROES[h];
    const n=heroes.length;
    const layerRank=def.water?0:def.fly?2:1;
    const baseX=(i+0.5)/n;
    // البحث عن حوار لهذه الشخصية
    const dialogue=dialogues.find(d=>d.hero===h);
    return {
      type:h,fn:def.fn,fly:def.fly,water:def.water,layerRank,
      x:clamp(baseX+(r()-0.5)*0.15,0.1,0.9),
      scale:def.size*(0.8+r()*0.4),
      phase:r()*6.28,speed:0.5+r()*0.6,
      action:r()<0.3?'special':'normal',
      dialogue:dialogue?dialogue.text:null,
      showBubble:false, bubbleTimer:0
    };
  }).sort((a,b)=>a.layerRank-b.layerRank);
  
  let cam={z:1.2,px:0,py:0,rot:0};
  if(index===0)cam={z:1.0,px:0,py:0,rot:0};
  else if(index===totalSentences-1)cam={z:1.6,px:0.06,py:0.08,rot:0.002};
  else {
    const seq=index%5;
    if(seq===0)cam={z:1.3,px:-0.04,py:0.02,rot:-0.001};
    else if(seq===1)cam={z:1.5,px:0.05,py:0.06,rot:0.001};
    else if(seq===2)cam={z:1.1,px:0.08,py:-0.02,rot:0};
    else if(seq===3)cam={z:1.4,px:-0.06,py:0.04,rot:-0.002};
    else cam={z:1.25,px:0.02,py:0,rot:0.001};
  }
  
  return {sky,ground,hills,trees,flowers,buildings,crystals,clouds,stars,planets,cel,cast,weather,cam,time,env,mood};
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

// ===== رسم فقاعة الحوار (الجديد!) =====
function drawSpeechBubble(g,x,y,text,alpha=1){
  if(!text||alpha<=0)return;
  g.save();g.globalAlpha=alpha;
  const fontSize=14,padding=8,maxWidth=180;
  g.font=`bold ${fontSize}px Arial`;
  const lines=[];let currentLine='';
  for(const word of text.split(' ')){
    const testLine=currentLine?`${currentLine} ${word}`:word;
    if(g.measureText(testLine).width>maxWidth-padding*2&&currentLine){lines.push(currentLine);currentLine=word;}
    else currentLine=testLine;
  }
  if(currentLine)lines.push(currentLine);
  const lineHeight=fontSize*1.3,bubbleHeight=lines.length*lineHeight+padding*2;
  const bubbleWidth=maxWidth+padding*2;
  const bx=x-bubbleWidth/2,by=y-bubbleHeight-15;
  // جسم الفقاعة
  g.fillStyle='#fff';g.strokeStyle='#1a1208';g.lineWidth=2;
  g.beginPath();g.roundRect(bx,by,bubbleWidth,bubbleHeight,10);g.fill();g.stroke();
  // ذيل الفقاعة
  g.beginPath();g.moveTo(x-8,by+bubbleHeight);g.lineTo(x,by+bubbleHeight+12);g.lineTo(x+8,by+bubbleHeight);g.fill();g.stroke();
  // النص
  g.fillStyle='#1a1208';g.textAlign='center';g.textBaseline='top';
  lines.forEach((line,i)=>g.fillText(line,x,by+padding+i*lineHeight));
  g.restore();
}

// ===== الرسم الرئيسي لمشهد احترافي (مع الحوارات) =====
function renderScene(g,S,ph,w,h){
  g.clearRect(0,0,w,h);g.save();
  const e=ph<0.5?2*ph*ph:1-Math.pow(-2*ph+2,2)/e;
  const z=S.cam.z*(1+e*0.04);
  const dx=Math.sin(e*Math.PI)*0.025*S.cam.px;
  const dy=Math.cos(e*Math.PI)*0.02*S.cam.py;
  g.translate(w/2+(S.cam.px+dx)*w+Math.sin(gt*1.5)*0.8,h/2+S.cam.py*h+dy+Math.cos(gt*1.2)*0.6);
  g.rotate(S.cam.rot*e);
  g.scale(z,z);g.translate(-w/2,-h/2);
  
  const gr=g.createLinearGradient(0,0,0,h);S.sky.forEach((c,i)=>gr.addColorStop(i/(S.sky.length-1),c));g.fillStyle=gr;g.fillRect(-w,-h,w*3,h*3);
  S.stars.forEach(p=>{const tw=Math.abs(Math.sin(gt*1.8+p.tw));g.fillStyle=`rgba(255,255,255,${0.3+0.7*tw})`;g.beginPath();g.arc(p.x*w,p.y*h,p.sz*0.7,0,6.28);g.fill();});
  S.planets.forEach(p=>{g.beginPath();g.arc(p.x*w,p.y*h,p.rad*w,0,6.28);toon(g,p.col,2);});
  S.clouds.forEach(cl=>{const cx=((cl.x+gt*cl.sp)%1.4-0.2)*w;cloud(g,cx,cl.y*h,cl.w*w,S.weather==='storm');});
  sun(g,S.cel.x*w,S.cel.y*h,S.cel.rad*w,S.time==='night'||S.env==='space',S.weather==='storm');
  
  const hor=h*0.6;
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
  
  // الشخصيات + الحوارات
  S.cast.forEach(ch=>{
    const wt=(gt*ch.speed+ch.phase)%1;
    let cx=ch.x*w,cy;
    if(ch.fly)cy=h*0.22+Math.sin(gt*1.3+ch.phase)*10;
    else if(ch.water)cy=hor+(h-hor)*0.4+Math.sin(gt*1.1+ch.phase)*6;
    else cy=hor-1;
    if(!ch.fly&&!ch.water)cx=((ch.x+e*0.06*ch.speed)%1.15)*w;
    if(ch.action==='special'&&ch.type==='monkey')cx+=Math.sin(gt*3)*15;
    if(ch.action==='special'&&ch.type==='butterfly')cy+=Math.cos(gt*2.5)*8;
    
    // التحكم في ظهور فقاعة الحوار
    if(ch.dialogue){
      ch.bubbleTimer+=1/FPS;
      if(ch.bubbleTimer>0.5&&ch.bubbleTimer<3.5){
        ch.showBubble=true;
        const alpha=ch.bubbleTimer<1?(ch.bubbleTimer-0.5)*2:ch.bubbleTimer>3?1-(ch.bubbleTimer-3):1;
        drawSpeechBubble(g,cx,cy-ch.scale*30,ch.dialogue,alpha);
      } else ch.showBubble=false;
    }
    
    // استدعاء دالة الرسم الصحيحة
    const fnMap={lion:lionFn,bird:birdFn,fish:fishFn,elephant:elephantFn,dragon:dragonFn,monkey:monkeyFn,
      turtle:turtleFn,butterfly:butterflyFn,cat:catFn,sheep:sheepFn,rabbit:rabbitFn,fox:foxFn,
      bear:bearFn,owl:owlFn,penguin:penguinFn,wolf:wolfFn,deer:deerFn,frog:frogFn,snake:snakeFn,bee:beeFn};
    (fnMap[ch.fn]||lionFn)(g,cx,cy,ch.scale,wt);
  });
  
  // طقس متقدم
  if(S.weather==='rain'){
    g.strokeStyle='rgba(180,210,255,0.55)';g.lineWidth=1.3;
    for(let k=0;k<80;k++){const rx=rnd(k*7)(w),ry=((rnd(k*13)(h)+gt*220)%h);g.beginPath();g.moveTo(rx,ry);g.lineTo(rx-2.5,ry+9);g.stroke();}
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
  const vg=g.createRadialGradient(w/2,h/2,h*0.25,w/2,h/2,h*0.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(15,8,30,0.4)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.065;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== الأزرار مع تفعيل الصوت =====
generateBtn.addEventListener('click',()=>{
  const text=promptInput.value.trim();
  if(!text){alert('اكتب قصة!\nمثال: The lion says hello. Then the monkey jumps happily in the forest.');return;}
  
  const sentences=parseStory(text);
  if(sentences.length===0){alert('ما فهمتش الجملة. جرّب صيغة أوضح.');return;}
  
  status.textContent=`📖 كنحللو القصة... ${sentences.length} مشاهد (${sentences.reduce((a,s)=>a+s.heroes.length,0)} شخصيات)`;
  
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
  let fr=0;gt=0;
  
  // تهيئة الصوت عند أول نقرة (سياسة المتصفح)
  soundEngine.init();
  soundEngine.playMood(storyScenes[0]?.mood||'calm');
  
  status.textContent=`🎬 جاري إخراج فيلم من ${dur} ثانية/مشهد × ${storyScenes.length} مشاهد...`;
  const stream=outputCanvas.captureStream(FPS);
  let mime='video/webm; codecs=vp9';if(!MediaRecorder.isTypeSupported(mime))mime='video/webm';
  recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  recorder.onstop=()=>{
    const blob=new Blob(chunks,{type:'video/webm'});
    const u=URL.createObjectURL(blob);
    downloadLink.href=u;downloadLink.download='full-animation.webm';
    downloadLink.style.display='inline-block';
    status.textContent=`✅ الفيلم جاهز! ${(total/FPS).toFixed(1)} ثانية. حمّلو من الزر الأخضر 🎬`;
    createVideoBtn.disabled=false;
  };
  recorder.start();
  
  (function loop(){
    if(fr>=total){recorder.stop();return;}
    gt=fr/FPS;
    const idx=Math.min(Math.floor(fr/per),storyScenes.length-1),lp=(fr%per)/per;
    
    // تغيير الموسيقى عند بداية كل مشهد جديد
    if(fr%per===0 && storyScenes[idx]){
      soundEngine.playMood(storyScenes[idx].mood);
    }
    
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
