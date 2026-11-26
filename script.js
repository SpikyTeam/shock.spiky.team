/* Name, handle and avatar are baked into index.html. The old live profile.json
   refresh is gone: this page is static on GitHub Pages now. */
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* копирование ника */
const snack = document.querySelector('.snack');
let snackT;
function toast(text) {
  snack.textContent = text;
  snack.classList.add('is-on');
  clearTimeout(snackT);
  snackT = setTimeout(() => snack.classList.remove('is-on'), 1800);
}
document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); } catch (e) { return; }
  toast('скопировано: ' + b.dataset.copy);
}));


/* темы: переключатель-ползунок, его можно нажать или перетащить; выбор запоминается, без выбора следуем системе */
const themeBtn = document.querySelector('.theme');
const themeIco = themeBtn.querySelector('.theme-ico');
const metaTheme = document.querySelector('meta[name=theme-color]');
function paintTheme() {
  const dark = root.dataset.theme === 'dark';
  themeIco.textContent = dark ? 'dark_mode' : 'light_mode';
  themeBtn.setAttribute('aria-checked', dark);
  metaTheme.content = getComputedStyle(root).getPropertyValue('--bg').trim();
  dispatchEvent(new Event('themechange'));
}
paintTheme();

function setTheme(next, x, y) {
  if (root.dataset.theme === next) return;
  const apply = () => { root.dataset.theme = next; paintTheme(); };
  if (!document.startViewTransition || reduced) { apply(); return; }
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty('--vt-x', x + 'px');
  root.style.setProperty('--vt-y', y + 'px');
  root.style.setProperty('--vt-r', r + 'px');
  document.startViewTransition(apply);
}
function chooseTheme(next) {
  try { localStorage.setItem('theme', next); } catch (err) {}
  const t = themeBtn.querySelector('.theme-thumb').getBoundingClientRect();
  setTheme(next, t.left + t.width / 2, t.top + t.height / 2);
}

let drag = null, dragged = false;
themeBtn.addEventListener('pointerdown', e => {
  drag = { x: e.clientX, from: root.dataset.theme === 'dark' ? 1 : 0, id: e.pointerId };
  dragged = false;
});
addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const travel = themeBtn.offsetWidth - themeBtn.offsetHeight;
  const dx = e.clientX - drag.x;
  if (!dragged && Math.abs(dx) < 4) return;
  dragged = true;
  themeBtn.classList.add('is-drag');
  const k = Math.min(1, Math.max(0, drag.from + dx / travel));
  themeBtn.style.setProperty('--k', k);
});
addEventListener('pointerup', () => {
  if (!drag) return;
  if (dragged) {
    const k = parseFloat(themeBtn.style.getPropertyValue('--k'));
    themeBtn.classList.remove('is-drag');
    themeBtn.style.removeProperty('--k');
    chooseTheme(k > .5 ? 'dark' : 'light');
    setTimeout(() => { dragged = false; }, 0);
  }
  drag = null;
});
themeBtn.addEventListener('click', () => {
  if (dragged) { dragged = false; return; }
  chooseTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  let saved = null; try { saved = localStorage.getItem('theme'); } catch (err) {}
  if (!saved) setTheme(e.matches ? 'dark' : 'light', innerWidth - 40, 40);
});

/* плеер */
const tracks = [
  { src: 'assets/music/lexapro-delirium.mp3', cover: 'assets/music/lexapro-delirium.jpg', title: 'Lexapro Delirium', artist: 'Sewerslvt' },
];
const player = document.querySelector('.player');
const cover = player.querySelector('.cover');
const titleEl = player.querySelector('.track-title');
const artistEl = player.querySelector('.track-artist');
const playBtn = player.querySelector('.play');
const curEl = player.querySelector('.time-cur');
const durEl = player.querySelector('.time-dur');
const canvas = player.querySelector('.wave');
const ctx = canvas.getContext('2d');

const audio = new Audio();
audio.preload = 'metadata';
const VOL = 0.45;
audio.volume = VOL;
let idx = 0;
let started = false;

const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function load(i, autoplay) {
  idx = (i + tracks.length) % tracks.length;
  const t = tracks[idx];
  audio.src = t.src;
  player.classList.remove('is-swap'); void player.offsetWidth; player.classList.add('is-swap');
  cover.src = t.cover;
  titleEl.textContent = t.title;
  artistEl.textContent = t.artist;
  curEl.textContent = '0:00';
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title, artist: t.artist, album: 'шоки',
      artwork: [{ src: t.cover, sizes: '256x256', type: 'image/jpeg' }],
    });
  }
  if (autoplay) play();
}

function fadeTo(v, ms) {
  const from = audio.volume, t0 = performance.now();
  return new Promise(res => {
    const step = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / ms));
      audio.volume = from + (v - from) * k;
      k < 1 ? requestAnimationFrame(step) : res();
    };
    requestAnimationFrame(step);
  });
}
function play() {
  started = true;
  return audio.play().then(() => { if (audio.volume < VOL) fadeTo(VOL, 1200); });
}
function toggle() {
  if (audio.paused) { play().catch(() => {}); }
  else audio.pause();
}

