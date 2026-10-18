const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'puzzle.js'), 'utf8');
function create() { return vm.runInNewContext(source + '; new FusePuzzle()'); }
function conserved(p) {
  const ids = [...p.circuits.flatMap(c => c.slots).filter(Boolean), ...p.inventory().map(f => f.id)];
  assert.equal(ids.length, 11); assert.equal(new Set(ids).size, 11);
}
test('initial state: two burnt fuses and one insufficient circuit', () => {
  const p = create();
  assert.equal(p.status(0).reason, 'Fusível queimado');
  assert.equal(p.status(1).reason, 'Fusível queimado');
  assert.equal(p.status(2).reason, 'Carga insuficiente');
  assert.equal(p.toggle(0), 'tripping'); assert.equal(p.won, false); conserved(p);
});
test('overload trips; a burnt fuse blocks even an otherwise exact sum', () => {
  const p = create(); p.move('f11', { c: 0, s: 0 });
  assert.equal(p.status(0).total, 20); assert.equal(p.status(0).ready, false);
  p.move('f2', null); assert.equal(p.status(0).reason, 'Sobrecarga');
  assert.equal(p.toggle(0), 'tripping');
  p.move('f9', { c: 0, s: 0 }); p.move('f2', { c: 0, s: 1 });
  assert.equal(p.status(0).total, 10); assert.equal(p.status(0).ready, false); conserved(p);
});
test('full solution: replacement, removal, exact sums and three active circuits', () => {
  const p = create();
  p.move('f2', null); p.move('f7', { c: 0, s: 1 });
  p.move('f8', { c: 1, s: 0 });
  p.move('f9', { c: 2, s: 0 });
  for (let c = 0; c < 3; c++) { assert.equal(p.status(c).ready, true); assert.equal(p.toggle(c), 'on'); }
  assert.equal(p.won, true); conserved(p);
  p.move('f9', null); assert.equal(p.circuits[2].state, 'off'); assert.equal(p.won, false); conserved(p);
});
test('moving between circuits disables both and returns replaced piece to inventory', () => {
  const p = create(); p.circuits[0].state = p.circuits[2].state = 'on';
  p.move('f1', { c: 2, s: 0 });
  assert.equal(p.circuits[0].slots[0], null); assert.equal(p.circuits[2].slots[0], 'f1');
  assert.equal(p.location('f5'), null); assert.equal(p.circuits[0].state, 'off'); assert.equal(p.circuits[2].state, 'off'); conserved(p);
});
test('one exact-value fuse works; invalid moves cannot lose pieces', () => {
  const p = create(); p.move('f1', null); p.move('f2', null); p.move('f9', { c: 0, s: 0 });
  assert.equal(p.status(0).ready, true);
  const before = JSON.stringify(p); p.move('f9', { c: 99, s: 0 }); p.move('unknown', null);
  assert.equal(JSON.stringify(p), before); conserved(p);
});
test('UI controller: delayed trip, recovery during trip, victory and reset', () => {
  class Element {
    constructor() { this.children = []; this.dataset = {}; this.style = {}; this.handlers = {}; this.classList = { add() {}, remove() {}, toggle() {} }; }
    replaceChildren() { this.children = []; } append(el) { this.children.push(el); }
    addEventListener(type, fn) { this.handlers[type] = fn; } setAttribute() {} remove() {}
  }
  const elements = new Map(), timers = new Map(); let nextTimer = 0;
  const document = { querySelector(selector) { if (!elements.has(selector)) elements.set(selector, new Element()); return elements.get(selector); }, querySelectorAll() { return []; }, createElement() { return new Element(); }, addEventListener() {}, body: new Element() };
  const ctx = vm.createContext({ document, setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); } });
  vm.runInContext(source + '\n' + fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'), ctx);
  const run = code => vm.runInContext(code, ctx);
  run('toggle(0)'); assert.equal(run('puzzle.circuits[0].state'), 'tripping');
  const callback = [...timers.values()][0]; timers.clear(); callback(); assert.equal(run('puzzle.circuits[0].state'), 'off');
  run("toggle(0); move('f7', {c:0,s:1})"); assert.equal(timers.size, 0); assert.equal(run('puzzle.circuits[0].state'), 'off');
  run("move('f8',{c:1,s:0});move('f9',{c:2,s:0});toggle(0);toggle(1);toggle(2)");
  assert.equal(run('puzzle.won'), true); assert.equal(elements.get('#success').hidden, false);
  elements.get('#reset').handlers.click(); assert.equal(run('puzzle.won'), false); assert.equal(run('puzzle.inventory().length'), 5);
  run('toggle(0)'); elements.get('#reset').handlers.click(); assert.equal(timers.size, 0); assert.equal(run('puzzle.circuits[0].state'), 'off');
});
