/**
 * CARE scroll story — the pinned canvas on the home page.
 * Markup: layouts/partials/care-story.html. Styles: assets/css/extended/care-story.css.
 *
 * How it works, in four parts (each is a section of this file):
 *
 *   1. LAYOUT    Copy steps scroll past a `position: sticky` stage. That part is pure CSS.
 *   2. SCROLL    Find the step under the "reading line". Each step names a keyframe (data-kf).
 *   3. PLAYHEAD  A number that travels toward that keyframe over time, at a pace set here.
 *                Scrolling never scrubs the animation; it only chooses where the playhead goes.
 *   4. DRAW(T)   The scene is a pure function of the playhead T. Same T in, same picture out,
 *                so scrolling back up simply plays the story in reverse.
 *
 * A small canvas "rig" wraps the drawing: it renders at the screen's real pixel density,
 * runs only while something is moving and the canvas is on screen, and parks otherwise.
 *
 * The same 24 dots are re-arranged in every beat, so the story morphs instead of cutting:
 *   0 question → (0.5 an ambiguous cloud) → 1 Clarity: sorted into decisions
 *   → 2 Alignment: four voices converging on one outcome → 3 Reality: assumptions tested
 *   → 4 Execution: shipped in slices → 5+ "in the field": one card per case study or build.
 *
 * To tune it, add `?story=debug` to the URL: the reading line, step position, goal keyframe
 * and playhead are shown live.
 */

// ---------------------------------------------------------------------------
// Maths kit. These few helpers do almost all the animation work.
// ---------------------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** Progress (0..1) of the window [from, to] inside a longer timeline. The workhorse. */
const seg = (t, from, to) => clamp01((t - from) / (to - from));
/** Smoothstep: slow in, slow out. */
const ss = (x) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
/** Cubic ease-out: fast start, soft landing. */
const ease = (x) => 1 - (1 - clamp01(x)) ** 3;
const lerp = (a, b, u) => a + (b - a) * u;
/** Visible between a fade-in window and a fade-out window; works in both scroll directions. */
const win = (t, inFrom, inTo, outFrom, outTo) => ss(seg(t, inFrom, inTo)) * (1 - ss(seg(t, outFrom, outTo)));
const mix = (c1, c2, u) => [0, 1, 2].map((k) => Math.round(lerp(c1[k], c2[k], u)));
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
/** Black or white, whichever reads better on colour c. */
const onColor = (c) => ((0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.6 ? '#10141c' : '#fff');
/** Deterministic "random": the same dot lands in the same place on every frame. */
const rand = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------------------------------------------------------------------------
// What the stage says. Words on the canvas live here so they are easy to find.
// ---------------------------------------------------------------------------
const LABELS = {
  ambiguity: 'An ambiguous brief',
  decisions: ['Risk', 'Seams', 'Scale', 'Success'],
  voices: ['Product', 'Engineering', 'Platform', 'Delivery'],
  outcome: 'Business outcome',
  reality: 'Assumptions, tested before they scale',
  holds: 'holds',
  rethink: 'rethink',
  execution: 'Shipped in small, reversible slices',
  defects: 'Zero critical defects',
};

const N = 24;                       // dots that travel through the whole story
const RETHINK = [5, 13, 18];        // assumptions the evidence sent back for a rethink
const STAIRS = [2, 3, 4, 4, 5, 6];  // dots per delivered slice (adds up to N)
const STAIR_CELLS = STAIRS.flatMap((height, col) => Array.from({ length: height }, (_, row) => ({ col, row })));
const FIELD_KF = 5;                 // first "in the field" keyframe
const SANS = '"IBM Plex Sans", system-ui, -apple-system, sans-serif';
const SERIF = '"IBM Plex Serif", Georgia, "Times New Roman", serif';

// ---------------------------------------------------------------------------
// Drawing primitives
// ---------------------------------------------------------------------------
const text = (ctx, str, x, y, size, color, { align = 'center', weight = 500, family = SANS, maxW } = {}) => {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  if (maxW) ctx.fillText(str, x, y, maxW); else ctx.fillText(str, x, y);
};

/** Break a string into at most `maxLines` lines that fit `maxW`; the last line gets an ellipsis. */
const wrap = (ctx, str, maxW, maxLines) => {
  const words = String(str).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxW || !line) { line = next; continue; }
    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && line) lines.push(line);
  else if (line && lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }
  return lines;
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
};

