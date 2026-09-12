import { createRun, NEUTRAL } from '../src/game.js';
function gauss(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function mul(a){return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
console.log('### "banca sempre al centro del verde": quanto per arrivare a 39.926 (mediana esperto)? ###');
for (const sigma of [30,55,90]) {
  const rand = mul(99); const times=[], ok=[];
  for (let k=0;k<50;k++){
    const run = createRun({seed:'c'+k, mode:'endless', modifier:NEUTRAL});
    let t=0,wall=0,g=0;
    while(run.state.score<39926 && !run.state.over && g++<5000){
      const s=run.state.spec;
      const held=Math.max(0,(((s.safeStart+s.goldStart)/2)/s.rate)*1000+gauss(rand)*sigma);
      run.press(t); run.tick(t+held)||run.release(t+held); wall+=held+520; t+=held+520;
    }
    if(run.state.score>=39926){ok.push(1);times.push(wall/1000);}
  }
  const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)];
  console.log(`sigma ${sigma}ms: ${ok.length}/50 corse ci arrivano SENZA MAI morire, tempo mediano ${med(times)?(med(times)/60).toFixed(1):'-'} minuti`);
}
console.log('\n### quanto vale il VERDE a seconda di dove rilasci (round 0, catena 1) ###');
{
  const run=createRun({seed:'x',mode:'endless',modifier:NEUTRAL});
  const s=run.state.spec;
  console.log('goldStart =', s.goldStart.toFixed(3), ' banda verde da 0.340 a', s.goldStart.toFixed(3));
  for (const c of [0.34,0.42,0.50,0.58,s.goldStart-0.001]) console.log(`  rilascio a carica ${c.toFixed(3)} -> ${Math.round(100*c)} punti`);
  console.log('  differenza fra il verde peggiore e il migliore: '+Math.round(100*(s.goldStart-0.001))+' vs 34 punti = '+((s.goldStart/0.34).toFixed(1))+'x, senza alcun segnale visivo');
}
