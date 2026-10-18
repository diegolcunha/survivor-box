const $ = selector => document.querySelector(selector);
let puzzle = new FusePuzzle(), selected = null, drag = null, suppressClick = false;
const tripTimers = new Map();
function feedback(text, type = '') { $('#feedback').textContent = text; $('#feedback').className = `feedback ${type}`; }
function inspect(id) {
  const fuse = puzzle.fuse(id);
  $('#context-title').textContent = fuse.burnt ? 'Fusível queimado' : `Fusível de ${fuse.value} pontos`;
  $('#context-text').textContent = fuse.burnt ? 'O filamento está rompido. Este fusível contribui com zero e impede o circuito de ligar. Retire-o para o inventário e coloque um substituto.' : `Contribui com ${fuse.value} pontos. Combine seu valor com o outro encaixe do circuito até atingir a carga indicada. Um encaixe pode ficar vazio se a soma já for exata.`;
}
function fuseMarkup(fuse) { return `<span class="fuse-visual" aria-hidden="true"></span><span class="fuse-value">${fuse.burnt ? 'QUEIMADO' : fuse.value + ' pts'}</span><span class="fuse-id">${fuse.id.toUpperCase()}${fuse.burnt ? ' · ' + fuse.value + ' pts nominais' : ''}</span>`; }
function selectFuse(id) { if (suppressClick) return; selected = selected === id ? null : id; inspect(id); render(); }
function bindFuse(button, id) {
  button.addEventListener('pointerdown', e => startDrag(e, id, button));
  button.addEventListener('click', () => selectFuse(id));
}
function render() {
  $('#breakers').replaceChildren(); $('#circuits').replaceChildren(); $('#items').replaceChildren();
  puzzle.circuits.forEach((circuit, c) => {
    const letter = 'ABC'[c], status = puzzle.status(c);
    const card = document.createElement('div'); card.className = `breaker-card ${circuit.state}`;
    card.innerHTML = `<span class="circuit-code">CIRCUITO ${letter}</span><strong>${circuit.name}</strong>`;
    const breaker = document.createElement('button'); breaker.type = 'button'; breaker.className = 'breaker';
    breaker.setAttribute('aria-label', `Disjuntor ${letter}: ${circuit.name}`); breaker.setAttribute('aria-pressed', String(circuit.state !== 'off'));
    breaker.disabled = circuit.state === 'tripping';
    breaker.innerHTML = `<i aria-hidden="true"></i><b>${circuit.state === 'on' ? 'ON' : circuit.state === 'tripping' ? 'FALHA' : 'OFF'}</b>`;
    breaker.addEventListener('click', () => toggle(c)); card.append(breaker); $('#breakers').append(card);
    const column = document.createElement('div'); column.className = 'fuse-column';
    column.innerHTML = `<span class="load">${letter} · Carga <b>${circuit.target} pts</b></span>`;
    const sockets = document.createElement('div'); sockets.className = 'sockets';
    circuit.slots.forEach((id, s) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.c = c; button.dataset.s = s;
      const fuse = id && puzzle.fuse(id);
      button.className = `socket ${!fuse ? 'empty' : fuse.burnt ? 'burnt' : ''} ${selected === id && id ? 'selected' : ''}`;
      button.setAttribute('aria-label', `Circuito ${letter}, encaixe ${s + 1}: ${fuse ? fuse.burnt ? 'fusível queimado' : fuse.value + ' pontos' : 'vazio'}`);
      button.innerHTML = fuse ? fuseMarkup(fuse) : 'Encaixe vazio';
      if (fuse) button.addEventListener('pointerdown', e => startDrag(e, id, button));
      button.addEventListener('click', () => {
        if (suppressClick) return;
        if (selected && selected !== id) move(selected, { c, s });
        else if (id) selectFuse(id);
        else feedback('Selecione um fusível no inventário e clique neste encaixe.');
      });
      sockets.append(button);
    });
    column.append(sockets);
    const sum = document.createElement('span'); sum.className = `sum ${status.ready ? 'ready' : status.broken || status.total > circuit.target ? 'bad' : ''}`;
    sum.textContent = `${status.total} / ${circuit.target} pts · ${status.broken ? 'Queimado' : status.ready ? 'Pronto' : status.total > circuit.target ? 'Sobrecarga' : 'Faltam ' + (circuit.target - status.total)}`;
    column.append(sum); $('#circuits').append(column);
  });
  for (const fuse of puzzle.inventory()) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `fuse ${fuse.burnt ? 'burnt' : ''} ${selected === fuse.id ? 'selected' : ''}`;
    button.innerHTML = fuseMarkup(fuse); button.setAttribute('aria-label', `${fuse.id}: ${fuse.burnt ? 'queimado' : fuse.value + ' pontos'}`); button.setAttribute('aria-pressed', String(selected === fuse.id));
    bindFuse(button, fuse.id); $('#items').append(button);
  }
  if (!puzzle.inventory().length) { const empty = document.createElement('span'); empty.className = 'inventory-empty'; empty.textContent = 'Todos os fusíveis estão nos circuitos.'; $('#items').append(empty); }
  const active = puzzle.circuits.filter(c => c.state === 'on').length;
  $('#progress').textContent = `${active} / 3 ativos`; $('#success').hidden = !puzzle.won;
  $('#store').disabled = !selected || !puzzle.location(selected);
}
function move(id, destination) {
  const affected = puzzle.move(id, destination);
  for (const c of affected) { clearTimeout(tripTimers.get(c)); tripTimers.delete(c); }
  selected = null;
  feedback(destination ? `Fusível encaixado no circuito ${'ABC'[destination.c]}. Teste o disjuntor. Uma peça substituída volta ao inventário.` : 'Fusível guardado no inventário.'); render();
}
function toggle(c) {
  if (puzzle.circuits[c].state === 'tripping') return;
  const state = puzzle.toggle(c), circuit = puzzle.circuits[c];
  if (state === 'tripping') {
    const reason = puzzle.status(c).reason;
    feedback(`${circuit.name}: ${reason.toLowerCase()}. O disjuntor está desarmando…`, 'error');
    tripTimers.set(c, setTimeout(() => {
      tripTimers.delete(c); circuit.state = 'off'; render();
      feedback(`${circuit.name}: disjuntor desarmado — ${reason.toLowerCase()}. Reconfigure os fusíveis e tente novamente.`, 'error');
    }, 720));
  } else feedback(state === 'on' ? `${circuit.name}: circuito estável. ${puzzle.won ? 'Os três circuitos estão ativos!' : 'Ative os demais circuitos.'}` : `${circuit.name}: circuito desligado.`, state === 'on' ? 'good' : '');
  render();
}
function inside(x, y, el) { const r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
function startDrag(e, id, button) {
  if (e.button !== 0) return;
  drag = { id, button, x: e.clientX, y: e.clientY, ghost: null };
  button.setPointerCapture?.(e.pointerId);
}
function cancelDrag() { drag?.ghost?.remove(); drag = null; document.querySelectorAll('.drop-highlight').forEach(el => el.classList.remove('drop-highlight')); }
document.addEventListener('pointermove', e => {
  if (!drag) return;
  if (!drag.ghost && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) {
    const fuse = puzzle.fuse(drag.id); drag.ghost = document.createElement('div'); drag.ghost.className = `fuse drag-copy ${fuse.burnt ? 'burnt' : ''}`;
    drag.ghost.innerHTML = fuseMarkup(fuse); drag.ghost.setAttribute('aria-hidden', 'true'); document.body.append(drag.ghost);
  }
  if (!drag.ghost) return;
  drag.ghost.style.left = `${e.clientX}px`; drag.ghost.style.top = `${e.clientY}px`;
  document.querySelectorAll('.socket, #inventory').forEach(el => el.classList.toggle('drop-highlight', inside(e.clientX, e.clientY, el)));
});
document.addEventListener('pointerup', e => {
  if (!drag) return;
  if (drag.ghost) {
    suppressClick = true; setTimeout(() => suppressClick = false, 160);
    const socket = [...document.querySelectorAll('.socket')].find(el => inside(e.clientX, e.clientY, el));
    if (socket) move(drag.id, { c: Number(socket.dataset.c), s: Number(socket.dataset.s) });
    else if (inside(e.clientX, e.clientY, $('#inventory'))) move(drag.id, null);
    else feedback('Solte sobre um encaixe ou no inventário. O fusível voltou à posição anterior.');
  }
  cancelDrag();
});
document.addEventListener('pointercancel', cancelDrag);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { cancelDrag(); selected = null; render(); } });
$('#store').addEventListener('click', () => { if (selected && puzzle.location(selected)) move(selected, null); });
$('#inventory').addEventListener('click', e => { if (!suppressClick && selected && puzzle.location(selected) && !e.target.closest('button')) move(selected, null); });
$('#reset').addEventListener('click', () => {
  cancelDrag(); tripTimers.forEach(clearTimeout); tripTimers.clear(); puzzle = new FusePuzzle(); selected = null;
  $('#context-title').textContent = 'A energia não se sustenta'; $('#context-text').textContent = 'Dois fusíveis queimaram e outros estão no circuito errado. Retire, redistribua e teste os disjuntores para recuperar a oficina.';
  feedback('Inspecione os fusíveis. Depois, teste um disjuntor.'); render();
});
render();
