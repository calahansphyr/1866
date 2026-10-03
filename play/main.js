// 1866: Prove Up — the Frontier slice, 1866 to 1873.
// One family, sixteen seasons, three visits a season. The game grades each
// decision against the ten ways the year could have gone.

import { createWorld } from './world.js';
import { ART, LOOK } from './art.js';

// ------------------------------------------------------------------ numbers

const K = {
  startCash: 30, startAcres: 8, maxAcres: 40, sod: 5,
  seed: 1.5, yield: 14, plowBonus: 1.25, hiredPenalty: 0.85, wage: 30,
  living: 30, winter: 35, hardWinter: 55, hardP: 0.25, droughtP: 0.2,
  tabHalf: Math.pow(1.03, 6) - 1, // 3% a month, six months a season
  jarCost: 4, jarValue: 5, maxJars: 14, wire: 1,
  savingsRate: 0.05, loanAmt: 50, loanRate: 0.10, lateRate: 0.15,
  forty: 120, fortyAcres: 20, mortgage: 150,
  reaperCash: 35, reaperDown: 8, reaperPay: 8, reaperPays: 6, reaperBonus: 1.2,
  stockCost: 30,
};
const BASE_PRICE = { 1866: 1.30, 1867: 1.45, 1868: 1.20, 1869: 0.95, 1870: 1.00, 1871: 1.15, 1872: 1.10, 1873: 0.70, 1874: 0.85 };
const STOCK = { 'S1872': 30, 'F1872': 36, 'S1873': 44, 'F1873': 6 };
const FIRST = 1866, LAST = 1873;

const $ = (s) => document.querySelector(s);
const money = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
const cents = (n) => '$' + n.toFixed(2);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The world is drawn once per run: weather, prices, and whether Cole's bank survives 1873.
function newWorld(seed) {
  const r = rng(seed);
  const w = { seed, years: {} };
  for (let y = FIRST; y <= LAST + 1; y++) {
    w.years[y] = {
      drought: r() < K.droughtP, bumper: r() < 0.2,
      hard: r() < K.hardP,
      price: +(BASE_PRICE[y] * (1 + (r() - 0.5) * 0.24)).toFixed(2),
      winters: Array.from({ length: 10 }, () => r() < K.hardP),
    };
  }
  w.years[1872].hard = true; // the winter everyone remembers
  w.bankFails = r() < 0.6;
  return w;
}

function newGame(look) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  return {
    v: 1, look, world: newWorld(seed),
    year: FIRST, half: 0, visits: 3, phase: 'town',
    cash: K.startCash, tab: 0, jars: 0, acres: K.startAcres, planted: 0, plow: false, reaper: null,
    grain: 0, savings: 0, frozen: 0, loan: null, mortgage: null, stock: 0, titled: false, boughtForty: false,
    hired: false, wired: false, soldAt: null, interestPaid: 0, seedOnBook: null,
    helpedAmes: 0, amesOwes: false, askedRuth: 0, askedThisTurn: false, lateMarks: 0, onTime: 0, wires: 0,
    almanac: {}, decisions: [], letters: [], tips: 0, withdrewIn73: false,
  };
}

let S = null;
let world = null;
let near = null;

// ------------------------------------------------------------------ helpers

function save() { try { localStorage.setItem('prove-up', JSON.stringify(S)); } catch (e) { /* storage blocked */ } }
function load() { try { const t = localStorage.getItem('prove-up'); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function wipe() { try { localStorage.removeItem('prove-up'); } catch (e) { /* storage blocked */ } }

function Y() { return S.world.years[S.year]; }
const seasonName = () => (S.half === 0 ? 'Spring' : 'Fall');
function chicago() { return S.half === 0 ? +(S.world.years[S.year].price * 0.97).toFixed(2) : Y().price; }
function pruittPays() { return +(chicago() * (S.wired ? 0.95 : 0.8)).toFixed(2); }
function stockValue() { return S.stock ? (STOCK[(S.half === 0 ? 'S' : 'F') + S.year] ?? (S.year > 1873 ? 6 : 30)) * S.stock : 0; }
function netWorth() {
  return S.cash + S.jars * K.jarValue + S.savings + S.frozen + S.grain * chicago() * 0.9 + stockValue()
    + S.acres * 8 + (S.titled ? 160 * 2 : 0) + (S.plow ? 15 : 0) + (S.reaper ? 25 : 0)
    - S.tab - (S.loan ? S.loan.due : 0) - (S.mortgage ? S.mortgage.amt : 0) - (S.reaper && S.reaper.left ? S.reaper.left * K.reaperPay : 0);
}

// Pay from cash first; whatever is short goes on Pruitt's book.
function spend(amt, lines, label) {
  const fromCash = Math.min(S.cash, amt);
  S.cash -= fromCash;
  const onTab = amt - fromCash;
  S.tab += onTab;
  lines && lines.push([onTab > 0.5 ? `${label} (${money(onTab)} on the book)` : label, -amt]);
  return onTab;
}

function unlock(key) {
  if (S.almanac[key]) return;
  S.almanac[key] = { year: S.year, season: seasonName() };
  toast(`New in the Almanac: ${ALMANAC[key].title}`);
}

function decide(d) { S.decisions.push({ year: S.year, ...d }); }

let toastT = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2600);
}

const chev = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2 L8 6 L4 10" fill="none" stroke="#8A3A2A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const check = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0;margin-top:4px"><path d="M2 7.5 L5.5 11 L12 3" fill="none" stroke="#3E6B2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ring = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style="flex-shrink:0;margin-top:4px"><circle cx="7" cy="7" r="5" fill="none" stroke="#5A4A3A" stroke-width="1.6" stroke-dasharray="2.5 2"/></svg>';
const jarSvg = (full) => `<svg width="13" height="17" viewBox="0 0 13 17" aria-hidden="true"><rect x="1.5" y="4" width="10" height="12" rx="2" fill="${full ? '#D99A4E' : 'none'}" stroke="#2A2420" stroke-width="1.3" ${full ? '' : 'stroke-dasharray="2 2"'}/><rect x="3" y="1" width="7" height="3" fill="${full ? '#8A6A4A' : 'none'}" stroke="#2A2420" stroke-width="1.1"/></svg>`;
const bootSvg = (on) => `<svg width="15" height="15" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1 H8 V9 H13 V13 H3 Z" fill="${on ? '#7A4A2A' : 'none'}" stroke="#2A2420" stroke-width="1.2" ${on ? '' : 'stroke-dasharray="2 1.5"'}/></svg>`;

