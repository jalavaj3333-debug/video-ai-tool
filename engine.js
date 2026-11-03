// ============ محرك الاستوديو ============
// المتغيرات العامة
let storyScenes = [], recorder = null, chunks = [], gt = 0, audioCtx = null, masterGain = null;
let isPlaying = false, previewSceneIdx = -1;

// ===== أدوات مساعدة =====
function $(id) { return document.getElementById(id); }
function rnd(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hs(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function toon(g, fill, lw) { g.fillStyle = fill; g.fill(); g.strokeStyle = '#1a1208'; g.lineWidth = lw || 2.2; g.lineJoin = 'round'; g.stroke(); }
function eye(g, x, y, r, blink, expr) {
  g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, 6.28); toon(g, '#fff', 1.4);
  if (blink) { g.strokeStyle = '#1a1208'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - r * 0.6, y); g.quadraticCurveTo(x, y + r * 0.4, x + r * 0.6, y); g.stroke(); return; }
  const lookX = expr === 'sad' ? -0.2 : 0.2;
  g.beginPath(); g.arc(x + r * lookX, y + r * 0.1, r * 0.45, 0, 6.28); toon(g, '#2a1a0a', 1);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x + r * lookX - r * 0.15, y - r * 0.1, r * 0.16, 0, 6.28); g.fill();
}
function smile(g, x, y, w) { g.strokeStyle = '#1a1208'; g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, w, 0.2, 2.9); g.stroke(); }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function mixHex(c1, c2, t) { const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16); const r = Math.round(((a >> 16) & 255) + (((b >> 16) & 255) - ((a >> 16) & 255)) * t); const g = Math.round(((a >> 8) & 255) + (((b >> 8) & 255) - ((a >> 8) & 255)) * t); const bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * t); return `rgb(${r},${g},${bl})`; }

// ===== الصوت =====
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = ($('volumeSlider')?.value || 40) / 100;
  masterGain.connect(audioCtx.destination);
}
function playTone(freq, dur, type) {
  if (!audioCtx) initAudio();
  try {
    const o = audioCtx.createOscillator(), gn = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    gn.gain.setValueAtTime(0, audioCtx.currentTime);
    gn.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
    gn.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(gn); gn.connect(masterGain);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { }
}
function playMood(mood) {
  const scales = { happy: [261, 329, 392, 523], sad: [220, 261, 311, 349], tense: [233, 277, 329, 392], calm: [261, 329, 392, 493] };
  const notes = scales[mood] || scales.calm;
  notes.forEach((f, i) => setTimeout(() => playTone(f, 1.8, 'triangle'), i * 250));
}
function playSFX(type) {
  const sfx = { jump: [440, 0.15, 'square'], splash: [220, 0.25, 'sawtooth'], whoosh: [330, 0.3, 'sine'], pop: [660, 0.1, 'sine'] };
  const [f, d, t] = sfx[type] || sfx.pop;
  playTone(f, d, t);
}

// ===== تحليل القصة =====
function parseStory(text) {
  let parts = text.split(/\.\s+|\,\s+|\band\s+then\b|\bthen\b|\bfollowed by\b|\bnext\b/i).map(s => s.trim()).filter(s => s.length > 2);
  if (parts.length === 0) parts = [text];
  return parts.slice(0, 30).map(sentence => {
    const sl = sentence.toLowerCase();
    const has = (...w) => w.some(x => sl.includes(x));
    let time = 'day';
    if (has('night', 'dark', 'moon', 'stars')) time = 'night';
    else if (has('sunset', 'golden', 'dusk')) time = 'sunset';
    else if (has('sunrise', 'dawn', 'morning')) time = 'sunrise';
    else if (has('storm', 'thunder')) time = 'storm';
    let env = 'nature';
    const envMap = { ocean: ['ocean', 'sea', 'underwater', 'coral', 'beach'], forest: ['forest', 'tree', 'jungle'], desert: ['desert', 'savanna', 'sand'], space: ['space', 'galaxy', 'planet', 'mars'], mountain: ['mountain', 'snow', 'peak'], meadow: ['meadow', 'field', 'grass', 'flower'], ice: ['ice', 'arctic', 'polar'], city: ['city', 'neon', 'street'], cave: ['cave', 'crystal'] };
    for (const [e, kws] of Object.entries(envMap)) if (has(...kws)) { env = e; break; }
    const heroes = [];
    for (const [h, kws] of Object.entries(CHAR_KEYWORDS)) if (kws.some(k => sl.includes(k))) heroes.push(h);
    let weather = 'clear';
    if (has('rain', 'storm')) weather = 'rain';
    else if (has('snow', 'winter')) weather = 'snow';
    else if (has('fog', 'mist')) weather = 'fog';
    else if (has('fire', 'ember')) weather = 'ember';
    // حوارات
    const dialogues = [];
    const dm = /(\w+)\s+(?:says|said|shouts|whispers)\s+"([^"]+)"/gi;
    let m; while ((m = dm.exec(sentence)) !== null) {
      const sp = m[1].toLowerCase(), line = m[2].trim();
      const hk = Object.keys(CHAR_KEYWORDS).find(k => CHAR_KEYWORDS[k].some(w => sp.includes(w)));
      if (hk) dialogues.push({ hero: hk, text: line });
    }
    // تحديد التعبير
    let expr = 'neutral';
    if (has('happy', 'joy', 'laugh', 'smile', 'play', 'fun')) expr = 'happy';
    else if (has('sad', 'cry', 'lonely', 'miss', 'lost')) expr = 'sad';
    else if (has('angry', 'fight', 'roar', 'attack')) expr = 'angry';
    return { sentence, time, env, heroes: heroes.slice(0, 15), weather, dialogues, expr };
  });
}

