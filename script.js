//  light/ dark mode toggle
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  if (themeToggle) {
    themeToggle.textContent = theme === 'light' ? '🌙 dark mode' : '☀ light mode';
  }
}

applyTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('theme', next);
  });
}

//  SCROLL REVEAL FOR TIMELINE 

/**IntersectionObserver is a browser API that automatically 
 * detects when observed elements enter or leave the viewport 
 * as the user scrolls. When at least 20% of a timeline item 
 * is visible, add the "in-view" CSS class to trigger its 
 * reveal animation, then stop observing it.
 */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view'); //in-view class inside CSS
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.timeline-item').forEach(item => {
  revealObserver.observe(item);
});

/*
  ART GRID
  Finds all elements with the "art-card" class that also have a
  data-name attribute. For each card, it creates an image using
  the filename stored in data-name and appends it to the card.
*/
document.querySelectorAll('.art-card[data-name]').forEach(card => {
  const name = card.dataset.name;

  const img = document.createElement('img');
  img.src = `${name}.png`;
  img.alt = name;
  img.loading = 'lazy';
  card.appendChild(img);
});

// STAR: SPINS LIKE A GALAXY WHEN STILL, STRETCHES INTO A COMET WHEN SCROLLING 
const cometStates = [];   // { container, el, canvas, cctx, targetY, currentY, trail: [], moveBlend, hue }
const COMET_TRAIL_LENGTH = 24;
const COMET_EASE = 0.09;
const COMET_W = 56;
const GALAXY_ARMS = 5;
const GALAXY_PARTICLES_PER_ARM = 8;
let galaxyAngle = 0;

// a distinct purple shade per section (keyed by section id)
const PURPLE_SHADES = {
  about:      { core: '147, 112, 219', glow: '106, 76, 175'  }, // medium purple
  experience: { core: '168, 85, 247',  glow: '126, 34, 206'  }, // violet
  education:  { core: '186, 85, 211',  glow: '139, 61, 158'  }, // orchid
  projects:   { core: '124, 58, 237',  glow: '91, 33, 182'   }, // indigo
  blog:       { core: '216, 121, 240', glow: '168, 68, 201'  }, // orchid-pink
  art:        { core: '199, 146, 234', glow: '155, 99, 199'  }, // lavender
  default:    { core: '168, 85, 247',  glow: '126, 34, 206'  }
};

const LIGHT_SHADES = {
  about:      { core: '234, 140, 60', glow: '196, 100, 30' },
  experience: { core: '250, 250, 250', glow: '200, 250, 250'  },
  education:  { core: '250, 250, 250', glow: '200, 250, 250' },
  projects:   { core: '225, 120, 30', glow: '180, 85, 15'  },
  blog:       { core: '245, 160, 80', glow: '205, 120, 50' },
  art:        { core: '230, 140, 90', glow: '190, 100, 55' },
  default:    { core: '235, 140, 50', glow: '195, 100, 25' }
};

function cometColor(hue, alpha) {
  const palette = document.body.classList.contains('light-mode') ? LIGHT_SHADES : PURPLE_SHADES;
  const c = (palette[hue] || palette.default).core;
  return `rgba(${c}, ${alpha})`;
}
function cometGlowColor(hue, alpha) {
  const palette = document.body.classList.contains('light-mode') ? LIGHT_SHADES : PURPLE_SHADES;
  const c = (palette[hue] || palette.default).glow;
  return `rgba(${c}, ${alpha})`;
}

function setupComet(container, el, hue) {
  if (!container || !el) return;

  let canvas = el.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    el.appendChild(canvas);
  }
  const h = container.scrollHeight;
  canvas.width = COMET_W;
  canvas.height = h;
  el.style.height = h + 'px';

  cometStates.push({
    container, el, canvas, hue,
    cctx: canvas.getContext('2d'),
    targetY: 0,
    currentY: 0,
    visible: false,
    trail: [],
    moveBlend: 0
  });
}

