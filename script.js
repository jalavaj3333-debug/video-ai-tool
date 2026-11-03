const promptInput = document.getElementById('promptInput');
const numImagesInput = document.getElementById('numImagesInput');
const durationInput = document.getElementById('durationInput');
const generateBtn = document.getElementById('generateBtn');
const createVideoBtn = document.getElementById('createVideoBtn');
const status = document.getElementById('status');
const imagesPreview = document.getElementById('imagesPreview');
const outputCanvas = document.getElementById('outputCanvas');
const downloadLink = document.getElementById('downloadLink');

// المفتاح اختياري: إلا كسبتي pollen من Quests وحطيتيه، السرعة كتولي فورية
let POLLI_TOKEN = localStorage.getItem('polli_token') || '';
const FREE_WAIT = 46;   // ثواني الانتظار بلا مفتاح
const TOKEN_WAIT = 3;   // ثواني الانتظار بالمفتاح

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];
let stopRequested = false;

// زر صغير لإدخال المفتاح (اختياري)
const keyBtn = document.createElement('button');
keyBtn.style.cssText = 'margin-top:8px;padding:8px 14px;border:none;border-radius:6px;background:#ffd166;color:#000;font-weight:bold;cursor:pointer;';
function refreshKeyBtn(){ keyBtn.textContent = POLLI_TOKEN ? '🔑 مفتاح: ✅ (بدّلو/مسحو)' : '🔑 عندي مفتاح (تسريع)'; }
refreshKeyBtn();
keyBtn.onclick = () => {
    const k = window.prompt('🔑 لصق مفتاح Pollinations (اختياري). سيبو خاوي باش تمسحو:', POLLI_TOKEN);
    if (k === null) return;
    POLLI_TOKEN = k.trim();
    if (POLLI_TOKEN) localStorage.setItem('polli_token', POLLI_TOKEN); else localStorage.removeItem('polli_token');
    refreshKeyBtn();
    status.textContent = POLLI_TOKEN ? '✅ المفتاح تحفظ، السرعة كتولّي فورية.' : '🗑️ تمسح المفتاح، غادي نخدمو بالانتظار المجاني.';
};
document.querySelector('.buttons').after(keyBtn);

function wait(sec, msg) {
    return new Promise((resolve) => {
        let left = sec;
        const tick = () => {
            status.textContent = `${msg} (${left})`;
            if (left <= 0 || stopRequested) { resolve(); return; }
            left--;
            setTimeout(tick, 1000);
        };
        tick();
    });
}

// تحميل صورة مع مهلة زمنية (باش ما يتعلّقش العداد)
function loadImageTO(url, ms = 75000) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const t = setTimeout(() => { img.src = ''; reject(new Error('timeout')); }, ms);
        img.onload = () => { clearTimeout(t); resolve(img); };
        img.onerror = () => { clearTimeout(t); reject(new Error('load-fail')); };
        img.src = url;
    });
}

// كشف الصور المزيفة (الصفرا/الوردية ديال "limit reached")

function isPlaceholder(img) {
    try {
        const c = document.createElement('canvas');
        c.width = 32; c.height = 32;
        const x = c.getContext('2d');
        x.drawImage(img, 0, 0, 32, 32);
        const d = x.getImageData(0, 0, 32, 32).data;
        const total = 32 * 32;
        let yellow = 0, pink = 0;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            if (r > 225 && g > 175 && b < 160) yellow++;            // أصفر Pollinations
            if (r > 225 && g > 175 && b >= 160 && b < 235) pink++;  // وردي "refused"
        }
        if (yellow / total > 0.45) return true;
        if (pink / total > 0.45) return true;
        return false;
    } catch (e) { return false; }
}
function drawCover(image, w, h) {
    const ir = image.width/image.height, cr = w/h;
    let sx=0,sy=0,sw=image.width,sh=image.height;
    if (ir>cr){ sw=image.height*cr; sx=(image.width-sw)/2; }
    else { sh=image.width/cr; sy=(image.height-sh)/2; }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
}

