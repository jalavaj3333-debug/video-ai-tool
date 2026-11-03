// ====== العناصر ======
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
const POLLINATIONS_TOKEN = ''; // إلا خذيت توكن مجاني من enter.pollinations.ai لصقوه هنا
const WAIT_SECONDS = 46;
const WIDTH = 640;
const HEIGHT = 360;
// =======================

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];
let firstRequestDone = false;

function waitWithCountdown(seconds) {
    return new Promise((resolve) => {
        let left = seconds;
        status.textContent = `⏳ كنصبرو على الحد المجاني... باقي ${left} ثانية`;
        const timer = setInterval(() => {
            left--;
            status.textContent = `⏳ كنصبرو على الحد المجاني... باقي ${left} ثانية`;
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

// 🔎 كشف الصور المزيفة (رسالة الحد المجاني أو الرفض)
function isBadImage(img) {
    // 1) الصورة الحقيقية خاصها تكون بالمقاس المطلوب بالضبط
    if (img.naturalWidth !== WIDTH || img.naturalHeight !== HEIGHT) return true;
    // 2) فحص الألوان: إلا كانت الأركان الأربعة بنفس اللون الفاتح = رسالة ماشي صورة
    try {
        const c = document.createElement('canvas');
        c.width = WIDTH; c.height = HEIGHT;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        const pts = [[5,5],[WIDTH-6,5],[5,HEIGHT-6],[WIDTH-6,HEIGHT-6]];
        const cols = pts.map(p => Array.from(cx.getImageData(p[0], p[1], 1, 1).data));
        const same = cols.every(cl =>
            Math.abs(cl[0]-cols[0][0]) < 15 &&
            Math.abs(cl[1]-cols[0][1]) < 15 &&
            Math.abs(cl[2]-cols[0][2]) < 15
        );
        const bright = cols[0][0] > 200 && cols[0][1] > 170;
        return same && bright;
    } catch (e) { return false; }
}

// تنظيم وتيرة الطلبات
async function pace() {
    if (POLLINATIONS_TOKEN) return; // بالتوكن ما كاينش انتظار
    if (!firstRequestDone) { firstRequestDone = true; return; }
    await waitWithCountdown(WAIT_SECONDS);
}

// جلب صورة حقيقية مع محاولات تلقائية
async function fetchGoodImage(prompt, index, total) {
    const maxTries = 4;
    for (let t = 0; t < maxTries; t++) {
        await pace();
        status.textContent = `🎨 كنولدو الصورة ${index + 1} من ${total}... (محاولة ${t + 1})`;
        const seed = Date.now() + index * 100 + t;
        let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&seed=${seed}`;
        if (POLLINATIONS_TOKEN) url += `&token=${POLLINATIONS_TOKEN}&nologo=true`;
        try {
            const img = await loadImage(url);
            if (!isBadImage(img)) return img;
            status.textContent = `⚠️ صورة مزيفة (حد مجاني/رفض)، كنعاودو المحاولة...`;
        } catch (e) {
            status.textContent = `⚠️ خطأ فال تحميل، كنعاودو المحاولة...`;
        }
    }
    return null;
}

// 1) توليد الصور
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const numImages = parseInt(numImagesInput.value);
    if (!prompt) { alert('الرجاء إدخال وصف للفيديو'); return; }

    generateBtn.disabled = true;
    createVideoBtn.disabled = true;
    imagesPreview.innerHTML = '';
    generatedImages = [];
    firstRequestDone = false;

    for (let i = 0; i < numImages; i++) {
        const img = await fetchGoodImage(prompt, i, numImages);
        if (img) {
            generatedImages.push(img);
            const el = document.createElement('img');
            el.src = img.src;
            imagesPreview.appendChild(el);
        }
    }

    if (generatedImages.length === 0) {
        status.textContent = '❌ ما تولدات حتى صورة حقيقية. أحسن حل: زيد التوكن المجاني (enter.pollinations.ai).';
    } else {
        status.textContent = `✅ تولدات ${generatedImages.length} صورة حقيقية! اضغط "إنشاء الفيديو".`;
        createVideoBtn.disabled = false;
    }
    generateBtn.disabled = false;
});

// 2) إنشاء الفيديو
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
        const frameInImage = currentFrame % (durationPerImage * fps);
        const progress = frameInImage / (durationPerImage * fps);
        const img = generatedImages[imageIndex];

        const zoom = 1 + progress * 0.1;
        const panX = Math.sin(progress * Math.PI) * 20;

        ctx.save();
        ctx.translate(outputCanvas.width / 2 + panX, outputCanvas.height / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-outputCanvas.width / 2, -outputCanvas.height / 2);
        ctx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height);
        ctx.restore();

        currentFrame++;
        requestAnimationFrame(drawFrame);
    }
    drawFrame();
});
