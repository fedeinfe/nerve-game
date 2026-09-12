// La corsa di chi non rischia MAI finisce? E quanto paga?
import { createRun, MODIFIERS, NEUTRAL } from '../src/game.js';
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function mul(a){return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

// due varianti di "banca sempre": mira al centro del verde, e mira all'ORLO del verde (max punti)
for (const [label, aimEdge] of [['centro del verde', false], ['orlo del verde (charge appena sotto l oro)', true]]) {
  console.log(`\n### banca sempre, ${label} ###`);
  console.log('sigma   round raggiunti (mediana)  % corse finite entro 1000 round  punteggio a 1000 round  pt/secondo');
  for (const sigma of [30, 55, 90, 130]) {
    const rand = mul(4242);
    let ended = 0, rounds = [], scores = [], secs = [];
    for (let i = 0; i < 400; i++) {
      const run = createRun({ seed: 'bank-' + i, mode: 'endless', modifier: NEUTRAL });
      let t = 0, wall = 0, guard = 0;
      while (!run.state.over && guard++ < 1000) {
        const s = run.state.spec;
        const target = aimEdge ? s.goldStart - 0.012 : (s.safeStart + s.goldStart) / 2;
        const held = Math.max(0, (target / s.rate) * 1000 + gauss(rand) * sigma);
        run.press(t);
        run.tick(t + held) || run.release(t + held);
        wall += held + 520; t += held + 520;
      }
      if (run.state.over) ended++;
      rounds.push(run.state.round); scores.push(run.state.score); secs.push(wall / 1000);
    }
    const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    console.log(String(sigma + 'ms').padEnd(8), String(med(rounds)).padStart(22), (100 * ended / 400).toFixed(1).padStart(28) + '%',
      med(scores).toLocaleString('en-US').padStart(22), (med(scores) / med(secs)).toFixed(0).padStart(11));
  }
}

// confronto: quanto tempo serve a un "banca sempre" per superare il punteggio mediano dell'esperto (39.926)
console.log('\n### per battere il punteggio mediano di un esperto (39.926 pt) bancando sempre ###');
for (const sigma of [55, 90]) {
  const rand = mul(99);
  const run = createRun({ seed: 'chase', mode: 'endless', modifier: NEUTRAL });
  let t = 0, wall = 0, g = 0;
  while (run.state.score < 39926 && !run.state.over && g++ < 20000) {
    const s = run.state.spec;
    const held = Math.max(0, ((s.goldStart - 0.012) / s.rate) * 1000 + gauss(rand) * sigma);
    run.press(t); run.tick(t + held) || run.release(t + held);
    wall += held + 520; t += held + 520;
  }
  console.log(`sigma ${sigma}ms: ${run.state.round} round, ${(wall / 1000 / 60).toFixed(1)} minuti, crepe usate ${run.state.cracks}, punteggio ${run.state.score.toLocaleString('en-US')}`);
}
