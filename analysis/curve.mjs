import { NEUTRAL, MODIFIERS, roundSpec, judge } from '../src/game.js';
const ES=2001;
const pdf=z=>Math.exp(-0.5*z*z)/Math.sqrt(2*Math.PI);
function probs(spec,aim,sig){const ideal=(aim/spec.rate)*1000,lo=-6*sig,hi=6*sig,h=(hi-lo)/(ES-1);
 let W=0;const p={gold:0,safe:0,flinch:0,overload:0};
 for(let i=0;i<ES;i++){const e=lo+i*h,w=pdf(e/sig);W+=w;const held=Math.max(0,ideal+e);
  p[judge((held/1000)*spec.rate,spec)]+=w;}
 for(const k in p)p[k]/=W;return p;}
function avg(n,sig,mod){let g=0,o=0;for(let i=0;i<21;i++){const u=(i+0.5)/21;const s=roundSpec(n,()=>u,mod);
 const p=probs(s,(s.goldStart+s.goldEnd)/2,sig);g+=p.gold;o+=p.overload;}return{g:g/21,o:o/21};}

console.log('Mirando al centro dell oro — P(oro) / P(sovraccarico), per round, ENDLESS');
console.log('round   finestra   principiante(90ms)   medio(55ms)   esperto(30ms)');
for(const n of [0,1,2,3,4,6,8,10,12,16,20,30]){
 const w=roundSpec(n,()=>0.5,NEUTRAL).windowMs;
 const f=s=>{const r=avg(n,s,NEUTRAL);return `${(r.g*100).toFixed(0)}% / ${(r.o*100).toFixed(0)}%`.padStart(14);};
 console.log(String(n).padEnd(8)+String(w+'ms').padStart(8)+f(90)+f(55)+f(30));
}
console.log('\nQuanti round prima della PRIMA crepa (mirando sempre all oro), valore atteso:');
for(const sig of [90,55,30]){
 let surv=1,exp=0;
 for(let n=0;n<200;n++){const p=avg(n,sig,NEUTRAL).o; exp+=surv*p*(n+1); surv*=(1-p);}
 console.log(`  sigma ${sig}ms: prima crepa attesa al round ${exp.toFixed(1)}  (probabilita di crepa gia nei primi 3 round: ${(100*(1-[0,1,2].reduce((a,n)=>a*(1-avg(n,sig,NEUTRAL).o),1))).toFixed(0)}%)`);
}
console.log('\nP(sovraccarico) al round 0 per modificatore, principiante 90ms:');
for(const m of [NEUTRAL,...MODIFIERS]) console.log('  '+m.name.padEnd(10)+(avg(0,90,m).o*100).toFixed(1)+'%   P(oro) '+(avg(0,90,m).g*100).toFixed(0)+'%');
