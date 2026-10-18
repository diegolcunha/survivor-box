(function(){
window.renderNextStep=function(){const s=game.s;let message='',label='',target=null;
const action=(type,index=0)=>document.querySelectorAll(`[data-action="${type}"]`)[index];
const offer=(text,type,index=0)=>{const button=action(type,index);if(!button||button.disabled)return false;message=text;label=button.childNodes[0].textContent;target=button;return true;};
if(s.phase==='draw'){message=s.turn===0&&s.day===1?'Revele a primeira carta para começar. O evento e os movimentos serão resolvidos automaticamente.':'Compre a próxima carta para continuar o cerco.';label='Comprar carta →';target=document.getElementById('next');}
else if(s.phase==='won'||s.phase==='lost'){message='Comece outra partida para defender a fortaleza novamente.';label='Nova partida';target=document.getElementById('restart');}
else {
const closest=s.enemies.reduce((best,p,i)=>p>=0&&p<4&&(best<0||p<s.enemies[best])?i:best,-1);
if(s.enemies.filter(p=>p===0).length>=2)offer('Há dois invasores em corpo a corpo. Ataque um deles antes de encerrar o turno para evitar a derrota.','attack',s.enemies.indexOf(0));
if(!target&&s.wall===0)offer('A muralha está em zero. Tente repará-la antes de encerrar o turno.','repair');
if(!target&&s.morale===0)offer('O ânimo da guarnição está em zero. Tente motivar as tropas antes de encerrar o turno.','rally');
if(!target&&s.tunnel===3&&(s.loot===2||s.turn===7))offer('Leve os soldados de volta: entre no túnel para iniciar o retorno ao castelo.','enter');
if(!target&&s.tunnel>0&&s.tunnel<3) {offer('Avance seus soldados uma casa pelo túnel sem gastar uma ação.','free')||offer('Você pode gastar uma ação para levar os soldados diretamente à saída do túnel.','fast');}
if(!target&&closest>=0&&(s.enemies[closest]<=1))offer('O inimigo está junto à muralha. Tente fazê-lo recuar com um ataque.','water',closest)||offer('O inimigo está junto à muralha. Tente fazê-lo recuar com um ataque.','attack',closest);
if(!target&&s.tunnel===3){if(s.supply<3)offer('Recolha provisões nas linhas inimigas e depois traga a carga ao castelo.','raid');if(!target)offer('Tente inutilizar um trabuco para reduzir os próximos bombardeios.','sabotage');if(!target)offer('Inicie o retorno pelo túnel para retirar seus soldados das linhas inimigas.','enter');}
if(!target&&s.wall<=2)offer('A muralha está enfraquecida. Você pode tentar reforçá-la com uma ação de reparo.','repair');
if(!target&&closest>=0)offer('Você pode tentar fazer o inimigo mais próximo recuar. O dado será rolado ao confirmar o ataque.','attack',closest);
if(!target&&s.morale<4)offer('Aproveite a pausa para tentar recuperar o ânimo da guarnição.','rally');
if(!target&&s.wall<4)offer('Você pode tentar recuperar a resistência da muralha.','repair');
if(!target)offer('Envie soldados pelo túnel para buscar provisões ou sabotar os trabucos.','enter');
if(!target){const danger=s.enemies.filter(p=>p===0).length>=2||[s.wall,s.morale,s.supply].includes(0);if(danger){offer('Sem ações disponíveis, você pode gastar uma provisão para obter uma ação extra e tentar evitar a derrota.','extraSupply')||offer('Sem ações disponíveis, você pode gastar um ponto de moral para obter uma ação extra.','extraMorale');}if(!target){message=danger?'Nenhuma ordem disponível resolve o perigo atual. Encerrar o turno confirmará a derrota.':s.ap===0?'Seus pontos de ação acabaram. Encerre o turno para continuar.':'Não há outras ações disponíveis nesta situação. Encerre o turno para continuar.';label='Encerrar turno →';target=document.getElementById('next');}}
}
document.getElementById('nextStepText').textContent=message;const button=document.getElementById('nextStepButton');button.textContent=label;button.onclick=()=>{if(target&&!target.disabled)target.click();};button.disabled=!target||target.disabled;
};
})();