const dot = (ctx, d) => {
  if (d.a <= 0.01 || d.r <= 0.2) return;
  const before = ctx.globalAlpha;
  ctx.globalAlpha = before * d.a;
  ctx.fillStyle = rgba(d.c);
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = before;
};

// ---------------------------------------------------------------------------
// 4. DRAW(T) — the scene as a pure function of the playhead
// ---------------------------------------------------------------------------
const geo = (w, h) => {
  const S = Math.min(w, h);
  return { w, h, S, cx: w / 2, cy: h / 2, r: Math.max(2.5, S * 0.017) };
};

/** The field card: size, and where card k sits for playhead T (0 = centred, ±1 = off stage). */
const cardBox = (g) => {
  const cw = Math.min(g.w * 0.88, g.S * 1.16, 470);
  const ch = Math.min(g.h * 0.8, cw * 0.7);
  return { cw, ch, y: g.cy - ch / 2, pad: ch * 0.09 };
};
const cardOffset = (k, T) => {
  const base = Math.floor(T);
  return (FIELD_KF + k) - (base + ss(T - base)); // eased, so every slide starts and stops softly
};
const chipCentre = (g, j, cardCx) => {
  const { cw, ch, y, pad } = cardBox(g);
  const b = ch * 0.125;
  return { x: cardCx - cw / 2 + pad + j * (b + ch * 0.04) + b / 2, y: y + ch - pad - b / 2, b };
};

/**
 * Where dot i rests at each stop on the timeline. A pose returns
 * { x, y, r, c (palette key), a (opacity) }.
 */
const POSES = [
  { at: 0, pose: (i, g) => ({ x: g.cx, y: g.cy, r: 0, c: 'muted', a: 0 }) },

  // Ambiguity: a loose cloud with no structure.
  { at: 0.5, pose: (i, g) => {
    const angle = rand(i, 1) * Math.PI * 2;
    const radius = (0.1 + 0.3 * Math.sqrt(rand(i, 2))) * g.S;
    return { x: g.cx + Math.cos(angle) * radius * 1.15, y: g.cy + g.S * 0.04 + Math.sin(angle) * radius * 0.85, r: g.r, c: 'muted', a: 0.9 };
  } },

  // Clarity: the same dots, sorted into four decisions (3 × 2 in each box).
  { at: 1, pose: (i, g) => {
    const group = i % 4, n = Math.floor(i / 4), b = g.S * 0.34, q = b * 0.25;
    const bx = g.cx + (group % 2 ? 1 : -1) * b * 0.6;
    const by = g.cy + (group < 2 ? -1 : 1) * b * 0.6;
    return { x: bx + ((n % 3) - 1) * q, y: by + b * 0.1 + (Math.floor(n / 3) - 0.5) * q, r: g.r, c: 'c', a: 1 };
  } },

  // Alignment: four lanes (one per group of people) converging on a single outcome.
  { at: 2, pose: (i, g) => {
    const lane = i % 4, u = Math.floor(i / 4) / 5;
    const a = alignGeo(g);
    return { x: lerp(a.x0, a.x1, u), y: g.cy + (lane - 1.5) * a.gap * (1 - 0.84 * u), r: g.r, c: 'a', a: 1 };
  } },

  // Reality: a 6 × 4 grid of assumptions; most hold, a few go back for a rethink.
  { at: 3, pose: (i, g) => {
    const q = g.S * 0.105;
    return { x: g.cx + ((i % 6) - 2.5) * q, y: g.cy + (Math.floor(i / 6) - 1.5) * q, r: q * 0.3, c: RETHINK.includes(i) ? 'muted' : 'r', a: 1 };
  } },

  // Execution: delivered in slices, each a little larger than the last.
  { at: 4, pose: (i, g) => {
    const { col, row } = STAIR_CELLS[i];
    const s = stairGeo(g);
    return { x: g.cx + (col - 2.5) * s.stepX, y: s.base - (row + 0.5) * s.pitch, r: s.pitch * 0.3, c: 'e', a: 1 };
  } },

  // In the field: the dots fold into the C·A·R·E chips of the first card and disappear.
  { at: 5, pose: (i, g, T, story) => {
    const cardCx = g.cx + cardOffset(0, Math.min(T, FIELD_KF)) * g.w * 0.95;
    if (!story.items[0] || !story.items[0].care) return { x: cardCx, y: g.cy, r: 0, c: 'brand', a: 0 };
    const chip = chipCentre(g, i % 4, cardCx);
    return { x: chip.x, y: chip.y, r: 0.5, c: ['c', 'a', 'r', 'e'][i % 4], a: 0 };
  } },
];

