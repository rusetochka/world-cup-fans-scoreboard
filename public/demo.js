(function(){
'use strict';
const storageKey='world-cup-fans-demo-picks-v1';
let basePromise, controlsReady=false;
function readOverrides(){try{const value=JSON.parse(localStorage.getItem(storageKey)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}}
function applyOverrides(base,overrides){
 const copy=JSON.parse(JSON.stringify(base));
 for(const [key,pick] of Object.entries(overrides)){
  const [player,id]=key.split('|');const match=copy.matches.find(m=>m.id===id);
  if(!match||!copy.players.some(p=>p.name===player)||![String(match.home).toLowerCase(),String(match.away).toLowerCase(),'draw'].includes(pick))continue;
  const bet=copy.bets.find(b=>b.player===player&&b.match_id===id);if(bet)bet.pick=pick;else copy.bets.push({player,match_id:id,pick});
 }
 return copy;
}
async function loadBase(){if(!basePromise)basePromise=fetch('./demo-data.json').then(r=>{if(!r.ok)throw Error('Snapshot unavailable');return r.json();}).catch(error=>{basePromise=null;throw error;});return basePromise;}
function initControls(data){if(controlsReady)return;controlsReady=true;
 const player=document.getElementById('demo-player'),match=document.getElementById('demo-match'),pick=document.getElementById('demo-pick'),status=document.getElementById('demo-status');
 for(const p of data.players)player.add(new Option(p.name,p.name));
 for(const m of data.matches)match.add(new Option(`${m.id} · ${m.home} vs ${m.away}`,m.id));
 function sync(){const m=data.matches.find(m=>m.id===match.value);pick.replaceChildren();pick.add(new Option(m.home,String(m.home).toLowerCase()));pick.add(new Option('Draw','draw'));pick.add(new Option(m.away,String(m.away).toLowerCase()));const current=applyOverrides(data,readOverrides()).bets.find(b=>b.player===player.value&&b.match_id===m.id);if(current)pick.value=current.pick;const result=m.result==='draw'?'Draw':String(m.home).toLowerCase()===m.result?m.home:m.away;document.getElementById('demo-result').textContent=`Recorded result: ${result}. This result cannot be edited.`;}
 player.addEventListener('change',sync);match.addEventListener('change',sync);sync();
 document.getElementById('demo-apply').addEventListener('click',()=>{const overrides=readOverrides();overrides[`${player.value}|${match.value}`]=pick.value;try{localStorage.setItem(storageKey,JSON.stringify(overrides));status.textContent=`Demo prediction changed for ${player.value}. Scores below have been recalculated; recorded results are unchanged.`;window.dispatchEvent(new Event('wc-demo-change'));}catch{status.textContent='Browser storage is unavailable. Enable storage to try your own predictions.';}});
 document.getElementById('demo-reset').addEventListener('click',()=>{localStorage.removeItem(storageKey);sync();status.textContent='Fictional starting predictions restored. Recorded match results are unchanged.';window.dispatchEvent(new Event('wc-demo-change'));});
}
window.WCDemo={async loadData(){const data=await loadBase();initControls(data);return applyOverrides(data,readOverrides());},applyOverrides};
})();
