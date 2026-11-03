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

const ctx = outputCanvas.getContext('2d');
let generatedImages = [];
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

// 1. توليد الصور من Pollinations.ai
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
    status.textContent = 'جاري توليد الصور... قد يستغرق هذا دقيقة...';

    for (let i = 0; i < numImages; i++) {
        status.textContent = `جاري توليد الصورة ${i + 1} من ${numImages}...`;
        
        // إضافة تنوع لكل صورة
        const seed = Date.now() + i;
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=640&height=360&seed=${seed}&nologo=true`;
        
        try {
            const img = await loadImage(imageUrl);
            generatedImages.push(img);
            
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imagesPreview.appendChild(imgElement);
        } catch (error) {
            console.error('خطأ في تحميل الصورة:', error);
        }
    }

    status.textContent = `✅ تم توليد ${generatedImages.length} صورة بنجاح!`;
    generateBtn.disabled = false;
    
    if (generatedImages.length > 0) {
        createVideoBtn.disabled = false;
    }
});

// دالة مساعدة لتحميل الصور
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

// 2. إنشاء الفيديو من الصور
createVideoBtn.addEventListener('click', async () => {
    if (generatedImages.length === 0) return;

    isRecording = true;
    recordedChunks = [];
    createVideoBtn.disabled = true;
    status.textContent = 'جاري إنشاء الفيديو...';

    const durationPerImage = parseInt(durationInput.value);
    const fps = 30;
    const totalFrames = generatedImages.length * durationPerImage * fps;
    let currentFrame = 0;

    // إعداد التسجيل
    const canvasStream = outputCanvas.captureStream(fps);
    
    // إضافة موسيقى إذا طُلب
    if (musicToggle.checked) {
        const audio = new Audio('https://www.bensound.com/bensound-music/bensound-epic.mp3'); // موسيقى مجانية
        audio.crossOrigin = 'anonymous';
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audio);
        const dest = audioContext.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioContext.destination);
        
        const combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
        ]);
        
        mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm; codecs=vp9' });
        audio.play();
    } else {
        mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm; codecs=vp9' });
    }

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
        isRecording = false;
    };

    mediaRecorder.start();

    // رسم الإطارات
    function drawFrame() {
        if (currentFrame >= totalFrames) {
            mediaRecorder.stop();
            return;
        }

        const imageIndex = Math.floor(currentFrame / (durationPerImage * fps));
        const frameInImage = currentFrame % (durationPerImage * fps);
        const progress = frameInImage / (durationPerImage * fps);

        const img = generatedImages[imageIndex];
        
        // تأثير Ken Burns (zoom + pan)
        const zoom = 1 + progress * 0.1; // تكبير تدريجي
        const panX = Math.sin(progress * Math.PI) * 20; // حركة أفقية
        
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