const alignGeo = (g) => ({ x0: g.cx - g.S * 0.16, x1: g.cx + g.S * 0.3, gap: g.S * 0.15, targetX: g.cx + g.S * 0.385 });
const stairGeo = (g) => ({ pitch: g.S * 0.078, stepX: g.S * 0.115, base: g.cy + g.S * 0.27 });

const drawDots = (ctx, g, T, p, story) => {
  if (T >= FIELD_KF) return;
  let k = 0;
  while (k < POSES.length - 2 && T >= POSES[k + 1].at) k += 1;
  const from = POSES[k], to = POSES[k + 1];
  const f = seg(T, from.at, to.at);
  for (let i = 0; i < N; i += 1) {
    const a = from.pose(i, g, T, story), b = to.pose(i, g, T, story);
    const start = rand(i, 9) * 0.35; // stagger: each dot sets off a little later than the last
    const u = ss(seg(f, start, start + 0.65));
    dot(ctx, { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), r: lerp(a.r, b.r, u), c: mix(p[a.c], p[b.c], u), a: lerp(a.a, b.a, u) });
  }
};

const drawQuestion = (ctx, g, T, p) => {
  const a = 1 - ease(seg(T, 0.02, 0.3));
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  text(ctx, '?', g.cx, g.cy + g.S * 0.02, Math.min(g.h * 0.36, 190), rgba(p.ink, 0.16), { weight: 600, family: SERIF });
  ctx.globalAlpha = 1;
};

const drawClarity = (ctx, g, T, p) => {
  const cloud = win(T, 0.12, 0.38, 0.5, 0.7);
  if (cloud > 0.01) {
    ctx.globalAlpha = cloud;
    text(ctx, LABELS.ambiguity, g.cx, g.cy - g.S * 0.4, Math.max(12, g.S * 0.04), rgba(p.muted));
    ctx.globalAlpha = 1;
  }
  const a = win(T, 0.58, 0.96, 1.15, 1.5);
  if (a <= 0.01) return;
  const b = g.S * 0.34;
  ctx.globalAlpha = a;
  for (let group = 0; group < 4; group += 1) {
    const x = g.cx + (group % 2 ? 1 : -1) * b * 0.6 - b / 2;
    const y = g.cy + (group < 2 ? -1 : 1) * b * 0.6 - b / 2;
    ctx.fillStyle = rgba(p.c, 0.08);
    ctx.strokeStyle = rgba(p.c, 0.5);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, b, b, 8);
    ctx.fill();
    ctx.stroke();
    text(ctx, LABELS.decisions[group], x + b * 0.1, y + b * 0.16, Math.max(11, g.S * 0.036), rgba(p.ink, 0.9), { align: 'left', weight: 600, maxW: b * 0.82 });
  }
  ctx.globalAlpha = 1;
};

