const promptInput = document.getElementById('promptInput');
const numImagesInput = document.getElementById('numImagesInput');
const durationInput = document.getElementById('durationInput');
const musicToggle = document.getElementById('musicToggle');
const generateBtn = document.getElementById('generateBtn');
const createVideoBtn = document.getElementById('createVideoBtn');
const status = document.getElementById('status');
const imagesPreview = document.getElementById('imagesPreview');
const outputCanvas = document.getElementById('outputCanvas');
const downloadLink = document.getElementById('downloadLink');

// ====== الإعدادات ======
// إلا خذيت توكن مجاني من enter.pollinations.ai، لصقوه هنا بين القوسين:
const POLLINATIONS_TOKEN = '';
// مدة الانتظار بين الصور (بالثواني) فحالة ما عندكش توكن:
const WAIT_SECONDS = 46;
// =======================

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];

// دالة الانتظار مع عدّاد تنازلي
function waitWithCountdown(seconds) {
    return new Promise((resolve) => {
        let left = seconds;
        status.textContent = `⏳ كنصبرو على الحد المجاني... باقي ${left} ثانية`;
        const timer = setInterval(() => {
            left--;
            status.textContent = `⏳ كنصبرو على الحد المجاني... باقي ${left} ثانية`;
            if (left <= 0) {
                clearInterval(timer);
                resolve();
            }
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

// 1. توليد الصور
generateBtn.addEventListener('click', async () => {
    const prompt = promptInput.value.trim();
    const numImages = parseInt(numImagesInput.value);

    if (!prompt) {
        alert('الرجاء إدخال وصف للفيديو');
        return;
    }

    generateBtn.disabled = true;
    createVideoBtn.disabled = true;
    imagesPreview.innerHTML = '';
    generatedImages = [];

    for (let i = 0; i < numImages; i++) {
        // الانتظار بين الصور إلا ما كانش توكن
        if (i > 0 && !POLLINATIONS_TOKEN) {
            await waitWithCountdown(WAIT_SECONDS);
        }

        status.textContent = `🎨 جاري توليد الصورة ${i + 1} من ${numImages}...`;

        const seed = Date.now() + i;
        let imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=360&seed=${seed}&nologo=true`;
        if (POLLINATIONS_TOKEN) {
            imageUrl += `&token=${POLLINATIONS_TOKEN}`;
        }

        try {
            const img = await loadImage(imageUrl);
            generatedImages.push(img);
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imagesPreview.appendChild(imgElement);
        } catch (error) {
            console.error('خطأ في تحميل الصورة:', error);
            status.textContent = `⚠️ الصورة ${i + 1} فشلات، كنعاودو المحاولة...`;
            await waitWithCountdown(WAIT_SECONDS);
            try {
                const img = await loadImage(imageUrl + '&retry=1');
                generatedImages.push(img);
                const imgElement = document.createElement('img');
                imgElement.src = img.src;
                imagesPreview.appendChild(imgElement);
            } catch (e) {
                console.error('فشلات مرة ثانية:', e);
            }
        }
    }

    status.textContent = `✅ تم توليد ${generatedImages.length} صورة بنجاح!`;
    generateBtn.disabled = false;
    if (generatedImages.length > 0) {
        createVideoBtn.disabled = false;
    }
});

// 2. إنشاء الفيديو من الصور
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
        if (currentFrame >= totalFrames) {
            mediaRecorder.stop();
            return;
        }

        const imageIndex = Math.floor(currentFrame / (durationPerImage * fps));
        const frameInImage = currentFrame % (durationPerImage * fps);
        const progress = frameInImage / (durationPerImage * fps);

        const img = generatedImages[imageIndex];

        // تأثير Ken Burns (تكبير + حركة سينمائية)
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