const playerKey = () => `${S.look.skin}-${S.look.hair}`;
function portrait(who) {
  const svg = who === 'player' ? ART.player[playerKey()] : ART.npc[who];
  return `<div class="portrait">${svg}</div>`;
}
const NPC = {
  ruth: ['Grandma Ruth', "the family elder, saw the Panic of '57"],
  pruitt: ['Mr. Pruitt', 'keeps the general store'],
  cole: ['Mr. Cole', 'runs the bank'],
  clerk: ['Mr. Finch', 'the telegraph clerk'],
  brandt: ['Herr Brandt', 'neighbor, reads the German papers'],
  ames: ['Widow Ames', 'neighbor across the creek'],
  drummer: ['Mr. Valentine', 'a traveling salesman'],
};
function speak(who, text) {
  return `<div class="speaker">${portrait(who)}<div><div class="who">${NPC[who][0]}</div><div class="role">${NPC[who][1]}</div><div class="say">${text}</div></div></div>`;
}
function choice(act, label, cost = '', disabled = false) {
  return `<button class="choice" data-act="${act}" ${disabled ? 'disabled' : ''}>${chev}<span>${label}</span>${cost ? `<span class="cost">${cost}</span>` : ''}</button>`;
}
const leave = (label = 'Tip your hat and walk on') => `<button class="walk" data-act="close">${label}</button>`;

// ------------------------------------------------------------------ sheets

const handlers = {};
function sheet(html, opts = {}) {
  $('#sheetIn').innerHTML = html;
  $('#sheet').classList.toggle('full', !!opts.full);
  $('#sheet').hidden = false; $('#veil').hidden = !!opts.full;
  world && world.enable(false);
  $('#sheet').scrollTop = 0;
  const f = $('#sheet').querySelector('button:not([disabled]), input');
  f && f.focus({ preventScroll: true });
}
function closeSheet() {
  $('#sheet').hidden = true; $('#veil').hidden = true;
  world && world.enable(true);
  render();
}
$('#sheet').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const [name, arg] = b.dataset.act.split(':');
  if (name === 'close') return closeSheet();
  handlers[name] && handlers[name](arg, b);
});
$('#veil').addEventListener('click', () => { if (S && S.phase === 'town') closeSheet(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden && S && S.phase === 'town') closeSheet(); });

// ------------------------------------------------------------------ header

function render() {
  if (!S) return;
  $('#family').textContent = `The ${S.look.family} Family`;
  $('#when').textContent = `${seasonName()} ${S.year}`;
  $('#cash').textContent = money(S.cash);
  $('#tabv').textContent = `Tab ${money(S.tab)}`;
  $('#tab').classList.toggle('owed', S.tab > 0.5);
  const shown = Math.max(4, Math.min(8, S.jars));
  $('#jars').innerHTML = Array.from({ length: shown }, (_, i) => jarSvg(i < S.jars)).join('') + (S.jars > 8 ? `<span style="font-size:13px">×${S.jars}</span>` : '');
  $('#jars').title = `${S.jars} jars in the cellar, worth ${money(S.jars * K.jarValue)} of winter food`;
  $('#boots').innerHTML = [0, 1, 2].map((i) => bootSvg(i < S.visits)).join('');
  const crop = S.planted > 0;
  world.setSeason(S.half === 0 ? 0 : 2, crop);
  world.setVisible('drummer', S.half === 0 && (S.year === 1868 || S.year === 1872));
  updateDock();
}

function updateDock() {
  const act = $('#act'), hint = $('#hint');
  if (!near) {
    act.hidden = true;
    hint.textContent = S.visits > 0 ? 'Tap the ground or a sign to walk there. Walk up to a door or a neighbor.' : 'No visits left this season. Head home or end the season.';
    return;
  }
  const p = PLACES[near];
  act.hidden = false;
  const free = p.free;
  act.textContent = `${p.verb}${free ? '' : ' · 1 visit'}`;
  act.disabled = !free && S.visits <= 0;
  hint.textContent = !free && S.visits <= 0 ? 'No visits left this season.' : p.hint();
}

// ------------------------------------------------------------------ places

const PLACES = {
  home: { verb: 'Go home', free: true, hint: () => 'Home is free. Grandma Ruth is by the stove.', open: openHome },
  store: { verb: "Go into Pruitt's", hint: () => (S.half === 0 ? 'Seed, tools and the book.' : 'Sell the harvest, put up jars, settle the book.'), open: openStore },
  bank: { verb: 'Go into the bank', hint: () => 'Savings, loans and land.', open: openBank },
  wire: { verb: 'Go into the telegraph office', hint: () => 'Chicago prices, for a dollar.', open: openWire },
  brandt: { verb: 'Talk to Herr Brandt', hint: () => 'He reads the German papers.', open: openBrandt },
  ames: { verb: 'Talk to Widow Ames', hint: () => 'She lives across the creek.', open: openAmes },
  drummer: { verb: 'Talk to Mr. Valentine', hint: () => 'A salesman with a wagon of patent goods.', open: openDrummer },
};

function enter(key) {
  const p = PLACES[key];
  if (!p.free) { if (S.visits <= 0) return toast('No visits left this season.'); S.visits--; }
  render(); save();
  p.open();
}
$('#act').addEventListener('click', () => near && enter(near));

// ---------------- home and Grandma Ruth

