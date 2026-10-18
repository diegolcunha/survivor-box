/* 9 Card Siege — Chris Hansen, rules 12.17.2017. */
(function(root){
const cards = [
 [{ap:3,e:'treb',name:'Ataque de trabucos'}, {ap:2,e:'treb',name:'Ataque de trabucos'}, {ap:1,e:'treb',name:'Ataque de trabucos'}],
 [{ap:2,e:'ill',move:[2],name:'Doença'}, {ap:2,e:'guards',move:'slow',name:'Guardas distraídos'}, {ap:1,e:'treb',name:'Ataque de trabucos'}],
 [{ap:2,e:'spoiled',move:[0],name:'Provisões estragadas'}, {ap:2,e:'weather',move:[],name:'Mau tempo'}, {ap:2,e:'oil',move:[0,1],name:'Óleo fervente'}],
 [{ap:2,e:'death',move:[0,2],name:'Morte de um líder'}, {ap:2,e:'gate',move:[0,1],name:'Portão fortificado'}, {ap:3,e:'flame',move:[2],name:'Flechas flamejantes'}],
 [{ap:3,e:'volley',move:[1],name:'Chuva de flechas'}, {ap:2,e:'collapse',move:[0,1],name:'Desabamento!'}, {ap:2,e:'repair',move:[0],name:'Trabuco reparado'}],
 [{ap:3,e:'dark',move:'slow',name:'Sob a escuridão'}, {ap:3,e:'fatigue',move:[0],name:'Fadiga inimiga'}, {ap:3,e:'rally',move:[1,2],name:'Às armas!'}],
 [{ap:2,e:'determined',move:[1],name:'Inimigo determinado'}, {ap:2,e:'shields',move:[2],name:'Escudos de ferro'}, {ap:3,e:'faith',move:[0,1,2],name:'Fé'}]
];
const descriptions={treb:'3 trabucos: −2 muralha; 2: −1; 1: −1 se o dado for 4–6. Sem avanço inimigo.',ill:'−1 moral e −1 provisão.',guards:'+1 em sabotagem e motivação.',spoiled:'−1 provisão.',weather:'Somente incursão e sabotagem neste turno.',oil:'+2 nos ataques a inimigos em casas circulares (posição 1).',death:'−1 moral.',gate:'+1 contra o aríete na trilha.',flame:'+1 contra a torre na trilha.',volley:'+1 em todos os ataques, inclusive corpo a corpo.',collapse:'Remove permanentemente a torre se ela estiver na posição inicial.',repair:'Adiciona 1 trabuco (máximo 3); +1 ao reparar muralha.',dark:'+1 em incursão e sabotagem.',fatigue:'+1 em reparo, incursão e sabotagem.',rally:'+1 em ataques corpo a corpo ou em casas circulares.',determined:'−1 contra o aríete na trilha.',shields:'−1 contra a torre na trilha.',faith:'+1 contra escadas e aríete na trilha; +1 em motivação.'};
class Siege {
 constructor(random=Math.random){this.random=random;this.s={day:1,turn:0,enemies:[4,4,4],trebs:3,wall:4,morale:4,supply:4,tunnel:0,direction:1,loot:0,phase:'draw',deck:[],log:[],card:null,ap:0};this.shuffle();}
 shuffle(){this.s.deck=[0,1,2,3,4,5,6];for(let i=6;i>0;i--){let j=Math.floor(this.random()*(i+1));[this.s.deck[i],this.s.deck[j]]=[this.s.deck[j],this.s.deck[i]];}}
 log(t){this.s.log.unshift(t);}
 die(){let n=1+Math.floor(this.random()*6);this.s.die=n;return n;}
 end(reason){this.s.phase='lost';this.s.reason=reason;this.log('DERROTA — '+reason);}
 status(key,delta){this.s[key]=Math.max(0,Math.min(4,this.s[key]+delta));if(['wall','morale','supply'].filter(k=>this.s[k]===0).length>=2)this.end('Dois recursos chegaram a zero.');}
 capture(){this.s.tunnel=0;this.s.loot=0;this.log('Soldados capturados. Carga perdida; −1 moral.');this.status('morale',-1);}
 home(){this.s.tunnel=0;let n=this.s.loot;this.s.loot=0;if(n){this.status('supply',n);this.log('Retorno ao castelo: +'+n+' provisões (máximo 4).');}}
 draw(){let s=this.s;if(s.phase!=='draw')return;if(s.tunnel===3){let r=this.die();this.log('Verificação nas linhas inimigas: dado '+r+'.');if(r===1)this.capture();}if(s.phase==='lost')return;s.cardDay=s.day;s.card=s.deck.pop();s.turn++;s.event=cards[s.card][s.day-1];s.ap=s.event.ap;s.water=false;s.extra=false;s.free=false;s.entered=false;s.phase='actions';let e=s.event.e;this.log('Dia '+s.day+', turno '+s.turn+': '+s.event.name+'.');
 if(e==='treb'){let damage=s.trebs===3?2:s.trebs===2?1:s.trebs===1?(this.die()>=4?1:0):0;this.log('Bombardeio: '+damage+' de dano à muralha.');this.status('wall',-damage);}
 if(e==='ill'){this.status('morale',-1);this.status('supply',-1);}if(e==='spoiled')this.status('supply',-1);if(e==='death')this.status('morale',-1);if(e==='repair')s.trebs=Math.min(3,s.trebs+1);if(e==='collapse'&&s.enemies[2]===4){s.enemies[2]=-1;this.log('A torre desabou e foi removida!');}
 if(s.phase==='lost')return;let move=s.event.move||[];if(move==='slow'){let max=Math.max(...s.enemies);move=s.enemies.map((v,i)=>v===max&&v>0?i:-1).filter(i=>i>=0);}for(let i of move){if(s.enemies[i]>0){s.enemies[i]--;if(s.enemies[i]===0){this.log('Inimigo entrou em corpo a corpo: −1 moral.');this.status('morale',-1);if(s.enemies.filter(v=>v===0).length===3)this.end('Três inimigos invadiram o castelo.');if(s.phase==='lost')break;}}}}
 bonus(type,i){let e=this.s.event.e, b=0,p=this.s.enemies[i];if(type==='attack'||type==='water'){if(e==='volley')b++;if(e==='rally'&&(p===0||p===1))b++;if(p>0){if(e==='oil'&&p===1)b+=2;if(e==='gate'&&i===1)b++;if(e==='flame'&&i===2)b++;if(e==='determined'&&i===1)b--;if(e==='shields'&&i===2)b--;if(e==='faith'&&i<2)b++;}}if(type==='repair'&&['repair','fatigue'].includes(e))b++;if(type==='rally'&&['guards','faith'].includes(e))b++;if(['raid','sabotage'].includes(type)&&['dark','fatigue'].includes(e))b++;if(type==='sabotage'&&e==='guards')b++;return b;}
 allowed(type,i=0){let s=this.s;if(s.phase!=='actions')return false;if(type==='extraMorale'||type==='extraSupply')return !s.extra&&s[type==='extraMorale'?'morale':'supply']>0;
 if(s.event.e==='weather'&&!['raid','sabotage'].includes(type))return false;
 if(type==='free')return s.tunnel>0&&s.tunnel<3&&!s.free&&!s.entered;
 if(s.ap<1)return false;
 if(type==='attack')return s.enemies[i]>=0&&s.enemies[i]<4;
 if(type==='water')return !s.water&&s.enemies[i]===1;
 if(type==='repair')return s.wall<4;
 if(type==='rally'||type==='rallySupply')return s.morale<4&&(type!=='rallySupply'||s.supply>0);
 if(type==='enter')return s.tunnel===0||s.tunnel===3;
 if(type==='fast')return s.tunnel===1||s.tunnel===2;
 if(type==='raid')return s.tunnel===3&&s.loot<2;
 if(type==='sabotage')return s.tunnel===3&&s.trebs>0;
 return false;}
 action(type,i=0){if(!this.allowed(type,i))return;let s=this.s;if(type.startsWith('extra')){s.extra=true;this.status(type==='extraMorale'?'morale':'supply',-1);s.ap++;this.log('Uma ação extra comprada.');return;}if(type==='free'){s.free=true;s.tunnel+=s.direction;if(s.tunnel===0)this.home();this.log('Movimento gratuito no túnel.');return;}s.ap--;
 if(type==='enter'){s.direction=s.tunnel===0?1:-1;s.tunnel+=s.direction;s.entered=true;this.log('Soldados entraram no túnel.');return;}if(type==='fast'){s.tunnel=s.direction===1?3:0;if(s.tunnel===0)this.home();this.log('Travessia rápida concluída.');return;}
 let actual=type==='rallySupply'?'rally':type,b=this.bonus(actual,i),r=this.die();if(type==='rallySupply'){b++;this.status('supply',-1);}let success=false;
 if(type==='attack'||type==='water'){let strength=s.enemies[i]===0?4:[2,3,4][i];if(type==='water'){s.water=true;b++;}success=r+b>strength;if(type==='water'&&r===1){success=false;if(this.bonus(type,i)<1)this.status('morale',-1);}if(s.enemies[i]===0&&r===1)this.status('morale',-1);if(success)s.enemies[i]++;}
 if(actual==='repair'||actual==='rally'){success=r+b>=5;if(success)this.status(actual==='repair'?'wall':'morale',1);}
 if(type==='raid'){if(r===1)this.capture();else {success=r+b>=3;if(success)s.loot=Math.min(2,s.loot+(r+b>=6?2:1));}}
 if(type==='sabotage'){if(r===1)this.capture();else {success=r+b>=5;if(success)s.trebs--;}}
 this.log(({attack:'Ataque',water:'Água fervente',repair:'Reparo',rally:'Motivação',rallySupply:'Motivação com provisão',raid:'Incursão',sabotage:'Sabotagem'})[type]+': dado '+r+(b?' '+(b>0?'+':'')+b:'')+' → '+(success?'sucesso.':'falha.'));}
 finish(){let s=this.s;if(s.phase!=='actions')return;if(s.enemies.filter(v=>v===0).length>=2)return this.end('Dois inimigos permaneceram em corpo a corpo.');if(['wall','morale','supply'].some(k=>s[k]===0))return this.end('Um recurso terminou o turno em zero.');if(s.turn===7){this.log('Fim do dia: −1 provisão.');this.status('supply',-1);if(s.phase==='lost')return;if(s.tunnel===1||s.tunnel===2)this.home();else if(s.tunnel===3)this.capture();if(s.phase==='lost')return;if(['wall','morale','supply'].some(k=>s[k]===0))return this.end('A fortaleza não resistiu ao fim do dia.');if(s.day===3){s.phase='won';s.reason='O exército de socorro chegou. A fortaleza resistiu!';this.log(s.reason);return;}s.day++;s.turn=0;this.shuffle();}s.ap=0;s.phase='draw';}
}
root.Siege=Siege;root.SiegeCards=cards;root.SiegeDescriptions=descriptions;
if(typeof module!=='undefined')module.exports={Siege,cards,descriptions};
})(typeof window!=='undefined'?window:globalThis);

