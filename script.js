// ============ استوديو الكرتون — عائلة الشخصيات الكاملة ============
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
function smile(g,x,y,w){g.strokeStyle='#1a1208';g.lineWidth=1.4;g.lineCap='round';g.beginPath();g.arc(x,y,w,0.2,2.9);g.stroke();}

// ===== الشخصيات =====
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
 