playBtn.addEventListener('click', toggle);
/* один трек, играет по кругу */
audio.loop = true;
audio.addEventListener('loadedmetadata', () => { durEl.textContent = fmt(audio.duration); });
audio.addEventListener('play', () => { player.classList.add('is-playing'); playBtn.setAttribute('aria-label', 'пауза'); playBtn.firstChild.textContent = 'pause'; });
audio.addEventListener('pause', () => { player.classList.remove('is-playing'); playBtn.setAttribute('aria-label', 'играть'); playBtn.firstChild.textContent = 'play_arrow'; });
audio.addEventListener('timeupdate', () => {
  curEl.textContent = fmt(audio.currentTime);
  canvas.setAttribute('aria-valuenow', Math.round(progress() * 100));
});

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => play());
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
}


/* волнистая полоса прогресса, как в медиаплеере android */
let amp = 0, phase = 0, dragging = false, last = performance.now();
const progress = () => audio.duration ? audio.currentTime / audio.duration : 0;

function sizeCanvas() {
  const r = canvas.getBoundingClientRect(), d = devicePixelRatio || 1;
  canvas.width = Math.round(r.width * d);
  canvas.height = Math.round(r.height * d);
}
let raf = 0, colors = null;
function readColors() {
  const cs = getComputedStyle(player);
  colors = { on: cs.getPropertyValue('--wave').trim(), off: cs.getPropertyValue('--wave-off').trim() };
}
/* рисуем только когда что-то меняется: волна бежит, пока играет музыка, и затихает на паузе */
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } }
function draw(now) {
  raf = 0;
  const dt = Math.min(64, now - last); last = now;
  const target = audio.paused || dragging ? 0 : 1;
  amp += (target - amp) * Math.min(1, dt / 160);
  if (Math.abs(target - amp) < 0.01) amp = target;
  if (!reduced) phase -= dt * 0.0045;
  if (!colors) readColors();

  const d = devicePixelRatio || 1, w = canvas.width, h = canvas.height, mid = h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineWidth = 4 * d;
  const pad = 3 * d, x = pad + (w - pad * 2) * progress();
  const A = 3.2 * d * amp, L = 22 * d;

  if (x > pad + 0.5) {
    ctx.strokeStyle = colors.on;
    ctx.beginPath();
    for (let px = pad; px <= x; px += d) {
      const y = mid + A * Math.sin((px / L) * Math.PI * 2 + phase);
      px === pad ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = colors.off;
  ctx.beginPath();
  ctx.moveTo(Math.min(w - pad, x + 8 * d), mid);
  ctx.lineTo(w - pad, mid);
  ctx.stroke();
  ctx.fillStyle = colors.on;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - 2 * d, mid - 9 * d, 4 * d, 18 * d, 2 * d);
  else ctx.rect(x - 2 * d, mid - 9 * d, 4 * d, 18 * d);
  ctx.fill();

  const moving = !audio.paused && !reduced && !dragging;
  if (moving || amp !== target) kick();
}
sizeCanvas();
addEventListener('resize', () => { sizeCanvas(); kick(); });
addEventListener('themechange', () => { readColors(); kick(); });
['play', 'pause', 'timeupdate', 'seeked', 'loadedmetadata', 'emptied'].forEach(n => audio.addEventListener(n, kick));
kick();

function seekAt(e) {
  const r = canvas.getBoundingClientRect();
  const k = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  if (audio.duration) audio.currentTime = k * audio.duration;
}
canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); seekAt(e); });
canvas.addEventListener('pointermove', e => { if (dragging) { seekAt(e); kick(); } });
canvas.addEventListener('pointerup', () => { dragging = false; kick(); });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('keydown', e => {
  if (!audio.duration) return;
  if (e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
  else if (e.key === 'ArrowLeft') audio.currentTime = Math.max(0, audio.currentTime - 5);
  else if (e.key === ' ') { e.preventDefault(); toggle(); }
});

load(0, false);

/* экран входа: браузеры не дают включить звук без касания, поэтому первое касание — это вход.
   если браузер всё же разрешает автозапуск, экран закрывается сам */
const gate = document.querySelector('.gate');
let entered = false;
function enter() {
  if (entered) return;
  entered = true;
  root.classList.remove('gated');
  root.classList.add('in');
  gate.classList.add('is-out');
  setTimeout(() => { gate.hidden = true; gate.classList.remove('is-out'); }, 700);
}
if (root.classList.contains('gated')) {
  gate.addEventListener('click', () => { audio.volume = 0; play().catch(() => {}); enter(); });
  addEventListener('keydown', e => { if (!entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); gate.click(); } });
  audio.volume = 0;
  audio.play().then(() => { started = true; fadeTo(VOL, 1200); enter(); }).catch(() => {});
} else {
  root.classList.add('in');
}
