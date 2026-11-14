const menu = document.getElementById('menu');
const fallback = document.getElementById('fallback');
const cover = document.getElementById('cover');
const queue = [];
const maxConcurrentRenders = 2;
let activeRenders = 0;
let pdf;

function releasePage(state) {
  if (state.canvas) {
    state.canvas.remove();
    state.canvas.width = 0;
    state.canvas.height = 0;
    state.canvas = null;
  }
  state.pdfPage?.cleanup();
  state.pdfPage = null;
}

function enqueue(state) {
  if (!state.near || state.queued || state.rendering || state.canvas || state.failed) return;
  state.queued = true;
  queue.push(state);
  drainQueue();
}

function drainQueue() {
  while (activeRenders < maxConcurrentRenders && queue.length) {
    const state = queue.shift();
    state.queued = false;
    if (!state.near || state.rendering || state.canvas || state.failed) continue;
    state.rendering = true;
    activeRenders += 1;
    renderPage(state);
  }
}

async function renderPage(state) {
  let canceled = false;
  try {
    const page = await pdf.getPage(state.number);
    state.pdfPage = page;
    if (!state.near) return;

    const original = page.getViewport({ scale: 1 });
    state.element.style.aspectRatio = `${original.width} / ${original.height}`;
    const displayWidth = Math.min(Math.max(state.element.clientWidth, 500), 1000);
    const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2.5);
    const viewport = page.getViewport({ scale: displayWidth / original.width });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.visibility = 'hidden';
    state.canvas = canvas;
    state.element.append(canvas);
    state.task = page.render({
      canvasContext: canvas.getContext('2d'),
      transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
      viewport,
    });
    await state.task.promise;
    canvas.style.visibility = 'visible';
    if (state.number === 1) cover.remove();
  } catch (error) {
    canceled = error?.name === 'RenderingCancelledException';
    if (!canceled) {
      state.failed = true;
      fallback.hidden = false;
      console.error('Could not display a menu page:', error);
    }
  } finally {
    state.task = null;
    state.rendering = false;
    activeRenders -= 1;
    if (canceled || !state.near || state.failed) releasePage(state);
    if (state.near && !state.canvas && !state.failed) enqueue(state);
    drainQueue();
  }
}

function setNear(state, near) {
  state.near = near;
  if (near) {
    enqueue(state);
  } else if (state.task) {
    state.task.cancel();
  } else if (!state.rendering) {
    releasePage(state);
  }
}

try {
  const pdfjs = await import('./vendor/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  pdf = await pdfjs.getDocument({ url: 'menu.pdf' }).promise;
  const firstPage = await pdf.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const states = [];
  const fragment = document.createDocumentFragment();

  for (let number = 1; number <= pdf.numPages; number += 1) {
    const element = document.createElement('section');
    element.className = 'page';
    element.style.aspectRatio = `${firstViewport.width} / ${firstViewport.height}`;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', `القائمة، الصفحة ${number} من ${pdf.numPages}`);
    const state = { number, element, near: false, queued: false, rendering: false, failed: false, canvas: null, task: null, pdfPage: null };
    states.push(state);
    fragment.append(element);
  }
  states[0].element.append(cover);
  menu.replaceChildren(fragment);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) setNear(states[Number(entry.target.dataset.page) - 1], entry.isIntersecting);
    }, { rootMargin: '150% 0px' });
    for (const state of states) {
      state.element.dataset.page = state.number;
      observer.observe(state.element);
    }
  } else {
    let scheduled = false;
    const updateVisibility = () => {
      scheduled = false;
      const margin = window.innerHeight * 1.5;
      for (const state of states) {
        const bounds = state.element.getBoundingClientRect();
        setNear(state, bounds.bottom >= -margin && bounds.top <= window.innerHeight + margin);
      }
    };
    const scheduleUpdate = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateVisibility);
      }
    };
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    updateVisibility();
  }
} catch (error) {
  fallback.hidden = false;
  console.error('Could not display the menu:', error);
}