function ruthQuestion() {
  const y = Y();
  if (S.year === 1873) return { q: 'When everyone runs to the bank at the same time, who gets paid, and who gets a closed door?', a: 'bankrun' };
  if (S.half === 0 && S.planted === 0) return { q: 'What will you sell in the fall if nothing is in the ground this spring?', a: null };
  if (S.tab > 1) {
    const t = S.tab;
    const by = (m) => cents(t * Math.pow(1.03, m));
    return { q: `Pruitt will write it in his book, sure. Now you tell me: what does that book say by January if the wheat comes in late?`, cal: [['Now', cents(t)], ['3 months', by(3)], ['6 months', by(6)], ['9 months', by(9)]], a: 'interest' };
  }
  if (S.half === 1 && S.jars * K.jarValue + S.cash < K.hardWinter) return { q: `If this winter is like the one in '56, what will you eat in February? Count it out: a hard winter takes ${money(K.hardWinter)}.`, a: 'buffer' };
  if (S.half === 1 && !S.wired && S.grain + S.planted > 0) return { q: 'Do you know what wheat fetches in Chicago, or only what Mr. Pruitt says it fetches?', a: 'price' };
  if (S.loan) return { q: `If the harvest fails, who still owes Mr. Cole ${money(S.loan.due)}?`, a: 'leverage' };
  if (S.stock) return { q: 'That paper from the salesman. What is under it besides his word?', a: 'hype' };
  if (y && S.half === 0 && S.acres < K.maxAcres) return { q: 'Ten dollars of wages this summer, or five more acres that pay every year after. Which one is still working for you in 1873?', a: 'sod' };
  return { q: 'What would you do with ten dollars you did not need this year?', a: 'saving' };
}

function openHome() {
  const q = ruthQuestion();
  if (!S.askedThisTurn) { S.askedThisTurn = true; S.askedRuth++; }
  if (q.a) unlock(q.a);
  const cal = q.cal ? `<div class="ledger" aria-label="Pencil sums on the calendar">${q.cal.map(([k, v], i) => `<div class="l"><span>${k}</span><b class="${i ? 'neg' : ''}">${v}</b></div>`).join('')}<div class="note">Pruitt charges 3% a month on the book.</div></div>` : '';
  sheet(`
    ${speak('ruth', `"${q.q}"`)}
    ${cal}
    <div class="choices">
      ${choice('almanac', 'Open the Almanac')}
      ${choice('restart', 'Start a new family')}
    </div>
    ${leave('Thank her and head into town')}
    <div class="note">Asking Ruth is free. She never tells you what to do.</div>`);
  save();
}
handlers.restart = () => {
  sheet(`<div class="h">Start over?</div><div class="say">This ends the ${S.look.family} family's run and starts a new one in Spring 1866.</div>
    <div class="choices">${choice('confirmRestart', 'Yes, start a new family')}</div>${leave('Keep playing')}`);
};
handlers.confirmRestart = () => { wipe(); location.reload(); };

// ---------------- Pruitt's store

function openStore() {
  const bits = [];
  if (S.half === 0) {
    const cost = S.acres * K.seed;
    const said = S.tab > 1 ? `"Your book stands at ${money(S.tab)}. Seed's ${cents(K.seed)} an acre. Pay me now or I'll write it down, no trouble at all."` : `"Seed wheat's ${cents(K.seed)} an acre. Cash, or I'll put it on the book. No trouble at all."`;
    bits.push(speak('pruitt', said));
    if (S.planted === 0) {
      bits.push(`<div class="choices">
        ${choice('seed:cash', `Buy seed for all ${S.acres} acres, pay cash`, money(cost), S.cash < cost)}
        ${choice('seed:book', `Buy seed for all ${S.acres} acres, put it on the book`, money(cost))}
      </div>`);
    } else bits.push(`<div class="note">${S.planted} acres are planted this year.</div>`);
    const tools = [];
    if (!S.plow) tools.push(choice('plow', 'A steel plow, yields up 25%', money(20)));
    if (!S.reaper && S.year >= 1868) tools.push(choice('reaper', 'A reaper, cash price, yields up 20%', money(K.reaperCash)));
    if (tools.length) bits.push(`<div class="choices">${tools.join('')}</div>`);
  } else {
    const p = pruittPays();
    const said = S.grain > 0 ? (S.wired ? `"Chicago's at ${cents(chicago())}, you say? Well. I can do ${cents(p)} a bushel."` : `"Wheat's soft this fall. ${cents(p)} a bushel is a fair price, I'd say."`) : '"Nothing to sell? Then let me show you the preserves."';
    bits.push(speak('pruitt', said));
    const c = [];
    if (S.grain > 0) {
      c.push(choice('sell', `Sell all ${Math.round(S.grain)} bushels`, `${cents(p)}/bu`));
      c.push(`<div class="note">Or keep it in the crib and sell in the spring. It might fetch more, or less, and some spoils.</div>`);
    }
    c.push(choice('jar:1', `Put up a jar for winter, worth ${money(K.jarValue)} of food`, money(K.jarCost), S.jars >= K.maxJars));
    c.push(choice('jar:5', 'Put up five jars', money(K.jarCost * 5), S.jars + 5 > K.maxJars));
    bits.push(`<div class="choices">${c.join('')}</div>`);
  }
  if (S.tab > 0.5) bits.push(`<div class="choices">${choice('paytab', `Pay down the book (${money(S.tab)})`, money(Math.min(S.cash, S.tab)), S.cash < 1)}</div>`);
  if (S.half === 0 && S.grain > 0) bits.push(`<div class="choices">${choice('sell', `Sell the ${Math.round(S.grain)} bushels you held over winter`, `${cents(pruittPays())}/bu`)}</div>`);
  sheet(bits.join('') + leave('Head back out'));
}
handlers.seed = (how) => {
  const cost = S.acres * K.seed;
  const hadCash = S.cash >= cost;
  if (how === 'cash') S.cash -= cost; else { S.tab += cost; unlock('interest'); }
  S.planted = S.acres;
  decide({ kind: 'seed', book: how === 'book', hadCash, cost });
  toast(`${S.planted} acres of wheat are in the ground.`);
  save(); openStore(); render();
};
handlers.plow = () => { spend(20); S.plow = true; unlock('sod'); toast('A steel plow. The sod turns easier.'); save(); openStore(); render(); };
handlers.reaper = () => { spend(K.reaperCash); S.reaper = { left: 0 }; toast('Bought a reaper outright.'); save(); openStore(); render(); };
handlers.sell = () => {
  const p = pruittPays();
  const v = S.grain * p;
  decide({ kind: 'sell', wired: S.wired, price: p, chicago: chicago(), held: S.half === 0 });
  S.cash += v; S.soldAt = p; S.grain = 0;
  unlock('price');
  toast(`Sold for ${money(v)}.`);
  save(); openStore(); render();
};
handlers.jar = (n) => {
  n = +n;
  const cost = n * K.jarCost;
  if (S.cash < cost) return toast("Pruitt won't put preserves on the book.");
  S.cash -= cost; S.jars += n; unlock('buffer');
  save(); openStore(); render();
};
handlers.paytab = () => {
  const pay = Math.min(S.cash, S.tab);
  S.cash -= pay; S.tab -= pay; if (S.tab < 0.5) S.tab = 0;
  toast(S.tab ? `Paid ${money(pay)}. ${money(S.tab)} still on the book.` : 'The book is settled.');
  save(); openStore(); render();
};