// ===== بناء المشهد =====
function buildScene(obj, idx, total) {
  const r = rnd(hs(obj.sentence + idx));
  const { time, env, heroes, weather, dialogues, expr } = obj;
  let mood = 'calm';
  if (weather === 'storm' || time === 'night') mood = 'tense';
  else if (time === 'sunset' || time === 'sunrise') mood = 'happy';
  else if (env === 'ocean' || env === 'space') mood = 'calm';

  const skySets = { day: [['#4aa3e0', '#8fd0f5', '#cdeeff']], sunset: [['#5a2d8a', '#c44a6a', '#ff8c42', '#ffd166']], sunrise: [['#6a3a8a', '#e06a8a', '#ffb36b']], night: [['#0a1238', '#16265c', '#243b7a']], storm: [['#2a2a3a', '#3a3a4a', '#4a4a5a']] };
  const envSky = { space: [['#0a0028', '#1a0050', '#2d0070']], ocean: [['#1a6fa8', '#2a9fd0', '#5ac0e8']], ice: [['#8fbcd4', '#c8dce8', '#eef5fa']], cave: [['#1a1a1a', '#2a2a2a', '#3a3a3a']] };
  let sky = envSky[env] ? pick(r, envSky[env]) : pick(r, skySets[weather === 'storm' ? 'storm' : time] || skySets.day);
  const groundC = { desert: '#e8b85a', forest: '#4a9a3a', ocean: '#1a7ab0', mountain: '#7a8a9a', space: '#2a2a4a', nature: '#6aaa3a', meadow: '#7ac44a', ice: '#c8dce8', city: '#3a3a4a', cave: '#2a2a2a' };
  const ground = groundC[env] || '#6aaa3a';

  const hills = []; if (!['ocean', 'space', 'ice', 'cave'].includes(env)) { for (let L = 0; L < 3; L++) { const pts = []; for (let s = 0; s <= 5; s++) pts.push({ x: s / 5, y: 0.5 + L * 0.05 + (r() - 0.5) * 0.1 }); hills.push({ pts, d: L, snow: (env === 'mountain' || env === 'ice') && L < 2 }); } }
  const trees = []; if (['forest', 'meadow'].includes(env)) { for (let k = 0; k < (env === 'meadow' ? 6 : 12); k++) trees.push({ x: r(), s: 0.4 + r() * 0.6, col: r() > 0.5 ? '#3a8a2a' : '#2e7d2e' }); }
  const flowers = []; if (['meadow', 'forest'].includes(env)) { for (let k = 0; k < 15; k++) flowers.push({ x: r(), y: 0.62 + r() * 0.15, col: pick(r, ['#e85a9a', '#ffd166', '#ba68c8', '#ff7043']), sz: 2 + r() * 2 }); }
  const clouds = []; if (time !== 'night' && !['ocean', 'space', 'cave'].includes(env)) { for (let k = 0; k < 4; k++) clouds.push({ x: r(), y: 0.1 + r() * 0.2, w: 0.1 + r() * 0.12, sp: 0.004 + r() * 0.008 }); }
  const stars = []; if (time === 'night' || env === 'space') { for (let k = 0; k < 70; k++) stars.push({ x: r(), y: r() * 0.55, sz: 0.6 + r() * 2, tw: r() * 6.28 }); }
  const planets = []; if (env === 'space') { for (let k = 0; k < 2; k++) planets.push({ x: 0.1 + r() * 0.8, y: 0.1 + r() * 0.35, rad: 0.05 + r() * 0.12, col: pick(r, ['#ff7043', '#ba68c8', '#4fc3f7', '#ffd54f']) }); }
  const cel = { x: 0.2 + r() * 0.6, y: 0.12 + r() * 0.18, rad: 0.06 + r() * 0.05 };

  const cast = heroes.map((h, i) => {
    const def = CHARACTERS[h]; if (!def) return null;
    const n = heroes.length;
    const dialogue = dialogues.find(d => d.hero === h);
    return { type: h, fly: ['bird', 'owl', 'butterfly', 'bee', 'dragon'].includes(h), water: ['fish'].includes(h), x: clamp((i + 0.5) / n + (r() - 0.5) * 0.12, 0.12, 0.88), scale: (def.size || 1) * (0.85 + r() * 0.3), phase: r() * 6.28, speed: 0.6 + r() * 0.5, dialogue: dialogue ? dialogue.text : null, bubbleT: 0, expr };
  }).filter(Boolean).sort((a, b) => { const rk = x => x.water ? 0 : x.fly ? 2 : 1; return rk(a) - rk(b); });

  let cam = { z: 1.2, px: 0 };
  if (idx === 0) cam = { z: 1.0, px: 0 };
  else if (idx === total - 1) cam = { z: 1.5, px: 0.05 };
  else cam = { z: 1.2 + (idx % 2) * 0.2, px: (idx % 2 ? -0.03 : 0.04) };

  return { sky, ground, hills, trees, flowers, clouds, stars, planets, cel, cast, weather, cam, time, env, mood };
}