function initComets() {
  cometStates.length = 0;

  // timelines (experience, education) - hue comes from the parent section id
  document.querySelectorAll('.timeline').forEach(tl => {
    const section = tl.closest('.section');
    setupComet(tl, tl.querySelector('.timeline-comet'), section ? section.id : 'default');
  });
}

function updateComets() {
  const viewportCenter = window.innerHeight * 0.5;

  cometStates.forEach(state => {
    const rect = state.container.getBoundingClientRect();
    const totalHeight = rect.height;
    const traveled = viewportCenter - rect.top;
    let rawProgress = totalHeight > 0 ? traveled / totalHeight : 0;

    const visible = rawProgress > -0.03 && rawProgress < 1.03;
    const progress = Math.max(0, Math.min(1, rawProgress));

    const spineTop = 8;
    const spineBottom = rect.height - 8;
    state.targetY = spineTop + (spineBottom - spineTop) * progress;
    state.visible = visible;
    state.el.style.opacity = visible ? '1' : '0';
  });
}

function drawGalaxySpin(cctx, cx, headY, blend, hue) {
  if (blend <= 0.02) return;
  for (let a = 0; a < GALAXY_ARMS; a++) {
    const armAngle = galaxyAngle + a * (Math.PI * 2 / GALAXY_ARMS);
    for (let p = 0; p < GALAXY_PARTICLES_PER_ARM; p++) {
      const radius = 5 + p * 2.8;
      const angle = armAngle + p * 0.4;
      const px = cx + Math.cos(angle) * radius;
      const py = headY + Math.sin(angle) * radius * 0.85;
      const t = p / GALAXY_PARTICLES_PER_ARM;
      const alpha = (1 - t) * 0.55 * blend;
      const size = (1 - t) * 2.6 + 0.6;
      cctx.beginPath();
      cctx.arc(px, py, size, 0, Math.PI * 2);
      cctx.fillStyle = cometColor(hue, alpha);
      cctx.fill();
    }
  }
}

function renderComets() {
  const cx = COMET_W / 2;

  cometStates.forEach(state => {
    // how fast it's currently traveling drives the comet
    const diff = state.targetY - state.currentY;
    const speed = Math.abs(diff);
    const movingTarget = Math.min(1, speed / 2.5);
    state.moveBlend += (movingTarget - state.moveBlend) * 0.15;

    // smoothly ease toward the scroll-driven target
    state.currentY += diff * COMET_EASE;

    if (state.visible) {
      state.trail.unshift(state.currentY);
      if (state.trail.length > COMET_TRAIL_LENGTH) state.trail.pop();
    } else {
      state.trail.length = 0;
    }

    const { cctx, canvas, hue } = state;
    cctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.trail.length === 0) return;
    const headY = state.trail[0];

    // trail, fading dots behind the head, fades out as it settles
    state.trail.forEach((y, i) => {
      const t = i / COMET_TRAIL_LENGTH;
      const alpha = (1 - t) * 0.5 * state.moveBlend;
      const size = (1 - t) * 3.2 + 0.6;
      cctx.beginPath();
      cctx.arc(cx, y, size, 0, Math.PI * 2);
      cctx.fillStyle = cometColor(hue, alpha);
      cctx.fill();
    });

    // outer glow
    const grd = cctx.createRadialGradient(cx, headY, 0, cx, headY, 14);
    grd.addColorStop(0, cometGlowColor(hue, 0.55));
    grd.addColorStop(1, cometGlowColor(hue, 0));
    cctx.beginPath();
    cctx.arc(cx, headY, 14, 0, Math.PI * 2);
    cctx.fillStyle = grd;
    cctx.fill();

    // spinning galaxy swirl, fades in as it comes to rest
    drawGalaxySpin(cctx, cx, headY, 1 - state.moveBlend, hue);

    // bright star head, constant size throughout
    cctx.beginPath();
    cctx.arc(cx, headY, 3.6, 0, Math.PI * 2);
    cctx.fillStyle = cometColor(hue, 0.95);
    cctx.fill();

    cctx.save();
    cctx.globalAlpha = 0.8;
    cctx.strokeStyle = cometColor(hue, 1);
    cctx.lineWidth = 0.8;
    const arm = 6.5;
    cctx.beginPath();
    cctx.moveTo(cx - arm, headY); cctx.lineTo(cx + arm, headY);
    cctx.moveTo(cx, headY - arm); cctx.lineTo(cx, headY + arm);
    cctx.stroke();
    cctx.restore();
  });

  galaxyAngle += 0.014;
  requestAnimationFrame(renderComets);
}

