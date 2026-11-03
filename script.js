const promptInput = document.getElementById('promptInput');
const numImagesInput = document.getElementById('numImagesInput');
const durationInput = document.getElementById('durationInput');
const generateBtn = document.getElementById('generateBtn');
const createVideoBtn = document.getElementById('createVideoBtn');
const status = document.getElementById('status');
const imagesPreview = document.getElementById('imagesPreview');
const outputCanvas = document.getElementById('outputCanvas');
const downloadLink = document.getElementById('downloadLink');

// ====== المفتاح كيتحفظ غير فالمتصفح ديالك ======
let POLLI_TOKEN = localStorage.getItem('polli_token') || '';
const WAIT_NO_TOKEN = 46; // انتظار طويل إلا ما كانش مفتاح
// ================================================

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];

// زر ديناميكي "🔑 المفتاح" بلا ما نبدلو HTML
const keyBtn = document.createElement('button');
keyBtn.textContent = POLLI_TOKEN ? '🔑 المفتاح: ✅ (بدّلو)' : '🔑 أدخل مفتاح Pollinations';
keyBtn.style.cssText = 'margin-top:8px;padding:8px 14px;border:none;border-radius:6px;background:#ffd166;color:#000;font-weight:bold;cursor:pointer;';
keyBtn.onclick = () => {
    const k = window.prompt('🔑 لصق مفتاح Pollinations (من enter.pollinations.ai):\n(كيتحفظ غير فمتصفحك)', POLLI_TOKEN);
    if (k === null) return;
    POLLI_TOKEN = k.trim();
    if (POLLI_TOKEN) localStorage.setItem('polli_token', POLLI_TOKEN);
    else localStorage.removeItem('polli_token');
    keyBtn.textContent = POLLI_TOKEN ? '🔑 المفتاح: ✅ (بدّلو)' : '🔑 أدخل مفتاح Pollinations';
    status.textContent = POLLI_TOKEN ? '✅ المفتاح تحفظ. دابا الصور غادي يجيو سريعين!' : '⚠️ تمسح المفتاح. غادي نخدمو بالانتظار الطويل.';
};
document.querySelector('.buttons').after(keyBtn);

function waitWithCountdown(seconds, msg) {
    return new Promise((resolve) => {
        let left = seconds;
        status.textContent = `${msg} (${left})`;
        const timer = setInterval(() => {
            left--;
            status.textContent = `${msg} (${left})`;
            if (left <= 0) { clearInterval(timer); resolve(); }
        }, 1000);
    });
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// كشف الصور المزيفة (صفراء/وردية = limit reached)
function isPlaceholder(img) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0, 16, 16);
    const d = x.getImageData(0, 0, 16, 16).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i+1]; b += d[i+2]; }
    r /= 256; g /= 256; b /= 256;
    let v = 0;
    for (let i = 0; i < d.length; i += 4) v += (d[i]-r)**2 + (d[i+1]-g)**2 + (d[i+2]-b)**2;
    v /= 256;
    const yellow = r > 200 && g > 170 && b < 160;
    const pink = r > 220 && g > 190 && b > 180 && b < 225;
    return v < 1800 && (yellow || pink);
}

function drawCover(image, w, h) {
    const ir = image.width / image.height, cr = w / h;
    let sx=0, sy=0, sw=image.width, sh=image.height;
    if (ir > cr) { sw = image.height*cr; sx = (image.width-sw)/2; }
    else { sh = image.width/cr; sy = (image.height-sh)/2; }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
}

// 1. توليد الصور
generateBtn.addEventListener('click', async () => {
    const basePrompt = promptInput.value.trim();
    const numImages = parseInt(numImagesInput.value);
    if (!basePrompt) { alert('الرجاء إدخال وصف للفيديو'); return; }

    generateBtn.disabled = true;
    createVideoBtn.disabled = true;
    imagesPreview.innerHTML = '';
    generatedImages = [];
    let blocked = false;

    for (let i = 0; i < numImages; i++) {
        if (blocked) break;
        if (i > 0 && !POLLI_TOKEN) await waitWithCountdown(WAIT_NO_TOKEN, '⏳ انتظار (بلا مفتاح)... باقي');

        status.textContent = `🎨 جاري توليد المشهد ${i + 1} من ${numImages}...`;

        let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?model=flux&seed=${Date.now()+i}&width=640&height=360&nologo=true`;
        if (POLLI_TOKEN) url += `&token=${POLLI_TOKEN}`;

        let got = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const img = await loadImage(url);
                if (!isPlaceholder(img)) { got = img; break; }
                // جات مزيفة = limit
                if (!POLLI_TOKEN) {
                    status.textContent = '🛑 بلا مفتاح، Pollيناتيونز كيحددو. اضغط زر "🔑 المفتاح" فوق ولصق مفتاح مجاني من enter.pollinations.ai — غادي يتحل المشكل نهائياً.';
                    blocked = true;
                } else {
                    status.textContent = `⚠️ المشهد ${i+1} ترفض، محاولة ثانية...`;
                    await waitWithCountdown(10, '⏳');
                }
            } catch (e) {
                status.textContent = `⚠️ خطأ فالتحميل: ${e.message}`;
                await waitWithCountdown(10, '⏳');
            }
        }

        if (got) {
            generatedImages.push(got);
            const el = document.createElement('img');
            el.src = got.src;
            imagesPreview.appendChild(el);
        }
    }

    if (!blocked) status.textContent = `✅ تم توليد ${generatedImages.length} مشهد!`;
    generateBtn.disabled = false;
    if (generatedImages.length > 0) createVideoBtn.disabled = false;
});

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
        const idx = Math.floor(frame / (dur*fps));
        const prog = (frame % (dur*fps)) / (dur*fps);
        const img = generatedImages[idx];
        const zoom = 1 + prog*0.1, panX = Math.sin(prog*Math.PI)*20;
        ctx.save();
        ctx.translate(outputCanvas.width/2 + panX, outputCanvas.height/2);
        ctx.scale(zoom, zoom);
        ctx.translate(-outputCanvas.width/2, -outputCanvas.height/2);
        drawCover(img, outputCanvas.width, outputCanvas.height);
        ctx.restore();
        frame++;
        requestAnimationFrame(draw);
    })();
});
