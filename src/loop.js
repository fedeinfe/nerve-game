// Passo fisso con accumulatore: la difficoltà non cambia al variare del frame rate.
export function createLoop({ update, render, step = 1 / 60 }) {
  let raf = 0;
  let last = 0;
  let acc = 0;
  let running = false;

  function frame(now) {
    if (!running) { raf = 0; return; }
    // Il ritorno da una scheda in background produce un delta enorme: va scartato,
    // altrimenti il gioco "salta" avanti di secondi in un frame.
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = step;
    acc += dt;
    let guard = 0;
    while (acc >= step && guard++ < 5) {
      update(step);
      acc -= step;
    }
    render(acc / step);
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      // frame() riaccoda PRIMA che update() possa chiamare stop(), quindi dopo il
      // cancelAnimationFrame sopra può restare un frame vivo: azzerare l'id impedisce
      // che un successivo start() ne accodi un secondo e raddoppi il ciclo.
      raf = 0;
    },
    get running() {
      return running;
    },
  };
}

export function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w: rect.width, h: rect.height, dpr };
}
