import { MODIFIERS, NEUTRAL, roundSpec } from '../src/game.js';
import { mulberry32, hashString } from '../src/rng.js';

const mods = [NEUTRAL, ...MODIFIERS];
console.log('--- FINESTRA D ORO (ms) ---');
console.log('round   ' + mods.map(m=>m.name.padStart(9)).join(''));
for (const n of [0,1,2,3,5,8,12,16,20,25,30,40,60]) {
  const row = mods.map(m => {
    const rnd = mulberry32(hashString('w'+m.key));
    let s; for (let i=0;i<=n;i++) s = roundSpec(i, rnd, m);
    return String(s.windowMs).padStart(9);
  });
  console.log(String(n).padEnd(8) + row.join(''));
}
console.log('\n--- banda VERDE (safeStart->goldStart) in ms, media su 2000 seed ---');
console.log('round   ' + mods.map(m=>m.name.padStart(9)).join(''));
for (const n of [0,5,20,40]) {
  const row = mods.map(m => {
    let acc=0;
    for (let k=0;k<2000;k++){
      const rnd = mulberry32(hashString('g'+k));
      let s; for (let i=0;i<=n;i++) s = roundSpec(i, rnd, m);
      acc += (s.goldStart - s.safeStart)/s.rate*1000;
    }
    return (acc/2000).toFixed(0).padStart(9);
  });
  console.log(String(n).padEnd(8) + row.join(''));
}
console.log('\n--- rate (giri/s) ---');
console.log('round   ' + mods.map(m=>m.name.padStart(9)).join(''));
for (const n of [0,5,10,17,20,25,40]) {
  const row = mods.map(m => { const rnd=mulberry32(1); let s; for(let i=0;i<=n;i++) s=roundSpec(i,rnd,m); return s.rate.toFixed(3).padStart(9); });
  console.log(String(n).padEnd(8)+row.join(''));
}
console.log('\n--- quando la difficolta smette di crescere ---');
for (const m of mods) {
  const rnd = mulberry32(hashString('f'+m.key));
  let floorRound=null, capRound=null, prevRate=0;
  for (let i=0;i<200;i++){ const s=roundSpec(i,rnd,m);
    if (floorRound===null && s.windowMs<=85) floorRound=i;
    if (capRound===null && i>0 && Math.abs(s.rate-prevRate)<1e-12) capRound=i;
    prevRate=s.rate;
  }
  console.log(m.name.padEnd(10),'finestra=85ms dal round',String(floorRound).padStart(3),'| rate al cap dal round',String(capRound).padStart(3));
}
console.log('\n--- TEMPO vs ENDLESS: finestra identica? ---');
{
  const a=mulberry32(7), b=mulberry32(7);
  let maxd=0;
  for(let i=0;i<80;i++){ const x=roundSpec(i,a,NEUTRAL), y=roundSpec(i,b,MODIFIERS.find(m=>m.key==='tempo'));
    maxd=Math.max(maxd, Math.abs(x.windowMs-y.windowMs)); }
  console.log('differenza massima finestra d oro su 80 round, ENDLESS vs TEMPO:', maxd, 'ms');
}