// ---------------- the bank

function openBank() {
  const bits = [];
  const rate = S.lateMarks ? 9 : 7;
  let said = `"Five percent a year on savings, paid every fall. A bank is a safer place for money than a coffee can."`;
  if (S.year === 1873 && S.half === 1) said = S.world.bankFails ? '"Everything is perfectly sound. There is no cause for alarm. None at all."' : '"Times are hard in the East, but we are a careful house."';
  else if (S.year >= 1868 && !S.loan) said += ` "I can lend ${money(K.loanAmt)} against your crop, too."`;
  bits.push(speak('cole', said));
  const c = [];
  {
    c.push(choice('deposit:10', 'Deposit $10', `${money(S.savings)} saved`, S.cash < 10));
    if (S.cash >= 50) c.push(choice('deposit:50', 'Deposit $50', '', false));
    c.push(choice('withdraw', 'Withdraw everything', money(S.savings), S.savings < 1));
  }
  if (S.year >= 1868 && !S.loan && !(S.year === 1873 && S.half === 1)) c.push(choice('loan', `Borrow ${money(K.loanAmt)} on the crop, due at harvest`, `${money(K.loanAmt * (1 + K.loanRate))} back`));
  if (S.loan) c.push(choice('repay', `Repay the crop loan`, money(S.loan.due), S.cash < S.loan.due));
  if (S.titled && !S.mortgage) c.push(choice('mortgage', `Mortgage the claim for ${money(K.mortgage)} at ${rate}%`, `${money(K.mortgage * rate / 100)} a year`));
  if (S.stock) c.push(choice('sellstock', 'Sell the railroad certificate', money(stockValue())));
  bits.push(`<div class="choices">${c.join('')}</div>`);
  if (S.year >= 1868) unlock('leverage');
  if (S.titled) unlock('collateral');
  sheet(bits.join('') + leave('Head back out'));
}
handlers.deposit = (n) => { n = Math.min(+n, S.cash); S.cash -= n; S.savings += n; unlock('saving'); save(); openBank(); render(); };
handlers.withdraw = () => {
  S.cash += S.savings; S.savings = 0;
  if (S.year === 1873) S.withdrewIn73 = true;
  save(); openBank(); render();
};
handlers.loan = () => {
  S.loan = { amt: K.loanAmt, due: +(K.loanAmt * (1 + K.loanRate)).toFixed(2), year: S.year };
  S.cash += K.loanAmt;
  decide({ kind: 'loan', amt: K.loanAmt, expected: S.planted * K.yield * Y().price * 0.8 });
  toast(`${money(K.loanAmt)} in hand, ${money(S.loan.due)} due at harvest.`);
  save(); openBank(); render();
};
handlers.repay = () => { S.cash -= S.loan.due; S.onTime++; S.loan = null; toast('Loan repaid.'); save(); openBank(); render(); };
handlers.mortgage = () => {
  const rate = S.lateMarks ? 0.09 : 0.07;
  S.mortgage = { amt: K.mortgage, rate }; S.cash += K.mortgage;
  decide({ kind: 'mortgage', rate });
  toast(`${money(K.mortgage)} against the land at ${Math.round(rate * 100)}%.`);
  save(); openBank(); render();
};
handlers.sellstock = () => {
  const v = stockValue(); S.cash += v;
  const d = S.decisions.find((x) => x.kind === 'stock' && x.soldFor == null);
  if (d) d.soldFor = v;
  S.stock = 0; toast(`Sold the certificate for ${money(v)}.`);
  save(); openBank(); render();
};

// ---------------- the telegraph office

function wireNews() {
  const y = S.year;
  if (y === 1873 && S.half === 1) return 'PHILADELPHIA SEPT 18. JAY COOKE AND CO CLOSED DOORS. NORTHERN PACIFIC BONDS UNSALEABLE. NEW YORK BANKS SUSPENDING. STOCK EXCHANGE SHUT.';
  if (y === 1873) return `CHICAGO WHEAT ${cents(chicago())}. RAILROAD BONDS SLIDING IN NEW YORK. VIENNA BOURSE CRASHED IN MAY. CREDIT TIGHT.`;
  if (S.half === 0) {
    const guess = Y().price * (1 + (rng(S.world.seed + y)() - 0.5) * 0.12);
    return `CHICAGO WHEAT ${cents(chicago())}. TRADE EXPECTS ${cents(guess)} BY HARVEST.${Y().drought ? ' DRY SPRING REPORTED IN KANSAS.' : ''}`;
  }
  return `CHICAGO WHEAT ${cents(chicago())} TODAY. COUNTRY BUYERS PAYING ${cents(chicago() * 0.8)}.`;
}
function openWire() {
  const bits = [speak('clerk', S.wired ? '"Same as I read you earlier. Nothing new on the wire."' : `"Chicago prices come over the wire every morning. A dollar to read you the sheet."`)];
  if (S.wired) bits.push(`<div class="ledger"><div style="font-family:var(--display);font-size:15px">${wireNews()}</div></div>`);
  else bits.push(`<div class="choices">${choice('buywire', "Pay to read today's wire", money(K.wire), S.cash < K.wire)}</div>`);
  sheet(bits.join('') + leave('Head back out'));
}
handlers.buywire = () => {
  S.cash -= K.wire; S.wired = true; S.wires++; unlock('price');
  if (S.year === 1873 && S.half === 1) unlock('bankrun');
  save(); openWire(); render();
};

