(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { scenes: [], selected: 0, playing: false, playTimer: null, progress: 0, recorder: null, chunks: [] };
  const canvas = $("previewCanvas");
  const ctx = canvas.getContext("2d");

  const examples = [
    "في غابة سحرية، يستيقظ أسد صغير مع شروق الشمس. يلتقي بأرنب يبحث عن طريق العودة إلى منزله. يقرران عبور النهر بمساعدة فيل طيب. في النهاية يصل الأصدقاء إلى حقل مليء بالأزهار ويحتفلون معاً.",
    "A little fox wakes up in a quiet forest. He meets a friendly rabbit near the river. Together they help a lost bird find its family. At sunset, all the animals celebrate under the stars."
  ];

  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function splitStory(text) {
    return text.replace(/\n+/g, ". ").split(/[.!؟?]+/).map(s => s.trim()).filter(s => s.length > 3).slice(0, 30);
  }
  function hash(text) {
    let h = 0; for (let i=0;i<text.length;i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
    return h;
  }
  function sceneTheme(text, index) {
    const t = text.toLowerCase();
    const themes = [
      {keys:["غابة","forest","شجرة","أشجار"], name:"الغابة", sky:["#1b3551","#54866c"], ground:"#31583e"},
      {keys:["بحر","نهر","ماء","ocean","river","sea"], name:"النهر", sky:["#244d76","#77b9ce"], ground:"#246f8b"},
      {keys:["ليل","قمر","نجوم","night","moon","stars"], name:"الليل", sky:["#101735","#303e70"], ground:"#26334e"},
      {keys:["صحراء","رمل","desert","sand"], name:"الصحراء", sky:["#a65d4d","#f1b66e"], ground:"#b98248"},
      {keys:["ثلج","جليد","snow","ice"], name:"الجبال الثلجية", sky:["#567d9d","#c5dce8"], ground:"#9bb9c8"}
    ];
    const found = themes.find(theme => theme.keys.some(k => t.includes(k)));
    return found || [
      {name:"عالم المغامرات",sky:["#324e79","#82a8c6"],ground:"#54835d"},
      {name:"وادي الألوان",sky:["#73517f","#e9a477"],ground:"#79905a"},
      {name:"القرية الهادئة",sky:["#4b7190","#e5bb83"],ground:"#7e9a67"}
    ][index % 3];
  }
  function drawScene(targetCtx, scene, w, h, animate = false) {
    const g = targetCtx, theme = scene.theme, seed = hash(scene.text);
    const grad = g.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,theme.sky[0]); grad.addColorStop(1,theme.sky[1]);
    g.fillStyle=grad;g.fillRect(0,0,w,h);
    // الشمس
    g.beginPath();g.arc(w*.78,h*.23,Math.min(w,h)*.075,0,Math.PI*2);g.fillStyle="#ffd98b";g.fill();
    // غيوم
    for(let i=0;i<3;i++){const x=((seed>>(i*3))%w*.7)+w*.08,y=h*(.18+i*.09);g.fillStyle="#ffffff25";g.beginPath();g.ellipse(x,y,w*.09,h*.025,0,0,Math.PI*2);g.fill();}
    // تلال
    g.fillStyle=theme.ground;g.beginPath();g.moveTo(0,h*.68);g.quadraticCurveTo(w*.22,h*.48,w*.48,h*.7);g.quadraticCurveTo(w*.73,h*.51,w,h*.68);g.lineTo(w,h);g.lineTo(0,h);g.fill();
    // نباتات بسيطة
    for(let i=0;i<12;i++){const x=(i/12)*w+((seed+i*17)%25), y=h*.76+((seed+i*7)%35);g.strokeStyle="#234a37";g.lineWidth=Math.max(2,w*.003);g.beginPath();g.moveTo(x,y+15);g.lineTo(x-5,y);g.moveTo(x,y+15);g.lineTo(x+6,y-7);g.stroke();}
    // شخصية كرتونية تجريبية
    const bob=animate?Math.sin(Date.now()/230)*5:0, x=w*.5, y=h*.69+bob, r=Math.min(w,h)*.105;
    g.fillStyle="#f1b85e";g.beginPath();g.ellipse(x,y,r*1.1,r*.85,0,0,Math.PI*2);g.fill();
    g.fillStyle="#d18a3d";g.beginPath();g.arc(x,y-r*.68,r*.72,0,Math.PI*2);g.fill();
    // أذنان
    g.beginPath();g.arc(x-r*.48,y-r*1.2,r*.28,0,Math.PI*2);g.arc(x+r*.48,y-r*1.2,r*.28,0,Math.PI*2);g.fill();
    // عينان وابتسامة
    g.fillStyle="#211b22";g.beginPath();g.arc(x-r*.23,y-r*.72,r*.07,0,Math.PI*2);g.arc(x+r*.23,y-r*.72,r*.07,0,Math.PI*2);g.fill();
    g.strokeStyle="#513322";g.lineWidth=3;g.beginPath();g.arc(x,y-r*.48,r*.2,.15,Math.PI-.15);g.stroke();
    // عنوان المشهد
    g.fillStyle="#ffffffdd";g.font=`600 ${Math.round(w*.027)}px Tajawal, sans-serif`;g.textAlign="center";
    g.fillText(`المشهد ${scene.number} — ${scene.theme.name}`,w/2,h*.12);
    g.fillStyle="#ffffffaa";g.font=`${Math.round(w*.019)}px Tajawal, sans-serif`;
    const caption=scene.text.length>62?scene.text.slice(0,59)+"…":scene.text;
    g.fillText(caption,w/2,h*.92);
  }
  function drawSelected() {
    const scene=state.scenes[state.selected]; if(!scene)return;
    $("previewPlaceholder").style.display="none";
    $("previewLabel").textContent=`المشهد ${scene.number} من ${state.scenes.length}`;
    $("currentSceneLabel").textContent=`SCENE ${String(scene.number).padStart(2,"0")} / ${scene.theme.name}`;
    drawScene(ctx,scene,canvas.width,canvas.height,true);
  }
  function renderCards() {
    const grid=$("sceneGrid");grid.innerHTML="";
    state.scenes.forEach((scene,index)=>{
      const card=document.createElement("button");card.className="scene-card"+(index===state.selected?" selected":"");card.type="button";
      const thumb=document.createElement("div");thumb.className="scene-thumb";
      const c=document.createElement("canvas");c.width=320;c.height=180;drawScene(c.getContext("2d"),scene,320,180);thumb.appendChild(c);
      const badge=document.createElement("span");badge.className="scene-index";badge.textContent=String(scene.number).padStart(2,"0");thumb.appendChild(badge);
      const info=document.createElement("div");info.className="scene-info";
      const title=document.createElement("b");title.textContent=scene.text;
      const meta=document.createElement("small");meta.textContent=`${$("sceneDuration").value} ثوانٍ • ${scene.theme.name}`;
      info.append(title,meta);card.append(thumb,info);
      card.addEventListener("click",()=>{stopPreview();state.selected=index;renderCards();drawSelected();});
      grid.appendChild(card);
    });
    $("sceneCount").textContent=`${state.scenes.length} مشاهد`;
    $("emptyState").style.display=state.scenes.length?"none":"block";
  }
  function analyze() {
    const text=$("storyInput").value.trim();
    if(!text){toast("كتب القصة أولاً باش نقدروا ننشئو المشاهد.");$("storyInput").focus();return;}
    const parts=splitStory(text);
    if(!parts.length){toast("زيد بعض التفاصيل فالقصة.");return;}
    state.scenes=parts.map((line,i)=>({number:i+1,text:line,theme:sceneTheme(line,i)}));
    state.selected=0;renderCards();drawSelected();
    $("exportBtn").disabled=false;$("exportStatus").textContent="المشاهد جاهزة. يمكنك تصدير معاينة WebM.";
    toast(`تم إنشاء ${state.scenes.length} مشاهد تجريبية بنجاح.`);
  }
  function stopPreview() {
    state.playing=false;clearInterval(state.playTimer);$("playBtn").textContent="▶";$("playState").textContent="جاهز للمعاينة";$("progressBar").style.width="0%";$("timeLabel").textContent="00:00";
  }
  function playPreview() {
    if(!state.scenes.length){toast("حلّل القصة أولاً.");return;}
    if(state.playing){stopPreview();return;}
    state.playing=true;$("playBtn").textContent="Ⅱ";$("playState").textContent="المعاينة تعمل";
    const duration=Number($("sceneDuration").value)*1000;let elapsed=0;
    state.playTimer=setInterval(()=>{
      elapsed+=100;
      const total=duration*state.scenes.length,percent=Math.min(100,elapsed/total*100);
      $("progressBar").style.width=percent+"%";$("timeLabel").textContent=`00:${String(Math.floor(elapsed/1000)).padStart(2,"0")}`;
      if(elapsed>=total){stopPreview();state.selected=0;renderCards();drawSelected();return;}
      const idx=Math.floor(elapsed/duration);
      if(idx!==state.selected){state.selected=idx;renderCards();}
      drawSelected();
    },100);
  }
  async function exportVideo() {
    if(!state.scenes.length)return;
    if(!canvas.captureStream || !window.MediaRecorder){toast("المتصفح لا يدعم تسجيل الفيديو. جرّب Chrome أو Edge.");return;}
    stopPreview();
    const quality=Number($("qualitySelect").value);
    canvas.width=quality===1080?1920:quality===480?854:1280;
    canvas.height=quality===1080?1080:quality===480?480:720;
    const stream=canvas.captureStream(24);state.chunks=[];
    let mime="video/webm;codecs=vp9";
    if(!MediaRecorder.isTypeSupported(mime))mime="video/webm";
    try{
      state.recorder=new MediaRecorder(stream,{mimeType:mime});
      state.recorder.ondataavailable=e=>{if(e.data.size)state.chunks.push(e.data);};
      state.recorder.onstop=()=>{
        const blob=new Blob(state.chunks,{type:"video/webm"}),url=URL.createObjectURL(blob);
        const a=document.createElement("a");a.href=url;a.download="ai-video-studio-preview.webm";document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
        $("exportStatus").textContent="اكتمل تصدير ملف WebM التجريبي.";
        $("exportBtn").disabled=false;toast("تم تجهيز ملف الفيديو للتحميل.");
      };
      $("exportBtn").disabled=true;$("exportStatus").textContent="جاري تسجيل المعاينة...";
      state.recorder.start();
      const duration=Number($("sceneDuration").value)*1000,started=Date.now();
      const drawLoop=()=>{
        const elapsed=Date.now()-started,idx=Math.min(Math.floor(elapsed/duration),state.scenes.length-1);
        state.selected=idx;drawScene(ctx,state.scenes[idx],canvas.width,canvas.height,true);
        if(elapsed>=duration*state.scenes.length){state.recorder.stop();return;}
        requestAnimationFrame(drawLoop);
      };drawLoop();
    }catch(err){$("exportBtn").disabled=false;toast("تعذر التصدير: "+err.message);}
  }

  $("storyInput").addEventListener("input",()=>{$("charCount").textContent=$("storyInput").value.length+" حرف";});
  $("analyzeBtn").addEventListener("click",analyze);
  $("exampleBtn").addEventListener("click",()=>{$("storyInput").value=examples[0];$("storyInput").dispatchEvent(new Event("input"));toast("تمت إضافة قصة نموذجية.");});
  $("playBtn").addEventListener("click",playPreview);
  $("exportBtn").addEventListener("click",exportVideo);
  $("volumeSlider").addEventListener("input",e=>$("volumeValue").textContent=e.target.value+"%");
  $("newProjectBtn").addEventListener("click",()=>{stopPreview();state.scenes=[];state.selected=0;$("storyInput").value="";$("storyInput").dispatchEvent(new Event("input"));$("sceneGrid").innerHTML="";$("sceneCount").textContent="0 مشاهد";$("emptyState").style.display="block";$("previewPlaceholder").style.display="flex";ctx.clearRect(0,0,canvas.width,canvas.height);$("exportBtn").disabled=true;$("exportStatus").textContent="أنشئ المشاهد أولاً لتفعيل التصدير.";toast("تم فتح مشروع جديد.");});
  $("fullscreenBtn").addEventListener("click",()=>{const box=document.querySelector(".preview-screen");if(box.requestFullscreen)box.requestFullscreen();});
  $("helpBtn").addEventListener("click",()=>toast("هذه نسخة الواجهة الأولى: تحليل نصي ومعاينة كرتونية وتصدير WebM تجريبي."));
  $("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
  document.querySelectorAll(".nav-item").forEach(a=>a.addEventListener("click",()=>$("sidebar").classList.remove("open")));
  $("sceneDuration").addEventListener("change",()=>{if(state.scenes.length)renderCards();});
  drawScene(ctx,{number:1,text:"Your story starts here",theme:{name:"Preview",sky:["#25324d","#7189a0"],ground:"#526b5c"}},canvas.width,canvas.height);
})();
