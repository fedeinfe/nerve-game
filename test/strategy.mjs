import { createRun, MODIFIERS, NEUTRAL } from '../src/game.js';
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function mul(a){return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

// Strategia: rischia l'oro finché la catena è < bankAt, poi incassa in verde.
function sim({sigmaMs, bankAt, rand, seed, mod=NEUTRAL}) {
  const run = createRun({ seed, mode:'endless', modifier: mod });
  let t=0, wall=0, guard=0;
  while(!run.state.over && guard++<600){
    const s=run.state.spec;
    const goGold = run.state.chain < bankAt;
    const target = goGold ? (s.goldStart+s.goldEnd)/2 : (s.safeStart+s.goldStart)/2;
    const held = Math.max(0,(target/s.rate)*1000 + gauss(rand)*sigmaMs);
    run.press(t); const ev = run.tick(t+held) || run.release(t+held);
    wall += held+520; t += held+520;
  }
  return {score:run.state.score, seconds:wall/1000};
}
const pct=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)];
for (const sigma of [90,55,30]) {
  const row=[];
  for (const bankAt of [1,2,3,4,5,6,8,12,999]) {
    const rand=mul(4242); const sc=[], se=[];
    for(let i=0;i<2000;i++){const r=sim({sigmaMs:sigma,bankAt,rand,seed:'s'+i}); sc.push(r.score); se.push(r.seconds);}
    row.push({bankAt, med:pct(sc,.5), secs:Math.round(pct(se,.5))});
  }
  const best = row.reduce((a,b)=>b.med>a.med?b:a);
  console.log(`σ=${sigma}ms  ottimo: incassa a catena ${best.bankAt===999?'MAI':best.bankAt} (mediana ${best.med.toLocaleString('en-US')}, ${best.secs}s)`);
  console.log('   ', row.map(r=>`${r.bankAt===999?'mai':r.bankAt}:${r.med}`).join('  '));
}
