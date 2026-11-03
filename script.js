// ============ استوديو الكرتون الجماعي — حفلة الشخصيات ============
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
function pick(r,arr){return arr[Math.floor(r()*arr.length)];}
function mixHex(c1,c2,t){const a=parseInt(c1.slice(1),16),b=parseInt(c2.slice(1),16);
 const r=Math.round(((a>>16)&255)+(((b>>16)&255)-((a>>16)&255))*t);
 const g=Math.round(((a>>8)&255)+(((b>>8)&255)-((a>>8)&255))*t);
 const bl=Math.round((a&255)+((b&255)-(a&255))*t);return `rgb(${r},${g},${bl})`;}

// ===== الشخصيات (كلها بنفس الواجهة: g,x,y,s,wt) =====
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
  smile(g,mx+0.5,my+5.5,2.5);
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
  eye(g,4.5,-3,1.6,0);smile(g,6,-1,1.5);
  g.restore();
}
function fish(g,x,y,s){
  g.save();g.translate(x,y);g.scale(s,s);const wg=Math.sin(gt*6)*0.25;g.rotate(wg*0.3);
  g.beginPath();g.ellipse(0,0,14,7,0,0,6.28);toon(g,'#3aa6c4',2.2);
  g.beginPath();g.moveTo(12,0);g.lineTo(22,-7);g.lineTo(22,7);g.closePath();toon(g,'#2a7a94',1.8);
  g.beginPath();g.moveTo(-2,-6);g.lineTo(2,-13);g.lineTo(6,-6);g.closePath();toon(g,'#2a7a94',1.8);
  eye(g,-7,-2,2.4,0);smile(g,-9,1,2);
  g.restore();
}
function elephant(g,x,y,s,wt){
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
function dragon(g,x,y,s,wt){
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
function monkey(g,x,y,s,wt){
  const jump=Math.abs(Math.sin(wt*8))*6, arm=Math.sin(wt*8)*0.6;
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
function turtle(g,x,y,s,wt){
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
function butterfly(g,x,y,s){
  const flap=Math.sin(gt*12)*0.8, floatY=Math.sin(gt*2)*4;
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
function cat(g,x,y,s,wt){
  const tail=Math.sin(wt*4)*0.6, step=Math.sin(wt*6.28);
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
function sheep(g,x,y,s,wt){
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
function rabbit(g,x,y,s,wt){
  const hop=Math.abs(Math.sin(wt*7))*7;
  g.save();g.translate(x,y-hop);g.scale(s,s);
  // أذنين طويلين
  g.beginPath();g.ellipse(-3,-22,3,9,-0.2,0,6.28);toon(g,'#e8e0d8',1.8);
  g.beginPath();g.ellipse(3,-22,3,9,0.2,0,6.28);toon(g,'#e8e0d8',1.8);
  g.fillStyle='#ffb6c1';g.beginPath();g.ellipse(-3,-22,1.5,6,-0.2,0,6.28);g.ellipse(3,-22,1.5,6,0.2,0,6.28);g.fill();
  // جسم
  g.beginPath();g.ellipse(0,-4,9,10,0,0,6.28);toon(g,'#f0e8e0',2);
  // رأس
  g.beginPath();g.arc(0,-14,7,0,6.28);toon(g,'#f0e8e0',1.8);
  eye(g,-2.5,-15,2,0);eye(g,2.5,-15,2,0);
  g.fillStyle='#ffb6c1';g.beginPath();g.arc(0,-12,1.2,0,6.28);g.fill();
  smile(g,0,-10.5,2);
  // ذيل كرة
  g.beginPath();g.arc(-9,-2,3,0,6.28);toon(g,'#fff',1.5);
  g.restore();
}
function fox(g,x,y,s,wt){
  const step=Math.sin(wt*6.28);
  g.save();g.translate(x,y);g.scale(s,s);
  // ذيل كبير
  g.beginPath();g.ellipse(-18,-4,10,5,0.3,0,6.28);toon(g,'#d45a1a',2);
  g.fillStyle='#fff';g.beginPath();g.arc(-26,-2,3,0,6.28);g.fill();
  // أرجل
  [[-8,step],[8,-step]].forEach(([lx,sw])=>{g.save();g.translate(lx,4);g.rotate(sw*0.4);g.beginPath();g.roundRect(-2,0,4,10,2);toon(g,'#a03a0a',1.5);g.restore();});
  // جسم
  g.beginPath();g.ellipse(0,-2,14,8,0,0,6.28);toon(g,'#e86a2a',2.2);
  // رأس مدبب
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
function bear(g,x,y,s,wt){
  const sway=Math.sin(wt*4)*0.15;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(sway*0.1);
  // أرجل ضخمة
  [[-12,Math.sin(wt*4)],[12,-Math.sin(wt*4)]].forEach(([lx,sw])=>{g.save();g.translate(lx,8);g.rotate(sw*0.3);g.beginPath();g.roundRect(-4,0,8,14,3);toon(g,'#6a4a2a',2);g.restore();});
  // جسم ضخم
  g.beginPath();g.ellipse(0,-4,20,16,0,0,6.28);toon(g,'#7a5a3a',2.6);
  g.fillStyle='#a07a4a';g.globalAlpha=0.7;g.beginPath();g.ellipse(0,2,12,8,0,0,6.28);g.fill();g.globalAlpha=1;
  // رأس + أذنين
  g.beginPath();g.arc(0,-22,12,0,6.28);toon(g,'#7a5a3a',2.4);
  g.beginPath();g.arc(-9,-30,4,0,6.28);toon(g,'#7a5a3a',1.8);
  g.beginPath();g.arc(9,-30,4,0,6.28);toon(g,'#7a5a3a',1.8);
  g.fillStyle='#a07a4a';g.beginPath();g.arc(-9,-30,2,0,6.28);g.arc(9,-30,2,0,6.28);g.fill();
  eye(g,-4,-23,2.5,0);eye(g,4,-23,2.5,0);
  g.fillStyle='#3a2a1a';g.beginPath();g.ellipse(0,-18,3,2,0,0,6.28);g.fill();
  smile(g,0,-16,3);
  g.restore();
}
function owl(g,x,y,s,wt){
  const tilt=Math.sin(gt*1.5)*0.1;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(tilt);
  // أجنحة مطوية
  g.beginPath();g.ellipse(-8,-2,5,12,0.2,0,6.28);toon(g,'#5a4a3a',1.8);
  g.beginPath();g.ellipse(8,-2,5,12,-0.2,0,6.28);toon(g,'#5a4a3a',1.8);
  // جسم
  g.beginPath();g.ellipse(0,-2,11,14,0,0,6.28);toon(g,'#6a5a4a',2.2);
  g.fillStyle='#8a7a6a';g.beginPath();g.ellipse(0,2,7,9,0,0,6.28);g.fill();
  // رأس دائري كبير
  g.beginPath();g.arc(0,-16,10,0,6.28);toon(g,'#6a5a4a',2.2);
  // آذان ريش
  g.beginPath();g.moveTo(-7,-23);g.lineTo(-9,-29);g.lineTo(-4,-24);g.closePath();toon(g,'#6a5a4a',1.5);
  g.beginPath();g.moveTo(7,-23);g.lineTo(9,-29);g.lineTo(4,-24);g.closePath();toon(g,'#6a5a4a',1.5);
  // عيون كبيرة (سر البومة!)
  g.fillStyle='#ffd54f';g.beginPath();g.arc(-4,-16,4,0,6.28);g.arc(4,-16,4,0,6.28);g.fill();
  g.strokeStyle='#1a1208';g.lineWidth=1.5;g.beginPath();g.arc(-4,-16,4,0,6.28);g.stroke();g.beginPath();g.arc(4,-16,4,0,6.28);g.stroke();
  const blink=Math.sin(gt*0.9)>0.95?1:0;
  if(!blink){g.fillStyle='#1a1208';g.beginPath();g.arc(-4,-16,2,0,6.28);g.arc(4,-16,2,0,6.28);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(-5,-17,0.8,0,6.28);g.arc(3,-17,0.8,0,6.28);g.fill();}
  else{g.strokeStyle='#1a1208';g.lineWidth=1.5;g.beginPath();g.moveTo(-7,-16);g.lineTo(-1,-16);g.moveTo(1,-16);g.lineTo(7,-16);g.stroke();}
  // منقار
  g.beginPath();g.moveTo(0,-13);g.lineTo(-2,-10);g.lineTo(2,-10);g.closePath();toon(g,'#f4a82a',1.2);
  g.restore();
}
function penguin(g,x,y,s,wt){
  const waddle=Math.sin(wt*5)*0.15;
  g.save();g.translate(x,y);g.scale(s,s);g.rotate(waddle);
  // أقدام
  g.fillStyle='#f4a82a';g.beginPath();g.ellipse(-4,8,4,2,0,0,6.28);g.ellipse(4,8,4,2,0,0,6.28);g.fill();
  // جسم أسود
  g.beginPath();g.ellipse(0,-4,10,14,0,0,6.28);toon(g,'#2a2a3a',2.2);
  // بطن أبيض
  g.fillStyle='#fff';g.beginPath();g.ellipse(0,-2,6,10,0,0,6.28);g.fill();
  // أجنحة صغيرة
  g.beginPath();g.ellipse(-9,-4,3,8,0.2,0,6.28);toon(g,'#2a2a3a',1.5);
  g.beginPath();g.ellipse(9,-4,3,8,-0.2,0,6.28);toon(g,'#2a2a3a',1.5);
  // رأس
  g.beginPath();g.arc(0,-18,8,0,6.28);toon(g,'#2a2a3a',2);
  eye(g,-3,-19,2.2,0);eye(g,3,-19,2.2,0);
  // منقار
  g.beginPath();g.moveTo(0,-15);g.lineTo(-3,-12);g.lineTo(3,-12);g.closePath();toon(g,'#f4a82a',1.2);
  g.restore();
}

// ===== سجل الشخصيات (هنا السر: نبحث على الكل) =====
const HEROES={
  lion:{fn:lion,size:1.0},
  bird:{fn:bird,size:0.7,fly:true},
  fish:{fn:fish,size:0.8,water:true},
  elephant:{fn:elephant,size:1.3},
  dragon:{fn:dragon,size:1.2,fly:true},
  monkey:{fn:monkey,size:0.85},
  turtle:{fn:turtle,size:0.75},
  butterfly:{fn:butterfly,size:0.6,fly:true},
  cat:{fn:cat,size:0.8},
  sheep:{fn:sheep,size:0.8},
  rabbit:{fn:rabbit,size:0.7},
  fox:{fn:fox,size:0.85},
  bear:{fn:bear,size:1.4},
  owl:{fn:owl,size:0.8,fly:true},
  penguin:{fn:penguin,size:0.8}
};
const KEYWORDS={
  lion:['lion'],bird:['bird','sparrow','crow','robin'],fish:['fish','shark','trout'],
  elephant:['elephant'],dragon:['dragon'],monkey:['monkey','ape'],turtle:['turtle','tortoise'],
  butterfly:['butterfly'],cat:['cat','kitten'],sheep:['sheep','lamb'],rabbit:['rabbit','bunny','hare'],
  fox:['fox'],bear:['bear','grizzly','panda'],owl:['owl'],penguin:['penguin']
};

// ===== تحليل الوصف: جمع كل الشخصيات =====
function analyze(t){
  t=t.toLowerCase();const has=(...w)=>w.some(x=>t.includes(x));
  let time='day';
  if(has('night','dark','moon','starry','stars'))time='night';
  else if(has('sunset','golden','dusk','evening'))time='sunset';
  let env='nature';
  if(has('ocean','sea','underwater','coral','reef','beach'))env='ocean';
  else if(has('forest','tree','jungle'))env='forest';
  else if(has('desert','savanna','sand','dune'))env='desert';
  else if(has('space','galaxy','planet','astronaut','mars'))env='space';
  else if(has('mountain','snow','peak','hill'))env='mountain';
  else if(has('meadow','field','grass','farm'))env='meadow';
  else if(has('ice','arctic','antarctic','polar'))env='ice';
  // جمع كل الشخصيات الموجودة
  const heroes=[];
  for(const [key,kws] of Object.entries(KEYWORDS)){
    if(kws.some(k=>t.includes(k)))heroes.push(key);
  }
  return {time,env,heroes};
}

// ===== بناء العالم =====
function build(a,prompt){
  const r=rnd(hs(prompt));
  const sky={day:['#4aa3e0','#8fd0f5','#cdeeff'],sunset:['#5a2d8a','#c44a6a','#ff8c42','#ffd166'],night:['#0a1238','#16265c','#243b7a']}[a.time];
  const ground={desert:'#e8b85a',forest:'#4a9a3a',ocean:'#1a7ab0',mountain:'#7a8a9a',space:'#2a2a4a',nature:'#6aaa3a',meadow:'#7ac44a',ice:'#c8dce8'}[a.env];
  const hills=[];
  if(!['ocean','space'].includes(a.env)){for(let L=0;L<3;L++){const pts=[];for(let s=0;s<=5;s++)pts.push({x:s/5,y:0.5+L*0.05+(r()-0.5)*0.1});hills.push({pts,d:L});}}
  const trees=[];if(['forest','meadow'].includes(a.env)){for(let k=0;k<(a.env==='meadow'?6:10);k++)trees.push({x:r(),s:0.4+r()*0.6,col:r()>0.5?'#3a8a2a':'#2e7d2e'});}
  const flowers=[];if(['meadow','forest'].includes(a.env)){for(let k=0;k<12;k++)flowers.push({x:r(),y:0.62+r()*0.15,col:pick(r,['#e85a9a','#ffd166','#ba68c8','#ff7043']),sz:2+r()*2});}
  const clouds=[];if(a.time!=='night'&&a.env!=='ocean'&&a.env!=='space'){for(let k=0;k<4;k++)clouds.push({x:r(),y:0.1+r()*0.2,w:0.1+r()*0.12,sp:0.004+r()*0.008});}
  const stars=[];if(a.time==='night'||a.env==='space'){for(let k=0;k<70;k++)stars.push({x:r(),y:r()*0.55,sz:0.6+r()*2,tw:r()*6.28});}
  const planets=[];if(a.env==='space'){for(let k=0;k<2;k++)planets.push({x:0.1+r()*0.8,y:0.1+r()*0.35,rad:0.05+r()*0.12,col:pick(r,['#ff7043','#ba68c8','#4fc3f7','#ffd54f'])});}
  const cel={x:0.2+r()*0.6,y:0.12+r()*0.18,rad:0.06+r()*0.05};
  // توزيع الشخصيات على مواقع مختلفة (حفلة!)
  const cast=a.heroes.map((h,i)=>{
    const def=HEROES[h];
    const n=a.heroes.length;
    // توزيع أفقي متساوي مع قليل من العشوائية
    const baseX=(i+0.5)/n;
    const xOff=(r()-0.5)*0.12;
    return {
      type:h, fn:def.fn, fly:def.fly, water:def.water,
      x:clamp(baseX+xOff,0.12,0.88),
      scale:def.size*(0.85+r()*0.3),
      phase:r()*6.28, speed:0.6+r()*0.5,
      order:i // ترتيب الرسم (الأرض تحت، الطيران فوق)
    };
  }).sort((a,b)=>{
    // الأرض أولاً، الماء بعدين، الطيران أخيراً
    const rank=x=>x.water?0:x.fly?2:1;
    return rank(a)-rank(b)||a.order-b.order;
  });
  return {...a,sky,ground,hills,trees,flowers,clouds,stars,planets,cel,cast,seed:hs(prompt)};
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function cams(n){
  const base=[{z:1,px:0},{z:1.2,px:-0.03},{z:1.5,px:0.04},{z:1.1,px:0.08}];
  const out=[];for(let i=0;i<n;i++)out.push(base[i%base.length]);return out;
}

// ===== عناصر الخلفية =====
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
function flower(g,x,y,col,sz){
  g.strokeStyle='#3a7a2a';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+sz*2.5);g.stroke();
  for(let i=0;i<5;i++){const a=i*1.256+gt*0.3;g.beginPath();g.ellipse(x+Math.cos(a)*sz,y+Math.sin(a)*sz-sz*0.5,sz*0.6,sz*0.3,a,0,6.28);g.fillStyle=col;g.fill();}
  g.beginPath();g.arc(x,y-sz*0.5,sz*0.4,0,6.28);toon(g,'#ffd166',1);
}

// ===== الرسم الرئيسي =====
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
  if(W.env==='ocean'||W.env==='ice'){
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
    g.strokeStyle='rgba(255,255,255,0.3)';g.lineWidth=2.5;g.lineCap='round';
    for(let L=0;L<4;L++){g.beginPath();for(let x=0;x<=w;x+=8){const y=hor+L*(h-hor)/4+Math.sin(x*0.03+gt*2+L*1.3)*(4+L*2);x===0?g.moveTo(x,y):g.lineTo(x,y);}g.stroke();}
  } else if(W.hills.length){
    W.hills.forEach((H,idx)=>{const off=e*(6+idx*10);
      g.beginPath();g.moveTo(-w,h+h);H.pts.forEach(p=>g.lineTo(p.x*w*1.4-w*0.2-off,p.y*h));g.lineTo(w*2,h+h);g.closePath();
      toon(g,idx===W.hills.length-1?W.ground:mixHex(W.ground,'#ffffff',0.15*idx),2.4);});
  } else {
    g.fillStyle=W.ground;g.fillRect(0,hor,w,h-hor);
  }
  W.trees.forEach(t=>tree(g,t.x*w*1.3-w*0.15-e*16,hor+(1-t.s)*h*0.06,t.s*1.1,t.col));
  W.flowers.forEach(f=>flower(g,f.x*w,f.y*h,f.col,f.sz));
  // رسم كل الشخصيات (الحفلة!)
  W.cast.forEach(ch=>{
    const wt=(gt*ch.speed+ch.phase)%1;
    let cx=ch.x*w, cy;
    if(ch.fly){cy=h*0.25+Math.sin(gt*1.5+ch.phase)*8;}
    else if(ch.water){cy=hor+(h-hor)*0.45+Math.sin(gt*1.2+ch.phase)*4;}
    else {cy=hor-2;}
    // حركة أفقية خفيفة (كل شخصية كتمشي بسرعتها)
    if(!ch.fly&&!ch.water)cx=((ch.x+e*0.08*ch.speed)%1.1)*w;
    ch.fn(g,cx,cy,ch.scale,wt);
  });
  g.restore();
  const vg=g.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,h*0.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(20,10,40,0.35)');g.fillStyle=vg;g.fillRect(0,0,w,h);
  g.fillStyle='#0a0812';const lb=h*0.07;g.fillRect(0,0,w,lb);g.fillRect(0,h-lb,w,lb);
}

// ===== الأزرار =====
generateBtn.addEventListener('click',()=>{
  const prompt=promptInput.value.trim();const n=parseInt(numImagesInput.value)||4;
  if(!prompt){alert('اكتب وصفاً');return;}
  const a=analyze(prompt);
  if(a.heroes.length===0){alert('ما لقيتش حتى شخصية معروفة!\nجرّب: lion, monkey, butterfly, cat, rabbit, fox, bear, owl, penguin, turtle, elephant, dragon, fish, bird, sheep');return;}
  const W=build(a,prompt);const CM=cams(n);
  scenes=CM.map(c=>({W,cam:c}));
  imagesPreview.innerHTML='';
  scenes.forEach(s=>{const tc=document.createElement('canvas');tc.width=180;tc.height=101;render(tc.getContext('2d'),s.W,s.cam,0.4,180,101);const el=document.createElement('img');el.src=tc.toDataURL();imagesPreview.appendChild(el);});
  status.textContent=`✅ حفلة! ${a.heroes.length} شخصيات (${a.heroes.join(', ')}) × ${n} لقطات — بيئة:${a.env} وقت:${a.time}`;
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
  recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'});const u=URL.createObjectURL(blob);downloadLink.href=u;downloadLink.download='cartoon-party.webm';downloadLink.style.display='inline-block';status.textContent='✅ الفيديو جاهز! حمّلو 🎬';createVideoBtn.disabled=false;};
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
