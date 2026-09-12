import { mulberry32, hashString } from '../src/rng.js';

function specFor(n, rnd, B) {
  const rate = Math.min(B.rateCap, B.rate0 + n * B.rateGrowth);
  const width = Math.max(B.goldWidthFloor, B.goldWidth0 - n * B.goldWidthDecay);
  const goldStart = 0.60 + rnd() * 0.18;
  return { rate, safeStart: 0.34, goldStart, goldEnd: goldStart + width, windowMs: (width / rate) * 1000 };
}
function gauss(rand){let u=0,v=0;while(u===0)u=rand();while(v===0)v=rand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function mul(a){return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

function sim(B, sigmaMs, greed, rand, seed) {
  const rnd = mulberry32(hashString(seed));
  let cracks = 0, n = 0, wall = 0, chain = 1, best = 1;
  while (cracks < 3 && n < 400) {
    const s = specFor(n, rnd, B);
    const gold = rand() < greed;
    const target = gold ? (s.goldStart + s.goldEnd) / 2 : (s.safeStart + s.goldStart) / 2;
    const held = Math.max(0, (target / s.rate) * 1000 + gauss(rand) * sigmaMs);
    const charge = (held / 1000) * s.rate;
    if (charge > s.goldEnd) { cracks++; chain = 1; }
    else if (charge >= s.goldStart) { chain++; best = Math.max(best, chain); }
    else chain = 1;
    wall += held + 520; n++;
  }
  return { seconds: wall / 1000, rounds: n, best };
}
const pct=(a,p)=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)];

function evalB(B) {
  const out = {};
  for (const [name, sigma, greed] of [['beg',90,0.55],['avg',55,0.70],['exp',30,0.85]]) {
    const rand = mul(999);
    const s = [];
    for (let i=0;i<2500;i++) s.push(sim(B, sigma, greed, rand, 'x'+i).seconds);
    out[name] = { p10: pct(s,.1), p50: pct(s,.5), p90: pct(s,.9) };
  }
  const r = mulberry32(hashString('w'));
  let minW = Infinity; for (let n=0;n<120;n++) minW = Math.min(minW, specFor(n, r, B).windowMs);
  out.minWindow = Math.round(minW);
  return out;
}

const cands = {
  'attuale        ': { rate0:0.60, rateGrowth:0.040, rateCap:1.15, goldWidth0:0.165, goldWidthDecay:0.0050, goldWidthFloor:0.095 },
  'A morbida      ': { rate0:0.55, rateGrowth:0.030, rateCap:1.05, goldWidth0:0.200, goldWidthDecay:0.0045, goldWidthFloor:0.100 },
  'B media        ': { rate0:0.55, rateGrowth:0.033, rateCap:1.10, goldWidth0:0.190, goldWidthDecay:0.0048, goldWidthFloor:0.095 },
  'C morbida-corta': { rate0:0.55, rateGrowth:0.036, rateCap:1.15, goldWidth0:0.200, goldWidthDecay:0.0055, goldWidthFloor:0.092 },
};
console.log('variante          principiante        medio             esperto           finestra min');
for (const [k,B] of Object.entries(cands)) {
  const e = evalB(B);
  const f = (o)=>`${o.p50.toFixed(0)}s (${o.p10.toFixed(0)}-${o.p90.toFixed(0)})`.padEnd(18);
  console.log(k, f(e.beg), f(e.avg), f(e.exp), String(e.minWindow)+'ms');
}
