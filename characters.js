// ============ مكتبة الشخصيات الكاملة ============
const CHARACTERS = {
  lion: {
    color: '#e8a33d', accent: '#b5651d', belly: '#f7d9a0', nose: '#5a2d0c',
    draw(g, x, y, s, wt, expr) {
      const step = Math.sin(wt * 6.28), bob = Math.abs(step) * 2;
      g.save(); g.translate(x, y - bob); g.scale(s, s);
      // ذيل
      g.strokeStyle = '#e8a33d'; g.lineWidth = 4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-22, -2); g.quadraticCurveTo(-32, -10 + Math.sin(gt * 2) * 4, -28, -18); g.stroke();
      g.beginPath(); g.arc(-28, -19, 3.5, 0, 6.28); toon(g, '#3a1f08', 1.5);
      // أرجل
      [[-13, Math.sin(wt * 6.28 + 3.14)], [9, Math.sin(wt * 6.28 + 3.14)], [-6, step], [14, step]].forEach(([lx, sw], i) => {
        g.save(); g.translate(lx, 6); g.rotate(sw * 0.5);
        g.beginPath(); g.roundRect(-3, 0, 6, 14, 2); toon(g, i < 2 ? '#c98a2e' : '#e8a33d', 1.8); g.restore();
      });
      // جسم
      g.beginPath(); g.ellipse(-2, -3, 23, 12, 0, 0, 6.28); toon(g, '#e8a33d', 2.4);
      g.fillStyle = '#f7d9a0'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(-2, 3, 15, 5, 0, 0, 6.28); g.fill(); g.globalAlpha = 1;
      // mane
      const mx = 16, my = -13, mr = 15;
      g.beginPath();
      for (let a = 0; a < 6.28; a += 0.2) { const rr = mr + Math.sin(a * 7 + gt * 2.5) * 3; g.lineTo(mx + Math.cos(a) * rr, my + Math.sin(a) * rr); }
      g.closePath(); toon(g, '#b5651d', 2.4);
      // رأس
      g.beginPath(); g.arc(mx, my, 9, 0, 6.28); toon(g, '#e8a33d', 2.2);
      g.beginPath(); g.arc(mx - 5, my - 7, 3, 0, 6.28); g.arc(mx + 3, my - 8, 3, 0, 6.28); toon(g, '#b5651d', 1.5);
      // وجه مع تعبيرات
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, mx - 3, my - 1, 2.8, blink, expr); eye(g, mx + 4, my - 1, 2.8, blink, expr);
      g.beginPath(); g.moveTo(mx + 0.5, my + 3); g.lineTo(mx - 1.5, my + 5); g.lineTo(mx + 2.5, my + 5); g.closePath(); toon(g, '#5a2d0c', 1.2);
      if (expr === 'happy') smile(g, mx + 0.5, my + 5.5, 3);
      else if (expr === 'sad') { g.strokeStyle = '#1a1208'; g.lineWidth = 1.4; g.beginPath(); g.arc(mx + 0.5, my + 8, 2.5, 3.5, 5.8); g.stroke(); }
      else smile(g, mx + 0.5, my + 5.5, 2.5);
      g.restore();
    }
  },
  monkey: {
    color: '#a06a3a', accent: '#8a5a2a', belly: '#d4a574',
    draw(g, x, y, s, wt, expr) {
      const jump = Math.abs(Math.sin(wt * 8)) * 6, arm = Math.sin(wt * 8) * 0.6;
      g.save(); g.translate(x, y - jump); g.scale(s, s);
      g.strokeStyle = '#8a5a2a'; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(-24, -8 + Math.sin(gt * 3) * 4, -20, -16); g.stroke();
      [[-8, arm], [8, -arm]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 4); g.rotate(sw * 0.4); g.beginPath(); g.roundRect(-2.5, 0, 5, 10, 2); toon(g, '#8a5a2a', 1.6); g.restore(); });
      g.beginPath(); g.ellipse(0, -2, 10, 8, 0, 0, 6.28); toon(g, '#a06a3a', 2);
      g.fillStyle = '#d4a574'; g.globalAlpha = 0.8; g.beginPath(); g.ellipse(0, 0, 6, 5, 0, 0, 6.28); g.fill(); g.globalAlpha = 1;
      g.save(); g.translate(-8, -6); g.rotate(-arm); g.beginPath(); g.roundRect(-2, 0, 4, 10, 2); toon(g, '#a06a3a', 1.6); g.restore();
      g.save(); g.translate(8, -6); g.rotate(arm); g.beginPath(); g.roundRect(-2, 0, 4, 10, 2); toon(g, '#a06a3a', 1.6); g.restore();
      g.beginPath(); g.arc(0, -14, 8, 0, 6.28); toon(g, '#a06a3a', 2);
      g.fillStyle = '#d4a574'; g.beginPath(); g.ellipse(0, -12, 5, 4, 0, 0, 6.28); g.fill();
      g.beginPath(); g.arc(-6, -18, 3, 0, 6.28); g.arc(6, -18, 3, 0, 6.28); toon(g, '#a06a3a', 1.4);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, -2.5, -15, 2.2, blink, expr); eye(g, 2.5, -15, 2.2, blink, expr);
      if (expr === 'happy') { smile(g, 0, -11, 3); g.fillStyle = '#fff'; g.beginPath(); g.arc(-1, -10.5, 1, 0, 6.28); g.arc(1, -10.5, 1, 0, 6.28); g.fill(); }
      else smile(g, 0, -11, 2.5);
      g.restore();
    }
  },
  elephant: {
    color: '#9a9aa8', accent: '#7a7a88', belly: '#c2c2cc',
    draw(g, x, y, s, wt, expr) {
      const st = Math.sin(wt * 5);
      g.save(); g.translate(x, y); g.scale(s, s);
      [[-14, st], [14, -st], [-4, -st], [8, st]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 8); g.rotate(sw * 0.3); g.beginPath(); g.roundRect(-3.5, 0, 7, 15, 2); toon(g, '#9a9aa8', 2); g.restore(); });
      g.beginPath(); g.ellipse(0, -6, 26, 16, 0, 0, 6.28); toon(g, '#9a9aa8', 2.4);
      g.beginPath(); g.arc(22, -14, 10, 0, 6.28); toon(g, '#9a9aa8', 2.2);
      g.strokeStyle = '#1a1208'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(30, -10); g.quadraticCurveTo(38 + Math.sin(gt * 2) * 3, 0, 34, 8); g.stroke();
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 25, -16, 2.6, blink, expr);
      if (expr === 'happy') smile(g, 28, -12, 2.5); else smile(g, 28, -12, 2);
      g.strokeStyle = '#d8cfc0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(30, -6); g.lineTo(33, 2); g.stroke();
      g.restore();
    }
  },
  bird: {
    color: '#3a6ea5', beak: '#f4a82a',
    draw(g, x, y, s, wt, expr) {
      const fl = Math.sin(gt * 9) * 0.7;
      g.save(); g.translate(x, y); g.scale(s, s);
      g.beginPath(); g.moveTo(-2, 0); g.quadraticCurveTo(-14, -8 - fl * 8, -20, -2 - fl * 4); g.quadraticCurveTo(-12, 2, -2, 1); g.closePath(); toon(g, '#3a6ea5', 1.8);
      g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(14, -8 - fl * 8, 20, -2 - fl * 4); g.quadraticCurveTo(12, 2, 2, 1); g.closePath(); toon(g, '#3a6ea5', 1.8);
      g.beginPath(); g.ellipse(0, 0, 6, 4, 0, 0, 6.28); toon(g, '#3a6ea5', 1.8);
      g.beginPath(); g.arc(5, -2, 3, 0, 6.28); toon(g, '#3a6ea5', 1.5);
      g.beginPath(); g.moveTo(7, -2); g.lineTo(11, -1); g.lineTo(7, 0); g.closePath(); toon(g, '#f4a82a', 1.2);
      eye(g, 4.5, -3, 1.6, 0, expr); smile(g, 6, -1, 1.5);
      g.restore();
    }
  },
  fish: {
    color: '#3aa6c4', fin: '#2a7a94',
    draw(g, x, y, s, wt, expr) {
      g.save(); g.translate(x, y); g.scale(s, s); const wg = Math.sin(gt * 6) * 0.25; g.rotate(wg * 0.3);
      g.beginPath(); g.ellipse(0, 0, 14, 7, 0, 0, 6.28); toon(g, '#3aa6c4', 2.2);
      g.beginPath(); g.moveTo(12, 0); g.lineTo(22, -7); g.lineTo(22, 7); g.closePath(); toon(g, '#2a7a94', 1.8);
      g.beginPath(); g.moveTo(-2, -6); g.lineTo(2, -13); g.lineTo(6, -6); g.closePath(); toon(g, '#2a7a94', 1.8);
      eye(g, -7, -2, 2.4, 0, expr); smile(g, -9, 1, 2);
      g.restore();
    }
  },
  dragon: {
    color: '#3a8a4a', wing: '#2a6a3a', belly: '#a8d48a',
    draw(g, x, y, s, wt, expr) {
      const wn = Math.sin(gt * 5) * 0.6;
      g.save(); g.translate(x, y); g.scale(s, s);
      g.save(); g.translate(-4, -8); g.rotate(wn); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-8, -22, 8, -26); g.quadraticCurveTo(2, -14, 4, 0); g.closePath(); toon(g, '#2a6a3a', 2); g.restore();
      g.beginPath(); g.ellipse(0, -2, 24, 9, 0, 0, 6.28); toon(g, '#3a8a4a', 2.4);
      g.fillStyle = '#a8d48a'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(0, 2, 18, 4, 0, 0, 6.28); g.fill(); g.globalAlpha = 1;
      g.beginPath(); g.arc(22, -9, 7, 0, 6.28); toon(g, '#3a8a4a', 2.2);
      g.beginPath(); g.moveTo(26, -12); g.lineTo(32, -15); g.lineTo(28, -8); g.closePath(); toon(g, '#2a6a3a', 1.5);
      eye(g, 24, -11, 2.4, 0, expr); smile(g, 27, -7, 2);
      g.strokeStyle = '#1a1208'; g.lineWidth = 3; g.beginPath(); g.moveTo(-22, -2); g.quadraticCurveTo(-34, 2, -30, 10); g.stroke();
      g.restore();
    }
  },
  cat: {
    color: '#5a5a6a', accent: '#4a4a5a', pink: '#ffb6c1',
    draw(g, x, y, s, wt, expr) {
      const tail = Math.sin(wt * 4) * 0.6, step = Math.sin(wt * 6.28);
      g.save(); g.translate(x, y); g.scale(s, s);
      g.strokeStyle = '#4a4a5a'; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(-24, -6 + tail * 8, -20, -14 + tail * 4); g.stroke();
      [[-8, step], [8, -step], [-2, -step], [4, step]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 4); g.rotate(sw * 0.4); g.beginPath(); g.roundRect(-2, 0, 4, 10, 2); toon(g, '#4a4a5a', 1.5); g.restore(); });
      g.beginPath(); g.ellipse(0, -2, 12, 8, 0, 0, 6.28); toon(g, '#5a5a6a', 2);
      g.beginPath(); g.arc(10, -10, 7, 0, 6.28); toon(g, '#5a5a6a', 2);
      g.beginPath(); g.moveTo(6, -15); g.lineTo(4, -22); g.lineTo(9, -16); g.closePath(); toon(g, '#5a5a6a', 1.5);
      g.beginPath(); g.moveTo(12, -15); g.lineTo(14, -22); g.lineTo(16, -16); g.closePath(); toon(g, '#5a5a6a', 1.5);
      g.fillStyle = '#ffb6c1'; g.beginPath(); g.moveTo(6.5, -16); g.lineTo(5, -20); g.lineTo(8.5, -16.5); g.fill();
      g.beginPath(); g.moveTo(12.5, -16); g.lineTo(13.5, -20); g.lineTo(15, -16.5); g.fill();
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 8, -11, 2.2, blink, expr); eye(g, 13, -11, 2.2, blink, expr);
      g.fillStyle = '#ffb6c1'; g.beginPath(); g.arc(10.5, -8, 1.2, 0, 6.28); g.fill();
      smile(g, 10.5, -7, 2);
      g.strokeStyle = '#1a1208'; g.lineWidth = 0.8;
      for (const sy of [-8, -7]) { g.beginPath(); g.moveTo(8, sy); g.lineTo(2, sy - 1); g.stroke(); g.beginPath(); g.moveTo(13, sy); g.lineTo(19, sy - 1); g.stroke(); }
      g.restore();
    }
  },
  bear: {
    color: '#7a5a3a', accent: '#6a4a2a', belly: '#a07a4a',
    draw(g, x, y, s, wt, expr) {
      const sway = Math.sin(wt * 4) * 0.15;
      g.save(); g.translate(x, y); g.scale(s, s); g.rotate(sway * 0.1);
      [[-12, Math.sin(wt * 4)], [12, -Math.sin(wt * 4)]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 8); g.rotate(sw * 0.3); g.beginPath(); g.roundRect(-4, 0, 8, 14, 3); toon(g, '#6a4a2a', 2); g.restore(); });
      g.beginPath(); g.ellipse(0, -4, 20, 16, 0, 0, 6.28); toon(g, '#7a5a3a', 2.6);
      g.fillStyle = '#a07a4a'; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(0, 2, 12, 8, 0, 0, 6.28); g.fill(); g.globalAlpha = 1;
      g.beginPath(); g.arc(0, -22, 12, 0, 6.28); toon(g, '#7a5a3a', 2.4);
      g.beginPath(); g.arc(-9, -30, 4, 0, 6.28); g.arc(9, -30, 4, 0, 6.28); toon(g, '#7a5a3a', 1.8);
      g.fillStyle = '#a07a4a'; g.beginPath(); g.arc(-9, -30, 2, 0, 6.28); g.arc(9, -30, 2, 0, 6.28); g.fill();
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, -4, -23, 2.5, blink, expr); eye(g, 4, -23, 2.5, blink, expr);
      g.fillStyle = '#3a2a1a'; g.beginPath(); g.ellipse(0, -18, 3, 2, 0, 0, 6.28); g.fill();
      if (expr === 'happy') smile(g, 0, -16, 3.5); else smile(g, 0, -16, 3);
      g.restore();
    }
  },
  rabbit: {
    color: '#f0e8e0', pink: '#ffb6c1',
    draw(g, x, y, s, wt, expr) {
      const hop = Math.abs(Math.sin(wt * 7)) * 7;
      g.save(); g.translate(x, y - hop); g.scale(s, s);
      g.beginPath(); g.ellipse(-3, -22, 3, 9, -0.2, 0, 6.28); toon(g, '#e8e0d8', 1.8);
      g.beginPath(); g.ellipse(3, -22, 3, 9, 0.2, 0, 6.28); toon(g, '#e8e0d8', 1.8);
      g.fillStyle = '#ffb6c1'; g.beginPath(); g.ellipse(-3, -22, 1.5, 6, -0.2, 0, 6.28); g.ellipse(3, -22, 1.5, 6, 0.2, 0, 6.28); g.fill();
      g.beginPath(); g.ellipse(0, -4, 9, 10, 0, 0, 6.28); toon(g, '#f0e8e0', 2);
      g.beginPath(); g.arc(0, -14, 7, 0, 6.28); toon(g, '#f0e8e0', 1.8);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, -2.5, -15, 2, blink, expr); eye(g, 2.5, -15, 2, blink, expr);
      g.fillStyle = '#ffb6c1'; g.beginPath(); g.arc(0, -12, 1.2, 0, 6.28); g.fill();
      smile(g, 0, -10.5, 2);
      g.beginPath(); g.arc(-9, -2, 3, 0, 6.28); toon(g, '#fff', 1.5);
      g.restore();
    }
  },
  fox: {
    color: '#e86a2a', accent: '#d45a1a', white: '#ffffff',
    draw(g, x, y, s, wt, expr) {
      const step = Math.sin(wt * 6.28);
      g.save(); g.translate(x, y); g.scale(s, s);
      g.beginPath(); g.ellipse(-18, -4, 10, 5, 0.3, 0, 6.28); toon(g, '#d45a1a', 2);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-26, -2, 3, 0, 6.28); g.fill();
      [[-8, step], [8, -step]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 4); g.rotate(sw * 0.4); g.beginPath(); g.roundRect(-2, 0, 4, 10, 2); toon(g, '#a03a0a', 1.5); g.restore(); });
      g.beginPath(); g.ellipse(0, -2, 14, 8, 0, 0, 6.28); toon(g, '#e86a2a', 2.2);
      g.beginPath(); g.arc(12, -10, 7, 0, 6.28); toon(g, '#e86a2a', 2);
      g.beginPath(); g.moveTo(18, -10); g.lineTo(24, -8); g.lineTo(18, -6); g.closePath(); toon(g, '#e86a2a', 1.5);
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(18, -8); g.lineTo(22, -7.5); g.lineTo(18, -6.5); g.fill();
      g.beginPath(); g.moveTo(8, -15); g.lineTo(6, -22); g.lineTo(11, -16); g.closePath(); toon(g, '#e86a2a', 1.5);
      g.beginPath(); g.moveTo(14, -15); g.lineTo(16, -22); g.lineTo(18, -16); g.closePath(); toon(g, '#e86a2a', 1.5);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 10, -11, 2, blink, expr); eye(g, 15, -11, 2, blink, expr);
      g.fillStyle = '#1a1208'; g.beginPath(); g.arc(22, -7.5, 1, 0, 6.28); g.fill();
      smile(g, 19, -6, 1.5);
      g.restore();
    }
  },
  owl: {
    color: '#6a5a4a', accent: '#5a4a3a', eyes: '#ffd54f',
    draw(g, x, y, s, wt, expr) {
      const tilt = Math.sin(gt * 1.5) * 0.1;
      g.save(); g.translate(x, y); g.scale(s, s); g.rotate(tilt);
      g.beginPath(); g.ellipse(-8, -2, 5, 12, 0.2, 0, 6.28); toon(g, '#5a4a3a', 1.8);
      g.beginPath(); g.ellipse(8, -2, 5, 12, -0.2, 0, 6.28); toon(g, '#5a4a3a', 1.8);
      g.beginPath(); g.ellipse(0, -2, 11, 14, 0, 0, 6.28); toon(g, '#6a5a4a', 2.2);
      g.fillStyle = '#8a7a6a'; g.beginPath(); g.ellipse(0, 2, 7, 9, 0, 0, 6.28); g.fill();
      g.beginPath(); g.arc(0, -16, 10, 0, 6.28); toon(g, '#6a5a4a', 2.2);
      g.beginPath(); g.moveTo(-7, -23); g.lineTo(-9, -29); g.lineTo(-4, -24); g.closePath(); toon(g, '#6a5a4a', 1.5);
      g.beginPath(); g.moveTo(7, -23); g.lineTo(9, -29); g.lineTo(4, -24); g.closePath(); toon(g, '#6a5a4a', 1.5);
      g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(-4, -16, 4, 0, 6.28); g.arc(4, -16, 4, 0, 6.28); g.fill();
      g.strokeStyle = '#1a1208'; g.lineWidth = 1.5; g.beginPath(); g.arc(-4, -16, 4, 0, 6.28); g.stroke(); g.beginPath(); g.arc(4, -16, 4, 0, 6.28); g.stroke();
      const blink = Math.sin(gt * 0.9) > 0.95 ? 1 : 0;
      if (!blink) { g.fillStyle = '#1a1208'; g.beginPath(); g.arc(-4, -16, 2, 0, 6.28); g.arc(4, -16, 2, 0, 6.28); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -17, 0.8, 0, 6.28); g.arc(3, -17, 0.8, 0, 6.28); g.fill(); }
      else { g.strokeStyle = '#1a1208'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-7, -16); g.lineTo(-1, -16); g.moveTo(1, -16); g.lineTo(7, -16); g.stroke(); }
      g.beginPath(); g.moveTo(0, -13); g.lineTo(-2, -10); g.lineTo(2, -10); g.closePath(); toon(g, '#f4a82a', 1.2);
      g.restore();
    }
  },
  penguin: {
    color: '#2a2a3a', belly: '#ffffff', beak: '#f4a82a',
    draw(g, x, y, s, wt, expr) {
      const waddle = Math.sin(wt * 5) * 0.15;
      g.save(); g.translate(x, y); g.scale(s, s); g.rotate(waddle);
      g.fillStyle = '#f4a82a'; g.beginPath(); g.ellipse(-4, 8, 4, 2, 0, 0, 6.28); g.ellipse(4, 8, 4, 2, 0, 0, 6.28); g.fill();
      g.beginPath(); g.ellipse(0, -4, 10, 14, 0, 0, 6.28); toon(g, '#2a2a3a', 2.2);
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, -2, 6, 10, 0, 0, 6.28); g.fill();
      g.beginPath(); g.ellipse(-9, -4, 3, 8, 0.2, 0, 6.28); toon(g, '#2a2a3a', 1.5);
      g.beginPath(); g.ellipse(9, -4, 3, 8, -0.2, 0, 6.28); toon(g, '#2a2a3a', 1.5);
      g.beginPath(); g.arc(0, -18, 8, 0, 6.28); toon(g, '#2a2a3a', 2);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, -3, -19, 2.2, blink, expr); eye(g, 3, -19, 2.2, blink, expr);
      g.beginPath(); g.moveTo(0, -15); g.lineTo(-3, -12); g.lineTo(3, -12); g.closePath(); toon(g, '#f4a82a', 1.2);
      g.restore();
    }
  },
  turtle: {
    color: '#5a8a4a', shell: '#3a7a3a', belly: '#a8c48a',
    draw(g, x, y, s, wt, expr) {
      const slow = Math.sin(wt * 3) * 0.3;
      g.save(); g.translate(x, y); g.scale(s, s);
      [[-10, slow], [10, -slow], [-4, -slow], [6, slow]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 4); g.rotate(sw * 0.3); g.beginPath(); g.roundRect(-2, 0, 4, 7, 2); toon(g, '#5a8a4a', 1.5); g.restore(); });
      g.beginPath(); g.ellipse(0, -2, 18, 12, 0, Math.PI, 0); g.closePath(); toon(g, '#3a7a3a', 2.4);
      g.strokeStyle = '#2a5a2a'; g.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, -2); g.lineTo(i * 4, -10); g.stroke(); }
      g.beginPath(); g.moveTo(-12, -6); g.quadraticCurveTo(0, -14, 12, -6); g.stroke();
      g.fillStyle = '#a8c48a'; g.beginPath(); g.ellipse(0, 0, 16, 4, 0, 0, Math.PI); g.fill();
      g.beginPath(); g.arc(18, -4, 6, 0, 6.28); toon(g, '#5a8a4a', 1.8);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 20, -5, 2, blink, expr); smile(g, 21, -2, 1.8);
      g.restore();
    }
  },
  butterfly: {
    color: '#e85a9a', accent: '#c44a7a', spot: '#ffd166',
    draw(g, x, y, s, wt, expr) {
      const flap = Math.sin(gt * 12) * 0.8, floatY = Math.sin(gt * 2) * 4;
      g.save(); g.translate(x, y + floatY); g.scale(s, s);
      g.save(); g.translate(-2, -2); g.rotate(-flap * 0.3); g.beginPath(); g.ellipse(-8, -4, 10, 7, -0.3, 0, 6.28); toon(g, '#e85a9a', 1.8); g.fillStyle = '#ffd166'; g.globalAlpha = 0.6; g.beginPath(); g.arc(-10, -6, 2.5, 0, 6.28); g.fill(); g.globalAlpha = 1; g.restore();
      g.save(); g.translate(2, -2); g.rotate(flap * 0.3); g.beginPath(); g.ellipse(8, -4, 10, 7, 0.3, 0, 6.28); toon(g, '#e85a9a', 1.8); g.fillStyle = '#ffd166'; g.globalAlpha = 0.6; g.beginPath(); g.arc(10, -6, 2.5, 0, 6.28); g.fill(); g.globalAlpha = 1; g.restore();
      g.save(); g.translate(-2, 2); g.rotate(-flap * 0.2); g.beginPath(); g.ellipse(-6, 4, 7, 5, -0.2, 0, 6.28); toon(g, '#c44a7a', 1.5); g.restore();
      g.save(); g.translate(2, 2); g.rotate(flap * 0.2); g.beginPath(); g.ellipse(6, 4, 7, 5, 0.2, 0, 6.28); toon(g, '#c44a7a', 1.5); g.restore();
      g.beginPath(); g.ellipse(0, 0, 2.5, 8, 0, 0, 6.28); toon(g, '#3a2a1a', 1.5);
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-1, -7); g.quadraticCurveTo(-4, -12, -3, -14); g.stroke();
      g.beginPath(); g.moveTo(1, -7); g.quadraticCurveTo(4, -12, 3, -14); g.stroke();
      g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(-3, -14, 1.2, 0, 6.28); g.arc(3, -14, 1.2, 0, 6.28); g.fill();
      eye(g, -1.5, -3, 1.5, 0, expr); eye(g, 1.5, -3, 1.5, 0, expr);
      g.restore();
    }
  },
  sheep: {
    color: '#f5f0e8', face: '#3a3a3a',
    draw(g, x, y, s, wt, expr) {
      const bounce = Math.abs(Math.sin(wt * 5)) * 3;
      g.save(); g.translate(x, y - bounce); g.scale(s, s);
      [[-6, Math.sin(wt * 6.28)], [6, -Math.sin(wt * 6.28)]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 6); g.rotate(sw * 0.4); g.beginPath(); g.rect(-1.5, 0, 3, 9); toon(g, '#3a3a3a', 1.2); g.restore(); });
      g.fillStyle = '#f5f0e8';
      g.beginPath(); g.arc(-8, -2, 7, 0, 6.28); g.arc(0, -4, 8, 0, 6.28); g.arc(8, -2, 7, 0, 6.28); g.arc(-4, 2, 6, 0, 6.28); g.arc(4, 2, 6, 0, 6.28); g.fill();
      g.strokeStyle = '#1a1208'; g.lineWidth = 1.8; g.lineJoin = 'round';
      g.beginPath(); g.arc(-8, -2, 7, 0, 6.28); g.stroke(); g.beginPath(); g.arc(0, -4, 8, 0, 6.28); g.stroke(); g.beginPath(); g.arc(8, -2, 7, 0, 6.28); g.stroke();
      g.beginPath(); g.ellipse(12, -6, 5, 6, 0.2, 0, 6.28); toon(g, '#3a3a3a', 1.8);
      g.beginPath(); g.ellipse(9, -10, 3, 1.5, -0.5, 0, 6.28); g.ellipse(15, -10, 3, 1.5, 0.5, 0, 6.28); toon(g, '#3a3a3a', 1.2);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 11, -7, 1.8, blink, expr); eye(g, 14, -7, 1.8, blink, expr);
      smile(g, 12.5, -4, 1.5);
      g.restore();
    }
  },
  wolf: {
    color: '#7a7a8a', accent: '#6a6a7a',
    draw(g, x, y, s, wt, expr) {
      const step = Math.sin(wt * 6.28);
      g.save(); g.translate(x, y); g.scale(s, s);
      g.strokeStyle = '#6a6a7a'; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-16, -2); g.quadraticCurveTo(-28, -8, -24, -16); g.stroke();
      [[-10, step], [10, -step]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 6); g.rotate(sw * 0.5); g.beginPath(); g.roundRect(-2.5, 0, 5, 12, 2); toon(g, '#6a6a7a', 1.6); g.restore(); });
      g.beginPath(); g.ellipse(0, -4, 16, 9, 0, 0, 6.28); toon(g, '#7a7a8a', 2.2);
      g.beginPath(); g.arc(14, -12, 8, 0, 6.28); toon(g, '#7a7a8a', 2);
      g.beginPath(); g.moveTo(10, -18); g.lineTo(8, -26); g.lineTo(13, -19); g.closePath(); toon(g, '#7a7a8a', 1.5);
      g.beginPath(); g.moveTo(16, -18); g.lineTo(18, -26); g.lineTo(20, -19); g.closePath(); toon(g, '#7a7a8a', 1.5);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 12, -13, 2.2, blink, expr); eye(g, 17, -13, 2.2, blink, expr);
      g.fillStyle = '#1a1208'; g.beginPath(); g.arc(20, -10, 1.5, 0, 6.28); g.fill();
      smile(g, 18, -8, 2);
      g.restore();
    }
  },
  deer: {
    color: '#a06a3a', antler: '#6a4a2a',
    draw(g, x, y, s, wt, expr) {
      const step = Math.sin(wt * 6.28);
      g.save(); g.translate(x, y); g.scale(s, s);
      [[-8, step], [8, -step]].forEach(([lx, sw]) => { g.save(); g.translate(lx, 6); g.rotate(sw * 0.4); g.beginPath(); g.roundRect(-2, 0, 4, 12, 2); toon(g, '#8a5a2a', 1.5); g.restore(); });
      g.beginPath(); g.ellipse(0, -4, 14, 8, 0, 0, 6.28); toon(g, '#a06a3a', 2);
      g.beginPath(); g.arc(12, -12, 7, 0, 6.28); toon(g, '#a06a3a', 1.8);
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(10, -18); g.lineTo(8, -26); g.moveTo(10, -22); g.lineTo(6, -28); g.stroke();
      g.beginPath(); g.moveTo(14, -18); g.lineTo(16, -26); g.moveTo(14, -22); g.lineTo(18, -28); g.stroke();
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, 10, -13, 2, blink, expr); eye(g, 15, -13, 2, blink, expr);
      g.fillStyle = '#1a1208'; g.beginPath(); g.arc(18, -10, 1.2, 0, 6.28); g.fill();
      smile(g, 16, -8, 1.5);
      g.restore();
    }
  },
  frog: {
    color: '#4a9a3a', accent: '#3a7a2a',
    draw(g, x, y, s, wt, expr) {
      const hop = Math.abs(Math.sin(wt * 8)) * 4;
      g.save(); g.translate(x, y - hop); g.scale(s, s);
      g.beginPath(); g.ellipse(0, -2, 12, 8, 0, 0, 6.28); toon(g, '#4a9a3a', 2);
      g.beginPath(); g.arc(-4, -8, 4, 0, 6.28); g.arc(4, -8, 4, 0, 6.28); toon(g, '#4a9a3a', 1.5);
      const blink = Math.sin(gt * 1.3) > 0.97 ? 1 : 0;
      eye(g, -4, -8, 2.5, blink, expr); eye(g, 4, -8, 2.5, blink, expr);
      smile(g, 0, -4, 3);
      g.beginPath(); g.ellipse(-8, 4, 4, 2, 0.3, 0, 6.28); g.ellipse(8, 4, 4, 2, -0.3, 0, 6.28); toon(g, '#3a7a2a', 1.5);
      g.restore();
    }
  },
  snake: {
    color: '#3a8a4a',
    draw(g, x, y, s, wt, expr) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.strokeStyle = '#3a8a4a'; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-20, 0);
      for (let k = 0; k < 8; k++) g.lineTo(-20 + k * 5, Math.sin(gt * 4 + k * 0.8) * 4);
      g.stroke();
      g.beginPath(); g.arc(20, Math.sin(gt * 4 + 7 * 0.8) * 4, 4, 0, 6.28); toon(g, '#3a8a4a', 1.5);
      eye(g, 22, Math.sin(gt * 4 + 7 * 0.8) * 4 - 1, 1.5, 0, expr);
      g.strokeStyle = '#ff3d00'; g.lineWidth = 1; g.beginPath();
      const ty = Math.sin(gt * 4 + 7 * 0.8) * 4;
      g.moveTo(24, ty + 1); g.lineTo(28, ty + 2); g.moveTo(24, ty + 1); g.lineTo(28, ty); g.stroke();
      g.restore();
    }
  },
  bee: {
    color: '#ffd54f', stripe: '#1a1208',
    draw(g, x, y, s, wt, expr) {
      const buzz = Math.sin(gt * 15) * 2;
      g.save(); g.translate(x, y + buzz); g.scale(s, s);
      g.beginPath(); g.ellipse(0, 0, 8, 5, 0, 0, 6.28); toon(g, '#ffd54f', 1.8);
      g.fillStyle = '#1a1208'; g.fillRect(-6, -2, 2, 4); g.fillRect(-2, -2, 2, 4); g.fillRect(2, -2, 2, 4);
      g.beginPath(); g.ellipse(-3, -6, 6, 3, -0.3, 0, 6.28); toon(g, 'rgba(200,220,255,0.6)', 1);
      g.beginPath(); g.ellipse(3, -6, 6, 3, 0.3, 0, 6.28); toon(g, 'rgba(200,220,255,0.6)', 1);
      eye(g, -5, -1, 1.5, 0, expr); eye(g, 5, -1, 1.5, 0, expr);
      g.restore();
    }
  }
};

// فهرسة الكلمات المفتاحية
const CHAR_KEYWORDS = {};
for (const [key] of Object.entries(CHARACTERS)) {
  CHAR_KEYWORDS[key] = [key];
}
// إضافة مرادفات
Object.assign(CHAR_KEYWORDS, {
  lion: ['lion'], bird: ['bird', 'sparrow', 'crow', 'robin', 'eagle'], fish: ['fish', 'shark', 'trout'],
  elephant: ['elephant'], dragon: ['dragon'], monkey: ['monkey', 'ape', 'gorilla'],
  turtle: ['turtle', 'tortoise'], butterfly: ['butterfly', 'moth'], cat: ['cat', 'kitten'],
  sheep: ['sheep', 'lamb'], rabbit: ['rabbit', 'bunny', 'hare'], fox: ['fox'],
  bear: ['bear', 'panda', 'grizzly'], owl: ['owl'], penguin: ['penguin'],
  wolf: ['wolf'], deer: ['deer', 'stag'], frog: ['frog', 'toad'],
  snake: ['snake', 'serpent'], bee: ['bee', 'wasp']
});