// ---------------- neighbors

const TIPS = [
  ['"The railroad is coming through Salina. Wheat will be two dollars."', false],
  ['"In Germany they say American wheat sells well this year. The harvest in Russia is poor."', true],
  ['"A man in the saloon says land here will double by next spring."', false],
  ['"My cousin writes that the Chicago buyers are paying less than last year. Sell early, maybe."', true],
  ['"Grasshoppers in Nebraska, very many. Maybe they come here, maybe not."', false],
];
function openBrandt() {
  const tip = TIPS[(S.year * 2 + S.half + S.world.seed) % TIPS.length];
  let said = tip[0];
  if (S.year === 1873) said = '"In Vienna the banks are selling their American railway paper. When Europe sells, somebody over here is left holding it."';
  const bits = [speak('brandt', said)];
  const c = [];
  if (S.year >= 1869 && !S.boughtForty) c.push(choice('forty', `Buy his back forty: ${K.fortyAcres} broken acres`, money(K.forty), S.cash < K.forty));
  bits.push(`<div class="choices">${c.join('')}</div>`);
  if (!c.length) bits.push('<div class="note">Neighbors pass on what they hear. Some of it is true.</div>');
  sheet(bits.join('') + leave());
}
handlers.forty = () => {
  S.cash -= K.forty; S.acres = Math.min(60, S.acres + K.fortyAcres); S.boughtForty = true;
  decide({ kind: 'forty' });
  toast(`${K.fortyAcres} more acres. ${S.acres} broken in all.`);
  save(); closeSheet();
};

function openAmes() {
  const helped = S.helpedThisTurn;
  const said = helped ? '"Thank you again. I won\'t forget it."' : (S.half === 0 ? '"My Thomas left me a mortgage and forty acres I can\'t plow alone. Could you spare a morning?"' : '"The roof needs patching before the snow. I can\'t pay you, but I can put up preserves."');
  const bits = [speak('ames', said)];
  if (!helped) bits.push(`<div class="choices">${choice('help', 'Spend the morning helping her')}</div>`);
  sheet(bits.join('') + leave());
}
handlers.help = () => {
  S.helpedAmes++; S.helpedThisTurn = true; S.amesOwes = true; unlock('mutual');
  toast('Widow Ames will remember it.');
  save(); openAmes();
};

function openDrummer() {
  const bits = [];
  if (S.year === 1868) {
    bits.push(speak('drummer', `"The Valentine Patent Reaper! Nothing down but ${money(K.reaperDown)}, and ${money(K.reaperPay)} a season after. Cuts a field before breakfast, friend."`));
    bits.push(`<div class="choices">${choice('instal', `Take the reaper on installments`, `${money(K.reaperDown + K.reaperPay * K.reaperPays)} in all`, !!S.reaper)}</div>`);
    bits.push(`<div class="note">${money(K.reaperDown)} now, then ${money(K.reaperPay)} a season for ${K.reaperPays} seasons.</div>`);
  } else {
    bits.push(speak('drummer', `"Northern Pacific Railroad, friend! Jay Cooke himself is behind it. A certificate is ${money(K.stockCost)} today. My last customer doubled his money."`));
    bits.push(`<div class="choices">${choice('stock', 'Buy a certificate', money(K.stockCost), S.cash < K.stockCost || S.stock > 0)}</div>`);
  }
  unlock('hype');
  sheet(bits.join('') + leave('No thank you'));
}
handlers.instal = () => {
  spend(K.reaperDown); S.reaper = { left: K.reaperPays };
  decide({ kind: 'instal' });
  toast('A reaper, on installments.'); save(); closeSheet();
};
handlers.stock = () => {
  S.cash -= K.stockCost; S.stock = 1;
  decide({ kind: 'stock', cost: K.stockCost, share: K.stockCost / Math.max(1, netWorth()) });
  toast('You own a Northern Pacific certificate.'); save(); closeSheet();
};

// ------------------------------------------------------------------ the turn

$('#endBtn').addEventListener('click', () => {
  if (S.half === 0) {
    const warn = S.planted === 0 ? '<div class="say" style="color:var(--red)">Nothing is planted this year. There will be no harvest in the fall.</div>' : '';
    sheet(`<div class="h">How will you spend the summer?</div>${warn}
      <div class="choices">
        ${choice('summer:sod', `Break more sod on the claim`, S.acres >= K.maxAcres ? 'claim is all broken' : `+${K.sod} acres`, S.acres >= K.maxAcres)}
        ${choice('summer:hire', 'Hire out to the rail crews', `+${money(K.wage)} wages`)}
      </div>
      <div class="note">Hiring out pays now, but a half-tended field yields less. Broken sod pays every year after.</div>
      ${leave('Not yet')}`);
  } else {
    const tip = S.grain > 0 ? `<div class="say">You still have ${Math.round(S.grain)} bushels in the crib. They'll keep until spring, mostly.</div>` : '';
    sheet(`<div class="h">Close out the fall?</div>${tip}
      <div class="say">Winter comes next. Food and fuel take ${money(K.winter)} in a normal winter and ${money(K.hardWinter)} in a hard one, paid from the cellar first, then cash, then Pruitt's book.</div>
      <div class="choices">${choice('winter', 'Go into winter')}</div>${leave('Not yet')}`);
  }
});

