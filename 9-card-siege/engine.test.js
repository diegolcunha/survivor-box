const assert=require('node:assert/strict');const {Siege}=require('./engine.js');
function setup(e='none',roll=6){let g=new Siege(()=> (roll-.5)/6);g.s.phase='actions';g.s.event={e};g.s.ap=10;return g;}
let g=setup();g.s.enemies=[1,2,3];g.action('attack',0);assert.equal(g.s.enemies[0],2);
g=setup('none',3);g.s.enemies[1]=2;g.action('attack',1);assert.equal(g.s.enemies[1],2);
g=setup('none',1);g.s.enemies[0]=1;g.action('water',0);assert.equal(g.s.morale,3);assert.equal(g.allowed('water',0),false);
g=setup('oil',1);g.s.enemies[0]=1;g.action('water',0);assert.equal(g.s.morale,4);assert.equal(g.s.enemies[0],1);
g=setup('gate',4);g.s.enemies[1]=0;g.action('attack',1);assert.equal(g.s.enemies[1],0);
g=setup('volley',4);g.s.enemies[1]=0;g.action('attack',1);assert.equal(g.s.enemies[1],1);
g=setup();g.action('enter');assert.equal(g.allowed('free'),false);g.action('fast');assert.equal(g.s.tunnel,3);g.action('raid');assert.equal(g.s.loot,2);g.action('enter');g.action('fast');assert.equal(g.s.loot,0);assert.equal(g.s.tunnel,0);
g=setup('dark',1);g.s.tunnel=3;g.s.loot=2;g.action('sabotage');assert.equal(g.s.tunnel,0);assert.equal(g.s.morale,3);assert.equal(g.s.loot,0);
g=setup('weather');assert.equal(g.allowed('repair'),false);g.s.tunnel=1;assert.equal(g.allowed('free'),false);
g=setup();g.s.wall=0;g.status('morale',-4);assert.equal(g.s.phase,'lost');
g=setup();g.s.enemies=[0,0,4];g.finish();assert.equal(g.s.phase,'lost');
g=setup();g.s.day=3;g.s.turn=7;g.finish();assert.equal(g.s.phase,'won');assert.equal(g.s.supply,3);
g=setup();g.s.turn=7;g.s.supply=1;g.s.tunnel=2;g.s.loot=1;g.finish();assert.equal(g.s.phase,'draw');assert.equal(g.s.supply,1);assert.equal(g.s.day,2);
g=new Siege(()=>.99);g.s.deck=[0];g.draw();assert.equal(g.s.wall,2);assert.deepEqual(g.s.enemies,[4,4,4]);
g=new Siege(()=>.99);g.s.deck=[6];g.s.day=3;g.s.enemies=[1,0,1];g.draw();assert.equal(g.s.phase,'lost');
console.log('14 cenários de regras passaram.');