// ===== عناصر الخلفية =====
function drawSun(g, cx, cy, r, night, storm) {
  if (!night && !storm) { for (let i = 0; i < 10; i++) { const a = i * 0.628 + gt * 0.2; g.save(); g.translate(cx, cy); g.rotate(a); g.beginPath(); g.moveTo(r * 1.15, -r * 0.15); g.lineTo(r * 1.6, 0); g.lineTo(r * 1.15, r * 0.15); g.closePath(); toon(g, '#ffca28', 1.2); g.restore(); } }
  g.beginPath(); g.arc(cx, cy, r, 0, 6.28); toon(g, storm ? '#8a8a9a' : night ? '#f0f4ff' : '#ffe066', 2.2);
  if (!storm) { const blink = Math.sin(gt * 0.8) > 0.96 ? 1 : 0; eye(g, cx - r * 0.35, cy - r * 0.1, r * 0.2, blink); eye(g, cx + r * 0.35, cy - r * 0.1, r * 0.2, blink); g.strokeStyle = '#1a1208'; g.lineWidth = r * 0.07; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy + r * 0.15, r * 0.35, 0.3, 2.85); g.stroke(); g.fillStyle = 'rgba(255,150,150,0.4)'; g.beginPath(); g.arc(cx - r * 0.5, cy + r * 0.25, r * 0.13, 0, 6.28); g.arc(cx + r * 0.5, cy + r * 0.25, r * 0.13, 0, 6.28); g.fill(); }
}
function drawCloud(g, cx, cy, w, dark) { g.beginPath(); g.arc(cx - w * 0.3, cy, w * 0.22, 0, 6.28); g.arc(cx, cy - w * 0.1, w * 0.3, 0, 6.28); g.arc(cx + w * 0.3, cy, w * 0.22, 0, 6.28); g.arc(cx, cy + w * 0.05, w * 0.26, 0, 6.28); toon(g, dark ? '#5a5a6a' : '#fff', 2); }
function drawTree(g, x, y, s, col) { const sw = Math.sin(gt * 1.2 + x * 0.05) * 2; g.beginPath(); g.roundRect(x - 2.5 * s, y - 9 * s, 5 * s, 9 * s, 2); toon(g, '#7a4a20', 1.8); g.beginPath(); g.arc(x + sw, y - 20 * s, 10 * s, 0, 6.28); toon(g, col, 2); g.beginPath(); g.arc(x - 6 * s + sw * 0.7, y - 14 * s, 7 * s, 0, 6.28); toon(g, col, 1.8); g.beginPath(); g.arc(x + 6 * s + sw * 0.7, y - 14 * s, 7 * s, 0, 6.28); toon(g, col, 1.8); }
function drawFlower(g, x, y, col, sz) { g.strokeStyle = '#3a7a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + sz * 2.5); g.stroke(); for (let i = 0; i < 5; i++) { const a = i * 1.256 + gt * 0.3; g.beginPath(); g.ellipse(x + Math.cos(a) * sz, y + Math.sin(a) * sz - sz * 0.5, sz * 0.6, sz * 0.3, a, 0, 6.28); g.fillStyle = col; g.fill(); } g.beginPath(); g.arc(x, y - sz * 0.5, sz * 0.4, 0, 6.28); toon(g, '#ffd166', 1); }

// ===== فقاعة الحوار =====
function drawBubble(g, x, y, text, alpha) {
  if (!text || alpha <= 0) return;
  g.save(); g.globalAlpha = alpha;
  g.font = 'bold 13px Arial';
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (g.measureText(test).width > 150 && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur);
  const lh = 17, pad = 7, bw = 160, bh = lines.length * lh + pad * 2;
  const bx = x - bw / 2, by = y - bh - 14;
  g.fillStyle = '#fff'; g.strokeStyle = '#1a1208'; g.lineWidth = 1.8;
  g.beginPath(); g.roundRect(bx, by, bw, bh, 8); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - 6, by + bh); g.lineTo(x, by + bh + 10); g.lineTo(x + 6, by + bh); g.fill(); g.stroke();
  g.fillStyle = '#1a1208'; g.textAlign = 'center'; g.textBaseline = 'top';
  lines.forEach((ln, i) => g.fillText(ln, x, by + pad + i * lh));
  g.restore();
}