handlers.summer = (how) => {
  const L = [];
  S.hired = how === 'hire';
  if (S.hired) { S.cash += K.wage; L.push(['Wages from the rail crews', K.wage]); decide({ kind: 'hire' }); }
  else { S.acres = Math.min(K.maxAcres, S.acres + K.sod); L.push([`Broke ${K.sod} more acres of sod (${S.acres} in all)`, 0]); decide({ kind: 'sod' }); unlock('sod'); }
  spend(K.living, L, 'Living costs, spring and summer');
  if (S.reaper && S.reaper.left) { spend(K.reaperPay, L, 'Reaper installment'); S.reaper.left--; }
  accrueTab(L);
  // The harvest.
  const y = Y();
  let f = 1;
  if (y.drought) f = 0.45; else if (y.bumper) f = 1.2;
  const bonus = (S.plow ? K.plowBonus : 1) * (S.reaper ? K.reaperBonus : 1) * (S.hired ? K.hiredPenalty : 1);
  const r = rng(S.world.seed + S.year * 7)();
  const bu = Math.round(S.planted * K.yield * f * bonus * (0.9 + r * 0.2));
  S.grain += bu;
  if (y.drought) L.push(['A dry summer: the wheat came in thin', 0, 'bad']);
  if (y.bumper && !y.drought) L.push(['A good summer: the heads came in heavy', 0, 'good']);
  if (S.hired && S.planted) L.push(['Half-tended fields yielded 15% less', 0, 'bad']);
  if (S.planted) L.push([`Harvest: ${bu} bushels of wheat in the crib`, 0, 'good']);
  S.half = 1; S.visits = 3; S.wired = false; S.helpedThisTurn = false; S.askedThisTurn = false; S.planted = 0;
  if (S.year === 1871 && !S.titled) { S.titled = true; L.push(['Five years on the claim: you proved up. The 160 acres are yours.', 0, 'good']); }
  if (S.stock) decideStockMark();
  save();
  showSeason(`Summer ${S.year}`, L, `Fall ${S.year}`);
};

function decideStockMark() { /* value is read live from the price table */ }

function accrueTab(L) {
  if (S.tab > 0.5) {
    const i = S.tab * K.tabHalf;
    S.tab += i; S.interestPaid += i;
    L.push([`Interest on Pruitt's book, six months at 3% a month`, -i, 'bad']);
    unlock('interest');
  }
}

handlers.winter = () => {
  const L = [];
  const y = Y();
  const cost = y.hard ? K.hardWinter : K.winter;
  const before = { jars: S.jars, cash: S.cash, tab: S.tab, ames: S.amesOwes };
  // Panic: the bank closes before the money can come out.
  if (S.year === 1873 && S.world.bankFails && S.savings > 0) {
    S.frozen = Math.round(S.savings * 0.7); L.push([`Cole's bank closed its doors. ${money(S.savings)} is frozen inside; maybe 70 cents on the dollar, someday`, -S.savings + S.frozen, 'bad']);
    decide({ kind: 'bank', lost: true, amt: S.savings }); S.savings = 0;
  } else if (S.year === 1873 && S.withdrewIn73) decide({ kind: 'bank', lost: false, pulled: true });
  else if (S.year === 1873 && S.savings > 0) decide({ kind: 'bank', lost: false });
  if (S.savings > 0) { const i = S.savings * K.savingsRate; S.savings += i; L.push(['Interest on savings at the bank', i, 'good']); }
  // Debts come due.
  if (S.loan) {
    if (S.cash >= S.loan.due) { S.cash -= S.loan.due; L.push(['Repaid the crop loan at harvest', -S.loan.due]); S.onTime++; S.decisions.filter((d) => d.kind === 'loan' && d.repaid == null).forEach((d) => { d.repaid = true; }); S.loan = null; }
    else {
      L.push([S.year === 1873 ? 'Mr. Cole called the crop loan and you could not pay. It rolls over at 15%' : "Couldn't repay the crop loan. It rolls over at 15%", 0, 'bad']);
      S.loan.due = +(S.loan.due * (1 + K.lateRate)).toFixed(2); S.lateMarks++;
      S.decisions.filter((d) => d.kind === 'loan' && d.repaid == null).forEach((d) => { d.repaid = false; });
    }
  }
  if (S.mortgage) { const i = S.mortgage.amt * S.mortgage.rate; spend(i, L, 'Mortgage interest for the year'); }
  if (S.reaper && S.reaper.left) { spend(K.reaperPay, L, 'Reaper installment'); S.reaper.left--; }
  // Winter itself.
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
  // Grain in the crib: some spoils.
  if (S.grain > 0) { const lost = Math.round(S.grain * 0.08); S.grain -= lost; L.push([`${lost} bushels spoiled in the crib`, 0, 'note']); }
  decide({ kind: 'winter', buffer: before.jars * K.jarValue + before.cash + (before.ames ? 10 : 0), hard: y.hard, onBook, cost });
  unlock('buffer');
  S.winterLines = L;
  save();
  showSeason(`Winter ${S.year}`, L, null, true);
};

