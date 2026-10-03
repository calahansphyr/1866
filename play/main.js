// 1866: Prove Up — the Frontier chapter, 1866 to 1873.
// Each season is three days of daylight. Walking around is free; the road
// between the claim and town, working the field and doing business all spend
// daylight. Things happen on their own days whether or not you are ready. Every December a letter home grades the year's calls against the
// ten ways the year could have gone.

import { createEngine } from './engine.js';
import { CLAIM, FORTY } from './scenery.js';
import { ART, LOOK } from './art.js';

// ------------------------------------------------------------------ numbers

const K = {
  startCash: 30, startAcres: 8, claimAcres: 48,
  seed: 1.5, yield: 9.5, plowBonus: 1.2, hiredPenalty: 0.85, wage: 30,
  living: 45, winter: 50, hardWinter: 80, hardP: 0.25, droughtP: 0.2,
  tabHalf: Math.pow(1.03, 6) - 1, // 3% a month, six months a season
  jarCost: 4, jarValue: 5, maxJars: 18, wire: 1,
  savingsRate: 0.05, loanAmt: 50, loanRate: 0.10, lateRate: 0.15,
  forty: 120, fortyAcres: 20, mortgage: 150,
  reaperCash: 35, reaperDown: 8, reaperPay: 8, reaperPays: 6,
  stockCost: 30,
};
// Time, in minutes of daylight.
const DAWN = 360, DUSK = 1200, DAYS = 3;
const TIME = { road: 60, sow: 25, sod: 480, sodPlow: 320, cut: 60, cutReaper: 25, shop: 15, wire: 20, talk: 10, amesSpring: 180, amesHarvest: 360 };
const BASE_PRICE = { 1866: 1.30, 1867: 1.45, 1868: 1.20, 1869: 0.95, 1870: 1.00, 1871: 1.15, 1872: 1.10, 1873: 0.70, 1874: 0.85 };
const STOCK = { S1872: 30, H1872: 36, S1873: 44, H1873: 6 };
const FIRST = 1866, LAST = 1873;
const HOME_DOOR = [7.5, 42.6];

const $ = (s) => document.querySelector(s);
const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
const cents = (n) => '$' + n.toFixed(2);
const hours = (m) => { const h = m / 60; return h < 1 ? `${Math.round(m)} minutes` : `${Math.round(h * 2) / 2} hour${h > 1.25 ? 's' : ''}`; };
const clock = (m) => { const h = Math.floor(m / 60), mm = Math.floor(m % 60); return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newWorld(seed) {
  const r = rng(seed);
  const w = { seed, years: {} };
  for (let y = FIRST; y <= LAST + 1; y++) {
    w.years[y] = {
      drought: r() < K.droughtP, bumper: r() < 0.2, hard: r() < K.hardP,
      price: +(BASE_PRICE[y] * (1 + (r() - 0.5) * 0.24)).toFixed(2),
      winters: Array.from({ length: 10 }, () => r() < K.hardP),
    };
  }
  w.years[1872].hard = true; // the winter everyone remembers
  w.years[1866].drought = false; // a fair first year
  w.bankFails = r() < 0.6;
  return w;
}

function newGame(look) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  return {
    v: 2, look, world: newWorld(seed),
    year: FIRST, season: 'spring', day: 1, minute: DAWN, phase: 'day',
    cash: K.startCash, tab: 0, jars: 0, acres: K.startAcres, plow: false, reaper: null,
    seedFor: 0, sown: 0, sodMin: 0, brokeThisYear: 0, ripe: 0, cut: 0, buPerAcre: 0, grain: 0,
    savings: 0, frozen: 0, loan: null, mortgage: null, stock: 0, titled: false, boughtForty: false,
    hired: false, wired: false, interestPaid: 0, bankClosed: false,
    helpedAmes: 0, amesOwes: false, amesHelpDue: false, askedRuth: 0, lateMarks: 0, onTime: 0, wires: 0,
    almanac: {}, decisions: [], letters: [], withdrewIn73: false, seen: {}, today: {}, bookLog: [],
  };
}

let S = null;
let engine = null;
let near = null;
let busy = false; // a scene change or a visitor is under way

// ------------------------------------------------------------------ helpers