window.addEventListener('scroll', updateComets, { passive: true });
window.addEventListener('resize', () => { initComets(); updateComets(); });

initComets();
updateComets();
renderComets();

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let mouse = { x: -999, y: -999 };
let stars = [];

const starColors = [
  'rgba(150, 80, 180,',
  'rgba(120, 70, 160,',
  'rgba(180, 110, 170,',
  'rgba(160, 90, 110,',
  'rgba(110, 70, 130,',
  'rgba(155, 75, 190,',
  'rgba(170, 95, 200,',
  'rgba(140, 85, 180,',
  'rgba(200, 140, 230,',
  'rgba(175, 130, 210,',
  'rgba(220, 160, 210,',
  'rgba(200, 140, 170,',
  'rgba(170, 130, 195,',
  'rgba(205, 135, 235,',
  'rgba(205, 165, 240,',
  'rgba(245, 190, 235,',
  'rgba(200, 184, 232,',
  'rgba(210, 195, 240,',
  'rgba(225, 215, 245,',
  'rgba(190, 170, 225,',
  'rgba(215, 200, 238,',
  'rgba(230, 190, 250,',
  'rgba(240, 205, 255,',
  'rgba(235, 200, 245,',
  'rgba(245, 220, 250,',
  'rgba(225, 205, 245,',
  'rgba(250, 225, 255,',
  'rgba(240, 220, 255,',
  'rgba(235, 215, 250,',
  'rgba(245, 235, 255,',
  'rgba(250, 240, 255,',
  'rgba(240, 235, 250,',
  'rgba(248, 238, 255,',
  'rgba(235, 230, 248,',
  'rgba(252, 245, 255,',
];

function randColor() {
  return starColors[Math.floor(Math.random() * starColors.length)];
}

function buildStars() {
  stars = [];
  const W = canvas.width;
  const H = canvas.height;

  for (let i = 0; i < 250; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      ox: 0, oy: 0,
      r: 0.9 + Math.random() * 0.45,
      baseOpacity: 0.25 + Math.random() * 0.45,
      twinkleSpeed: 0.045 + Math.random() * 0.018,
      twinkleOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.02 + Math.random() * 0.010,
      floatOffset: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.03,
      color: randColor(),
      glow: false
    });
  }

  for (let i = 0; i < 255; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      ox: 0, oy: 0,
      r: 1 + Math.random() * 0.85,
      baseOpacity: 0.3 + Math.random() * 0.4,
      twinkleSpeed: 0.045 + Math.random() * 0.012,
      twinkleOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.02 + Math.random() * 0.008,
      floatOffset: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.02,
      color: randColor(),
      glow: false
    });
  }

  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W, y: Math.random() * H,
      ox: 0, oy: 0,
      r: 1.2 + Math.random() * 0.8,
      baseOpacity: 0.6 + Math.random() * 0.35,
      twinkleSpeed: 0.045 + Math.random() * 0.007,
      twinkleOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.02 + Math.random() * 0.006,
      floatOffset: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.012,
      color: randColor(),
      glow: true
    });
  }
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildStars();
}

resize();
window.addEventListener('resize', resize);

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY + window.scrollY;
});