function showSeason(title, L, next, toLetter) {
  S.phase = 'season';
  const rows = L.map(([t, a, k]) => `<div class="l"><span>${t}</span><b class="${a < -0.5 ? 'neg' : a > 0.5 ? 'pos' : ''}">${Math.abs(a) > 0.5 ? (a > 0 ? '+' : '-') + money(Math.abs(a)).replace('-', '') : ''}</b></div>`).join('');
  sheet(`<div class="letter plain">
      <div class="top"><div class="dear">${title}</div><div class="date">${S.look.family} family ledger</div></div>
      <div class="ledger">${rows || '<div class="l"><span>A quiet season.</span></div>'}
        <div class="l tot"><span>Cash</span><b>${money(S.cash)}</b></div>
        <div class="l"><span>Pruitt's book</span><b class="${S.tab > 0.5 ? 'neg' : ''}">${money(S.tab)}</b></div>
        <div class="l"><span>Jars in the cellar</span><b>${S.jars}</b></div>
      </div>
    </div>
    <button class="bigbtn" data-act="${toLetter ? 'letter' : 'nextTurn'}">${toLetter ? 'Read the letter home' : `On to ${next}`}</button>`, { full: true });
  render();
}
handlers.nextTurn = () => { S.phase = 'town'; save(); world.goHome(); closeSheet(); };

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
  for (const d of ds) {
    if (d.kind === 'seed') {
      const paid = S.tab < 0.5 || (winter && winter.onBook < 0.5 && S.tab < 0.5);
      const good = !d.book || !d.hadCash;
      lines.push({ stamp: stampOf(good, !d.book || paid), text: d.book ? "In the spring I put the seed on Pruitt's book instead of paying for it." : 'In the spring I paid cash for the seed.',
        why: d.book ? (d.hadCash ? `We had the cash. The book charges 3% a month, about 19% a season.` : 'We had no cash, so the book was the only way to plant.') : '' });
    }
    if (d.kind === 'sod') lines.push({ stamp: 'Sound', text: 'All summer I broke sod rather than hiring out to the rail crews.', why: `${K.sod} more acres that pay every year from now on.` });
    if (d.kind === 'hire') lines.push({ stamp: S.cash < 20 ? 'Sound' : 'Lucky', text: 'I hired out to the rail crews this summer.', why: 'Wages now, a thinner harvest later.' });
    if (d.kind === 'sell') {
      const fair = d.price >= d.chicago * 0.9;
      lines.push({ stamp: stampOf(d.wired, fair), text: `We sold the wheat at Pruitt's for ${cents(d.price)} a bushel.`, why: d.wired ? `I read the Chicago price first: ${cents(d.chicago)}.` : `Chicago was paying ${cents(d.chicago)}. I never asked.` });
    }
    if (d.kind === 'loan') {
      const good = d.amt <= Math.max(1, d.expected) * 0.4;
      lines.push({ stamp: stampOf(good, d.repaid !== false), text: `I borrowed ${money(d.amt)} from Mr. Cole against the crop.`, why: good ? 'Small next to what the field should bring.' : 'Big next to what the field could bring if the year went wrong.' });
    }
    if (d.kind === 'instal') lines.push({ stamp: 'Exposed', text: "I took the salesman's reaper on installments.", why: `${money(K.reaperDown + K.reaperPay * K.reaperPays)} in all. Pruitt sells one for ${money(K.reaperCash)} cash.` });
    if (d.kind === 'stock') {
      const sold = d.soldFor != null ? d.soldFor : stockValue();
      lines.push({ stamp: stampOf(false, sold > d.cost), text: "I bought a railroad certificate from the salesman.", why: `On his word alone. It is worth ${money(sold)} now.` });
    }
    if (d.kind === 'bank') {
      if (d.lost) lines.push({ stamp: 'Unlucky', text: `We kept ${money(d.amt)} in Mr. Cole's bank, and it closed.`, why: 'Saving was right. No one insured the deposits in 1873; the wire carried the warning.' });
      else if (d.pulled) lines.push({ stamp: 'Sound', text: 'When the news came over the wire, I took our money out of the bank.', why: 'Information, read in time.' });
    }
    if (d.kind === 'mortgage') lines.push({ stamp: 'Sound', text: `I mortgaged the claim at ${Math.round(d.rate * 100)}%.`, why: 'Now that the land is ours, it can carry a loan. It can also be lost to one.' });
  }
  if (winter) {
    const good = winter.buffer >= K.hardWinter;
    lines.push({ stamp: stampOf(good, winter.onBook < 0.5), winter: true,
      text: winter.hard ? (winter.onBook > 0.5 ? `Then the hardest winter anyone remembers. ${money(winter.onBook)} went back on the book.` : 'Then the hardest winter anyone remembers, and the cellar held.') : (winter.onBook > 0.5 ? `Even an ordinary winter put ${money(winter.onBook)} on the book.` : 'An ordinary winter, and we came through it fine.'),
      why: `Going in we had ${money(winter.buffer)} in jars and cash. A hard winter takes ${money(K.hardWinter)}.` });
  }
  return { lines, winter };
}