// ===== الرسم الرئيسي =====
function renderScene(g, S, ph, w, h) {
  g.clearRect(0, 0, w, h); g.save();
  const e = ph < 0.5 ? 2 * ph * ph : 1 - Math.pow(-2 * ph + 2, 2) / 2;
  const z = S.cam.z * (1 + e * 0.05);
  const dx = Math.sin(e * Math.PI) * 0.03;
  g.translate(w / 2 + (S.cam.px + dx) * w + Math.sin(gt * 1.7) * 1, h / 2 + Math.cos(gt * 1.3) * 0.8);
  g.scale(z, z); g.translate(-w / 2, -h / 2);

  const gr = g.createLinearGradient(0, 0, 0, h); S.sky.forEach((c, i) => gr.addColorStop(i / (S.sky.length - 1), c)); g.fillStyle = gr; g.fillRect(-w, -h, w * 3, h * 3);
  S.stars.forEach(p => { const tw = Math.abs(Math.sin(gt * 2 + p.tw)); g.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * tw})`; g.beginPath(); g.arc(p.x * w, p.y * h, p.sz * 0.8, 0, 6.28); g.fill(); });
  S.planets.forEach(p => { g.beginPath(); g.arc(p.x * w, p.y * h, p.rad * w, 0, 6.28); toon(g, p.col, 2.2); });
  S.clouds.forEach(cl => { const cx = ((cl.x + gt * cl.sp) % 1.3 - 0.15) * w; drawCloud(g, cx, cl.y * h, cl.w * w, S.weather === 'storm'); });
  drawSun(g, S.cel.x * w, S.cel.y * h, S.cel.rad * w, S.time === 'night' || S.env === 'space', S.weather === 'storm');

  const hor = h * 0.6;
  if (S.env === 'ocean' || S.env === 'ice') {
    g.fillStyle = S.ground; g.fillRect(0, hor, w, h - hor);
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2.5; g.lineCap = 'round';
    for (let L = 0; L < 4; L++) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = hor + L * (h - hor) / 4 + Math.sin(x * 0.03 + gt * 2 + L * 1.3) * (4 + L * 2); x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
  } else if (S.hills.length) {
    S.hills.forEach((H, idx) => { const off = e * (6 + idx * 10); g.beginPath(); g.moveTo(-w, h + h); H.pts.forEach(p => g.lineTo(p.x * w * 1.4 - w * 0.2 - off, p.y * h)); g.lineTo(w * 2, h + h); g.closePath(); toon(g, idx === S.hills.length - 1 ? S.ground : mixHex(S.ground, '#ffffff', 0.15 * idx), 2.4); if (H.snow) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); H.pts.forEach((p, i) => { const x = p.x * w * 1.4 - w * 0.2 - off, y = p.y * h; i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }); for (let i = H.pts.length - 1; i >= 0; i--) { const p = H.pts[i]; g.lineTo(p.x * w * 1.4 - w * 0.2 - off, p.y * h + h * 0.025); } g.closePath(); g.fill(); } });
  } else { g.fillStyle = S.ground; g.fillRect(0, hor, w, h - hor); }
  S.trees.forEach(t => drawTree(g, t.x * w * 1.3 - w * 0.15 - e * 16, hor + (1 - t.s) * h * 0.06, t.s * 1.1, t.col));
  S.flowers.forEach(f => drawFlower(g, f.x * w, f.y * h, f.col, f.sz));

  // الشخصيات
  S.cast.forEach(ch => {
    const wt = (gt * ch.speed + ch.phase) % 1;
    let cx = ch.x * w, cy;
    if (ch.fly) cy = h * 0.25 + Math.sin(gt * 1.5 + ch.phase) * 8;
    else if (ch.water) cy = hor + (h - hor) * 0.45 + Math.sin(gt * 1.2 + ch.phase) * 4;
    else cy = hor - 2;
    if (!ch.fly && !ch.water) cx = ((ch.x + e * 0.08 * ch.speed) % 1.1) * w;

    if (ch.dialogue) {
      ch.bubbleT += 1 / 30;
      if (ch.bubbleT > 0.5 && ch.bubbleT < 3.5) {
        const alpha = ch.bubbleT < 1 ? (ch.bubbleT - 0.5) * 2 : ch.bubbleT > 3 ? 1 - (ch.bubbleT - 3) : 1;
        drawBubble(g, cx, cy - ch.scale * 30, ch.dialogue, alpha);
      }
    }
    const charDef = CHARACTERS[ch.type];
    if (charDef && charDef.draw) charDef.draw(g, cx, cy, ch.scale, wt, ch.expr || 'neutral');
  });

  // طقس
  if (S.weather === 'rain') { g.strokeStyle = 'rgba(180,210,255,0.6)'; g.lineWidth = 1.5; for (let k = 0; k < 60; k++) { const rx = rnd(k * 7)(w), ry = ((rnd(k * 13)(h) + gt * 200) % h); g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 3, ry + 10); g.stroke(); } }
  else if (S.weather === 'snow') { g.fillStyle = '#fff'; for (let k = 0; k < 40; k++) { const sx = rnd(k * 11)(w), sy = ((rnd(k * 17)(h) + gt * 30) % h); g.beginPath(); g.arc(sx + Math.sin(gt + k) * 5, sy, 1.5 + rnd(k * 23)(), 0, 6.28); g.fill(); } }
  else if (S.weather === 'fog') { for (let L = 0; L < 3; L++) { const fy = hor - 10 + L * 14; const fgr = g.createLinearGradient(0, fy - 20, 0, fy + 20); fgr.addColorStop(0, 'rgba(0,0,0,0)'); fgr.addColorStop(0.5, `rgba(200,210,220,${0.2 - L * 0.05})`); fgr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = fgr; g.fillRect(0, fy - 20, w, 40); } }
  else if (S.weather === 'ember') { for (let k = 0; k < 25; k++) { const ex = rnd(k * 19)(w), ey = ((rnd(k * 29)(h) - gt * 50) % h + h) % h; g.fillStyle = ['#ff6d00', '#ffd54f', '#ff3d00'][k % 3]; g.globalAlpha = 1 - ey / h; g.beginPath(); g.arc(ex + Math.sin(gt * 2 + k) * 8, ey, 1.5 + rnd(k * 31)(), 0, 6.28); g.fill(); g.globalAlpha = 1; } }

  g.restore();
  const vg = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,40,0.35)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0a0812'; const lb = h * 0.07; g.fillRect(0, 0, w, lb); g.fillRect(0, h - lb, w, lb);
}

// ===== تحديث Timeline =====
function updateTimeline() {
  const tl = $('timeline'); tl.innerHTML = '';
  storyScenes.forEach((sc, idx) => {
    const div = document.createElement('div'); div.className = 'timeline-item' + (idx === previewSceneIdx ? ' active' : '');
    const tc = document.createElement('canvas'); tc.width = 160; tc.height = 90;
    renderScene(tc.getContext('2d'), sc, 0.4, 160, 90);
    const img = document.createElement('img'); img.src = tc.toDataURL();
    const num = document.createElement('span'); num.className = 'scene-num'; num.textContent = idx + 1;
    div.append(img, num);
    div.onclick = () => { previewSceneIdx = idx; updateTimeline(); previewCurrentScene(); };
    tl.appendChild(div);
  });
}

// ===== معاينة مشهد =====
function previewCurrentScene() {
  if (previewSceneIdx < 0 || previewSceneIdx >= storyScenes.length) return;
  const sc = storyScenes[previewSceneIdx];
  const canvas = $('outputCanvas');
  const ctx2 = canvas.getContext('2d');
  gt = 0;
  renderScene(ctx2, sc, 0.4, canvas.width, canvas.height);
  $('statusBar').textContent = `👁️ معاينة المشهد ${previewSceneIdx + 1}/${storyScenes.length}`;
}

// ===== الأزرار =====
$('durationSlider').addEventListener('input', e => { $('durationValue').textContent = e.target.value + 's'; });
$('volumeSlider').addEventListener('input', e => { if (masterGain) masterGain.gain.value = e.target.value / 100; });

$('analyzeBtn').addEventListener('click', () => {
  const text = $('storyInput').value.trim();
  if (!text) { alert('اكتب قصة أولاً!'); return; }
  const sentences = parseStory(text);
  if (sentences.length === 0) { alert('ما فهمتش الجملة.'); return; }
  storyScenes = sentences.map((s, i) => buildScene(s, i, sentences.length));
  previewSceneIdx = 0;
  updateTimeline();
  previewCurrentScene();
  $('analysisResult').textContent = `✅ ${storyScenes.length} مشاهد · ${sentences.reduce((a, s) => a + s.heroes.length, 0)} شخصيات · ${sentences.filter(s => s.dialogues.length > 0).length} حوارات`;
  $('generateAllBtn').disabled = false;
  $('playbackOverlay').style.display = 'flex';
});

$('previewBtn').addEventListener('click', () => {
  initAudio();
  if (previewSceneIdx >= 0 && storyScenes[previewSceneIdx]) {
    playMood(storyScenes[previewSceneIdx].mood);
    playSFX('pop');
  }
});

$('generateAllBtn').addEventListener('click', () => {
  if (!storyScenes.length) return;
  initAudio();
  chunks = []; isPlaying = true;
  $('generateAllBtn').style.display = 'none';
  $('stopBtn').style.display = 'inline-block';
  $('downloadLink').style.display = 'none';

  const dur = parseFloat($('durationSlider').value) || 4;
  const quality = $('qualitySelect').value;
  const res = { fast: [640, 360], medium: [1280, 720], high: [1920, 1080] }[quality] || [1280, 720];
  $('outputCanvas').width = res[0]; $('outputCanvas').height = res[1];

  const fps = 30, per = Math.round(dur * fps), total = storyScenes.length * per;
  let fr = 0; gt = 0;

  playMood(storyScenes[0]?.mood || 'calm');

  const stream = $('outputCanvas').captureStream(fps);
  let mime = 'video/webm; codecs=vp9'; if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
  recorder = new MediaRecorder(stream, { mimeType: mime });
  recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const u = URL.createObjectURL(blob);
    $('downloadLink').href = u; $('downloadLink').download = 'cartoon-film.webm';
    $('downloadLink').style.display = 'inline-block';
    $('stopBtn').style.display = 'none';
    $('generateAllBtn').style.display = 'inline-block';
    $('generateAllBtn').textContent = '🎬 إنتاج فيلم جديد';
    $('statusBar').textContent = `✅ الفيلم جاهز! ${(total / fps).toFixed(1)} ثانية · ${res[0]}×${res[1]} · حمّلو من الزر الأخضر 🎬`;
    isPlaying = false;
  };
  recorder.start();

  (function loop() {
    if (!isPlaying || fr >= total) { recorder.stop(); return; }
    gt = fr / fps;
    const idx = Math.min(Math.floor(fr / per), storyScenes.length - 1), lp = (fr % per) / per;
    if (fr % per === 0 && storyScenes[idx]) { playMood(storyScenes[idx].mood); previewSceneIdx = idx; updateTimeline(); }
    renderScene($('outputCanvas').getContext('2d'), storyScenes[idx], lp, res[0], res[1]);
    if (idx < storyScenes.length - 1 && lp > 0.85) {
      const t = (lp - 0.85) / 0.15;
      const ctx2 = $('outputCanvas').getContext('2d');
      ctx2.save(); ctx2.globalAlpha = t * t * (3 - 2 * t);
      renderScene(ctx2, storyScenes[idx + 1], 0, res[0], res[1]);
      ctx2.restore();
    }
    fr++;
    if (fr % 10 === 0) $('statusBar').textContent = `🎬 إطار ${fr}/${total} · مشهد ${idx + 1}/${storyScenes.length} · ${(fr / fps).toFixed(1)}s`;
    requestAnimationFrame(loop);
  })();
});

$('stopBtn').addEventListener('click', () => {
  isPlaying = false;
  if (recorder) recorder.stop();
  $('stopBtn').style.display = 'none';
  $('generateAllBtn').style.display = 'inline-block';
  $('statusBar').textContent = '⏹️ تم الإيقاف.';
});