window.addEventListener('mouseleave', () => {
  mouse.x = -999; mouse.y = -999;
});

let frame = 0;
const REPEL_RADIUS = 80;
const REPEL_STRENGTH = 3;

function drawStar(s) {
  const t = frame * s.twinkleSpeed + s.twinkleOffset;
  const alpha = s.baseOpacity * (0.35 + 0.65 * (Math.sin(t) * 0.5 + 0.5));

  const dx = s.x - mouse.x;
  const dy = s.y - (mouse.y - window.scrollY);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < REPEL_RADIUS && dist > 0) {
    const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
    s.ox += (dx / dist) * force;
    s.oy += (dy / dist) * force;
  }
  s.ox *= 0.87;
  s.oy *= 0.87;

  const floatX = Math.sin(frame * s.floatSpeed + s.floatOffset) * 1.2;
  const floatY = Math.cos(frame * s.floatSpeed + s.floatOffset * 1.3) * 1.2;

  const rx = s.x + s.ox + floatX;
  const ry = s.y + s.oy + floatY;

  if (s.glow) {
    const grd = ctx.createRadialGradient(rx, ry, 0, rx, ry, s.r * 7);
    grd.addColorStop(0, s.color + (alpha * 0.45) + ')');
    grd.addColorStop(1, s.color + '0)');
    ctx.beginPath();
    ctx.arc(rx, ry, s.r * 5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.save();
    ctx.globalAlpha = alpha * 0.65;
    ctx.strokeStyle = s.color + '1)';
    ctx.lineWidth = 0.4;
    const arm = s.r * 3.5;
    ctx.beginPath();
    ctx.moveTo(rx - arm, ry); ctx.lineTo(rx + arm, ry);
    ctx.moveTo(rx, ry - arm); ctx.lineTo(rx, ry + arm);
    ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(rx, ry, s.r, 0, Math.PI * 2);
  ctx.fillStyle = s.color + alpha + ')';
  ctx.fill();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  frame++;
  stars.forEach(s => {
    s.x += s.drift;
    if (s.x < -5) s.x = canvas.width + 5;
    if (s.x > canvas.width + 5) s.x = -5;
    drawStar(s);
  });
  requestAnimationFrame(animate);
}

animate();

// orbiting circle around the profile photo
const orbit = document.getElementById('orbitCanvas');
const octx = orbit.getContext('2d');
const ocx = 130, ocy = 130;
const orbitRadius = 95;
let orbitAngle = 0;
const tail = [];
const TAIL_LENGTH = 180;

function drawOrbit() {
  octx.clearRect(0, 0, 260, 260);

  orbitAngle += 0.012;

  const x = ocx + Math.cos(orbitAngle) * orbitRadius;
  const y = ocy + Math.sin(orbitAngle) * orbitRadius;

  tail.unshift({ x, y });
  if (tail.length > TAIL_LENGTH) tail.pop();

  tail.forEach((p, i) => {
    const alpha = (1 - i / TAIL_LENGTH) * 0.7;
    const size = (1 - i / TAIL_LENGTH) * 3.5;
    octx.beginPath();
    octx.arc(p.x, p.y, size, 0, Math.PI * 2);
    octx.fillStyle = `rgba(200, 180, 255, ${alpha})`;
    octx.fill();
  });

  octx.beginPath();
  octx.arc(x, y, 3.5, 0, Math.PI * 2);
  octx.fillStyle = 'rgba(230, 215, 255, 0.95)';
  octx.fill();

  const grd = octx.createRadialGradient(x, y, 0, x, y, 10);
  grd.addColorStop(0, 'rgba(200,180,255,0.4)');
  grd.addColorStop(1, 'rgba(200,180,255,0)');
  octx.beginPath();
  octx.arc(x, y, 10, 0, Math.PI * 2);
  octx.fillStyle = grd;
  octx.fill();

  requestAnimationFrame(drawOrbit);
}

drawOrbit();