const drawAlignment = (ctx, g, T, p, now) => {
  const a = win(T, 1.45, 1.92, 2.15, 2.5);
  if (a <= 0.01) return;
  const { x0, x1, gap, targetX } = alignGeo(g);
  const size = Math.max(11, g.S * 0.036);
  const ring = g.S * 0.045;
  ctx.globalAlpha = a;
  ctx.lineWidth = 1;
  for (let lane = 0; lane < 4; lane += 1) {
    const y0 = g.cy + (lane - 1.5) * gap;
    const y1 = g.cy + (lane - 1.5) * gap * 0.16;
    text(ctx, LABELS.voices[lane], x0 - g.S * 0.05, y0, size, rgba(p.ink, 0.9), { align: 'right', weight: 500 });
    ctx.strokeStyle = rgba(p.a, 0.3);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(targetX - ring, g.cy);
    ctx.stroke();
    // A pulse runs down each lane on the wall clock, not the playhead: it keeps moving
    // after the playhead has landed here, which is what animatesAt() asks the rig for.
    const u = ((now / 1000) * 0.4 + lane * 0.25) % 1;
    ctx.fillStyle = rgba(p.a, 0.9 * Math.sin(u * Math.PI));
    ctx.beginPath();
    ctx.arc(lerp(x0, x1, u), lerp(y0, y1, u), Math.max(1.6, g.S * 0.008), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = rgba(p.a, 0.9);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(targetX, g.cy, ring, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = rgba(p.a);
  ctx.beginPath();
  ctx.arc(targetX, g.cy, ring * 0.4, 0, Math.PI * 2);
  ctx.fill();
  const labelY = g.cy + gap * 1.5;
  ctx.strokeStyle = rgba(p.a, 0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(targetX, g.cy + ring + 3);
  ctx.lineTo(targetX, labelY - size * 0.9);
  ctx.stroke();
  text(ctx, LABELS.outcome, targetX + ring, labelY, size, rgba(p.ink, 0.9), { align: 'right', weight: 600 });
  ctx.globalAlpha = 1;
};

const drawReality = (ctx, g, T, p) => {
  const q = g.S * 0.105;
  const size = Math.max(11, g.S * 0.036);
  // Each verdict lands in turn as the playhead crosses the dot's own small window.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, q * 0.065);
  for (let i = 0; i < N; i += 1) {
    const a = ss(seg(T, 2.7 + i * 0.011, 2.76 + i * 0.011)) * (1 - ss(seg(T, 3.05, 3.2)));
    if (a <= 0.01) continue;
    const x = g.cx + ((i % 6) - 2.5) * q, y = g.cy + (Math.floor(i / 6) - 1.5) * q, s = q * 0.12;
    ctx.globalAlpha = a;
    ctx.strokeStyle = rgba(p.surface);
    ctx.beginPath();
    if (RETHINK.includes(i)) {
      ctx.moveTo(x - s, y - s); ctx.lineTo(x + s, y + s);
      ctx.moveTo(x + s, y - s); ctx.lineTo(x - s, y + s);
    } else {
      ctx.moveTo(x - s, y); ctx.lineTo(x - s * 0.3, y + s * 0.7); ctx.lineTo(x + s * 1.1, y - s * 0.8);
    }
    ctx.stroke();
  }
  const a = win(T, 2.45, 2.92, 3.1, 3.42);
  if (a > 0.01) {
    ctx.globalAlpha = a;
    text(ctx, LABELS.reality, g.cx, g.cy - 2.75 * q, size, rgba(p.ink, 0.9), { weight: 600, maxW: g.w * 0.92 });
    const legendY = g.cy + 2.75 * q, r = q * 0.16;
    dot(ctx, { x: g.cx - q * 1.9, y: legendY, r, c: p.r, a: 1 });
    text(ctx, LABELS.holds, g.cx - q * 1.9 + r * 2.2, legendY, size * 0.95, rgba(p.muted), { align: 'left' });
    dot(ctx, { x: g.cx + q * 0.5, y: legendY, r, c: p.muted, a: 1 });
    text(ctx, LABELS.rethink, g.cx + q * 0.5 + r * 2.2, legendY, size * 0.95, rgba(p.muted), { align: 'left' });
  }
  ctx.globalAlpha = 1;
};

const drawExecution = (ctx, g, T, p) => {
  const a = win(T, 3.48, 3.95, 4.1, 4.42);
  if (a <= 0.01) return;
  const { pitch, stepX, base } = stairGeo(g);
  const size = Math.max(11, g.S * 0.036);
  ctx.globalAlpha = a;
  ctx.strokeStyle = rgba(p.ink, 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(g.cx - 3.1 * stepX, base + 2);
  ctx.lineTo(g.cx + 3.1 * stepX, base + 2);
  ctx.stroke();
  text(ctx, LABELS.execution, g.cx, base - 6 * pitch - size * 1.8, size, rgba(p.ink, 0.9), { weight: 600, maxW: g.w * 0.92 });
  text(ctx, LABELS.defects, g.cx, base + size * 1.7, size, rgba(p.e), { weight: 600 });
  ctx.globalAlpha = 1;
};

const drawCards = (ctx, g, T, p, story) => {
  if (T < FIELD_KF - 1) return;
  const { cw, ch, y, pad } = cardBox(g);
  const inner = cw - pad * 2;
  story.items.forEach((item, k) => {
    const off = cardOffset(k, T);
    if (Math.abs(off) >= 1) return;
    const cardCx = g.cx + off * g.w * 0.95;
    const x = cardCx - cw / 2;
    const meta = Math.max(10, ch * 0.05);
    ctx.globalAlpha = 1 - Math.min(1, Math.abs(off) * 1.15);
    ctx.fillStyle = rgba(p.brand, 0.07);
    ctx.strokeStyle = rgba(p.brand, 0.5);
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cw, ch, 12);
    ctx.fill();
    ctx.stroke();

    text(ctx, item.kind.toUpperCase(), x + pad, y + pad + meta * 0.5, meta, rgba(p.muted), { align: 'left', weight: 600 });

    const titleSize = Math.max(14, Math.min(22, ch * 0.085));
    ctx.font = `600 ${titleSize}px ${SERIF}`;
    const titleLines = wrap(ctx, item.title, inner, 2);
    titleLines.forEach((line, n) => text(ctx, line, x + pad, y + pad + meta * 2.4 + n * titleSize * 1.22, titleSize, rgba(p.ink), { align: 'left', weight: 600, family: SERIF }));

    // The headline figure, shrunk only if it would not fit the card.
    let figure = ch * 0.185;
    ctx.font = `700 ${figure}px ${SERIF}`;
    const figureW = ctx.measureText(item.metric).width;
    if (figureW > inner) figure *= inner / figureW;
    const figureY = y + ch * (item.care ? 0.52 : 0.58);
    text(ctx, item.metric, x + pad, figureY, figure, rgba(p.brand), { align: 'left', weight: 700, family: SERIF });

    const noteSize = Math.max(11, ch * 0.055);
    ctx.font = `500 ${noteSize}px ${SANS}`;
    wrap(ctx, item.metricLabel, inner, 2).forEach((line, n) =>
      text(ctx, line, x + pad, figureY + ch * 0.125 + n * noteSize * 1.3, noteSize, rgba(p.muted), { align: 'left' }));

    if (item.care) {
      // C, A, R, E light up in turn as the card settles in the centre.
      const settle = 1 - Math.min(1, Math.abs(off));
      ['c', 'a', 'r', 'e'].forEach((key, j) => {
        const on = ss(seg(settle, 0.5 + j * 0.1, 0.68 + j * 0.1));
        const chip = chipCentre(g, j, cardCx);
        ctx.fillStyle = rgba(p[key], 0.16 + 0.84 * on);
        roundRect(ctx, chip.x - chip.b / 2, chip.y - chip.b / 2, chip.b, chip.b, 4);
        ctx.fill();
        text(ctx, key.toUpperCase(), chip.x, chip.y + 0.5, chip.b * 0.52, on > 0.5 ? onColor(p[key]) : rgba(p.ink, 0.7), { weight: 700, family: SERIF });
      });
    }
    ctx.globalAlpha = 1;
  });
};

const drawStory = (ctx, w, h, T, now, p, story) => {
  const g = geo(w, h);
  drawQuestion(ctx, g, T, p);
  drawClarity(ctx, g, T, p);
  drawAlignment(ctx, g, T, p, now);
  drawExecution(ctx, g, T, p);
  drawCards(ctx, g, T, p, story);
  drawDots(ctx, g, T, p, story);
  drawReality(ctx, g, T, p); // verdict marks sit on top of the dots
};

// ---------------------------------------------------------------------------
// Canvas rig: sharp on any screen, idle whenever nothing is changing.
// ---------------------------------------------------------------------------
const createSceneCanvas = (canvas, draw, { fps = 60, maxPixels = 2400000 } = {}) => {
  const ctx = canvas.getContext('2d');
  const interval = 1000 / fps - 1;
  let w = 0, h = 0, scale = 1, frame = null, lastDrawAt = -Infinity, visible = false, wantsFrames = true;

  const measure = () => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    w = rect.width;
    h = rect.height;
    // Real pixel density (sharp on phones), pulled back only if this canvas would
    // exceed the pixel budget (memory on very large screens).
    const want = Math.min(window.devicePixelRatio || 1, 3);
    scale = Math.max(1, Math.min(want, Math.sqrt(maxPixels / (w * h))));
    const bw = Math.round(w * scale), bh = Math.round(h * scale);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    return true;
  };

  const paint = (now) => {
    lastDrawAt = now;
    ctx.setTransform(scale, 0, 0, scale, 0, 0); // draw in CSS pixels
    ctx.clearRect(0, 0, w, h);
    return draw(ctx, w, h, now) === true;
  };

  const tick = (now) => {
    if (!visible) { frame = null; return; }
    if (now - lastDrawAt >= interval) {
      // One bad frame must not kill the loop: log it and keep going.
      try { wantsFrames = paint(now); } catch (err) { console.error('[care-story] draw failed', err); wantsFrames = false; }
    }
    // Park the moment the scene reports it has settled: a still canvas costs nothing.
    frame = wantsFrames ? requestAnimationFrame(tick) : null;
  };

  const start = () => {
    if (!visible || (!w && !measure())) return;
    if (frame === null) { wantsFrames = true; frame = requestAnimationFrame(tick); }
  };
  const stop = () => { if (frame !== null) { cancelAnimationFrame(frame); frame = null; } };
  const invalidate = () => { lastDrawAt = -Infinity; start(); };

  // Only run while the canvas is on screen.
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate(); else stop();
  });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { if (measure()) invalidate(); });
  ro.observe(canvas);

  return {
    invalidate,
    running: () => frame !== null,
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      canvas.width = 0; // hand the backing store back
      canvas.height = 0;
    },
  };
};

