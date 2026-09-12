import { NEUTRAL, roundSpec, judge, scoreFor } from '../src/game.js';
const N=400, CMAX=60, GS=21, ES=481;
function specGrid(n,mod){const o=[];for(let i=0;i<GS;i++){const u=(i+0.5)/GS;o.push(roundSpec(n,()=>u,mod));}return o;}
const pdf=z=>Math.exp(-0.5*z*z)/Math.sqrt(2*Math.PI);
function outcome(spec,aim,sig){const ideal=(aim/spec.rate)*1000,lo=-5*sig,hi=5*sig,h=(hi-lo)/(ES-1);
 let W=0;const p={gold:0,safe:0,flinch:0,overload:0};let sc=0;
 for(let i=0;i<ES;i++){const e=lo+i*h,w=pdf(e/sig);W+=w;const held=Math.max(0,ideal+e);const ch=(held/1000)*spec.rate;
  const v=judge(ch,spec);p[v]+=w;sc+=w*scoreFor(v,Math.min(ch,spec.goldEnd),1);}
 for(const k in p)p[k]/=W;return{p,score:sc/W};}
function solve(sig,mod){let V=[];for(let k=0;k<3;k++)V.push(new Float64Array(CMAX+2));
 const pol=new Map(),gap=new Map();
 for(let n=N-1;n>=0;n--){const specs=specGrid(n,mod);
  const acts=specs.map(s=>({gold:outcome(s,(s.goldStart+s.goldEnd)/2,sig),safe:outcome(s,(s.safeStart+s.goldStart)/2,sig)}));
  const Vn=[];for(let k=0;k<3;k++)Vn.push(new Float64Array(CMAX+2));
  for(let k=0;k<3;k++)for(let c=1;c<=CMAX;c++){let best=-Infinity,bа=null,vals={};
   for(const a of['gold','safe']){let acc=0;
    for(const o of acts){const{p,score}=o[a];acc+=score*c;const cu=Math.min(CMAX,c+1);
     acc+=p.gold*V[k][cu];acc+=(p.safe+p.flinch)*V[k][1];if(k<2)acc+=p.overload*V[k+1][1];}
    acc/=acts.length;vals[a]=acc;if(acc>best){best=acc;bа=a;}}
   Vn[k][c]=best;pol.set(`${n}|${k}|${c}`,bа);gap.set(`${n}|${k}|${c}`,(vals.gold-vals.safe)/vals.safe);}
  V=Vn;}
 return{pol,gap,V};}
for(const sig of [30,55,90]){const{pol,gap}=solve(sig,NEUTRAL);
 console.log(`\n===== sigma=${sig}ms ENDLESS =====`);
 console.log('  la riga mostra la mossa ottimale per catena 1..12 (G=oro, v=verde)');
 for(const n of[0,5,10,15,20,30,60])for(const k of[0,1,2]){
  let row='';for(let c=1;c<=12;c++)row+=pol.get(`${n}|${k}|${c}`)==='gold'?'G':'v';
  const g=[1,3,6,10].map(c=>`c${c}:${(gap.get(`${n}|${k}|${c}`)*100).toFixed(0)}%`).join(' ');
  console.log(`round ${String(n).padStart(2)} crepe ${k}  ${row}   vantaggio EV oro: ${g}`);}}