function save() { try { localStorage.setItem('prove-up-2', JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() { try { const t = localStorage.getItem('prove-up-2'); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function wipe() { try { localStorage.removeItem('prove-up-2'); } catch (e) { /* storage blocked */ } }

function Y() { return S.world.years[S.year]; }
const seasonName = () => (S.season === 'spring' ? 'Spring' : 'Harvest');
function chicago() { return S.season === 'spring' ? +(Y().price * 0.97).toFixed(2) : Y().price; }
function pruittPays() { return +(chicago() * (S.wired ? 0.95 : 0.8)).toFixed(2); }
function stockValue() { return S.stock ? (STOCK[(S.season === 'spring' ? 'S' : 'H') + S.year] ?? (S.year > 1873 ? 6 : 30)) * S.stock : 0; }
function ownAcres() { return S.acres - (S.boughtForty ? K.fortyAcres : 0); }
function netWorth() {
  return S.cash + S.jars * K.jarValue + S.savings + S.frozen + S.grain * chicago() * 0.9 + stockValue()
    + S.acres * 8 + (S.titled ? 160 * 2 : 0) + (S.plow ? 15 : 0) + (S.reaper ? 25 : 0)
    - S.tab - (S.loan ? S.loan.due : 0) - (S.mortgage ? S.mortgage.amt : 0) - (S.reaper && S.reaper.left ? S.reaper.left * K.reaperPay : 0);
}
function spend(amt, lines, label = 'Goods') {
  const fromCash = Math.min(S.cash, amt);
  S.cash -= fromCash;
  const onTab = amt - fromCash;
  S.tab += onTab;
  if (onTab > 0.5) bookLine(label.split(/[,(]/)[0].trim(), onTab);
  lines && lines.push([onTab > 0.5 ? `${label} (${money(onTab)} on the book)` : label, -amt]);
  return onTab;
}
// Pruitt's account book: what went on it, what came off, and the interest in red.
function bookLine(t, amt, kind) {
  S.bookLog = S.bookLog || [];
  S.bookLog.push({ t, a: +amt.toFixed(2), red: kind === 'interest', paid: kind === 'paid', y: S.year, s: S.season });
  if (S.bookLog.length > 40) S.bookLog.splice(0, S.bookLog.length - 40);
}
function unlock(key) {
  if (S.almanac[key]) return;
  S.almanac[key] = { year: S.year, season: seasonName() };
  toast(`New in the Almanac: ${ALMANAC[key].title}`);
}
function decide(d) { S.decisions.push({ year: S.year, ...d }); }
const left = () => Math.max(0, DUSK - S.minute);
const sowRate = () => TIME.sow;
const sodRate = () => (S.plow ? TIME.sodPlow : TIME.sod);
const cutRate = () => (S.reaper ? TIME.cutReaper : TIME.cut);

let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2800);
}
let bannerT = 0;
function banner(title, lines) {
  const b = $('#banner');
  b.innerHTML = `<div class="d">${title}</div>${lines.map((l) => `<div class="e">${l}</div>`).join('')}`;
  b.hidden = false;
  clearTimeout(bannerT); bannerT = setTimeout(() => { b.hidden = true; }, 5200);
}
$('#banner').addEventListener('click', () => { $('#banner').hidden = true; });

const chev = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2 L8 6 L4 10" fill="none" stroke="#8A3A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0;margin-top:4px"><path d="M2 7.5 L5.5 11 L12 3" fill="none" stroke="#3E6B2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ring = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0;margin-top:4px"><circle cx="7" cy="7" r="5" fill="none" stroke="#5A4A3A" stroke-width="1.6" stroke-dasharray="2.5 2"/></svg>';
const jarSvg = (full) => `<svg width="13" height="17" viewBox="0 0 13 17" aria-hidden="true"><rect x="1.5" y="4" width="10" height="12" rx="2" fill="${full ? '#D99A4E' : 'none'}" stroke="#2A2420" stroke-width="1.3" ${full ? '' : 'stroke-dasharray="2 2"'}/><rect x="3" y="1" width="7" height="3" fill="${full ? '#8A6A4A' : 'none'}" stroke="#2A2420" stroke-width="1.1"/></svg>`;
const moon = '<svg width="54" height="54" viewBox="0 0 54 54" aria-hidden="true"><path d="M36 8 A20 20 0 1 0 46 38 A16 16 0 1 1 36 8 Z" fill="#F2E6CC" stroke="#E6C77A" stroke-width="1.5"/><circle cx="10" cy="12" r="1.2" fill="#F2E6CC"/><circle cx="46" cy="16" r="1" fill="#F2E6CC"/><circle cx="8" cy="40" r="1" fill="#F2E6CC"/></svg>';

const playerKey = () => `${S.look.skin}-${S.look.hair}`;
function portrait(who) { return `<div class="portrait">${who === 'player' ? ART.player[playerKey()] : ART.npc[who]}</div>`; }
const NPC = {
  ruth: ['Grandma Ruth', "the family elder, saw the Panic of '57"],
  pruitt: ['Mr. Pruitt', 'keeps the general store'],
  cole: ['Mr. Cole', 'runs the bank'],
  clerk: ['Mr. Finch', 'the telegraph clerk'],
  brandt: ['Herr Brandt', 'neighbor, reads the German papers'],
  ames: ['Widow Ames', 'neighbor across the creek'],
  drummer: ['Mr. Valentine', 'a traveling salesman'],
  foreman: ['Mr. Doyle', 'foreman, Kansas Pacific crew'],
};
function speak(who, text) {
  const head = ART.npc[who] ? portrait(who) : '';
  return `<div class="speaker">${head}<div><div class="who">${NPC[who][0]}</div><div class="role">${NPC[who][1]}</div><div class="say">${text}</div></div></div>`;
}
function choice(act, label, cost = '', disabled = false) {
  return `<button class="choice" data-act="${act}" ${disabled ? 'disabled' : ''}>${chev}<span>${label}</span>${cost ? `<span class="cost">${cost}</span>` : ''}</button>`;
}
const leave = (label = 'Tip your hat and walk on') => `<button class="walk" data-act="close">${label}</button>`;

// ------------------------------------------------------------------ sheets

const handlers = {};
let onClose = null;
function sheet(html, opts = {}) {
  $('#sheetIn').innerHTML = html;
  $('#sheet').classList.toggle('full', !!opts.full);
  $('#sheet').hidden = false; $('#veil').hidden = !!opts.full;
  engine && engine.enable(false);
  $('#sheet').scrollTop = 0;
  const f = $('#sheet').querySelector('button:not([disabled]), input');
  f && f.focus({ preventScroll: true });
}
function closeSheet() {
  $('#sheet').hidden = true; $('#veil').hidden = true;
  if (S && S.phase === 'day' && !busy) engine.enable(true);
  render();
  const cb = onClose; onClose = null;
  if (cb) cb(); else if (S && S.phase === 'day' && S.minute >= DUSK) endDay('dusk');
}
$('#sheet').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const [name, arg] = b.dataset.act.split(':');
  if (name === 'close') return closeSheet();
  handlers[name] && handlers[name](arg, b);
});
$('#veil').addEventListener('click', () => { if (S && S.phase === 'day') closeSheet(); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden && S && S.phase === 'day') closeSheet();
  if ((e.key === 'Enter' || e.key === ' ') && $('#sheet').hidden && near && S && S.phase === 'day' && !busy && document.activeElement === document.body) { e.preventDefault(); arriveAt(near); }
});

// Time passes for what you do, never for walking around.
function pass(min) {
  S.minute = Math.min(DUSK, S.minute + min);
  if (S.year === 1873 && S.season === 'harvest' && S.day === 3 && S.minute >= 720 && S.world.bankFails && !S.bankClosed) closeBank();
  if (S.phase === 'day' && S.minute >= DUSK - 60 && S.minute < DUSK && !S.today.warned) { S.today.warned = true; toast('The sun is low. An hour of light left.'); }
  if (engine.scene !== 'town') engine.refreshRoom();
  renderClock(); updateDock();
}

// ------------------------------------------------------------------ header

function renderClock() {
  engine.setTime(S.minute);
  $('#clock').textContent = clock(S.minute);
  const f = 1 - (S.minute - DAWN) / (DUSK - DAWN);
  $('#sunleft').style.width = `${Math.max(0, Math.min(1, 1 - f)) * 100}%`;
  $('#sun').classList.toggle('late', S.minute >= DUSK - 120);
  $('#sun').title = `${hours(left())} of daylight left`;
}
function render() {
  if (!S) return;
  $('#family').textContent = `The ${S.look.family} Family`;
  $('#when').textContent = `${seasonName()} ${S.year} · Day ${S.day} of ${DAYS}`;
  $('#cash').textContent = money(S.cash);
  $('#tabv').textContent = `Book ${money(S.tab)}`;
  $('#tab').classList.toggle('owed', S.tab > 0.5);
  $('#jars').innerHTML = `${jarSvg(S.jars > 0)}<span>${S.jars}</span>`;
  $('#jars').title = `${S.jars} jars in the cellar, worth ${money(S.jars * K.jarValue)} of winter food`;
  renderClock();
  updateField();
  updateDock();
}

// The field shows exactly what you own and what state it's in.
function updateField() {
  const own = ownAcres();
  const mine = CLAIM.slice(0, own).concat(S.boughtForty ? FORTY : []);
  const tiles = [];
  const stateFor = (i) => {
    if (S.season === 'spring') return i < S.sown ? 'sown' : 'broken';
    return i < S.cut ? 'cut' : i < S.ripe ? 'ripe' : 'broken';
  };
  mine.forEach(([x, y], i) => tiles.push({ x, y, state: stateFor(i), mine: true }));
  CLAIM.slice(own).forEach(([x, y]) => tiles.push({ x, y, state: 'prairie', mine: true }));
  if (!S.boughtForty) FORTY.forEach(([x, y]) => tiles.push({ x, y, state: S.season === 'spring' ? 'sown' : 'ripe', mine: false }));
  const key = JSON.stringify(tiles);
  if (key !== updateField.last) { updateField.last = key; engine.setField(tiles); }
  engine.setSeason(S.season);
}

// The one next thing to do, and where it is. It points at places, never at
// choices: it says go sell the wheat, not where or when to sell it.
function nextGoal() {
  const sp = S.season === 'spring';
  const own = ownAcres();
  const mine = CLAIM.slice(0, own).concat(S.boughtForty ? FORTY : []);
  const tile = (p) => (p ? `${p[0]},${p[1]}` : '');
  const acres = (n) => `${n} acre${n === 1 ? '' : 's'}`;
  const bed = (text) => ({ text, kind: 'thing', id: 'bed', scene: 'home', door: 'home' });
  const pruitt = (text, here) => ({ text: engine.scene === 'store' ? here : text, kind: 'npc', id: 'pruitt', scene: 'store', door: 'store' });
  let g;
  if (S.minute >= DUSK - 90) g = bed('Head home before dark');
  else if (sp) {
    const seeded = Math.min(S.acres, S.seedFor), unseeded = S.acres - S.seedFor;
    if (S.sown < seeded) g = { text: `Sow ${acres(seeded - S.sown)} of wheat on your claim`, kind: 'field', id: tile(mine[S.sown]), scene: 'town' };
    else if (unseeded > 0 && (S.seedFor === 0 || unseeded >= 3)) g = pruitt(`Buy seed for ${acres(unseeded)} at Pruitt's store`, `Buy seed for ${acres(unseeded)} from Mr. Pruitt`);
    else if (own < K.claimAcres) g = { text: 'Break more prairie while the light lasts', kind: 'field', id: tile(CLAIM[own]), scene: 'town' };
    else g = bed('The wheat is in. Rest until the harvest');
  } else if (S.ripe > S.cut) g = { text: `Cut your wheat: ${acres(S.ripe - S.cut)} standing`, kind: 'field', id: tile(mine[S.cut]), scene: 'town' };
  else if (S.grain > 0) g = pruitt(`Sell your ${Math.round(S.grain)} bushels in town`, `Sell your ${Math.round(S.grain)} bushels`);
  else g = bed('Get ready for winter, then turn in');
  // From where you stand: out of this room first, or over to the right building.
  if (g.scene !== engine.scene) return engine.scene !== 'town' ? { ...g, kind: 'exit', id: 'exit' } : { ...g, kind: 'door', id: g.door };
  return g;
}

function updateDock() {
  const act = $('#act'), hint = $('#hint'), gl = $('#goal');
  if (!S || S.phase !== 'day') return;
  const g = nextGoal();
  engine.setGoal(g);
  $('#goalText').textContent = g.text;
  if (near) {
    // Standing at something: its action, plus the next step if this isn't it.
    const atGoal = near.kind === g.kind && (g.kind === 'exit' || near.id === g.id || (g.kind === 'field' && near.kind === 'field'));
    act.hidden = false; act.textContent = labelFor(near);
    gl.hidden = atGoal; hint.hidden = !atGoal;
    hint.textContent = hintFor(near);
    return;
  }
  act.hidden = true; gl.hidden = false;
  const tip = engine.scene === 'town' ? (S.seen.walked ? '' : 'Tap where to go, or hold and drag.') : (S.seen.looked ? '' : 'Tap anyone to talk, or anything to look at it.');
  hint.hidden = !tip; hint.textContent = tip;
}
$('#goal').addEventListener('click', () => {
  if (busy || !S || S.phase !== 'day' || !$('#sheet').hidden) return;
  if (!engine.walkToGoal()) toast('Head outside first.');
});
function labelFor(t) {
  if (t.kind === 'door') return t.enter ? `Go into ${t.name === 'Home' ? 'the house' : t.name.replace(/^The /, 'the ')}` : `Knock at ${t.name.replace(/^The /, 'the ')}`;
  if (t.kind === 'npc') return NPC[t.id] ? `Talk to ${NPC[t.id][0]}` : 'Say good day';
  if (t.kind === 'field') return 'Work the field';
  if (t.kind === 'exit') return 'Go back outside';
  return 'Look';
}
function hintFor(t) {
  if (t.kind === 'field') return S.season === 'spring' ? 'Sow the wheat or break new sod.' : 'Cut the wheat before it shatters.';
  if (t.kind === 'door' && t.id === 'home') return 'Grandma Ruth is by the stove. Your bed is inside.';
  return `${clock(S.minute)}. ${hours(left())} of daylight left.`;
}
$('#act').addEventListener('click', () => near && arriveAt(near));

// ------------------------------------------------------------------ walking and arriving

function arriveAt(t) {
  if (busy || !S || S.phase !== 'day') return;
  if (t.kind === 'door') return enterDoor(t);
  if (t.kind === 'exit') return leaveRoom();
  if (t.kind === 'npc') return talk(t.id);
  if (t.kind === 'field') return openField();
  if (t.kind === 'thing') return look(t.id);
}

const DOOR_OUT = { store: [10.5, 13.6], bank: [17.5, 13.6], wire: [3.5, 13.6], home: HOME_DOOR };
function enterDoor(t) {
  if (!t.enter) {
    const say = {
      saloon: 'The saloon is loud even at this hour. Not today.',
      church: 'The church is quiet on a weekday.',
      barn: "Brandt's barn. His team is out in the field.",
      brandt: 'Herr Brandt is out by his fence, not at home.',
      ames: 'Widow Ames is out in her garden.',
    }[t.id];
    return toast(say || 'Nobody answers.');
  }
  if (t.enter === 'bank' && S.bankClosed) {
    sheet(`<div class="h">The bank is shut</div><div class="say">A paper is nailed to the door: <i>SUSPENDED. This bank has closed its doors until further notice.</i> A crowd mutters on the boardwalk.</div>${leave('Walk on')}`);
    return;
  }
  busy = true; engine.enable(false);
  engine.go(t.enter, [4.5, 7.7], () => { busy = false; engine.enable(true); render(); });
}
function leaveRoom() {
  const from = engine.scene;
  busy = true; engine.enable(false);
  engine.go('town', DOOR_OUT[from], () => { busy = false; engine.enable(true); render(); });
}

function talk(id) {
  ({ ruth: openRuth, pruitt: openStore, cole: openBank, clerk: openWire, brandt: openBrandt, ames: openAmes, drummer: openDrummer, foreman: openForeman, folk1: folk, folk2: folk, folk3: folk, folk4: folk }[id] || folk)(id);
}

// Townsfolk talk about what the town is talking about.
function folk(id) {
  const lines = {
    1866: ['"They say the railroad will reach Abilene by summer next."', '"Pruitt will carry anybody. That book of his never forgets, though."'],
    1867: ['"Cattle drives coming up from Texas now. Prices are up all over town."', '"My husband swears by reading the wire before he sells."'],
    1868: ['"A fellow sold my cousin a reaper on time. He\'s still paying."', '"Wheat\'s down from last year."'],
    1869: ['"Brandt\'s selling out, I hear. Nebraska."', '"Grasshoppers in the next county. Not here yet."'],
    1870: ['"Cole pays five percent. My money sleeps better in his vault."', '"The cattle trade is good for the store, not for us."'],
    1871: ['"Five years on the claim and it\'s yours. Then the bank will talk to you."', '"Mortgage the place? My father lost a farm that way."'],
    1872: ['"Valentine says the Northern Pacific will double. Pruitt bought two certificates himself."', '"Everyone\'s buying that railroad paper."'],
    1873: ['"Something\'s wrong back East. The wire\'s been busy all week."', '"Cole says the bank is sound. He says it a lot."'],
  }[S.year];
  const r = rng(S.world.seed + S.year * 31 + S.day * 7 + id.charCodeAt(4))();
  sheet(`<div class="say">${lines[Math.floor(r * lines.length)]}</div>${leave('Nod and walk on')}`);
}

function look(id) {
  S.seen.looked = true;
  const say = (t, note = '') => sheet(`<div class="say">${t}</div>${note ? `<div class="note">${note}</div>` : ''}${leave('Back')}`);
  const lines = {
    shelves: 'Coffee, flour, lamp oil, calico and boots. Most families out here buy all of it on the book and settle up after the harvest.',
    tools: 'Grain cradles, forks and shovels. With a cradle, one man cuts about an acre an hour.',
    stove: 'The stove is cold until October. In winter half the town sits around it and argues about the railroad.',
    checkers: 'A game left half finished on the cracker barrel. Somebody is two kings ahead.',
    barrels: 'Pickles in one barrel, crackers in the other. The crackers are a penny each.',
    slips: 'A stand of deposit slips and a pen on a chain.',
    pigeonholes: 'Telegrams waiting for people who haven\'t come to town. One has been here since March.',
    batteries: 'Glass jars of bluestone and zinc. They push the current down the line to Kansas City and on to Chicago.',
    key: 'Finch\'s key and sounder. Chicago is days away by wagon and rail, and a minute away by wire.',
    blanks: 'Yellow telegram blanks. You pay by the word, so nobody wastes one.',
    bible: 'The family Bible. Births, marriages and deaths are written inside the cover, back to 1790.',
    trunk: 'The trunk the family brought west. Everything you owned fit inside it.',
  };
  if (lines[id]) return say(lines[id]);
  if (id === 'book') {
    const log = (S.bookLog || []).slice(-12);
    const rows = log.map((e) => `<div class="l ${e.red ? 'int' : e.paid ? 'paid' : ''}"><span>${e.t}</span><b>${e.paid ? '-' : ''}${cents(e.a)}</b></div>`).join('');
    sheet(`<div class="book">
        <div class="bh"><span>Pruitt's Goods</span><span>${S.look.family}</span></div>
        ${rows || '<div class="l"><span>Nothing written yet.</span></div>'}
        <div class="l tot"><span>Owing</span><b>${cents(S.tab)}</b></div>
      </div>
      <div class="note">Pruitt adds 3% a month to whatever is owing. The red lines are interest.</div>${leave('Back')}`);
    unlock('interest');
  } else if (id === 'seed') {
    say(`Sacks of seed wheat, ${cents(K.seed)} an acre's worth. One acre of broken sod takes one acre of seed.`);
  } else if (id === 'preserves') {
    say(`Mrs. Pruitt's preserves, ${money(K.jarCost)} a jar. In February, when there is nothing to buy, each one is about ${money(K.jarValue)} of food.`, 'Pruitt does not put preserves on the book.');
  } else if (id === 'plow') {
    say(S.plow ? 'Yours is out on the claim. Pruitt has another one on order.' : `A steel plow, ${money(20)} cash. Prairie sod sticks to an iron plow; this one turns it clean and breaks an acre about a third faster.`, S.plow ? '' : 'Pruitt does not sell tools on the book.');
  } else if (id === 'reaper') {
    if (S.year < 1868 || S.reaper) say(S.reaper ? 'Kegs of nails. Your reaper is out on the claim.' : 'Kegs of nails, tenpenny and twentypenny.');
    else say(`A McCormick reaper, ${money(K.reaperCash)} cash. A horse pulls it, and it cuts an acre in less than half the time a cradle takes.`, 'Pruitt does not sell tools on the book.');
  } else if (id === 'vault') {
    say(S.savings > 0 ? `Your passbook says ${money(S.savings)} is inside, earning 5% a year.` : 'A great iron door. Nothing of yours is behind it.', "A bank lends out most of what's in the vault. That's how it pays you interest.");
    unlock('saving');
  } else if (id === 'notice') {
    say('"FIVE PER CENT PAID ON DEPOSITS. Loans on crops and land. J. Cole, President."');
  } else if (id === 'bankclock') {
    say(`The bank clock says ${clock(S.minute)}. Mr. Cole keeps it two minutes fast.`);
  } else if (id === 'board') {
    say(S.wired ? `The chalk says Chicago wheat is <b>${cents(chicago())}</b> today.` : 'The board is blank. Finch writes the Chicago price on it for customers who pay to read the wire.');
  } else if (id === 'calendar') {
    const t = S.tab, by = (m) => cents(t * Math.pow(1.03, m));
    if (t > 1) {
      sheet(`<div class="say">Ruth's calendar for ${S.year}. Down the margin, in pencil, she has worked out what Pruitt's book will say if nobody pays it.</div>
        <div class="ledger">${[['Now', cents(t)], ['3 months', by(3)], ['6 months', by(6)], ['9 months', by(9)]].map(([k, v], i) => `<div class="l"><span>${k}</span><b class="${i ? 'neg' : ''}">${v}</b></div>`).join('')}</div>${leave('Back')}`);
      unlock('interest');
    } else say(`Ruth's calendar for ${S.year}. The margin is blank. There is nothing on the book to add up.`);
  } else if (id === 'jars') {
    sheet(`<div class="h">The cellar shelf</div><div class="say">${S.jars} jar${S.jars === 1 ? '' : 's'} put up, about ${money(S.jars * K.jarValue)} of winter food. An ordinary winter takes ${money(K.winter)} of food and fuel. A hard one takes ${money(K.hardWinter)}.</div>${leave('Back')}`);
    unlock('buffer');
  } else if (id === 'almanac') handlers.almanac();
  else if (id === 'bed') openBed();
}

// ------------------------------------------------------------------ Grandma Ruth

function ruthQuestion() {
  if (S.year === 1873 && S.season === 'harvest') return { q: 'When everyone runs to the bank at the same time, who gets paid, and who gets a closed door?', a: 'bankrun' };
  if (S.season === 'spring' && S.seedFor < S.acres && S.sown < S.acres) return { q: 'What goes in the ground this spring, and what pays for the seed?', a: null };
  if (S.tab > 1) {
    const t = S.tab, by = (m) => cents(t * Math.pow(1.03, m));
    return { q: 'Pruitt will write it on his slate, sure. Now you tell me: what does that slate say by January if the wheat comes in late?', cal: [['Now', cents(t)], ['3 months', by(3)], ['6 months', by(6)], ['9 months', by(9)]], a: 'interest' };
  }
  if (S.season === 'harvest') {
    const standing = S.ripe - S.cut;
    const can = Math.floor(((DAYS - S.day) * (DUSK - DAWN) + left()) / cutRate());
    if (standing > can) return { q: `${standing} acres are standing. Count the daylight you have left. How many can you cut before the heads shatter, and what will you do about the rest?`, a: 'sod' };
    if (S.jars * K.jarValue + S.cash < K.hardWinter) return { q: `If this winter is like the one in '56, what will you eat in February? Count it out: a hard winter takes ${money(K.hardWinter)}.`, a: 'buffer' };
    if (!S.wired && S.grain + standing > 0) return { q: 'Do you know what wheat fetches in Chicago, or only what Mr. Pruitt says it fetches?', a: 'price' };
  }
  if (S.loan) return { q: `If the harvest fails, who still owes Mr. Cole ${money(S.loan.due)}?`, a: 'leverage' };
  if (S.stock) return { q: 'That paper from the salesman. What is under it besides his word?', a: 'hype' };
  if (S.season === 'spring' && ownAcres() < K.claimAcres) return { q: 'A day breaking sod pays nothing this year. What does it pay in 1873?', a: 'sod' };
  return { q: 'What would you do with ten dollars you did not need this year?', a: 'saving' };
}
function openRuth() {
  const q = ruthQuestion();
  if (!S.today.askedRuth) { S.today.askedRuth = true; S.askedRuth++; }
  if (q.a) unlock(q.a);
  const cal = q.cal ? `<div class="ledger" aria-label="Pencil sums on the calendar">${q.cal.map(([k, v], i) => `<div class="l"><span>${k}</span><b class="${i ? 'neg' : ''}">${v}</b></div>`).join('')}<div class="note">Pruitt charges 3% a month on the book.</div></div>` : '';
  sheet(`${speak('ruth', `"${q.q}"`)}${cal}
    <div class="choices">${choice('almanac', 'Open the Almanac')}${choice('restart', 'Start a new family')}</div>
    ${leave('Thank her')}
    <div class="note">Talking to Ruth takes no time. She never tells you what to do.</div>`);
  save();
}
handlers.restart = () => {
  sheet(`<div class="h">Start over?</div><div class="say">This ends the ${S.look.family} family's run and starts a new one in the spring of 1866.</div>
    <div class="choices">${choice('confirmRestart', 'Yes, start a new family')}</div>${leave('Keep playing')}`);
};
handlers.confirmRestart = () => { wipe(); location.reload(); };

function openBed() {
  const late = S.day < DAYS;
  sheet(`<div class="h">Turn in?</div>
    <div class="say">${hours(left())} of daylight left today.${S.season === 'spring' && S.sown < S.acres ? ` ${S.acres - S.sown} acres are not sown yet.` : ''}${S.season === 'harvest' && S.ripe > S.cut ? ` ${S.ripe - S.cut} acres are still standing.` : ''}</div>
    <div class="choices">
      ${choice('sleep', 'Sleep until morning')}
      ${late ? choice('sleepSeason', S.season === 'spring' ? 'Rest until the harvest' : 'Rest until winter') : ''}
    </div>${leave('Not yet')}`);
}
handlers.sleep = () => { onClose = () => endDay('bed'); closeSheet(); };
handlers.sleepSeason = () => { onClose = () => { S.day = DAYS; endDay('bed'); }; closeSheet(); };

// ------------------------------------------------------------------ the field

function openField() {
  const bits = [];
  if (S.season === 'spring') {
    const unsown = S.acres - S.sown;
    const seeded = Math.max(0, S.seedFor - S.sown);
    bits.push(`<div class="h">Your claim</div><div class="say">${S.acres} acres broken${S.boughtForty ? ', counting Brandt\'s old forty' : ''}. ${S.sown} sown so far.</div>`);
    const c = [];
    if (unsown > 0 && seeded > 0) {
      const n = Math.min(unsown, seeded);
      c.push(choice('sow', `Sow ${n} acre${n === 1 ? '' : 's'} of wheat`, hours(n * sowRate())));
    }
    if (unsown > 0 && seeded <= 0) c.push(`<div class="note">${unsown} acres are ready, but you have no seed for them. Pruitt sells it in town.</div>`);
    if (ownAcres() < K.claimAcres) {
      const until = Math.floor(left() / sodRate() * 10) / 10;
      c.push(choice('sod:180', 'Break new sod for three hours', hours(Math.min(180, left()))));
      c.push(choice('sod:all', 'Break sod until dark', until >= 1 ? `about ${Math.floor(until)} acre${until >= 2 ? 's' : ''}` : hours(left())));
      if (S.sodMin > 0) c.push(`<div class="note">The next acre is ${Math.round((S.sodMin / sodRate()) * 100)}% broken.</div>`);
    }
    bits.push(`<div class="choices">${c.join('')}</div>`);
    bits.push(`<div class="note">${S.plow ? 'The steel plow' : 'The old iron plow'} breaks an acre of prairie in about ${hours(sodRate())}. Sod broken now is sown every year after.</div>`);
  } else {
    const standing = S.ripe - S.cut;
    bits.push(`<div class="h">Your claim</div><div class="say">${S.ripe ? `${S.cut} of ${S.ripe} acres cut and shocked. ${S.grain ? `${Math.round(S.grain)} bushels in the crib.` : ''}` : 'Nothing was sown this year. The field is bare.'}</div>`);
    if (standing > 0) {
      const can = Math.floor(left() / cutRate());
      bits.push(`<div class="choices">
        ${choice('cut:180', 'Cut and bind for three hours', `${Math.min(standing, Math.floor(Math.min(180, left()) / cutRate()))} acres`)}
        ${choice('cut:all', 'Cut until dark', `${Math.min(standing, can)} acres`)}
      </div>`);
      bits.push(`<div class="note">${S.reaper ? 'With the reaper' : 'With a cradle scythe'}, an acre takes about ${hours(cutRate())}. After day ${DAYS}, the heads start to shatter and the grain falls in the dirt.</div>`);
    }
  }
  sheet(bits.join('') + leave('Leave it for now'));
}
// Work happens in a fade so the time it takes is felt.
function work(minutes, fn, note) {
  const m = Math.min(minutes, left());
  if (m <= 0) return toast('It is too dark to work.');
  onClose = () => {
    busy = true; engine.enable(false);
    engine.blackout((resume) => {
      $('#fadeNote').textContent = `${note || 'Working'} · ${hours(m)}`;
      pass(m); fn(m); save(); render();
      setTimeout(() => {
        $('#fadeNote').textContent = '';
        resume(); busy = false;
        if (S.minute >= DUSK) endDay('dusk'); else engine.enable(true);
      }, 650);
    });
  };
  closeSheet();
}
handlers.sow = () => {
  const n = Math.min(S.acres - S.sown, S.seedFor - S.sown);
  work(n * sowRate(), (m) => {
    const did = Math.min(n, Math.floor(m / sowRate() + 1e-6));
    S.sown += did; S.today.sown = (S.today.sown || 0) + did;
    toast(did ? `Sowed ${did} acre${did === 1 ? '' : 's'}. ${S.acres - S.sown ? `${S.acres - S.sown} still bare.` : 'The whole field is in.'}` : 'Not enough light left to sow an acre.');
  }, 'Sowing');
};
handlers.sod = (how) => {
  const m = how === 'all' ? left() : 180;
  work(m, (spent) => {
    S.sodMin += spent; S.today.sodWork = true;
    let n = 0;
    while (S.sodMin >= sodRate() && ownAcres() < K.claimAcres) { S.sodMin -= sodRate(); S.acres++; n++; }
    S.brokeThisYear += n; S.today.broke = (S.today.broke || 0) + n;
    unlock('sod');
    toast(n ? `Broke ${n} acre${n === 1 ? '' : 's'} of prairie. ${S.acres} acres in all.` : 'The sod is tough. The next acre is coming along.');
  }, 'Breaking sod');
};
handlers.cut = (how) => {
  const standing = S.ripe - S.cut;
  const m = how === 'all' ? Math.min(left(), standing * cutRate()) : Math.min(180, standing * cutRate());
  work(m, (spent) => {
    const n = Math.min(standing, Math.floor(spent / cutRate() + 1e-6));
    S.cut += n; S.grain += n * S.buPerAcre; S.today.cut = (S.today.cut || 0) + n;
    toast(`Cut ${n} acre${n === 1 ? '' : 's'}: ${Math.round(n * S.buPerAcre)} bushels. ${S.ripe - S.cut ? `${S.ripe - S.cut} acres standing.` : 'The harvest is in.'}`);
  }, 'Cutting wheat');
};

// ------------------------------------------------------------------ Pruitt's store

function openStore() {
  const bits = [];
  const extra = S.acres - S.seedFor;
  if (S.season === 'spring') {
    const cost = extra * K.seed;
    const said = S.tab > 1 ? `"Your family's on my slate for ${money(S.tab)}. Seed's ${cents(K.seed)} an acre. Pay me now or I'll write it down, no trouble at all."` : `"Seed wheat's ${cents(K.seed)} an acre. Cash, or I'll put it on the book. No trouble at all."`;
    bits.push(speak('pruitt', said));
    if (extra > 0) {
      bits.push(`<div class="choices">
        ${choice('seed:cash', `Seed for ${extra} acre${extra === 1 ? '' : 's'}, pay cash`, money(cost), S.cash < cost)}
        ${choice('seed:book', `Seed for ${extra} acre${extra === 1 ? '' : 's'}, put it on the book`, money(cost))}
      </div>`);
    } else bits.push(`<div class="note">You have seed for all ${S.acres} acres.</div>`);
    const tools = [];
    if (!S.plow) tools.push(choice('plow', 'A steel plow. Breaks sod a third faster', money(20), S.cash < 20));
    if (!S.reaper && S.year >= 1868) tools.push(choice('reaper', 'A McCormick reaper. Cuts wheat in less than half the time', money(K.reaperCash), S.cash < K.reaperCash));
    if (tools.length) bits.push(`<div class="choices">${tools.join('')}</div><div class="note">Pruitt doesn't sell tools on the book.</div>`);
  } else {
    const p = pruittPays();
    const said = S.grain > 0 ? (S.wired ? `"Chicago's at ${cents(chicago())}, you say? Well. I can do ${cents(p)} a bushel."` : `"Wheat's soft this year. ${cents(p)} a bushel is a fair price, I'd say."`) : '"Nothing to sell yet? Then let me show you the preserves."';
    bits.push(speak('pruitt', said));
    const c = [];
    if (S.grain > 0) {
      c.push(choice('sell', `Sell all ${Math.round(S.grain)} bushels`, `${cents(p)}/bu`));
      c.push('<div class="note">Or keep it in the crib and sell in the spring. It might fetch more, or less, and some spoils.</div>');
    }
    c.push(choice('jar:1', `Put up a jar for winter, worth ${money(K.jarValue)} of food`, money(K.jarCost), S.jars >= K.maxJars || S.cash < K.jarCost));
    c.push(choice('jar:5', 'Put up five jars', money(K.jarCost * 5), S.jars + 5 > K.maxJars || S.cash < K.jarCost * 5));
    bits.push(`<div class="choices">${c.join('')}</div>`);
  }
  if (S.tab > 0.5) bits.push(`<div class="choices">${choice('paytab', `Pay down the book (${money(S.tab)})`, money(Math.min(S.cash, S.tab)), S.cash < 1)}</div>`);
  if (S.season === 'spring' && S.grain > 0) bits.push(`<div class="choices">${choice('sell', `Sell the ${Math.round(S.grain)} bushels you held over winter`, `${cents(pruittPays())}/bu`)}</div>`);
  sheet(bits.join('') + `<div class="timecost">Each piece of business takes about ${hours(TIME.shop)}.</div>` + leave('Step away from the counter'));
}
handlers.seed = (how) => {
  const n = S.acres - S.seedFor, cost = n * K.seed;
  const hadCash = S.cash >= cost;
  if (how === 'cash') S.cash -= cost; else { S.tab += cost; bookLine(`Seed, ${n} acres`, cost); unlock('interest'); }
  S.seedFor = S.acres; pass(TIME.shop);
  const d = S.decisions.find((x) => x.kind === 'seed' && x.year === S.year);
  if (d) { d.book = d.book || how === 'book'; d.hadCash = d.hadCash && hadCash; d.cost += cost; }
  else decide({ kind: 'seed', book: how === 'book', hadCash, cost });
  toast(`Seed for ${n} acres. Sow it out on the claim.`);
  save(); openStore(); render();
};
handlers.plow = () => { S.cash -= 20; S.plow = true; pass(TIME.shop); unlock('sod'); toast('A steel plow. The sod turns easier.'); save(); engine.refreshRoom(); openStore(); render(); };
handlers.reaper = () => { S.cash -= K.reaperCash; S.reaper = { left: 0 }; pass(TIME.shop); decide({ kind: 'reaperCash' }); toast('A reaper, paid in full.'); save(); openStore(); render(); };
handlers.sell = () => {
  const p = pruittPays();
  const v = S.grain * p;
  decide({ kind: 'sell', wired: S.wired || S.cash < K.wire, price: p, chicago: chicago(), held: S.season === 'spring' });
  S.cash += v; S.grain = 0; pass(TIME.shop * 2);
  unlock('price');
  toast(`Sold for ${money(v)}.`);
  save(); openStore(); render();
};
handlers.jar = (n) => {
  n = +n;
  const cost = n * K.jarCost;
  if (S.cash < cost) return toast("Pruitt won't put preserves on the book.");
  S.cash -= cost; S.jars += n; pass(5 * n); unlock('buffer');
  save(); engine.refreshRoom(); openStore(); render();
};
handlers.paytab = () => {
  const pay = Math.min(S.cash, S.tab);
  S.cash -= pay; S.tab -= pay; if (S.tab < 0.5) S.tab = 0; bookLine('Paid, cash', pay, 'paid'); pass(5);
  toast(S.tab ? `Paid ${money(pay)}. ${money(S.tab)} still on the slate.` : 'Pruitt wipes your line off the slate.');
  save(); engine.refreshRoom(); openStore(); render();
};

// ------------------------------------------------------------------ the bank

function openBank() {
  if (S.bankClosed) { sheet(`${speak('cole', '"We are closed! Closed until further notice. Please, everyone, go home."')}${leave('Walk out')}`); return; }
  const bits = [];
  const rate = S.lateMarks ? 9 : 7;
  let said = '"Five percent a year on savings, paid every winter. A bank is a safer place for money than a coffee can."';
  if (S.year === 1873 && S.season === 'harvest') said = S.world.bankFails ? '"Everything is perfectly sound. There is no cause for alarm. None at all."' : '"Times are hard in the East, but we are a careful house."';
  else if (S.year >= 1868 && !S.loan) said += ` "I can lend ${money(K.loanAmt)} against your crop, too."`;
  bits.push(speak('cole', said));
  const c = [];
  c.push(choice('deposit:10', 'Deposit $10', `${money(S.savings)} saved`, S.cash < 10));
  if (S.cash >= 50) c.push(choice('deposit:50', 'Deposit $50'));
  c.push(choice('withdraw', 'Withdraw everything', money(S.savings), S.savings < 1));
  if (S.year >= 1868 && !S.loan && !(S.year === 1873 && S.season === 'harvest')) c.push(choice('loan', `Borrow ${money(K.loanAmt)} on the crop, due this winter`, `${money(K.loanAmt * (1 + K.loanRate))} back`));
  if (S.loan) c.push(choice('repay', 'Repay the crop loan', money(S.loan.due), S.cash < S.loan.due));
  if (S.titled && !S.mortgage) c.push(choice('mortgage', `Mortgage the claim for ${money(K.mortgage)} at ${rate}%`, `${money(K.mortgage * rate / 100)} a year`));
  if (S.stock) c.push(choice('sellstock', 'Sell the railroad certificate', money(stockValue())));
  bits.push(`<div class="choices">${c.join('')}</div>`);
  if (S.year >= 1868) unlock('leverage');
  if (S.titled) unlock('collateral');
  sheet(bits.join('') + leave('Step away from the window'));
}
handlers.deposit = (n) => { n = Math.min(+n, S.cash); S.cash -= n; S.savings += n; pass(TIME.shop); unlock('saving'); save(); openBank(); render(); };
handlers.withdraw = () => {
  S.cash += S.savings; S.savings = 0; pass(TIME.shop);
  if (S.year === 1873 && S.season === 'harvest') S.withdrewIn73 = true;
  save(); openBank(); render();
};
handlers.loan = () => {
  S.loan = { amt: K.loanAmt, due: +(K.loanAmt * (1 + K.loanRate)).toFixed(2), year: S.year };
  S.cash += K.loanAmt; pass(TIME.shop);
  decide({ kind: 'loan', amt: K.loanAmt, expected: Math.max(S.sown, S.acres) * K.yield * Y().price * 0.8 });
  toast(`${money(K.loanAmt)} in hand, ${money(S.loan.due)} due this winter.`);
  save(); openBank(); render();
};
handlers.repay = () => { S.cash -= S.loan.due; S.onTime++; S.decisions.filter((d) => d.kind === 'loan' && d.repaid == null).forEach((d) => { d.repaid = true; }); S.loan = null; pass(TIME.shop); toast('Loan repaid.'); save(); openBank(); render(); };
handlers.mortgage = () => {
  const rate = S.lateMarks ? 0.09 : 0.07;
  S.mortgage = { amt: K.mortgage, rate }; S.cash += K.mortgage; pass(TIME.shop);
  decide({ kind: 'mortgage', rate });
  toast(`${money(K.mortgage)} against the land at ${Math.round(rate * 100)}%.`);
  save(); openBank(); render();
};
handlers.sellstock = () => {
  const v = stockValue(); S.cash += v; pass(TIME.shop);
  const d = S.decisions.find((x) => x.kind === 'stock' && x.soldFor == null);
  if (d) d.soldFor = v;
  S.stock = 0; toast(`Sold the certificate for ${money(v)}.`);
  save(); openBank(); render();
};

// ------------------------------------------------------------------ the telegraph office

function wireNews() {
  const y = S.year;
  if (y === 1873 && S.season === 'harvest') return 'PHILADELPHIA SEPT 18. JAY COOKE AND CO CLOSED DOORS. NORTHERN PACIFIC BONDS UNSALEABLE. NEW YORK BANKS SUSPENDING. STOCK EXCHANGE SHUT.';
  if (y === 1873) return `CHICAGO WHEAT ${cents(chicago())}. RAILROAD BONDS SLIDING IN NEW YORK. VIENNA BOURSE CRASHED IN MAY. CREDIT TIGHT.`;
  if (S.season === 'spring') {
    const guess = Y().price * (1 + (rng(S.world.seed + y)() - 0.5) * 0.12);
    return `CHICAGO WHEAT ${cents(chicago())}. TRADE EXPECTS ${cents(guess)} BY HARVEST.${Y().drought ? ' DRY SPRING REPORTED IN KANSAS.' : ''}`;
  }
  return `CHICAGO WHEAT ${cents(chicago())} TODAY. COUNTRY BUYERS PAYING ${cents(chicago() * 0.8)}.`;
}
function openWire() {
  const bits = [speak('clerk', S.wired ? '"Same as I read you earlier. Nothing new on the wire."' : '"Chicago prices come over the wire every morning. A dollar to read you the sheet."')];
  if (S.wired) bits.push(`<div class="ledger"><div style="font-family:var(--display);font-size:15px">${wireNews()}</div></div>`);
  else bits.push(`<div class="choices">${choice('buywire', "Pay to read today's wire", money(K.wire), S.cash < K.wire)}</div>`);
  sheet(bits.join('') + leave('Step away from the counter'));
}
handlers.buywire = () => {
  S.cash -= K.wire; S.wired = true; S.wires++; pass(TIME.wire); unlock('price');
  if (S.year === 1873 && S.season === 'harvest') unlock('bankrun');
  save(); engine.refreshRoom(); openWire(); render();
};

// ------------------------------------------------------------------ neighbors and visitors

const TIPS = [
  ['"The railroad is coming through Salina. Wheat will be two dollars."', false],
  ['"In Germany they say American wheat sells well this year. The harvest in Russia is poor."', true],
  ['"A man in the saloon says land here will double by next spring."', false],
  ['"My cousin writes that the Chicago buyers are paying less than last year. Sell early, maybe."', true],
  ['"Grasshoppers in Nebraska, very many. Maybe they come here, maybe not."', false],
];
function openBrandt() {
  const tip = TIPS[(S.year * 2 + (S.season === 'spring' ? 0 : 1) + S.world.seed) % TIPS.length];
  let said = tip[0];
  if (S.year === 1873) said = '"In Vienna the banks are selling their American railway paper. When Europe sells, somebody over here is left holding it."';
  if (S.year >= 1869 && !S.boughtForty && S.year <= 1870) said = `"I go to Nebraska, to my brother. My forty is broken, twenty acres, good soil. ${money(K.forty)} and it is yours."`;
  if (S.boughtForty) said = '"You will take good care of my forty, I know it." ' + said;
  const bits = [speak('brandt', said)];
  const c = [];
  if (S.year >= 1869 && S.year <= 1870 && !S.boughtForty) c.push(choice('forty', `Buy his forty: ${K.fortyAcres} broken acres`, money(K.forty), S.cash < K.forty));
  bits.push(`<div class="choices">${c.join('')}</div>`);
  if (!c.length) bits.push('<div class="note">Neighbors pass on what they hear. Some of it is true.</div>');
  sheet(bits.join('') + leave());
}
handlers.forty = () => {
  S.cash -= K.forty; S.acres += K.fortyAcres; S.boughtForty = true; pass(TIME.talk * 3);
  decide({ kind: 'forty', borrowed: !!S.loan || !!S.mortgage });
  toast(`${K.fortyAcres} more acres. ${S.acres} broken in all.`);
  placeNpcs(); save(); closeSheet();
};

function openAmes() {
  const said = S.today.helpedAmes ? '"Thank you again. I won\'t forget it."' : '"The garden won\'t weed itself. Good to see you."';
  sheet(speak('ames', said) + leave());
}
function openForeman() {
  const bits = [];
  if (S.season === 'spring' && !S.hired) {
    bits.push(speak('foreman', `"Kansas Pacific pays ${money(K.wage)} for the summer, laying track west. Cash at the end of August. Your wheat'll have to mind itself."`));
    bits.push(`<div class="choices">${choice('hire', 'Sign on with the crew for the summer', `+${money(K.wage)}`)}</div>`);
    bits.push('<div class="note">A field nobody tends all summer yields about 15% less.</div>');
  } else if (S.hired && S.season === 'spring') bits.push(speak('foreman', '"You\'re on the list. First of June, don\'t be late."'));
  else bits.push(speak('foreman', '"The crew\'s gone on to Ellsworth. Come back in the spring if you want summer work."'));
  sheet(bits.join('') + leave());
}
handlers.hire = () => { S.hired = true; pass(TIME.talk); decide({ kind: 'hire', cashThen: S.cash }); toast('Signed on for the summer.'); save(); openForeman(); };

function openDrummer() {
  const bits = [];
  if (S.year === 1868) {
    bits.push(speak('drummer', `"The Valentine Patent Reaper! Nothing down but ${money(K.reaperDown)}, and ${money(K.reaperPay)} a season after. Cuts a field before breakfast, friend."`));
    bits.push(`<div class="choices">${choice('instal', 'Take the reaper on installments', `${money(K.reaperDown + K.reaperPay * K.reaperPays)} in all`, !!S.reaper)}</div>`);
    bits.push(`<div class="note">${money(K.reaperDown)} now, then ${money(K.reaperPay)} a season for ${K.reaperPays} seasons. He leaves town tonight.</div>`);
  } else {
    bits.push(speak('drummer', `"Northern Pacific Railroad, friend! Jay Cooke himself is behind it. A certificate is ${money(K.stockCost)} today. Mr. Pruitt took two. My last customer doubled his money."`));
    bits.push(`<div class="choices">${choice('stock', 'Buy a certificate', money(K.stockCost), S.cash < K.stockCost || S.stock > 0)}</div>`);
    bits.push('<div class="note">He leaves town tonight.</div>');
  }
  unlock('hype');
  sheet(bits.join('') + leave('No thank you'));
}
handlers.instal = () => {
  spend(K.reaperDown, null, 'Reaper down payment'); S.reaper = { left: K.reaperPays }; pass(TIME.shop);
  decide({ kind: 'instal' });
  toast('A reaper, on installments. It will be on the claim by harvest.'); save(); closeSheet();
};
handlers.stock = () => {
  S.cash -= K.stockCost; S.stock = 1; pass(TIME.shop);
  decide({ kind: 'stock', cost: K.stockCost, share: K.stockCost / Math.max(1, netWorth()) });
  toast('You own a Northern Pacific certificate.'); save(); closeSheet();
};

// Visitors walk up to you. These are the year's turning points.
function visitorsToday() {
  const v = [];
  const y = S.year, sp = S.season === 'spring', d = S.day;
  if (y === 1867 && !sp && d === 1) v.push('amesHarvest');
  if (y === 1870 && sp && d === 1) v.push('amesSpring');
  if (y === 1869 && sp && d === 1) v.push('brandtForty');
  if (y === 1871 && sp && d === 1 && S.titled) v.push('landOffice');
  if (!sp && d === 2 && S.amesHelpDue && S.ripe - S.cut > 0) v.push('amesReturns');
  if (y === 1873 && !sp && d === 2) v.push('brandtNews');
  return v.filter((k) => !S.seen[`${k}${y}`]);
}
function runVisitors(list, done) {
  if (!list.length) return done();
  const k = list.shift();
  S.seen[`${k}${S.year}`] = true;
  const next = () => runVisitors(list, done);
  if (k === 'landOffice') {
    onClose = next;
    sheet(`<div class="h">A letter from the land office</div><div class="say">"Five years' residence having been proved, patent is hereby issued for the northwest quarter, Section 14." The 160 acres are yours. Mr. Cole will lend against them now.</div>${leave('Fold it into the Bible')}`);
    unlock('collateral');
    return;
  }
  const brandtHere = !(S.boughtForty && S.year > 1870);
  const who = k.startsWith('ames') || !brandtHere ? 'ames' : 'brandt';
  const home = who === 'ames' ? [6.5, 21.6] : [19.5, 29.6];
  engine.setNpc(who, { x: 14.5, y: engine.player.y > 33 ? 36.6 : Math.min(engine.player.y + 6, 43), scene: 'town', name: NPC[who][0] });
  busy = true; engine.enable(false);
  engine.npcVisit(who, () => {
    busy = false;
    onClose = () => { engine.npcWalk(who, [Math.floor(home[0]), Math.floor(home[1])], () => engine.setNpc(who, { x: home[0], y: home[1] })); next(); };
    visitorSheet(k);
  });
}
function visitorSheet(k) {
  if (k === 'amesHarvest') {
    sheet(`${speak('ames', '"My boys and I can\'t get our wheat in alone, not since Thomas passed. Could you give us a day? I can\'t pay you. I can only owe you."')}
      <div class="choices">${choice('helpAmes:harvest', 'Spend the day cutting her wheat', hours(TIME.amesHarvest))}</div>
      <div class="note">Your own wheat is ripe too: ${S.ripe} acres.</div>${leave('Tell her you can\'t spare it')}`);
  } else if (k === 'amesSpring') {
    sheet(`${speak('ames', '"The storm took half my roof. Could you spare a morning before the rain comes back?"')}
      <div class="choices">${choice('helpAmes:spring', 'Spend the morning on her roof', hours(TIME.amesSpring))}</div>${leave('Tell her you can\'t spare it')}`);
  } else if (k === 'amesReturns') {
    const n = Math.min(4, S.ripe - S.cut);
    S.cut += n; S.grain += n * S.buPerAcre; S.amesHelpDue = false;
    sheet(`${speak('ames', `"We've come to help with your wheat, the boys and I. You helped us when we needed it."`)}<div class="say">By noon they have cut and shocked ${n} acres of your wheat.</div>${leave('Thank them')}`);
    unlock('mutual'); save(); render();
  } else if (k === 'brandtForty') {
    openBrandt();
  } else if (k === 'brandtNews') {
    const fails = S.world.bankFails;
    const news = S.boughtForty ? speak('ames', '"Have you heard? A rider came through from Topeka. Some big bank back East has failed, Jay Cooke\'s, and the New York banks have stopped paying. Folks are saying Mr. Cole\'s bank could be next."')
      : speak('brandt', '"Have you heard? Jay Cooke is finished, in Philadelphia. The New York banks stop paying. The man at the telegraph office says all the banks out here will close too, one by one. Mine is in a sock in the barn, thank God."');
    sheet(`${news}
      <div class="say">${S.savings > 0 ? `You have ${money(S.savings)} in Mr. Cole's bank.` : 'You have nothing in the bank.'} ${S.ripe - S.cut > 0 ? `${S.ripe - S.cut} acres of your wheat are still standing.` : ''}</div>
      <div class="note">${fails ? 'Town is an hour up the road. A winter without savings is longer.' : 'Town is an hour up the road.'}</div>${leave('Thank him')}`);
    unlock('bankrun');
  }
}
handlers.helpAmes = (when) => {
  const m = when === 'harvest' ? TIME.amesHarvest : TIME.amesSpring;
  S.helpedAmes++; S.amesOwes = true; S.amesHelpDue = true; S.today.helpedAmes = true;
  decide({ kind: 'helped', when, ripe: S.ripe });
  unlock('mutual');
  work(m, () => toast('Widow Ames will remember it.'), when === 'harvest' ? "At the Ames place" : 'On the Ames roof');
};

// ------------------------------------------------------------------ days and seasons

function placeNpcs() {
  const sp = S.season === 'spring';
  engine.setNpc('ruth', { x: 5.5, y: 3.6, scene: 'home', name: '' });
  engine.setNpc('pruitt', { x: 3.5, y: 3.6, scene: 'store', name: '' });
  engine.setNpc('cole', { x: 4.5, y: 3.6, scene: 'bank', name: '', hidden: S.bankClosed });
  engine.setNpc('clerk', { x: 5.5, y: 3.6, scene: 'wire', name: '' });
  engine.setNpc('brandt', S.boughtForty && S.year > 1870 ? null : { x: 19.5, y: 29.6, scene: 'town', name: 'Herr Brandt' });
  engine.setNpc('ames', { x: 6.5, y: 21.6, scene: 'town', name: 'Widow Ames' });
  engine.setNpc('foreman', { x: 20.5, y: 7.6, scene: 'town', name: 'Mr. Doyle', sprite: 'foreman' });
  const market = sp && S.day === 2 && (S.year === 1868 || S.year === 1872);
  engine.setNpc('drummer', market ? { x: 13.5, y: 19.4, scene: 'town', name: 'Mr. Valentine' } : null);
  engine.setExtras(market ? [{ kind: 'wagon', x: 10.4, y: 18.8, solid: [[9, 18], [10, 18], [11, 18]], sign: 'PATENT GOODS' }] : []);
  // Townsfolk; in the fall of 1873 they crowd the bank.
  const run = S.year === 1873 && !sp && S.day >= 2 && S.world.bankFails;
  const spots = run ? [[15.5, 13.6], [16.4, 14.7], [18.5, 13.6], [17.6, 15.3]] : [[9.5, 13.6], [6.5, 15.4], [21.5, 21.7], [13.5, 21.4]];
  ['folk1', 'folk2', 'folk3', 'folk4'].forEach((k, i) => engine.setNpc(k, { x: spots[i][0], y: spots[i][1], scene: 'town', name: '', sprite: k }));
}

function morning() {
  S.minute = DAWN; S.today = {}; S.phase = 'day';
  if (S.day === 1) S.wired = false;
  placeNpcs();
  engine.place('town', HOME_DOOR); side = 'claim';
  render(); save();
  const lines = [];
  const sp = S.season === 'spring';
  if (S.year === FIRST && sp && S.day === 1) lines.push('Buy seed at Pruitt\'s in town, then sow it on your claim before the end of day 3. The road to town takes an hour each way, and work takes daylight too.');
  else if (sp && S.day === 1) lines.push(`${S.acres} acres broken. ${S.seedFor >= S.acres ? 'You have the seed.' : 'You will need seed from Pruitt\'s.'}`);
  if (sp && S.day === 2 && (S.year === 1868 || S.year === 1872)) lines.push("Market day. A salesman's wagon is in the square until dark.");
  if (!sp && S.day === 1) lines.push(S.ripe ? `${S.ripe} acres of wheat are ripe. After day 3, the heads start to shatter.` : 'Nothing is ripe in your field this year.');
  if (!sp && S.day === 3 && S.ripe - S.cut > 0) lines.push(`Last day before the wheat shatters. ${S.ripe - S.cut} acres still standing.`);
  if (S.year === 1873 && !sp && S.day === 3 && S.world.bankFails && !S.bankClosed) lines.push('Talk in town is that the bank will not open past noon.');
  banner(`${seasonName()} ${S.year} · Day ${S.day} of ${DAYS}`, lines);
  const v = visitorsToday();
  if (v.length) { engine.enable(false); setTimeout(() => runVisitors(v, () => { render(); save(); if (S.phase === 'day' && $('#sheet').hidden) engine.enable(true); }), 900); }
  else engine.enable(true);
}

// Called as you walk. Walking itself is free; the road over the creek between
// the claim and town takes an hour each way. Returns false to stop the walk.
let side = 'claim';
const sideOf = (y) => (y < 23.6 ? 'town' : y > 27.2 ? 'claim' : null);
function onStep() {
  if (!S || S.phase !== 'day') return false;
  if (!S.seen.walked && engine.scene === 'town') { S.seen.walked = true; updateDock(); }
  if (engine.scene !== 'town') return true;
  const now = sideOf(engine.player.y);
  if (now && now !== side) {
    side = now;
    engine.floatText(now === 'town' ? 'An hour on the road to town' : 'An hour on the road home');
    pass(TIME.road);
    if (S.minute >= DUSK) { endDay('dusk'); return false; }
  }
  return true;
}
function closeBank() {
  S.bankClosed = true; placeNpcs();
  if (engine.scene === 'bank') {
    toast('Mr. Cole pulls down the blinds. "We are closed. Closed!"');
    if ($('#sheet').hidden) leaveRoom(); else onClose = () => leaveRoom();
  } else if (engine.scene === 'town' && engine.player.y < 20) toast('A shout from the boardwalk: the bank has shut its doors.');
}

function endDay(why) {
  if (S.phase !== 'day') return;
  S.phase = 'night';
  engine.enable(false); engine.stop();
  if (S.year === 1873 && S.season === 'harvest' && S.day === 3 && S.world.bankFails && !S.bankClosed) S.bankClosed = true;
  const done = [];
  if (S.today.sown) done.push(`Sowed ${S.today.sown} acres`);
  if (S.today.broke) done.push(`Broke ${S.today.broke} acre${S.today.broke === 1 ? '' : 's'} of sod`);
  if (S.today.sodWork && !S.today.broke) done.push(`Worked on the sod. The next acre is ${Math.round((S.sodMin / sodRate()) * 100)}% broken`);
  if (S.today.cut) done.push(`Cut ${S.today.cut} acres`);
  if (S.today.helpedAmes) done.push('Helped Widow Ames');
  const last = S.day >= DAYS;
  const tomorrow = [];
  if (!last) {
    const sp = S.season === 'spring', d = S.day + 1;
    if (sp && d === 2 && (S.year === 1868 || S.year === 1872)) tomorrow.push("Tomorrow is market day. A salesman's wagon comes to the square.");
    if (sp && d === DAYS && S.sown < S.acres) tomorrow.push(`Tomorrow is the last day of spring. ${S.acres - S.sown} acres are not sown.`);
    if (!sp && d === DAYS && S.ripe - S.cut > 0) tomorrow.push(`Tomorrow is the last day before the wheat shatters. ${S.ripe - S.cut} acres standing.`);
  }
  engine.go('town', HOME_DOOR, () => {
    sheet(`<div class="night">
        <div class="moon">${moon}</div>
        <div class="h">${why === 'dusk' ? 'Dark falls, and you walk home' : 'You turn in for the night'}</div>
        <div class="sub">${seasonName()} ${S.year}, day ${S.day} of ${DAYS}</div>
        ${done.length ? `<div class="ledger">${done.map((d) => `<div class="l"><span>${d}</span></div>`).join('')}</div>` : ''}
        ${tomorrow.map((t) => `<div class="tomorrow">${t}</div>`).join('')}
      </div>
      <button class="bigbtn light" data-act="${last ? 'seasonEnd' : 'nextDay'}" style="background:var(--paper)">${last ? (S.season === 'spring' ? 'The summer passes' : 'Winter comes') : 'Morning'}</button>`, { full: true });
    save();
  });
}
handlers.nextDay = () => { S.day++; closeSheetQuiet(); morning(); };
function closeSheetQuiet() { $('#sheet').hidden = true; $('#veil').hidden = true; }

handlers.seasonEnd = () => { if (S.season === 'spring') summer(); else winter(); };

function summer() {
  const L = [];
  if (S.sown < S.acres) L.push([`${S.acres - S.sown} acres went unsown this year`, 0, 'bad']);
  if (S.hired) { S.cash += K.wage; L.push(['Wages from the Kansas Pacific crew', K.wage]); }
  const living = K.living + (S.year - FIRST) * 6;
  spend(living, L, `Living costs, spring and summer (${S.year - FIRST ? 'a bigger family now' : 'a family of four'})`);
  if (S.reaper && S.reaper.left) { spend(K.reaperPay, L, 'Reaper installment'); S.reaper.left--; }
  accrueTab(L);
  const y = Y();
  let f = 1;
  if (y.drought) f = 0.45; else if (y.bumper) f = 1.2;
  const bonus = (S.plow ? K.plowBonus : 1) * (S.hired ? K.hiredPenalty : 1);
  const r = rng(S.world.seed + S.year * 7)();
  S.buPerAcre = K.yield * f * bonus * (0.9 + r * 0.2);
  S.ripe = S.sown; S.cut = 0;
  if (y.drought) L.push(['A dry summer: the wheat came in thin', 0, 'bad']);
  if (y.bumper && !y.drought) L.push(['A good summer: the heads came in heavy', 0, 'good']);
  if (S.hired && S.sown) L.push(['Untended fields will yield 15% less', 0, 'bad']);
  if (S.sown) L.push([`${S.ripe} acres of wheat ripening, about ${Math.round(S.buPerAcre)} bushels an acre`, 0, 'good']);
  S.season = 'harvest'; S.day = 1; S.wired = false;
  showLedger(`Summer ${S.year}`, L, 'harvestStart', `On to the harvest`);
}
handlers.harvestStart = () => { closeSheetQuiet(); morning(); };

function accrueTab(L) {
  if (S.tab > 0.5) {
    const i = S.tab * K.tabHalf;
    S.tab += i; S.interestPaid += i;
    bookLine('Interest, 6 months', i, 'interest');
    L.push(["Interest on Pruitt's book, six months at 3% a month", -i, 'bad']);
    unlock('interest');
  }
}

function winter() {
  const L = [];
  const y = Y();
  const cost = y.hard ? K.hardWinter : K.winter;
  const lost = S.ripe - S.cut;
  if (lost > 0) {
    const shattered = Math.round(lost * S.buPerAcre * 0.85);
    L.push([`${lost} acres shattered in the field: about ${shattered} bushels lost`, 0, 'bad']);
    decide({ kind: 'shatter', lost, value: shattered * pruittPays(), reaper: !!S.reaper, helped: S.decisions.some((d) => d.kind === 'helped' && d.year === S.year && d.when === 'harvest') });
    const gleaned = Math.round(lost * S.buPerAcre * 0.15);
    S.grain += gleaned;
  }
  const before = { jars: S.jars, cash: S.cash, tab: S.tab, ames: S.amesOwes };
  if (S.year === 1873 && S.world.bankFails && S.savings > 0) {
    S.frozen = Math.round(S.savings * 0.7);
    L.push([`Cole's bank closed its doors. ${money(S.savings)} is frozen inside; maybe 70 cents on the dollar, someday`, -S.savings + S.frozen, 'bad']);
    decide({ kind: 'bank', lost: true, amt: S.savings }); S.savings = 0;
  } else if (S.year === 1873 && S.withdrewIn73) decide({ kind: 'bank', lost: false, pulled: true });
  else if (S.year === 1873 && S.savings > 0) decide({ kind: 'bank', lost: false });
  if (S.savings > 0) { const i = S.savings * K.savingsRate; S.savings += i; L.push(['Interest on savings at the bank', i, 'good']); }
  if (S.loan) {
    if (S.cash >= S.loan.due) { S.cash -= S.loan.due; L.push(['Repaid the crop loan', -S.loan.due]); S.onTime++; S.decisions.filter((d) => d.kind === 'loan' && d.repaid == null).forEach((d) => { d.repaid = true; }); S.loan = null; }
    else {
      L.push([S.year === 1873 ? 'Mr. Cole called the crop loan and you could not pay. It rolls over at 15%' : "Couldn't repay the crop loan. It rolls over at 15%", 0, 'bad']);
      S.loan.due = +(S.loan.due * (1 + K.lateRate)).toFixed(2); S.lateMarks++;
      S.decisions.filter((d) => d.kind === 'loan' && d.repaid == null).forEach((d) => { d.repaid = false; });
    }
  }
  if (S.year === 1873 && S.stock) decide({ kind: 'stock', cost: K.stockCost, soldFor: stockValue(), held: true });
  if (S.mortgage) spend(S.mortgage.amt * S.mortgage.rate, L, 'Mortgage interest for the year');
  if (S.reaper && S.reaper.left) { spend(K.reaperPay, L, 'Reaper installment'); S.reaper.left--; }
  L.push([y.hard ? 'The hardest winter anyone remembers' : 'An ordinary winter', 0, y.hard ? 'bad' : 'note']);
  let need = cost;
  const fromJars = Math.min(S.jars * K.jarValue, need);
  const used = Math.ceil(fromJars / K.jarValue);
  S.jars -= used; need -= fromJars;
  if (fromJars) L.push([`The cellar covered ${money(fromJars)} of food and fuel (${used} jars)`, 0, 'good']);
  if (need > 0 && S.amesOwes) { const a = Math.min(need, 10); need -= a; S.amesOwes = false; L.push([`Widow Ames sent over preserves worth ${money(a)}`, 0, 'good']); }
  const onBook = need > 0 ? spend(need, L, 'Food and fuel') : 0;
  if (onBook > 0.5) L.push(['The cellar ran dry and the rest went on the book', 0, 'bad']); else if (S.tab < 0.5) S.onTime++;
  accrueTab(L);
  if (S.grain > 0) { const spoil = Math.round(S.grain * 0.08); S.grain -= spoil; L.push([`${spoil} bushels spoiled in the crib`, 0, 'note']); }
  decide({ kind: 'winter', buffer: before.jars * K.jarValue + before.cash + (before.ames ? 10 : 0), hard: y.hard, onBook, cost });
  unlock('buffer');
  save();
  showLedger(`Winter ${S.year}`, L, 'letter', 'Read the letter home');
}

function showLedger(title, L, next, label) {
  S.phase = 'ledger';
  const rows = L.map(([t, a, k]) => `<div class="l"><span>${t}</span><b class="${a < -0.5 ? 'neg' : a > 0.5 ? 'pos' : ''}">${Math.abs(a) > 0.5 ? (a > 0 ? '+' : '-') + money(Math.abs(a)).replace('-', '') : ''}</b></div>`).join('');
  sheet(`<div class="letter plain">
      <div class="top"><div class="dear">${title}</div><div class="date">${S.look.family} family ledger</div></div>
      <div class="ledger">${rows || '<div class="l"><span>A quiet season.</span></div>'}
        <div class="l tot"><span>Cash</span><b>${money(S.cash)}</b></div>
        <div class="l"><span>Pruitt's book</span><b class="${S.tab > 0.5 ? 'neg' : ''}">${money(S.tab)}</b></div>
        <div class="l"><span>Jars in the cellar</span><b>${S.jars}</b></div>
      </div>
    </div>
    <button class="bigbtn light" data-act="${next}" style="background:var(--paper)">${label}</button>`, { full: true });
  render(); save();
}

// ------------------------------------------------------------------ the letter and the grader

function stampOf(goodCall, goodOutcome) {
  if (goodCall && goodOutcome) return 'Sound';
  if (goodCall) return 'Unlucky';
  if (goodOutcome) return 'Lucky';
  return 'Exposed';
}

function gradeYear(year) {
  const ds = S.decisions.filter((d) => d.year === year);
  const lines = [];
  const winter = ds.find((d) => d.kind === 'winter');
  const broke = ds.find((d) => d.kind === 'broke');
  for (const d of ds) {
    if (d.kind === 'seed') {
      const paid = S.tab < 0.5;
      const good = !d.book || !d.hadCash;
      lines.push({ stamp: stampOf(good, !d.book || paid), text: d.book ? "In the spring I put the seed on Pruitt's book instead of paying for it." : 'In the spring I paid cash for the seed.',
        why: d.book ? (d.hadCash ? 'We had the cash. The book charges 3% a month, about 19% a season.' : 'We had no cash, so the book was the only way to plant.') : '' });
    }
    if (d.kind === 'broke' && d.n > 0) lines.push({ stamp: 'Sound', text: `I broke ${d.n} more acre${d.n === 1 ? '' : 's'} of prairie this spring.`, why: 'Land that pays every year from now on.' });
    if (d.kind === 'hire') lines.push({ stamp: d.cashThen < 20 ? 'Sound' : 'Lucky', text: 'I signed on with the railroad crew for the summer.', why: d.cashThen < 20 ? 'We needed the cash more than the extra wheat.' : 'Wages now, a thinner harvest later. We had cash enough without it.' });
    if (d.kind === 'helped') lines.push({ stamp: 'Sound', text: d.when === 'harvest' ? 'I gave a day of the harvest to Widow Ames.' : 'I spent a morning on Widow Ames\'s roof.', why: 'Out here, neighbors are the only insurance there is.' });
    if (d.kind === 'shatter') {
      lines.push({ stamp: d.helped ? 'Unlucky' : 'Exposed', text: `${d.lost} acre${d.lost === 1 ? '' : 's'} of wheat shattered before I could cut ${d.lost === 1 ? 'it' : 'them'}.`,
        why: `About ${money(d.value)} left in the dirt. ${d.helped ? 'The day I gave the Ameses cost us this.' : d.reaper ? 'More field than daylight.' : 'More field than a man with a scythe can cut in three days.'}` });
    }
    if (d.kind === 'sell') {
      const fair = d.price >= d.chicago * 0.9;
      lines.push({ stamp: stampOf(d.wired, fair), text: `We sold the wheat at Pruitt's for ${cents(d.price)} a bushel.`, why: d.wired ? `I read the Chicago price first: ${cents(d.chicago)}.` : `Chicago was paying ${cents(d.chicago)}. I never asked.` });
    }
    if (d.kind === 'loan') {
      const good = d.amt <= Math.max(1, d.expected) * 0.4;
      lines.push({ stamp: stampOf(good, d.repaid !== false), text: `I borrowed ${money(d.amt)} from Mr. Cole against the crop.`, why: good ? 'Small next to what the field should bring.' : 'Big next to what the field could bring if the year went wrong.' });
    }
    if (d.kind === 'instal') lines.push({ stamp: 'Exposed', text: "I took the salesman's reaper on installments.", why: `${money(K.reaperDown + K.reaperPay * K.reaperPays)} in all. Pruitt sells one for ${money(K.reaperCash)} cash.` });
    if (d.kind === 'reaperCash') lines.push({ stamp: 'Sound', text: 'I bought a reaper at Pruitt\'s and paid cash.', why: 'It cuts an acre in less than half the time. No payments hanging over us.' });
    if (d.kind === 'forty') lines.push({ stamp: d.borrowed ? 'Lucky' : 'Sound', text: `We bought Herr Brandt's forty for ${money(K.forty)}.`, why: d.borrowed ? 'Partly on borrowed money. It worked this time.' : 'Paid in full. Twenty acres already broken.' });
    if (d.kind === 'stock') {
      const sold = d.soldFor != null ? d.soldFor : stockValue();
      lines.push({ stamp: stampOf(false, sold > d.cost), text: d.held ? 'I still held the railroad certificate when Jay Cooke failed.' : 'I bought a railroad certificate from the salesman.', why: `Bought on his word alone. It is worth ${money(sold)} now.` });
    }
    if (d.kind === 'bank') {
      if (d.lost) lines.push({ stamp: 'Unlucky', text: `We kept ${money(d.amt)} in Mr. Cole's bank, and it closed.`, why: 'Saving was right. No one insured the deposits in 1873. Brandt brought the warning, and town was a long walk.' });
      else if (d.pulled) lines.push({ stamp: 'Sound', text: 'When the news came, I walked to town and took our money out of the bank.', why: 'Information, acted on in time.' });
    }
    if (d.kind === 'mortgage') lines.push({ stamp: 'Sound', text: `I mortgaged the claim at ${Math.round(d.rate * 100)}%.`, why: 'Now that the land is ours, it can carry a loan. It can also be lost to one.' });
  }
  void broke;
  if (winter) {
    const good = winter.buffer >= K.hardWinter;
    lines.push({ stamp: stampOf(good, winter.onBook < 0.5), winter: true,
      text: winter.hard ? (winter.onBook > 0.5 ? `Then the hardest winter anyone remembers. ${money(winter.onBook)} went back on the book.` : 'Then the hardest winter anyone remembers, and the cellar held.') : (winter.onBook > 0.5 ? `Even an ordinary winter put ${money(winter.onBook)} on the book.` : 'An ordinary winter, and we came through it fine.'),
      why: `Going in we had ${money(winter.buffer)} in jars and cash. A hard winter takes ${money(K.hardWinter)}.` });
  }
  return { lines, winter };
}

handlers.letter = () => {
  if (S.brokeThisYear > 0 && !S.decisions.some((d) => d.kind === 'broke' && d.year === S.year)) decide({ kind: 'broke', n: S.brokeThisYear });
  // put the sod line first among the year's calls
  const { lines, winter } = gradeYear(S.year);
  const y = Y();
  const ten = y.winters.slice(); ten[6] = winter ? winter.hard : y.hard;
  const covered = ten.map((h) => winter && winter.buffer >= (h ? K.hardWinter : K.winter));
  const held = covered.filter(Boolean).length;
  const jars = ten.map((h, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><div class="jar ${covered[i] ? 'full' : 'empty'} ${i === 6 ? 'mine' : ''}" title="${h ? 'Hard winter' : 'Ordinary winter'}"></div><div style="font-size:9px;color:var(--muted)">${h ? 'hard' : ''}</div></div>`).join('');
  const nw = netWorth();
  if (!S.letters.some((l) => l.year === S.year)) S.letters.push({ year: S.year, nw: Math.round(nw), stamps: lines.map((l) => l.stamp) });
  const order = (l) => (l.winter ? 9 : 0);
  const body = lines.sort((a, b) => order(a) - order(b)).slice(-6).map((l) => `<div class="line"><div class="stamp ${l.stamp}">${l.stamp}</div><p>${l.text}</p>${l.why ? `<div class="why">${l.why}</div>` : ''}</div>`).join('');
  S.phase = 'letter';
  sheet(`<div class="letter">
      <div class="top"><div class="dear">Dear Mother,</div><div class="date">December ${S.year}</div></div>
      ${body || '<p>A quiet year. Nothing much to tell.</p>'}
      <div class="winters"><div class="t">Ten winters that might have come</div><div class="grid">${jars}</div>
        <div style="font-size:13px;line-height:1.4">What we had put by would have lasted the winter in ${held} of them. The circled one is the winter we got.</div></div>
      <p>The family stands at ${money(nw)}.${S.tab > 0.5 ? ` We owe Pruitt ${money(S.tab)}.` : ' We owe Pruitt nothing.'}</p>
      <div class="sign">Your son, ${S.look.first} ${S.look.family}</div>
    </div>
    <button class="bigbtn light" data-act="${S.year === LAST ? 'chapterEnd' : 'newYear'}" style="background:var(--paper)">${S.year === LAST ? 'Seal it · End of the chapter' : `Seal it · Spring ${S.year + 1}`}</button>`, { full: true });
  save();
};

handlers.newYear = () => {
  S.year++; S.season = 'spring'; S.day = 1;
  if (S.year === 1871) S.titled = true; // five years on the claim
  S.seedFor = 0; S.sown = 0; S.ripe = 0; S.cut = 0; S.hired = false; S.brokeThisYear = 0;
  closeSheetQuiet();
  if (S.grain > 0) setTimeout(() => toast(`${Math.round(S.grain)} bushels are still in the crib. Pruitt will buy them this spring.`), 5600);
  morning();
};

// ------------------------------------------------------------------ chapter end

function pips(n) { return Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); }
handlers.chapterEnd = () => {
  S.phase = 'end';
  const nw = netWorth();
  const all = gradeAll();
  const sound = all.filter((s) => s === 'Sound').length, lucky = all.filter((s) => s === 'Lucky').length, exposed = all.filter((s) => s === 'Exposed').length;
  const wealth = nw < 100 ? 1 : nw < 300 ? 2 : nw < 600 ? 3 : nw < 1000 ? 4 : 5;
  const credit = Math.max(1, Math.min(5, 5 - S.lateMarks - (S.tab > 0.5 ? 1 : 0) - (S.interestPaid > 40 ? 1 : 0)));
  const skills = Math.max(1, Math.min(5, 1 + (S.plow ? 1 : 0) + (S.acres >= 30 ? 1 : 0) + (S.wires >= 3 ? 1 : 0) + (S.reaper ? 1 : 0)));
  const rep = Math.max(1, Math.min(5, 1 + Math.min(2, S.helpedAmes) + (S.onTime >= 4 ? 1 : 0) + (S.lateMarks === 0 ? 1 : 0)));
  const lore = Math.max(1, Math.min(5, 1 + Math.floor(Object.keys(S.almanac).length / 2)));
  const opens = [
    [credit >= 4, `The bank in town will write a mortgage at ${credit >= 4 ? '6%' : '9%'}, not ${credit >= 4 ? '9%' : '6%'}`],
    [skills >= 3, "A broker in Kansas City will open the family's account"],
    [rep >= 3, rep >= 3 ? 'The grange co-op votes the family in' : "The co-op won't vote you in yet (more trust needed)"],
  ];
  const heir = S.look.first === 'Samuel' ? 'Thomas' : 'Samuel';
  const best = sound >= exposed ? 'You kept your head more often than not.' : 'Too many of your calls were bets.';
  const shattered = S.decisions.filter((d) => d.kind === 'shatter').reduce((a, d) => a + d.value, 0);
  const habit = S.interestPaid > 20 ? `Pruitt's book cost this family ${money(S.interestPaid)} in interest. Pay it down first.`
    : shattered > 40 ? `About ${money(shattered)} of wheat shattered in the field over the years. Daylight was the thing you were shortest of.`
      : S.wires < 2 ? 'You sold most years without knowing the Chicago price. Information is cheap next to what it saves.'
        : lucky > 1 ? 'Some of what went right was luck. Do not count on being lucky three times.' : 'Keep the cellar full and the book empty, and the rest takes care of itself.';
  sheet(`<div class="letter plain">
      <div class="top"><div class="dear">My dear ${heir},</div><div class="date">Christmas ${LAST}</div></div>
      <p>Your father came to this claim in 1866 with ${money(K.startCash)} and a team he did not own. The family stands at ${money(nw)} today.</p>
      <p>${best} ${sound} of his calls were sound, ${lucky} were lucky, and ${exposed} left the family exposed.</p>
      <p>${habit}</p>
      <div class="sign"><div class="portrait">${ART.npc.ruth}</div>Grandma Ruth</div>
    </div>
    <div class="letter plain" style="gap:10px">
      <div class="top"><div class="dear">${S.look.family} family standing</div><div class="date">${money(nw)} · ${S.acres} acres broken</div></div>
      <div class="pips">
        <div>Wealth</div><div class="p">${pips(wealth)}</div>
        <div>Credit record</div><div class="p">${pips(credit)}</div>
        <div>Skills</div><div class="p">${pips(skills)}</div>
        <div>Reputation</div><div class="p">${pips(rep)}</div>
        <div>Lore</div><div class="p">${pips(lore)}</div>
      </div>
      <div class="lbl">What this opens in Chapter Two, the Gilded Age</div>
      <div class="opens">${opens.map(([ok, t]) => `<div>${ok ? check : ring}<span>${t}</span></div>`).join('')}</div>
    </div>
    <div class="note" style="color:#E8DCC0">This prototype ends with Chapter One. Chapter Two (1894 to 1913) brings the stock exchange and the Panic of 1907.</div>
    <button class="bigbtn light" data-act="almanac" style="background:var(--paper)">Open the Almanac</button>
    <button class="bigbtn light" data-act="confirmRestart" style="background:var(--paper)">Start a new family</button>`, { full: true });
  save();
};
function gradeAll() {
  const out = [];
  for (let y = FIRST; y <= LAST; y++) for (const l of gradeYear(y).lines) out.push(l.stamp);
  return out;
}

// ------------------------------------------------------------------ the Almanac

const ALMANAC = {
  interest: { title: 'Compound interest', what: 'Interest charged on a debt, and then interest on that interest. The longer it sits, the faster it grows.',
    did: () => `Pruitt's book has cost the family ${money(S.interestPaid)} in interest so far.${S.tab > 0.5 ? ` Left alone, today's ${money(S.tab)} would be ${money(S.tab * Math.pow(1.03, 12))} in a year.` : ''}`,
    today: 'A credit card at 24% a year is the same 2% a month. Leave $1,000 on it for a year and you owe $1,268. Payday loans and late "buy now, pay later" fees can run far higher.' },
  buffer: { title: 'An emergency fund', what: 'Money or goods set aside for the bad season you know is coming, even if you do not know when.',
    did: () => `You have ${S.jars} jars in the cellar, worth ${money(S.jars * K.jarValue)} of food. A hard winter takes ${money(K.hardWinter)}.`,
    today: 'Most planners suggest three to six months of expenses in savings. Without it, a car repair or a missed paycheck goes on a credit card at 20% or more.' },
  price: { title: 'Prices and information', what: 'The price you are offered depends on what you know. A buyer who knows more than you will pay you less.',
    did: () => `You have paid for the Chicago wire ${S.wires} time${S.wires === 1 ? '' : 's'}. Without it Pruitt pays about 80% of Chicago; with it, about 95%.`,
    today: 'Look up what a used car, a salary or a rent is worth before you negotiate. The research is free; not doing it is not.' },
  leverage: { title: 'Borrowing against a crop', what: 'A loan lets you do more with what you have. It also means you owe the same amount whether the year goes well or badly.',
    did: () => (S.loan ? `You owe Mr. Cole ${money(S.loan.due)}.` : S.decisions.some((d) => d.kind === 'loan') ? 'You have borrowed from Mr. Cole before.' : 'You have not borrowed from the bank yet.'),
    today: 'Student loans, car loans and margin accounts all work this way. Ask what happens to the payment if your income drops.' },
  collateral: { title: 'Collateral', what: 'Something a lender can take if you do not pay. Owning it lets you borrow cheaper; pledging it means you can lose it.',
    did: () => (S.titled ? 'You proved up. The bank will now lend against the land.' : 'You do not own the land yet.'),
    today: 'A mortgage is backed by the house and a car loan by the car. Unsecured debt, like a credit card, costs more because nothing backs it.' },
  hype: { title: 'Salesmen and hype', what: 'Someone who earns a commission is paid to make you buy, whether or not it is good for you.',
    did: () => (S.decisions.some((d) => d.kind === 'stock') ? `You bought a certificate for ${money(K.stockCost)}. It is worth ${money(stockValue())} now.` : S.decisions.some((d) => d.kind === 'instal') ? `The reaper on installments costs ${money(K.reaperDown + K.reaperPay * K.reaperPays)}; cash at Pruitt's was ${money(K.reaperCash)}.` : 'You have heard Mr. Valentine out.'),
    today: 'Hot stock tips, crypto influencers and "no money down" offers. If someone profits when you buy, find a second opinion that does not.' },
  bankrun: { title: 'Bank runs', what: 'A bank lends out most of what it holds. If everyone asks for their money at once, it cannot pay them all, and it closes.',
    did: () => (S.frozen ? `${money(S.frozen)} of your savings is frozen in Cole's bank.` : S.withdrewIn73 ? 'You took your money out in time.' : 'In 1873 hundreds of banks suspended payments.'),
    today: 'Since 1933 the FDIC insures US bank deposits up to $250,000 per depositor, so a bank run like 1873 does not take your savings.' },
  mutual: { title: 'Helping each other', what: 'Before insurance companies, neighbors were the insurance. Help given in a good year comes back in a bad one.',
    did: () => `You have helped Widow Ames ${S.helpedAmes} time${S.helpedAmes === 1 ? '' : 's'}.`,
    today: 'Co-ops, credit unions and mutual insurance companies grew out of this idea. Friends and family are still most people\'s first safety net.' },
  sod: { title: 'Time is the scarce thing', what: 'Every hour spent one way is an hour not spent another. Economists call what you gave up the opportunity cost.',
    did: () => `You have ${S.acres} acres broken${S.plow ? ' and a steel plow' : ''}${S.reaper ? ' and a reaper' : ''}.`,
    today: 'A commute, a side job, a night class: each one costs the hours you could have spent on something else. Tools and skills that save hours pay you back every year.' },
  saving: { title: 'Saving at interest', what: 'Money in a bank earns interest because the bank lends it out to others.',
    did: () => `You have ${money(S.savings)} in the bank at 5% a year.`,
    today: 'High-yield savings accounts pay interest too. At 4%, $1,000 becomes about $1,480 in ten years without adding a cent.' },
};
handlers.almanac = () => {
  const keys = Object.keys(ALMANAC).filter((k) => S.almanac[k]);
  const body = keys.length ? keys.map((k) => {
    const a = ALMANAC[k];
    return `<div class="entry"><h3>${a.title}</h3><div class="role">Found ${S.almanac[k].season} ${S.almanac[k].year}</div>
      <div><div class="k">What it is</div><p>${a.what}</p></div>
      <div class="yours"><div class="k">What it did to you</div><p>${a.did()}</p></div>
      <div><div class="k">Today</div><p>${a.today}</p></div></div>`;
  }).join('') : '<p>Nothing yet. Entries appear the first time you run into an idea in play.</p>';
  const back = S.phase === 'end' ? 'chapterEnd' : 'close';
  sheet(`<div class="alm"><div class="top" style="display:flex;justify-content:space-between;align-items:baseline"><div class="h">The Almanac</div><div class="note">${keys.length} of ${Object.keys(ALMANAC).length} found</div></div>${body}</div>
    <button class="bigbtn" data-act="${back}">${back === 'close' ? 'Close the Almanac' : 'Back'}</button>`);
};
$('#almBtn').addEventListener('click', () => { if (S && (S.phase === 'day' || S.phase === 'end')) handlers.almanac(); });

// ------------------------------------------------------------------ start

function creation(look) {
  look = look || { family: 'Hollis', first: 'Jonah', skin: 3, hair: 0 };
  const skins = LOOK.skins.map((_, i) => `<button class="sw" data-act="skin:${i}" aria-label="Skin tone ${i + 1}" aria-pressed="${i === look.skin}">${ART.player[`${i}-${look.hair}`]}</button>`).join('');
  const hairs = LOOK.hairs.map((h, i) => `<button class="sw hair" data-act="hair:${i}" aria-label="Hair color ${i + 1}" aria-pressed="${i === look.hair}" style="background:${h}"></button>`).join('');
  sheet(`<div class="h" style="font-size:28px">Begin your family</div>
    <div class="say">Kansas, spring 1866. You have filed a homestead claim: 160 acres of prairie that become yours if you live on it for five years. You have ${money(K.startCash)} and eight acres of broken sod.</div>
    <div class="hero">${ART.playerFront[`${look.skin}-${look.hair}`]}</div>
    <div class="grid2">
      <div class="field"><label for="fam">Family name</label><input id="fam" maxlength="16" value="${look.family}" autocomplete="off"></div>
      <div class="field"><label for="first">First head of the family</label><input id="first" maxlength="14" value="${look.first}" autocomplete="off"></div>
    </div>
    <div><div class="lbl">Skin</div><div class="swatches">${skins}</div></div>
    <div><div class="lbl">Hair</div><div class="swatches">${hairs}</div></div>
    <div class="note">How you look is yours to choose. It changes nothing in the game.</div>
    <button class="bigbtn" data-act="begin">Begin · Spring 1866</button>`);
  $('#sheet').style.top = '0'; $('#sheet').style.maxHeight = 'none';
  handlers.skin = (i) => creation({ ...readNames(look), skin: +i });
  handlers.hair = (i) => creation({ ...readNames(look), hair: +i });
  handlers.begin = () => {
    const l = readNames(look);
    l.family = l.family.trim() || 'Hollis'; l.first = l.first.trim() || 'Jonah';
    $('#sheet').style.top = ''; $('#sheet').style.maxHeight = '';
    start(newGame(l));
  };
}
function readNames(look) {
  return { ...look, family: ($('#fam') && $('#fam').value) || look.family, first: ($('#first') && $('#first').value) || look.first };
}

async function start(state) {
  S = state;
  await engine.setPlayerLook(playerKey());
  $('#hud').hidden = false; $('#dock').hidden = false;
  closeSheetQuiet();
  engine.resize();
  if (S.phase === 'end') { render(); return handlers.chapterEnd(); }
  if (S.phase === 'letter') { render(); return handlers.letter(); }
  if (S.phase === 'ledger' || S.phase === 'night') {
    // Resume at the start of the day rather than mid-sheet.
    S.minute = DAWN;
  }
  const resume = S.phase === 'day' && S.minute > DAWN;
  if (resume) {
    placeNpcs(); engine.place('town', HOME_DOOR); side = 'claim'; render(); engine.enable(true);
    banner(`${seasonName()} ${S.year} · Day ${S.day} of ${DAYS}`, [`${clock(S.minute)}. You are back at the house.`]);
  } else morning();
}

engine = createEngine($('#scene'), {
  insets: () => ({ top: ($('#hud').offsetHeight || 96), bottom: ($('#dock').offsetHeight || 90) }),
  onArrive: (t) => arriveAt(t),
  onNear: (t) => { near = t; if (S) updateDock(); },
  onStep,
  onScene: () => { if (S && engine && engine.scene === 'town') side = sideOf(engine.player.y) || side; },
  onBlocked: () => toast("You can't get there from here."),
  roomState: () => (S ? {
    jars: S.jars, tab: S.tab, family: S.look.family, plow: S.plow, reaper: S.reaper, year: S.year, minute: S.minute, bookLog: S.bookLog,
    wired: S.wired, bankClosed: S.bankClosed, boardPrice: S.wired ? `WHEAT  ${cents(chicago())}` : '', boardNote: S.wired ? `${seasonName()} ${S.year}` : '',
    prices: { seed: cents(K.seed), plow: `${money(20)} CASH`, reaper: `${money(K.reaperCash)} CASH`, jar: `${money(K.jarCost)} A JAR` },
  } : {}),
});
engine.enable(false);
await engine.ready;
const saved = load();
if (saved && saved.v === 2) start(saved); else creation();

// A small hook for automated playtests.
window.__prove = { get S() { return S; }, get busy() { return busy; }, handlers, engine, arriveAt, endDay, K, pass, closeSheet };
