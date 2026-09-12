import { NEUTRAL, MODIFIERS, roundSpec } from '../src/game.js';
import { mulberry32 } from '../src/rng.js';
console.log('Finestra d oro media sui round 0-25 (quelli che un giocatore mediano gioca davvero):');
const base=[];
for(const m of [NEUTRAL,...MODIFIERS]){
 let acc=0;const r=mulberry32(5);
 for(let n=0;n<=25;n++) acc+=roundSpec(n,r,m).windowMs;
 acc/=26; base.push([m.name,acc]);
}
const ref=base[0][1];
for(const [n,v] of base) console.log('  '+n.padEnd(10)+v.toFixed(0)+'ms   scarto da ENDLESS: '+(((v-ref)/ref)*100).toFixed(1)+'%');

console.log('\nRipetibilita del daily: le posizioni dell oro sono identiche a ogni "Again"?');
const a=[],b=[];
{ // stesso seme daily, due corse
  const r1=mulberry32(1234), r2=mulberry32(1234);
  for(let n=0;n<8;n++){a.push(roundSpec(n,r1,MODIFIERS[0]).goldStart.toFixed(4));b.push(roundSpec(n,r2,MODIFIERS[0]).goldStart.toFixed(4));}
}
console.log('  corsa 1:',a.join(' '));
console.log('  corsa 2:',b.join(' '));
console.log('  identiche:',JSON.stringify(a)===JSON.stringify(b));