// ---------------------------------------------------------------------------
// Theme: the canvas reads its colours from the same CSS tokens as the page.
// ---------------------------------------------------------------------------
const readPalette = (root) => {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  root.appendChild(probe);
  const read = (value) => {
    probe.style.color = '';
    probe.style.color = value;
    const m = getComputedStyle(probe).color.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
  };
  const palette = {
    ink: read('var(--color-text-main)'),
    muted: read('var(--color-text-muted)'),
    surface: read('var(--color-surface)'),
    brand: read('var(--color-brand)'),
    c: read('var(--care-c)'),
    a: read('var(--care-a)'),
    r: read('var(--care-r)'),
    e: read('var(--care-e)'),
  };
  probe.remove();
  return palette;
};

// ---------------------------------------------------------------------------
// One story instance: 2. SCROLL and 3. PLAYHEAD
// ---------------------------------------------------------------------------
const RATE = 1.25;          // default pace, keyframes per second
const CATCH_UP_TAU = 0.42;  // when the reader jumps far ahead, hurry…
const CATCH_UP_MAX = 8;     // …but never so fast that motion turns into a cut
/** Pace per segment. A segment with more to watch plays slower. */
const SEGMENT_RATE = [0.8, 1.0, 1.0, 0.95, 1.0];
const SWITCH_AT = 0.62;     // hand over once the next step is 62% of the way to the reading line
const WIDE = '(min-width: 1024px)'; // keep equal to the breakpoint in care-story.css