handlers.letter = () => {
  const { lines, winter } = gradeYear(S.year);
  const y = Y();
  const ten = y.winters.slice(); ten[6] = winter ? winter.hard : y.hard;
  const covered = ten.map((h) => winter && winter.buffer >= (h ? K.hardWinter : K.winter));
  const held = covered.filter(Boolean).length;
  const jars = ten.map((h, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><div class="jar ${covered[i] ? 'full' : 'empty'} ${i === 6 ? 'mine' : ''}" title="${h ? 'Hard winter' : 'Ordinary winter'}"></div><div style="font-size:9px;color:var(--muted)">${h ? 'hard' : ''}</div></div>`).join('');
  const nw = netWorth();
  S.letters.push({ year: S.year, nw: Math.round(nw), stamps: lines.map((l) => l.stamp) });
  const body = lines.slice(0, 5).map((l) => `<div class="line"><div class="stamp ${l.stamp}">${l.stamp}</div><p>${l.text}</p>${l.why ? `<div class="why">${l.why}</div>` : ''}</div>`).join('');
  sheet(`<div class="letter">
      <div class="top"><div class="dear">Dear Mother,</div><div class="date">December ${S.year}</div></div>
      ${body}
      <div class="winters"><div class="t">Ten winters that might have come</div><div class="grid">${jars}</div>
        <div style="font-size:13px;line-height:1.4">What we had put by would have lasted the winter in ${held} of them. The circled one is the winter we got.</div></div>
      <p>The family stands at ${money(nw)}.${S.tab > 0.5 ? ` We owe Pruitt ${money(S.tab)}.` : ' We owe Pruitt nothing.'}</p>
      <div class="sign">Your son, ${S.look.first} ${S.look.family}</div>
    </div>
    <button class="bigbtn light" data-act="${S.year === LAST ? 'chapterEnd' : 'newYear'}" style="background:var(--paper)">${S.year === LAST ? 'Seal it · End of the chapter' : `Seal it · Spring ${S.year + 1}`}</button>`, { full: true });
  save();
};

handlers.newYear = () => {
  S.year++; S.half = 0; S.visits = 3; S.wired = false; S.helpedThisTurn = false; S.askedThisTurn = false;
  S.phase = 'town';
  if (S.grain > 0) toast(`${Math.round(S.grain)} bushels are still in the crib. Pruitt will buy them this spring.`);
  save(); world.goHome(); closeSheet();
};

// ------------------------------------------------------------------ chapter end

function pips(n) { return Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join(''); }
handlers.chapterEnd = () => {
  S.phase = 'end';
  const nw = netWorth();
  const all = S.decisions.length ? gradeAll() : [];
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
  const habit = S.interestPaid > 20 ? `Pruitt's book cost this family ${money(S.interestPaid)} in interest. Pay it down first.` : S.wires < 2 ? 'You sold most years without knowing the Chicago price. Information is cheap next to what it saves.' : lucky > 1 ? 'Some of what went right was luck. Do not count on being lucky three times.' : 'Keep the cellar full and the book empty, and the rest takes care of itself.';
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
    did: () => (S.titled ? 'You proved up in 1871. The bank will now lend against the land.' : 'You do not own the land yet.'),
    today: 'A mortgage is backed by the house and a car loan by the car. Unsecured debt, like a credit card, costs more because nothing backs it.' },
  hype: { title: 'Salesmen and hype', what: 'Someone who earns a commission is paid to make you buy, whether or not it is good for you.',
    did: () => (S.stock || S.decisions.some((d) => d.kind === 'stock') ? `You bought a certificate for ${money(K.stockCost)}. It is worth ${money(stockValue())} now.` : S.reaper && S.reaper.left !== undefined && S.decisions.some((d) => d.kind === 'instal') ? `The reaper on installments costs ${money(K.reaperDown + K.reaperPay * K.reaperPays)}; cash at Pruitt's was ${money(K.reaperCash)}.` : 'You have heard Mr. Valentine out.'),
    today: 'Hot stock tips, crypto influencers and "no money down" offers. If someone profits when you buy, find a second opinion that does not.' },
  bankrun: { title: 'Bank runs', what: 'A bank lends out most of what it holds. If everyone asks for their money at once, it cannot pay them all, and it closes.',
    did: () => (S.frozen ? `${money(S.frozen)} of your savings is frozen in Cole's bank.` : S.withdrewIn73 ? 'You took your money out in time.' : 'In 1873 hundreds of banks suspended payments.'),
    today: 'Since 1933 the FDIC insures US bank deposits up to $250,000 per depositor, so a bank run like 1873 does not take your savings.' },
  mutual: { title: 'Helping each other', what: 'Before insurance companies, neighbors were the insurance. Help given in a good year comes back in a bad one.',
    did: () => `You have helped Widow Ames ${S.helpedAmes} time${S.helpedAmes === 1 ? '' : 's'}.`,
    today: 'Co-ops, credit unions and mutual insurance companies grew out of this idea. Friends and family are still most people\'s first safety net.' },
  sod: { title: 'Investing in your own work', what: 'Spending time or money now to earn more every year after.',
    did: () => `You have ${S.acres} acres broken${S.plow ? ' and a steel plow' : ''}.`,
    today: 'A certificate, a trade or a skill that raises your pay works like broken sod. It keeps paying long after the cost is gone.' },
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
$('#almBtn').addEventListener('click', () => handlers.almanac());

// ------------------------------------------------------------------ start

function creation(look) {
  look = look || { family: 'Hollis', first: 'Jonah', skin: 3, hair: 0 };
  const skins = LOOK.skins.map((_, i) => `<button class="sw" data-act="skin:${i}" aria-label="Skin tone ${i + 1}" aria-pressed="${i === look.skin}">${ART.player[`${i}-${look.hair}`]}</button>`).join('');
  const hairs = LOOK.hairs.map((h, i) => `<button class="sw hair" data-act="hair:${i}" aria-label="Hair color ${i + 1}" aria-pressed="${i === look.hair}" style="background:${h}"></button>`).join('');
  sheet(`<div class="h" style="font-size:28px">Begin your family</div>
    <div class="say">Kansas, spring 1866. You have filed a homestead claim: 160 acres of prairie that become yours if you live on it for five years. You have ${money(K.startCash)} and eight acres of broken sod.</div>
    <div class="hero">${ART.playerFull[`${look.skin}-${look.hair}`]}</div>
    <div class="grid2">
      <div class="field"><label for="fam">Family name</label><input id="fam" maxlength="16" value="${look.family}" autocomplete="off"></div>
      <div class="field"><label for="first">First head of the family</label><input id="first" maxlength="14" value="${look.first}" autocomplete="off"></div>
    </div>
    <div><div class="lbl">Skin</div><div class="swatches">${skins}</div></div>
    <div><div class="lbl">Hair</div><div class="swatches">${hairs}</div></div>
    <div class="note">How you look is yours to choose. It changes nothing in the game.</div>
    <button class="bigbtn" data-act="begin">Begin · Spring 1866</button>`, { full: false });
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

const PANTS = '#4F5D73';
function start(state) {
  S = state;
  const sk = LOOK.skins[S.look.skin], hr = LOOK.hairs[S.look.hair];
  world.setPlayer({ skin: sk, hair: hr, shirt: '#7F9F6E', pants: PANTS, boots: '#4A3222', suspenders: '#7A4A2A' });
  $('#hud').hidden = false; $('#dock').hidden = false;
  closeSheet();
  if (S.phase === 'season' || S.phase === 'end') {
    // Resume at the start of the current season rather than mid-sheet.
    if (S.phase === 'end') return handlers.chapterEnd();
    S.phase = 'town';
  }
  render();
  if (S.year === FIRST && S.half === 0 && S.visits === 3 && !S.decisions.length) setTimeout(() => toast('Walk to Pruitt\'s store to buy seed. Grandma Ruth is at home.'), 400);
}

world = createWorld($('#scene'), $('#labels'));
world.onNear((k) => { near = k; if (S) updateDock(); });
world.onTap(() => {});
world.enable(false);
const saved = load();
if (saved && saved.v === 1) start(saved); else creation();
