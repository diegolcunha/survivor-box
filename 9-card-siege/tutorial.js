/* Orientações contextuais: não alteram a partida nem os dados. */
(function(){
let seen={},enabled=true;
try{const saved=JSON.parse(localStorage.getItem('siege-tutorial-v1'));if(saved){seen=saved.seen||{};enabled=saved.enabled!==false;}}catch{}
let current=null;
const store=()=>{try{localStorage.setItem('siege-tutorial-v1',JSON.stringify({seen,enabled}));}catch{}};
function choose(s){
 if(!seen.welcome)return {id:'welcome',tag:'COMECE AQUI · 30 SEGUNDOS',title:'Seu objetivo é ganhar tempo',text:'Resista por 3 dias. Os marcadores vermelhos são os invasores; os verdes mostram muralha, moral e provisões. Preserve os três recursos acima de zero.',target:'#fortBoard',label:'Entendi'};
 if(['lost','won'].includes(s.phase))return {id:'ending',title:s.phase==='won'?'Você resistiu!':'O cerco terminou',text:s.phase==='won'?'O exército de socorro chegou. Você pode começar outra partida quando quiser.':'O motivo aparece acima da mesa. Use “Nova partida” para tentar outra estratégia.',target:'#restart'};
 if(s.phase==='draw'){
  if(s.turn===0&&s.day>1&&!seen.night)return {id:'night',title:'Um novo dia',text:'A noite consome uma provisão. Soldados no túnel voltam ao castelo; nas linhas inimigas, são capturados. As cartas foram embaralhadas para o próximo dia.',target:'.hud'};
  if(!seen.draw)return {id:'draw',tag:'1 · REVELE A AMEAÇA',title:'Comece comprando uma carta',text:'Clique em “Comprar carta”. O jogo resolve o evento e move os inimigos sozinho. Depois, você decide como usar suas ações.',target:'#next'};
  return null;
 }
 const close=s.enemies.filter(v=>v===0).length;
 if(close&&!seen.close)return {id:'close',title:'Inimigo dentro da fortaleza!',text:'Use o ataque “Corpo a corpo” para expulsá-lo: precisa superar 4. Dois invasores aqui ao encerrar o turno causam derrota.',target:'[data-action="attack"]:not(:disabled)'};
 if([s.wall,s.morale,s.supply].includes(0)&&!seen.zero)return {id:'zero',title:'Um recurso chegou a zero',text:'Você ainda pode recuperá-lo antes de encerrar o turno. Dois recursos em zero provocam derrota imediata.',target:'#fortBoard'};
 if(s.event.e==='weather'&&!seen.weather)return {id:'weather',title:'O mau tempo limita suas ordens',text:'Nesta carta, só incursão e sabotagem são permitidas, se seus soldados estiverem nas linhas inimigas. Se não há ação possível, encerre o turno.',target:'#eventText'};
 if(!seen.actions){let target=s.wall<4?'repair':s.enemies.some(v=>v>0&&v<4)?'attack':s.morale<4?'rally':'enter';return {id:'actions',tag:'2 · DÊ UMA ORDEM',title:'Cada ação é uma tentativa',text:`Você recebeu ${s.event.ap} ações. ${target==='repair'?'A muralha sofreu dano: tente “Reparar muralha”.':target==='attack'?'Um inimigo avançou: tente atacá-lo com arqueiros.':target==='rally'?'A moral caiu: tente “Motivar tropas”.':'Você pode enviar soldados ao túnel para alcançar as linhas inimigas.'} O dado é rolado automaticamente. Botões apagados estão indisponíveis.`,target:`[data-action="${target}"]:not(:disabled)`};}
 if(s.tunnel===3&&!seen.lines)return {id:'lines',title:'Atrás das linhas inimigas',text:'Sabote para destruir trabucos ou faça uma incursão por provisões. Um 1 natural causa captura. Para voltar, entre no túnel novamente; a carga só abastece a fortaleza ao chegar ao castelo.',target:'[data-action="sabotage"]:not(:disabled), [data-action="raid"]:not(:disabled)'};
 if(s.tunnel>0&&s.tunnel<3&&!seen.tunnel)return {id:'tunnel',title:'Seus soldados estão no túnel',text:'No turno de entrada, aguarde ou gaste mais 1 ação na travessia rápida. Nos turnos seguintes, avance uma casa grátis. A direção é definida pelo lado em que você entrou.',target:'[data-action="fast"]:not(:disabled), [data-action="free"]:not(:disabled)'};
 if(s.enemies.includes(1)&&!seen.water)return {id:'water',title:'Um inimigo chegou à casa circular',text:'Água fervente dá +1 ao ataque nessa posição, mas só pode ser usada uma vez por turno. Um sucesso empurra o inimigo uma casa para trás.',target:'[data-action="water"]:not(:disabled)'};
 if(s.ap<s.event.ap&&!seen.result)return {id:'result',tag:'3 · VEJA O RESULTADO',title:'Confira o diário do cerco',text:'O diário mostra o dado, os bônus e o resultado. Uma tentativa gasta a ação mesmo quando falha. Você pode repetir ações enquanto tiver pontos.',target:'#log'};
 if(s.ap===0&&!seen.finish)return {id:'finish',title:'Suas ações acabaram',text:'Clique em “Encerrar turno” e compre outra carta. Uma vez por turno, você também pode trocar 1 moral ou provisão por uma ação extra, se precisar.',target:'#next'};
 if(s.turn===7&&!seen.dayEnd)return {id:'dayEnd',title:'A noite está chegando',text:'Ao encerrar este turno, sua população consome 1 provisão. Retire os soldados das linhas inimigas para evitar a captura; quem estiver no túnel retorna automaticamente.',target:'#next'};
 return null;
}
window.renderTutorial=function(){document.querySelectorAll('.tutorial-focus').forEach(el=>el.classList.remove('tutorial-focus'));const box=document.getElementById('tutorial');if(!enabled){box.hidden=true;return;}current=choose(game.s);box.hidden=!current;if(!current)return;document.getElementById('tutorialTag').textContent=current.tag||'DICA NA HORA CERTA';document.getElementById('tutorialTitle').textContent=current.title;document.getElementById('tutorialText').textContent=current.text;document.getElementById('tutorialDone').textContent=current.label||'Entendi';const target=document.querySelector(current.target);if(target)target.classList.add('tutorial-focus');};
document.getElementById('tutorialDone').onclick=()=>{if(current)seen[current.id]=true;store();renderTutorial();};
document.getElementById('tutorialSkip').onclick=()=>{enabled=false;store();renderTutorial();};
document.getElementById('tutorialReplay').onclick=()=>{seen={};enabled=true;store();renderTutorial();document.getElementById('tutorial').scrollIntoView({behavior:'smooth',block:'center'});};
})();
