import { TAU } from './game.js';
import { fitCanvas } from './loop.js';

const C = {
  track: '#1B212C',
  safe: '#35D0A5',
  gold: '#FFC24B',
  danger: '#FF4D5E',
  ink: '#F3F0EA',
  dim: '#767E8F',
};

// La corsa parte dall'alto e gira in senso orario.
const START = -Math.PI / 2;

const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  const particles = [];
  let shake = 0;
  let flash = null;
  let dims = { w: 0, h: 0, dpr: 1 };

  function burst(kind, count, cx, cy, r) {
    const color = kind === 'gold' ? C.gold : kind === 'safe' ? C.safe : C.danger;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const sp = (kind === 'overload' ? 130 : 90) * (0.4 + Math.random());
      particles.push({
        x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 1, decay: 1.6 + Math.random(), color,
        size: kind === 'overload' ? 2.6 : 2,
      });
    }
  }

  function impact(kind, cx, cy, r) {
    if (REDUCED) { if (kind === 'gold') flash = { c: C.gold, a: 0.12 }; else if (kind === 'overload') flash = { c: C.danger, a: 0.2 }; return; }
    if (kind === 'gold') { shake = 7; flash = { c: C.gold, a: 0.16 }; burst('gold', 26, cx, cy, r); }
    else if (kind === 'safe') { shake = 2.5; burst('safe', 10, cx, cy, r); }
    else if (kind === 'overload') { shake = 16; flash = { c: C.danger, a: 0.3 }; burst('overload', 34, cx, cy, r); }
    else { shake = 1.5; }
  }

  function arc(cx, cy, r, from, to, color, width, glow = 0) {
    if (to <= from) return;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'butt';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; } else { ctx.shadowBlur = 0; }
    ctx.arc(cx, cy, r, START + from * TAU, START + to * TAU);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function draw(run, t, paused) {
    const d = fitCanvas(canvas);
    dims = d;
    ctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);
    ctx.clearRect(0, 0, d.w, d.h);

    const cx = d.w / 2;
    const cy = d.h * 0.46;
    const R = Math.min(d.w, d.h) * 0.30;
    const LW = Math.max(9, R * 0.115);

    ctx.save();
    if (shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      shake *= 0.86;
    }

    const s = run ? run.state : null;
    const spec = s ? s.spec : null;

    // Traccia di fondo.
    ctx.beginPath();
    ctx.strokeStyle = C.track;
    ctx.lineWidth = LW;
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.stroke();

    if (spec) {
      // C'è UNA campata sicura: [safeStart, goldEnd]. Fuori da lì, sotto o sopra, si crepa.
      // Entrambi i lati vanno disegnati come pericolo, o la regola resta invisibile.
      arc(cx, cy, R, 0, spec.safeStart, 'rgba(255,77,94,.28)', LW);
      arc(cx, cy, R, spec.safeStart, spec.goldStart, 'rgba(53,208,165,.32)', LW);
      arc(cx, cy, R, spec.goldStart, spec.goldEnd, 'rgba(255,194,75,.52)', LW);
      arc(cx, cy, R, spec.goldEnd, Math.min(1, spec.goldEnd + 0.09), 'rgba(255,77,94,.55)', LW);

      // Tacche di confine: la campata sicura deve leggersi a colpo d'occhio, e i due
      // estremi devono distinguersi senza dipendere dal colore (rosso/verde sono
      // indistinguibili in protanopia): quella d'ingresso è doppia, quella del muro è piena.
      tick(cx, cy, R, LW, spec.safeStart, 'rgba(243,240,234,.85)', 2);
      tick(cx, cy, R, LW, spec.goldStart, 'rgba(255,194,75,.95)');
      tick(cx, cy, R, LW, spec.goldEnd, 'rgba(255,255,255,.95)', 3);

      if (s.holding && s.charge > 0) {
        const c = Math.min(s.charge, spec.goldEnd);
        const inGold = c >= spec.goldStart;
        const col = inGold ? C.gold : c >= spec.safeStart ? C.safe : C.ink;
        arc(cx, cy, R, 0, c, col, LW, inGold ? 26 : 12);

        // Testa della carica: il punto che il pollice sta inseguendo.
        const a = START + c * TAU;
        ctx.beginPath();
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = inGold ? 22 : 10;
        ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, LW * 0.46, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Centro: catena in corso. Nessun numero superfluo durante l'azione.
    if (s && !s.over) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const hot = s.chain > 1;
      ctx.fillStyle = hot ? C.gold : C.dim;
      ctx.font = `700 ${Math.round(R * 0.46)}px 'Space Grotesk', system-ui, sans-serif`;
      ctx.fillText(hot ? `×${s.chain}` : '', cx, cy - R * 0.02);
      if (s.holding) {
        ctx.fillStyle = 'rgba(118,126,143,.7)';
        ctx.font = `500 ${Math.round(R * 0.13)}px 'Space Grotesk', system-ui, sans-serif`;
        ctx.fillText('HOLD', cx, cy + R * 0.34);
      }
    }

    // Particelle.
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay * (1 / 60);
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * (1 / 60);
      p.y += p.vy * (1 / 60);
      p.vy += 120 * (1 / 60);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (flash) {
      ctx.fillStyle = flash.c;
      ctx.globalAlpha = flash.a;
      ctx.fillRect(0, 0, d.w, d.h);
      ctx.globalAlpha = 1;
      flash.a *= 0.82;
      if (flash.a < 0.01) flash = null;
    }
  }

  // kind: 1 tacca singola · 2 tacca doppia (ingresso della campata) · 3 barra piena (il muro)
  function tick(cx, cy, R, LW, at, color, kind = 1) {
    const draw = (off, w) => {
      const a = START + (at + off) * TAU;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.moveTo(cx + Math.cos(a) * (R - LW * 0.75), cy + Math.sin(a) * (R - LW * 0.75));
      ctx.lineTo(cx + Math.cos(a) * (R + LW * 0.75), cy + Math.sin(a) * (R + LW * 0.75));
      ctx.stroke();
    };
    if (kind === 3) { draw(0, 5); return; }
    if (kind === 2) { draw(-0.006, 2); draw(0.006, 2); return; }
    draw(0, 2);
  }

  return { draw, impact };
}