const createStory = (root) => {
  const canvas = root.querySelector('[data-care-canvas]');
  const stage = root.querySelector('[data-care-stage]');
  const steps = [...root.querySelectorAll('[data-kf]')];
  if (!canvas || !stage || steps.length < 2) return null;

  const story = {
    items: steps.filter((s) => s.dataset.storyTitle).map((s) => ({
      kind: s.dataset.storyKind || '',
      title: s.dataset.storyTitle,
      metric: s.dataset.storyMetric || '',
      metricLabel: s.dataset.storyMetricLabel || '',
      care: 'storyCare' in s.dataset,
    })),
  };
  const lastKf = Math.max(...steps.map((s) => Number(s.dataset.kf)));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia(WIDE);
  const debug = new URLSearchParams(location.search).get('story') === 'debug';
  let palette = null;
  let goal = 0, playhead = 0, dir = 1, lastT = null;
  let active = -1, scrollPos = 0, lineY = 0, queued = false, disposed = false, headerBottom = -1;

  /** Rewinding is quicker: the reader has already seen it. */
  const rateAt = (at, direction) => {
    const segment = Math.max(0, direction < 0 ? Math.ceil(at) - 1 : Math.floor(at));
    const forward = SEGMENT_RATE[segment] ?? 1.1;
    return direction < 0 ? forward * 1.6 : forward;
  };
  /** Ranges where the picture keeps moving after the playhead lands (the Alignment pulses). */
  const animatesAt = (at) => at > 1.9 && at < 2.1;

  const rig = createSceneCanvas(canvas, (ctx, w, h, now) => {
    if (!palette) palette = readPalette(root);
    const t = now / 1000;
    const dt = lastT === null || t - lastT > 0.1 ? 1 / 60 : t - lastT; // resume gently after a pause
    lastT = t;
    const distance = goal - playhead;
    if (distance !== 0) dir = distance < 0 ? -1 : 1;
    if (reduced.matches) {
      playhead = goal; // reduced motion: go straight to the settled frame
    } else {
      const surplus = Math.max(0, Math.abs(distance) - 1);
      const rate = Math.min(CATCH_UP_MAX, rateAt(playhead, dir) + surplus / CATCH_UP_TAU);
      playhead += Math.sign(distance) * Math.min(Math.abs(distance), dt * rate);
    }
    drawStory(ctx, w, h, Math.min(playhead, lastKf), now, palette, story);
    // true = "I still need frames"; anything else lets the rig park the loop.
    return playhead !== goal || (!reduced.matches && animatesAt(playhead));
  });

  /**
   * The reading line: where a step counts as "being read".
   * Wide screens: the middle of the window below the header.
   * Phones: the middle of the space between the pinned stage and the bottom navigation.
   */
  const readingLine = () => {
    const header = document.querySelector('.site-header');
    const top = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 0;
    if (top !== headerBottom) { headerBottom = top; root.style.setProperty('--care-header', `${top}px`); }
    if (wide.matches) return top + (innerHeight - top) / 2;
    const stageBottom = stage.getBoundingClientRect().bottom;
    const nav = document.querySelector('.bottom-nav');
    const navRect = nav ? nav.getBoundingClientRect() : null;
    const floor = navRect && navRect.height > 0 && navRect.top < innerHeight ? navRect.top : innerHeight;
    return stageBottom + (Math.max(floor, stageBottom + 80) - stageBottom) / 2;
  };

  const hud = debug ? document.createElement('pre') : null;
  const lineEl = debug ? document.createElement('div') : null;
  if (debug) {
    hud.className = 'care-story__hud';
    lineEl.className = 'care-story__line';
    root.append(lineEl, hud);
  }
  const renderHud = () => {
    if (!debug) return;
    lineEl.style.top = `${lineY}px`;
    hud.textContent =
      `scroll position  ${scrollPos.toFixed(2)}\n` +
      `active step      ${active}   (switches at .${Math.round(SWITCH_AT * 100)})\n` +
      `goal keyframe    ${goal}\n` +
      `playhead         ${playhead.toFixed(2)}\n` +
      `render loop      ${rig.running() ? 'running' : 'parked'}`;
  };
  const hudTimer = debug ? setInterval(renderHud, 120) : null;

  const update = () => {
    queued = false;
    if (disposed) return;
    if (!root.isConnected) { destroy(); return; } // the page was swapped out from under us
    lineY = readingLine();
    const centres = steps.map((s) => { const r = s.getBoundingClientRect(); return r.top + r.height / 2; });
    let pos = 0;
    if (lineY >= centres[centres.length - 1]) pos = centres.length - 1;
    else if (lineY > centres[0]) {
      for (let i = 0; i < centres.length - 1; i += 1) {
        if (lineY >= centres[i] && lineY <= centres[i + 1]) {
          pos = i + (lineY - centres[i]) / Math.max(1, centres[i + 1] - centres[i]);
          break;
        }
      }
    }
    scrollPos = pos; // e.g. 2.4 = 40% of the way from step 2 to step 3
    const next = Math.floor(pos) + (pos - Math.floor(pos) >= SWITCH_AT ? 1 : 0);
    if (next !== active) {
      active = next;
      steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
      goal = Number(steps[active].dataset.kf);
      rig.invalidate(); // wake the loop; the playhead does the rest
    }
    renderHud();
  };
  const queue = () => { if (!queued && !disposed) { queued = true; requestAnimationFrame(update); } };
  const repaint = () => { palette = null; rig.invalidate(); };

  // Theme toggle flips data-theme on <html>; late web fonts would otherwise leave fallback type on a parked canvas.
  const themeObserver = new MutationObserver(repaint);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!disposed) repaint(); });

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  wide.addEventListener('change', queue);
  reduced.addEventListener('change', repaint);

  function destroy() {
    if (disposed) return;
    disposed = true;
    removeEventListener('scroll', queue);
    removeEventListener('resize', queue);
    wide.removeEventListener('change', queue);
    reduced.removeEventListener('change', repaint);
    themeObserver.disconnect();
    if (hudTimer) clearInterval(hudTimer);
    rig.destroy();
    root.classList.remove('care-story--live');
  }

  root.classList.add('care-story--live'); // CSS shows the stage and dims inactive steps only now
  update();
  return { destroy };
};

let current = null;

/** Start the story if the page has one. Safe to call on every page view (Swup navigation). */
export function initCareStory() {
  if (current) { current.destroy(); current = null; }
  const root = document.querySelector('[data-care-story]');
  if (root) current = createStory(root);
}