// 1. توليد الصور (منطقي ومحكّم)
generateBtn.addEventListener('click', async () => {
    const basePrompt = promptInput.value.trim();
    const numImages = parseInt(numImagesInput.value);
    if (!basePrompt) { alert('الرجاء إدخال وصف للفيديو'); return; }

    stopRequested = false;
    generateBtn.disabled = true;
    createVideoBtn.disabled = true;
    downloadLink.style.display = 'none';
    imagesPreview.innerHTML = '';
    generatedImages = [];

    const waitTime = POLLI_TOKEN ? TOKEN_WAIT : FREE_WAIT;

    for (let i = 0; i < numImages; i++) {
        if (stopRequested) break;
        if (i > 0) await wait(waitTime, POLLI_TOKEN ? '⏳ بين المشاهد...' : '⏳ الحد المجاني، صبر شوية... باقي');
        if (stopRequested) break;

        status.textContent = `🎨 جاري توليد المشهد ${i+1}/${numImages}...`;

        // أبسط URL ممكن = أقل رفض (بلا nologo ولا model ولا أبعاد)
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?seed=${Date.now()+i}`;

        let got = null;
        for (let attempt = 1; attempt <= 3 && !got && !stopRequested; attempt++) {
            try {
                const img = await loadImageTO(url);
                if (!isPlaceholder(img)) {
                    got = img;
                } else {
                    status.textContent = ` المشهد ${i+1} جا limit (محاولة ${attempt}/3)...`;
                    if (attempt < 3) await wait(waitTime, '⏳ كنعاود، باقي');
                }
            } catch (e) {
                status.textContent = `⚠️ المشهد ${i+1} فشل (${e.message})، محاولة ${attempt}/3...`;
                if (attempt < 3) await wait(15, '⏳ انتظار قصير، باقي');
            }
        }

        if (got) {
            generatedImages.push(got);
            const el = document.createElement('img');
            el.src = got.src;
            imagesPreview.appendChild(el);
            status.textContent = `✅ المشهد ${i+1} تولد!`;
        } else if (!stopRequested) {
            status.textContent = `❌ المشهد ${i+1} ما تسنتجش (السيرفر مشغول). نكملو بالباقي.`;
        }
    }

    status.textContent = `🏁 خلاص: ${generatedImages.length}/${numImages} مشهد جاهز.`;
    generateBtn.disabled = false;
    if (generatedImages.length > 0) createVideoBtn.disabled = false;
});

// زر إيقاف (باش ما نبقاوش ننتظر بلا فايدة)
const stopBtn = document.createElement('button');
stopBtn.textContent = '⏹️ إيقاف';
stopBtn.style.cssText = 'margin-top:8px;padding:8px 14px;border:none;border-radius:6px;background:#cf6679;color:#000;font-weight:bold;cursor:pointer;';
stopBtn.onclick = () => { stopRequested = true; status.textContent = '⏹️ تم الإيقاف.'; };
keyBtn.after(stopBtn);

// 2. إنشاء الفيديو
createVideoBtn.addEventListener('click', () => {
    if (generatedImages.length === 0) return;
    recordedChunks = [];
    createVideoBtn.disabled = true;
    status.textContent = '🎬 جاري إنشاء الفيديو...';
    const dur = parseInt(durationInput.value), fps = 30;
    const total = generatedImages.length * dur * fps;
    let frame = 0;
    const stream = outputCanvas.captureStream(fps);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const u = URL.createObjectURL(blob);
        downloadLink.href = u;
        downloadLink.download = 'ai-video.webm';
        downloadLink.style.display = 'inline-block';
        status.textContent = '✅ الفيديو جاهز! حمّلو من الزر الأخضر.';
        createVideoBtn.disabled = false;
    };
    mediaRecorder.start();
    (function draw() {
        if (frame >= total) { mediaRecorder.stop(); return; }
        const idx = Math.floor(frame/(dur*fps));
        const prog = (frame%(dur*fps))/(dur*fps);
        const img = generatedImages[idx];
        const zoom = 1+prog*0.1, panX = Math.sin(prog*Math.PI)*20;
        ctx.save();
        ctx.translate(outputCanvas.width/2+panX, outputCanvas.height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-outputCanvas.width/2, -outputCanvas.height/2);
        drawCover(img, outputCanvas.width, outputCanvas.height);
        ctx.restore();
        frame++;
        requestAnimationFrame(draw);
    })();
});
