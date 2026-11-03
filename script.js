const promptInput = document.getElementById('promptInput');
const numImagesInput = document.getElementById('numImagesInput');
const durationInput = document.getElementById('durationInput');
const generateBtn = document.getElementById('generateBtn');
const createVideoBtn = document.getElementById('createVideoBtn');
const status = document.getElementById('status');
const imagesPreview = document.getElementById('imagesPreview');
const outputCanvas = document.getElementById('outputCanvas');
const downloadLink = document.getElementById('downloadLink');

// ====== الإعدادات ======
// المفتاح كيتحفظ غير فالمتصفح ديالك (localStorage)، وما كيدخلش فالكود
let GEMINI_KEY = localStorage.getItem('gemini_key') || '';
const MODEL = 'gemini-2.5-flash-image';
const WAIT_BETWEEN = 25;
// =======================

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];

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

async function generateImageGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + await res.text());
    const data = await res.json();
    const parts = (data.candidates && data.candidates[0].content.parts) || [];
    let inline = null;
    for (const p of parts) { if (p.inlineData) { inline = p.inlineData; break; } }
    if (!inline) throw new Error('ما كاينة حتى صورة فالجواب');

    const bin = atob(inline.data);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: inline.mimeType || 'image/png' });
    return URL.createObjectURL(blob);
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function drawCover(image, w, h) {
    const ir = image.width / image.height, cr = w / h;
    let sx = 0, sy = 0, sw = image.width, sh = image.height;
    if (ir > cr) { sw = image.height * cr; sx = (image.width - sw) / 2; }
    else { sh = image.width / cr; sy = (image.height - sh) / 2; }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
}

// 1. توليد الصور
generateBtn.addEventListener('click', async () => {
    const basePrompt = promptInput.value.trim();
    const numImages = parseInt(numImagesInput.value);

    if (!basePrompt) { alert('الرجاء إدخال وصف للفيديو'); return; }

    // إلا ما كانش مفتاح محفوظ، طلبوه من المستخدم مرة وحدة
    if (!GEMINI_KEY) {
        const k = window.prompt('🔑 لصق مفتاح Gemini ديالك هنا:\n(غادي يتحفظ غير فالمتصفح ديالك، وما غاديش يدخل فالكواد)');
        if (!k || !k.trim()) {
            status.textContent = '❌ ما دخلتيش المفتاح.';
            return;
        }
        GEMINI_KEY = k.trim();
        localStorage.setItem('gemini_key', GEMINI_KEY);
    }

    generateBtn.disabled = true;
    createVideoBtn.disabled = true;
    imagesPreview.innerHTML = '';
    generatedImages = [];

    for (let i = 0; i < numImages; i++) {
        if (i > 0) await waitWithCountdown(WAIT_BETWEEN, '⏳ انتظار بين المشاهد... باقي');

        status.textContent = `🎨 جاري توليد المشهد ${i + 1} من ${numImages}...`;

        const prompt = `${basePrompt}. Scene ${i + 1} of ${numImages}, different camera angle, cinematic, highly detailed`;

        let ok = false;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const objUrl = await generateImageGemini(prompt);
                const img = await loadImage(objUrl);
                generatedImages.push(img);
                const el = document.createElement('img');
                el.src = objUrl;
                imagesPreview.appendChild(el);
                ok = true;
                break;
            } catch (e) {
                console.error(e);
                status.textContent = `⚠️ فشل المشهد ${i + 1}، محاولة ثانية...`;
                await waitWithCountdown(20, '⏳ انتظار... باقي');
            }
        }
        if (!ok) status.textContent = `❌ المشهد ${i + 1} ترفض، نكملو بالباقي.`;
    }

    status.textContent = `✅ تم توليد ${generatedImages.length} مشهد!`;
    generateBtn.disabled = false;
    if (generatedImages.length > 0) createVideoBtn.disabled = false;
});

// 2. إنشاء الفيديو
createVideoBtn.addEventListener('click', () => {
    if (generatedImages.length === 0) return;

    recordedChunks = [];
    createVideoBtn.disabled = true;
    status.textContent = '🎬 جاري إنشاء الفيديو...';

    const durationPerImage = parseInt(durationInput.value);
    const fps = 30;
    const totalFrames = generatedImages.length * durationPerImage * fps;
    let currentFrame = 0;

    const canvasStream = outputCanvas.captureStream(fps);
    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp9' });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'ai-generated-video.webm';
        downloadLink.style.display = 'inline-block';
        status.textContent = '✅ تم إنشاء الفيديو بنجاح! اضغط على زر التحميل.';
        createVideoBtn.disabled = false;
    };

    mediaRecorder.start();

    function drawFrame() {
        if (currentFrame >= totalFrames) { mediaRecorder.stop(); return; }

        const imageIndex = Math.floor(currentFrame / (durationPerImage * fps));
        const progress = (currentFrame % (durationPerImage * fps)) / (durationPerImage * fps);
        const img = generatedImages[imageIndex];

        const zoom = 1 + progress * 0.1;
        const panX = Math.sin(progress * Math.PI) * 20;

        ctx.save();
        ctx.translate(outputCanvas.width / 2 + panX, outputCanvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-outputCanvas.width / 2, -outputCanvas.height / 2);
        drawCover(img, outputCanvas.width, outputCanvas.height);
        ctx.restore();

        currentFrame++;
        requestAnimationFrame(drawFrame);
    }

    drawFrame();
});
