(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { scenes: [], selected: 0, playing: false, playTimer: null };

  const canvas = $("previewCanvas");
  const ctx = canvas.getContext("2d");

  // دالة تقسيم القصة
  function splitStory(text) {
    return text.replace(/\n+/g, ". ").split(/[.!؟?]+/).map(s => s.trim()).filter(s => s.length > 3).slice(0, 30);
  }

  // دالة تحليل النص لمعرفة الخلفية
  function sceneTheme(text) {
    const t = text.toLowerCase();
    if (t.includes("غابة") || t.includes("شجر")) return { name: "الغابة", sky: ["#1b3551","#54866c"], ground: "#31583e" };
    if (t.includes("بحر") || t.includes("نهر") || t.includes("ماء")) return { name: "النهر", sky: ["#244d76","#77b9ce"], ground: "#246f8b" };
    if (t.includes("ليل") || t.includes("نجوم")) return { name: "الليل", sky: ["#101735","#303e70"], ground: "#26334e" };
    return { name: "عالم المغامرات", sky: ["#324e79","#82a8c6"], ground: "#54835d" };
  }

  // دالة استخراج الشخصيات
  function getCharacters(text) {
    const chars = [];
    const t = text.toLowerCase();
    if (t.includes('أسد') || t.includes('lion')) chars.push('lion');
    if (t.includes('أرنب') || t.includes('rabbit')) chars.push('rabbit');
    if (t.includes('فيل') || t.includes('elephant')) chars.push('elephant');
    if (t.includes('روبوت') || t.includes('robot')) chars.push('robot');
    return chars;
  }

  // دالة رسم المشهد
  function drawScene(targetCtx, scene, w, h) {
    const theme = scene.theme;
    
    // 1. رسم الخلفية
    const grad = targetCtx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,theme.sky[0]); grad.addColorStop(1,theme.sky[1]);
    targetCtx.fillStyle=grad; targetCtx.fillRect(0,0,w,h);
    
    // شمس
    targetCtx.beginPath(); targetCtx.arc(w*.78,h*.23,Math.min(w,h)*.075,0,Math.PI*2); targetCtx.fillStyle="#ffd98b"; targetCtx.fill();
    
    // أرض
    targetCtx.fillStyle=theme.ground; targetCtx.beginPath(); targetCtx.moveTo(0,h*.68); targetCtx.quadraticCurveTo(w*.22,h*.48,w*.48,h*.7); targetCtx.quadraticCurveTo(w*.73,h*.51,w,h*.68); targetCtx.lineTo(w,h); targetCtx.lineTo(0,h); targetCtx.fill();

    // 2. رسم الشخصيات
    let startX = (w - (scene.characters.length * 150)) / 2;
    let xOffset = startX;
    scene.characters.forEach(char => {
        drawCharacter(targetCtx, char, xOffset, h * 0.75, w);
        xOffset += 150;
    });

    // 3. كتابة النص
    targetCtx.fillStyle="rgba(0,0,0,0.6)"; targetCtx.fillRect(0, h-80, w, 80);
    targetCtx.fillStyle="#ffffff"; targetCtx.font=`bold ${Math.round(w*.025)}px Tajawal, sans-serif`; targetCtx.textAlign="center";
    targetCtx.fillText(scene.text, w/2, h-30);
  }

  // دالة رسم الأشكال الكرتونية (أسد، أرنب...)
  function drawCharacter(g, type, x, groundY, w) {
      const size = w * 0.05; // حجم متناسب مع الشاشة
      g.save(); g.translate(x, groundY);

      // ظل
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(0, 0, size*0.8, 10, 0, 0, Math.PI * 2); g.fill();

      if (type === 'lion') {
          g.fillStyle = '#f59e0b'; g.beginPath(); g.arc(0, -size, size, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#d97706'; g.beginPath(); g.arc(0, -size*1.8, size*0.8, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#fcd34d'; g.beginPath(); g.arc(0, -size*1.8, size*0.5, 0, Math.PI * 2); g.fill();
      } else if (type === 'rabbit') {
          g.fillStyle = '#f3f4f6'; g.beginPath(); g.ellipse(0, -size*0.8, size*0.7, size, 0, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.ellipse(-12, -size*1.9, 8, 25, 0.1, 0, Math.PI * 2); g.fill();
          g.beginPath(); g.ellipse(12, -size*1.9, 8, 25, -0.1, 0, Math.PI * 2); g.fill();
      } else if (type === 'elephant') {
          g.fillStyle = '#94a3b8'; g.beginPath(); g.ellipse(0, -size*1.2, size*1.2, size*1.4, 0, 0, Math.PI * 2); g.fill();
      } else if (type === 'robot') {
          g.fillStyle = '#3b82f6'; g.fillRect(-size*0.8, -size*1.8, size*1.6, size*1.8);
          g.fillStyle = '#1d4ed8'; g.fillRect(-size*0.6, -size*2.5, size*1.2, size*0.8);
      }
      g.restore();
  }

  // عرض المشاهد
  function renderCards() {
    const grid=$("sceneGrid"); grid.innerHTML="";
    state.scenes.forEach((scene,index)=>{
      const card=document.createElement("button");card.className="scene-card"+(index===state.selected?" selected":"");card.type="button";
      const thumb=document.createElement("div");thumb.className="scene-thumb";
      const c=document.createElement("canvas");c.width=320;c.height=180;drawScene(c.getContext("2d"),scene,320,180);thumb.appendChild(c);
      const info=document.createElement("div");info.className="scene-info";
      const title=document.createElement("b");title.textContent=scene.text;
      info.append(title);card.append(thumb,info);
      card.addEventListener("click",()=>{state.selected=index;renderCards();drawSelected();});
      grid.appendChild(card);
    });
    $("sceneCount").textContent=`${state.scenes.length} مشاهد`;
    $("emptyState").style.display=state.scenes.length?"none":"block";
  }

  function drawSelected() {
    const scene=state.scenes[state.selected]; if(!scene)return;
    $("previewPlaceholder").style.display="none";
    $("previewLabel").textContent=`المشهد ${scene.number} من ${state.scenes.length}`;
    drawScene(ctx,scene,canvas.width,canvas.height);
  }

  // زر التحليل
  function analyze() {
    const text=$("storyInput").value.trim();
    if(!text){alert("كتب القصة أولاً!");return;}
    const parts=splitStory(text);
    state.scenes=parts.map((line,i)=>({number:i+1,text:line,theme:sceneTheme(line),characters:getCharacters(line)}));
    state.selected=0;renderCards();drawSelected();
    $("exportBtn").disabled=false;
  }

  $("analyzeBtn").addEventListener("click",analyze);
  
  // خلفية مبدئية
  drawScene(ctx,{number:1,text:"Your story starts here",theme:{name:"Preview",sky:["#25324d","#7189a0"],ground:"#526b5c"},characters:[]},canvas.width,canvas.height);
})();
