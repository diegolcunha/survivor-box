// Exact-sum puzzle with fictional energy points.
class FusePuzzle {
  constructor() {
    this.circuits = [
      { name: 'Iluminação', target: 10, slots: ['f1', 'f2'], state: 'off' },
      { name: 'Ventilação', target: 15, slots: ['f3', 'f4'], state: 'off' },
      { name: 'Bancada', target: 20, slots: ['f5', 'f6'], state: 'off' }
    ];
    this.fuses = [
      { id: 'f1', value: 5 }, { id: 'f2', value: 10, burnt: true },
      { id: 'f3', value: 5, burnt: true }, { id: 'f4', value: 10 },
      { id: 'f5', value: 5 }, { id: 'f6', value: 10 },
      { id: 'f7', value: 5 }, { id: 'f8', value: 5 },
      { id: 'f9', value: 10 }, { id: 'f10', value: 15 }, { id: 'f11', value: 20 }
    ];
  }
  fuse(id) { return this.fuses.find(f => f.id === id); }
  location(id) {
    for (let c = 0; c < this.circuits.length; c++) {
      const s = this.circuits[c].slots.indexOf(id);
      if (s !== -1) return { c, s };
    }
    return null;
  }
  inventory() { return this.fuses.filter(f => !this.location(f.id)); }
  status(c) {
    const circuit = this.circuits[c];
    const fuses = circuit.slots.filter(Boolean).map(id => this.fuse(id));
    const total = fuses.reduce((sum, f) => sum + (f.burnt ? 0 : f.value), 0);
    const broken = fuses.some(f => f.burnt), ready = !broken && total === circuit.target;
    return { total, broken, ready, reason: broken ? 'Fusível queimado' : total > circuit.target ? 'Sobrecarga' : total < circuit.target ? 'Carga insuficiente' : 'Configuração adequada' };
  }
  move(id, destination) {
    if (!this.fuse(id)) return [];
    if (destination && (!Number.isInteger(destination.c) || !Number.isInteger(destination.s) || !this.circuits[destination.c] || destination.s < 0 || destination.s > 1)) return [];
    const source = this.location(id);
    if (source && destination && source.c === destination.c && source.s === destination.s) return [];
    const affected = new Set();
    // A replaced fuse returns to inventory instead of being destroyed.
    if (source) { this.circuits[source.c].slots[source.s] = null; affected.add(source.c); }
    if (destination) { this.circuits[destination.c].slots[destination.s] = id; affected.add(destination.c); }
    for (const c of affected) this.circuits[c].state = 'off';
    return [...affected];
  }
  toggle(c) {
    const circuit = this.circuits[c];
    if (circuit.state === 'tripping') return 'tripping';
    if (circuit.state === 'on') return circuit.state = 'off';
    return circuit.state = this.status(c).ready ? 'on' : 'tripping';
  }
  get won() { return this.circuits.every(c => c.state === 'on'); }
}
