// The loop, one season per turn: the post arrives, three visits in town, set
// the farm, the season turns, a line in the letter home. Verdicts are shown in
// the letter at year's end, never live.

import { EVENTS, MECH, SHAPES, RUMORS, SCENARIOS } from './data.js';
import * as E from './engine.js';
import { Diorama } from './scene.js';

const $ = (sel) => document.querySelector(sel);
const money = (n) => `${n < 0 ? '−' : ''}$${Math.abs(Math.round(n))}`;
const SAVE = 'proveup-1866-save';

// Source reliability: a cheap source is often wrong about what reaches you.
const SOURCES = {
  church: { name: 'Church talk', note: 'free, weeks late and garbled', r: 0.55 },
  weekly: { name: 'Topeka Weekly', note: `$${E.C.weekly} a year, a week late`, r: 0.7 },
  daily: { name: 'Kansas City Daily', note: `$${E.C.daily} a year, six days late, sees a season ahead`, r: 0.8 },
  wire: { name: 'The wire', note: '$1 a visit, same week, sees a season ahead', r: 0.9 },
  brandt: { name: 'Herr Brandt', note: 'reads the German papers', r: 0.85 },
  plat: { name: 'The survey plat', note: 'the land office’s own map', r: 0.75 },
};
const SRC_CODE = { church: 1, weekly: 2, daily: 3, wire: 4, brandt: 5, plat: 6, saloon: 7 };
const GOLD = { 1866: 140, 1867: 138, 1868: 140, 1869: 133, 1870: 115, 1873: 114 };

let g, world, scene;

// ---- Game state ------------------------------------------------------------

function newGame(name) {
  const seed = (Math.random() * 2 ** 31) >>> 0;
  return {
    v: 1, seed, name, phase: 'post', s: E.newState(), visitsLeft: 3, info: {},
    stats: {}, seenShapes: {}, history: [], plan: null, depot: null, drought: false,
    pre: g?.pre ?? null, post: null, result: null, interlude: null, actions: [],
  };
}
function save() { try { localStorage.setItem(SAVE, JSON.stringify(g)); } catch (e) { /* private mode */ } }
function load() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } }

function card(t = g.s.turn) { return EVENTS[t]; }
function rel(src) { return Math.min(0.95, SOURCES[src].r + (g.s.skills.market && src !== 'plat' ? 0.1 : 0)); }

// A source's report on whether this season's shock reaches the county.
function signal(src, t) {
  const e = EVENTS[t];
  if (!e) return null;
  const r = rel(src);
  const roll = E.rng(E.mix(g.seed, t, SRC_CODE[src]))();
  const truth = world.ev[t].hit;
  const said = roll < r ? truth : !truth;
  if (e.p < 1) {
    const prev = g.info[t];
    if (!prev || prev.r < r) g.info[t] = { r, said, src };
    const key = `${src}:${t}`;
    if (!g.stats[key]) g.stats[key] = { src, right: said === truth };
  }
  return { said, line: said ? e.hitLine : e.missLine, r };
}

const view = () => ({ season: E.seasonOf(g.s.turn), turn: g.s.turn, netWorth: E.netWorth(g.s), depot: g.depot, drought: g.drought });
function turnNo(t) { return t >= 20 && t < E.INTERLUDE ? `Coda ${t - 19}/2` : `${t + 1}/20`; }

// ---- Rendering helpers ------------------------------------------------------

function rich(text, shape) {
  return text.replace(/\[\[(\w+)\|([^\]]+)\]\]/g, (_, k, w) => `<button class="term" data-term="${k}" data-shape="${shape || ''}">${w}</button>`);
}

function hud() {
  const s = g.s;
  $('#house').textContent = `House of ${g.name}`;
  $('#season').textContent = g.phase === 'title' ? '1866' : `${E.seasonLabel(s.turn >= E.END ? 21 : s.turn)} · ${turnNo(Math.min(s.turn, 21))}`;
  $('#cash').textContent = money(s.cash);
  $('#tab').textContent = money(s.tab);
  $('#tab').parentElement.classList.toggle('warn', s.tab > 0);
  $('#cellar').textContent = money(s.cellar);
  $('#nw').textContent = money(E.netWorth(s));
  scene?.update(s, view());
}

function sheet(html, { wide = false } = {}) {
  const el = $('#sheet');
  el.classList.remove('collapsed');
  el.classList.toggle('wide', wide);
  $('#sheet-body').innerHTML = html;
  $('#sheet-body').scrollTop = 0;
  hud();
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 2600);
}

// The margin note: plain words, how the money moves, what you hold that this
// touches, and (second time a shape appears) what it rhymes with. Never what
// happens next; never what to do.
function marginNote(term, shape) {
  const m = MECH[term];
  if (!m) return;
  let rhymes = '';
  const first = shape && g.seenShapes[shape];
  if (first !== undefined && first !== g.s.turn && EVENTS[first]) {
    rhymes = `<h4>Rhymes with</h4><p>${EVENTS[first].date}: ${EVENTS[first].title}. Same shape: <em>${SHAPES[shape]}</em>.</p>`;
  }
  $('#note-body').innerHTML = `
    <div class="kicker">Margin note</div>
    <h3>${m.name}</h3>
    <h4>Plain words</h4><p>${m.plain}</p>
    <h4>How the money moves</h4><ol class="chain">${m.how.map((h) => `<li>${h}</li>`).join('')}</ol>
    <h4>What you hold that this touches</h4><ul>${m.touches(g.s).map((h) => `<li>${h}</li>`).join('')}</ul>
    ${rhymes}`;
  $('#note').classList.add('open');
}

// ---- Phases -----------------------------------------------------------------

function showTitle() {
  g = g || { phase: 'title', s: E.newState(), name: '' };
  const saved = load();
  sheet(`
    <div class="kicker">A prototype</div>
    <h1>1866 · Prove Up</h1>
    <p class="lede">Twenty seasons on a Kansas claim, then the Panic of 1873. You play the House, not a person. The game never tells you what to do. It tells you what happened, how the money moves, and what you hold that it touches.</p>
    <p class="muted">The skill is reading the canary. Every time news lands, ask: <b>What do I hold that this touches? If this gets worse, what happens to it? Can the House survive that?</b></p>
    <div class="row">
      ${saved && saved.phase !== 'title' ? '<button class="btn" data-go="continue">Continue</button>' : ''}
      <button class="btn ${saved && saved.phase !== 'title' ? 'ghost' : ''}" data-go="pre">New game</button>
    </div>`);
}

function showScenario(which) {
  const sc = SCENARIOS[which];
  sheet(`
    <div class="kicker">${which === 'pre' ? 'One question first' : 'The exam after the exam'}</div>
    <h2>${sc.title}</h2>
    <p>${sc.setup}</p>
    <div class="choices">${sc.options.map((o, i) => `<button class="choice" data-scenario="${which}" data-i="${i}">${o.text}</button>`).join('')}</div>
    <p class="muted small">Not graded now. You’ll see how you did at the end.</p>`);
}

function showNaming() {
  sheet(`
    <div class="kicker">Spring 1866 · Eastern Kansas</div>
    <h2>Name your House</h2>
    <p>You came west with <b>$30</b>. Filing the claim at the land office cost <b>$14</b>. There are six acres of broken sod, a soddy, and a long way to the first crop.</p>
    <input id="name" maxlength="18" placeholder="Hollis" autocomplete="off" />
    <button class="btn" data-go="start">File the claim</button>`);
  setTimeout(() => $('#name')?.focus(), 50);
}

function newsItem(src, e, sig, t, extra = '') {
  const S = SOURCES[src];
  const rhyme = e.shape && g.seenShapes[e.shape] !== undefined && g.seenShapes[e.shape] < t
    ? `<div class="rhyme">Rhymes with ${EVENTS[g.seenShapes[e.shape]].date}</div>` : '';
  return `<div class="news">
    <div class="src"><b>${S.name}</b> · ${S.note}</div>
    <p class="head">${rich(e.headline, e.shape)}</p>
    ${sig && e.p < 1 ? `<p class="local">“${sig.line}”</p>` : ''}
    ${extra}${rhyme}</div>`;
}

function showPost() {
  const t = g.s.turn, e = card(t), nt = E.nextTurn(t), ne = EVENTS[nt];
  let items = '';
  if (e) {
    if (g.s.subs.daily) {
      items += newsItem('daily', e, signal('daily', t), t,
        (ne?.foreshadow ? `<p class="ahead"><b>Further out:</b> ${ne.foreshadow}</p>` : '') +
        `<p class="gold">Gold at ${GOLD[E.yearOf(t)]}. ${MECH.gold && `<button class="term" data-term="gold">What is that?</button>`}</p>`);
    } else if (g.s.subs.weekly) items += newsItem('weekly', e, signal('weekly', t), t);
    items += newsItem('church', e, signal('church', t), t);
  } else items = '<p class="muted">A quiet season. No news worth the name.</p>';
  if (e?.shape && g.seenShapes[e.shape] === undefined) g.seenShapes[e.shape] = t;
  const tips = t === 0 ? `<p class="hint">Tap any <span class="term-demo">underlined phrase</span> for a margin note. Paying for better news is a choice you make in town.</p>` : '';
  sheet(`
    <div class="kicker">${E.seasonLabel(t)} · The post arrives</div>
    <h2>${e ? e.title : 'The post'}</h2>
    ${tips}${items}
    <button class="btn" data-go="town">Go to town</button>`);
  scene.focus('all');
}

// What each building offers this season. Every explainer is right, and every
// explainer has a motive.
function buildingActions(id) {
  const s = g.s, t = s.turn, coda = t >= 20 && t < E.INTERLUDE;
  const x = E.eventCtx(t, world.ev[t]?.hit, world.ev[t]?.mag);
  const A = [];
  const act = (label, sub, ok, run) => A.push({ label, sub, ok, run });
  switch (id) {
    case 'store':
      return {
        who: 'Pruitt, storekeeper',
        say: s.tab > 0 ? `“No hurry on that ${money(s.tab)}. Everybody runs a tab out here.” He doesn’t mention the 3% a month.` : '“Take what you need, pay when the crop comes in. Everybody runs a tab.”',
        actions: [
          ...(s.plow ? [] : [{ label: `Buy a steel plow — ${money(E.C.plowPrice)}`, sub: 'Yields up a quarter, every harvest. On the tab if you’re short.', ok: true, run: () => { E.spendNow(s, E.C.plowPrice); s.plow = true; return 'You walk out with a steel plow.'; } }]),
          { label: 'Ask how the tab works', sub: 'A margin note', ok: true, run: () => { marginNote('tab'); return 'Pruitt explains, cheerfully.'; } },
        ],
      };
    case 'bank': {
      if (coda) {
        if (s.titled && !s.mortgage) act(`Mortgage the farm for $200`, '10% a year. Avery says land never goes down.', !x.creditTight, () => { E.mortgage(s, 200); return 'You sign. $200 in cash.'; });
        if (s.titled && !s.mortgage) act(`Mortgage the farm for $400`, 'The most Avery will write.', !x.creditTight, () => { E.mortgage(s, 400); return 'You sign. $400 in cash.'; });
        act('Buy Northern Pacific bonds, $100', '7.3% a year, sold by Jay Cooke’s agent at Avery’s window.', s.cash >= 100, () => { E.buyBonds(s, 100); return 'Two crisp bonds. 7.3%.'; });
        if (s.cash >= 300) act('Buy Northern Pacific bonds, $300', 'Same paper, more of it.', true, () => { E.buyBonds(s, 300); return 'Six crisp bonds.'; });
      } else {
        if (!s.note) {
          for (const amt of E.C.noteSizes) act(`Borrow ${money(amt)} on a note`, `10% a year, due ${E.seasonLabel(t + E.C.noteTerm)}.`, !x.creditTight, () => { E.borrow(s, amt); return `Avery counts out ${money(amt)}. The note is due ${s.note.dueLabel}.`; });
        } else act(`Repay the note — ${money(s.note.amount)}`, 'Early, before it’s called.', s.cash >= s.note.amount, () => { s.cash -= s.note.amount; s.note = null; return 'Paid in full. Avery looks disappointed.'; });
      }
      act('Ask how a note works', 'A margin note', true, () => { marginNote('note'); return 'Avery explains, at length.'; });
      return {
        who: 'Avery, banker',
        say: x.creditTight ? '“We’re not writing anything new this season. Talk to me in the spring.” He is reading a New York letter and doesn’t look up.' : coda ? '“Land never goes down, and Cooke’s paper pays seven-thirty. Put the farm to work.”' : '“A note at ten per cent beats Pruitt’s three a month. Why not borrow sixty and build?”',
        actions: A,
      };
    }
    case 'land':
      if (!s.lot && t >= 4 && t <= 9) act(`Buy a town lot — ${money(E.C.lotPrice)}`, 'The promoter says the depot is coming right here.', true, () => { E.buyLot(s); return 'You own lot 14, block 3, by the plat.'; });
      if (s.lot) act(`Sell your town lot`, `For ${money(s.lot.value * 0.8)}. Land sells slowly.`, !x.creditTight, () => { s.cash += s.lot.value * 0.8; s.lot = null; return 'Sold, at a discount.'; });
      if (t >= 8 && t <= 10) act('Study the survey plat', 'Where are the stakes going?', true, () => { const sg = signal('plat', 10); return `The clerk’s plat: ${sg.said ? 'the line runs through the town plat' : 'the line bends north, away from town'}. Maps have been wrong before.`; });
      if (!s.titled && t < 19 && !coda) act(`Commute the claim — ${money(E.C.commute)}`, 'Title now instead of after five years.', s.cash >= E.C.commute, () => { s.cash -= E.C.commute; s.titled = true; return 'The 160 acres are yours, today.'; });
      act('Ask about proving up', 'A margin note', true, () => { marginNote('proveup'); return 'The clerk explains.'; });
      return { who: 'The land office clerk', say: t >= 4 && t <= 9 ? 'A promoter in a good coat is selling lots from the counter. “Depot’s coming. Triple in a year.”' : '“Five years on the land and it’s yours. Or $1.25 an acre now.”', actions: A };
    case 'wire': {
      act('Read the wire — $1', 'This season, and a look at the next.', true, () => {
        E.spendNow(s, E.C.wire);
        const e = card(t), ne = EVENTS[E.nextTurn(t)];
        const sg = e && signal('wire', t);
        return `<b>${e ? e.title : 'Quiet'}.</b> ${sg ? sg.line : ''} ${ne?.foreshadow ? `<br><b>Further out:</b> ${ne.foreshadow}` : ''}<br>Gold at ${GOLD[E.yearOf(t)]} in New York.`;
      });
      act('Ask what the wire is worth', 'A margin note', true, () => { marginNote('telegraph'); return 'Miss Duval taps the key. “More than a dollar, some weeks.”'; });
      return { who: 'Miss Duval, operator', say: '“London to New York the same day now. Kansas City by the evening. A dollar a look.”', actions: A };
    }
    case 'paper':
      if (!s.subs.weekly && !s.subs.daily) act(`Subscribe to the Topeka Weekly — $${E.C.weekly}/yr`, 'Every season, a week late.', true, () => { E.spendNow(s, E.C.weekly); s.subs.weekly = true; return 'Hale shakes your hand. The Weekly will come with the post.'; });
      if (!s.subs.daily) act(`Subscribe to the Kansas City Daily — $${E.C.daily}/yr`, 'Better, and it sees a season ahead.', true, () => { E.spendNow(s, E.C.daily); s.subs.daily = true; s.subs.weekly = false; return 'The Daily will come by post. Hale looks hurt.'; });
      if (!s.skills.market) act('Learn to read the market page', 'Costs this visit. Every source you read gets more useful.', true, () => { s.skills.market = true; return 'An afternoon with Hale and a pile of old Dailies. You can read a gold quote and a grain table now.'; });
      return { who: 'Hale, editor', say: '“The church hears it three months late. My paper hears it in a week. You want the truth or the gossip?” He sells subscriptions.', actions: A };
    case 'yards':
      act(`Buy two piglets — $${E.C.hogBuy * 2}`, 'Grown by next fall. Eat feed meanwhile.', true, () => { E.spendNow(s, E.C.hogBuy * 2); s.piglets += 2; return 'Two piglets, squealing in a sack.'; });
      if (s.hogs) act(`Sell your ${s.hogs} grown hogs`, `At about ${money(E.C.hogValue * x.hogM)} a head today.`, true, () => { const v = s.hogs * E.C.hogValue * x.hogM; s.cash += v; s.hogs = 0; return `Sold for ${money(v)}.`; });
      if (!s.skills.apprentice) act('Apprentice with the drover', 'Costs this visit. Wages up $10 for good.', true, () => { s.skills.apprentice = true; return 'A season of learning the yards. Your wages are worth more now.'; });
      act('Ask about livestock', 'A margin note', true, () => { marginNote('livestock'); return 'The drover talks hogs.'; });
      return { who: 'The drover', say: x.hogM > 1 ? '“McCoy’s buyers are paying up. Good time to have hogs.”' : '“Hogs are a bank that eats corn.”', actions: A };
    case 'saloon': {
      const e = card(t);
      act('Listen to the talk', 'Free. Worth about that.', true, () => {
        const rm = RUMORS[E.rng(E.mix(g.seed, t, 77))() * RUMORS.length | 0];
        return `“${rm.text}”`;
      });
      if (e && (e.shape === 'credit' || e.shape === 'war')) act('Ask Herr Brandt what the German papers say', 'He reads Frankfurt’s news.', true, () => {
        const sg = signal('brandt', t);
        return `“${sg.line}” Then: “If you ever want to sell your back forty, I pay cash.”`;
      });
      if (s.acres > 10 && !coda) act('Sell Brandt 4 acres of broken sod — $30', 'Cash now. Less land to farm.', true, () => { s.acres -= 4; s.cash += 30; return 'Brandt counts out thirty dollars. He seems pleased.'; });
      return { who: 'Brandt and the regulars', say: '“Can’t lose,” somebody says about something. Herr Brandt, your German neighbor, is reading a Frankfurt paper in the corner.', actions: A };
    }
  }
}

function showTown() {
  g.phase = 'town'; save();
  scene.focus('town'); scene.setTownActive(true);
  const s = g.s;
  const done = g.visited || [];
  sheet(`
    <div class="kicker">${E.seasonLabel(s.turn)} · A week in town</div>
    <h2>${g.visitsLeft} visit${g.visitsLeft === 1 ? '' : 's'} left</h2>
    <p class="muted">Tap a building. You can’t see everything, so choose where to look.</p>
    <div class="buildings">${['store', 'bank', 'land', 'wire', 'paper', 'yards', 'saloon'].map((id) => `<button class="bchip ${done.includes(id) ? 'done' : ''}" data-visit="${id}" ${g.visitsLeft ? '' : 'disabled'}>${({ store: 'General Store', bank: 'Bank', land: 'Land Office', wire: 'Telegraph', paper: 'Newspaper', yards: 'Stockyard', saloon: 'Saloon' })[id]}</button>`).join('')}</div>
    <button class="btn" data-go="farm">${g.visitsLeft ? 'Head home early' : 'Head home'}</button>`);
}

function visit(id) {
  if (g.phase !== 'town') return;
  if (!g.visitsLeft) return toast('No visits left this season.');
  g.visitsLeft--;
  (g.visited = g.visited || []).push(id);
  const b = buildingActions(id);
  g.current = id;
  save();
  sheet(`
    <div class="kicker">${b.who}</div>
    <h2>${({ store: 'General Store', bank: 'Bank', land: 'Land Office', wire: 'Telegraph', paper: 'Newspaper', yards: 'Stockyard', saloon: 'Saloon' })[id]}</h2>
    <p class="say">${rich(b.say)}</p>
    <div class="choices">${b.actions.map((a, i) => `<button class="choice" data-act="${i}" ${a.ok ? '' : 'disabled'}><b>${a.label}</b><span>${a.ok ? a.sub : 'Not this season.'}</span></button>`).join('')}</div>
    <button class="btn ghost" data-go="street">Back to the street</button>`);
  showVisit.actions = b.actions;
}
function showVisit() {}

function doAction(i) {
  const a = showVisit.actions?.[i];
  if (!a || !a.ok) return;
  const out = a.run();
  g.actions.push({ turn: g.s.turn, label: a.label.replace(/ —.*/, '') });
  save();
  sheet(`
    <div class="kicker">${E.seasonLabel(g.s.turn)}</div>
    <p class="say">${out}</p>
    <button class="btn" data-go="street">Back to the street</button>`);
}

function defaultPlan() {
  const s = g.s, season = E.seasonOf(s.turn);
  const p = g.plan ? { ...g.plan } : { hire: false, cellar: 0, payTab: 0, hold: false };
  if (season === 0) { p.corn = Math.ceil(s.acres / 2); p.wheat = s.acres - p.corn; }
  p.cellar = season === 2 ? 30 : 0;
  p.payTab = Math.ceil(s.tab / 5) * 5;
  p.hold = false;
  return p;
}

function showFarm() {
  g.phase = 'farm'; save();
  scene.setTownActive(false); scene.focus('claim');
  const s = g.s, season = E.seasonOf(s.turn), p = defaultPlan();
  g.draft = p;
  const wage = (season === 3 ? E.C.winterWage : E.C.wage) + (s.skills.apprentice ? E.C.apprenticeBonus : 0);
  const cost = season === 3 ? `$${E.C.living[3]} (a hard winter: $${E.C.hardWinter})` : `$${E.C.living[season]}`;
  sheet(`
    <div class="kicker">${E.seasonLabel(s.turn)} · Set the farm</div>
    <h2>${['Plant and plan', 'Tend or hire out', 'Harvest and put up', 'See out the winter'][season]}</h2>
    <p class="muted small">Living costs this season: ${cost}. The <button class="term" data-term="reserve">cellar</button> pays first, then cash, then the <button class="term" data-term="tab">tab</button>.</p>
    ${season === 0 ? `
      <div class="field"><label>Corn <b id="v-corn">${p.corn} ac</b></label><input type="range" id="f-corn" min="0" max="${s.acres}" value="${p.corn}"></div>
      <div class="field"><label>Wheat <b id="v-wheat">${p.wheat} ac</b></label><input type="range" id="f-wheat" min="0" max="${s.acres}" value="${p.wheat}"></div>
      <p class="muted small">${s.acres} acres broken. Seed: corn $${E.C.cornSeed}/ac, wheat $${E.C.wheatSeed}/ac. Corn fears <button class="term" data-term="drought">drought</button>; wheat’s price is set in <button class="term" data-term="grain">Chicago and Liverpool</button>.</p>` : ''}
    <div class="field"><label>Your hands this season</label>
      <div class="seg">
        <button data-hire="0" class="${p.hire ? '' : 'on'}">Work the claim<span>${season <= 1 && s.acres < E.C.maxAcres ? `break ${E.C.sodPerSeason} more acres` : season === 2 ? 'bring in the whole harvest' : 'mend and wait'}</span></button>
        <button data-hire="1" class="${p.hire ? 'on' : ''}">Hire out<span>about $${wage}${season <= 2 ? ', fields half-tended' : ''}</span></button>
      </div></div>
    ${season === 2 ? `<div class="field"><label>The harvest</label>
      <div class="seg">
        <button data-hold="0" class="on">Sell at harvest<span>cash now, at the fall price</span></button>
        <button data-hold="1">Hold to spring<span>sell in spring, a little spoils</span></button>
      </div></div>` : ''}
    <div class="field"><label>Then put up stores, up to <b id="v-cellar">$${p.cellar}</b></label><input type="range" id="f-cellar" min="0" max="60" step="5" value="${p.cellar}">
      <p class="muted small">${season === 2 ? 'At harvest prices: each $1 buys $1.25 of January food.' : 'At store prices.'} Cellar now: ${money(s.cellar)}.</p></div>
    ${s.tab > 0 || season === 0 ? `<div class="field"><label>Then pay toward the tab, up to <b id="v-pay">$${p.payTab}</b></label><input type="range" id="f-pay" min="0" max="${Math.max(5, Math.ceil(s.tab / 5) * 5 + 40)}" step="5" value="${p.payTab}"></div>` : ''}
    <p class="muted small">Stores and payments come out of whatever cash you have after the season’s income.</p>
    <button class="btn" data-go="turn">Turn the season</button>`);
  const bind = (id, key, fmt) => {
    const el = $(`#f-${id}`); if (!el) return;
    el.addEventListener('input', () => {
      g.draft[key] = +el.value;
      if (season === 0) {
        const other = key === 'corn' ? 'wheat' : key === 'wheat' ? 'corn' : null;
        if (other && g.draft.corn + g.draft.wheat > s.acres) { g.draft[other] = s.acres - g.draft[key]; $(`#f-${other}`).value = g.draft[other]; $(`#v-${other}`).textContent = `${g.draft[other]} ac`; }
      }
      $(`#v-${id}`).textContent = fmt(+el.value);
      if (season === 0) { g.s.planted = { corn: g.draft.corn, wheat: g.draft.wheat }; scene.update(g.s, view()); g.s.planted = { corn: 0, wheat: 0 }; }
    });
  };
  bind('corn', 'corn', (v) => `${v} ac`); bind('wheat', 'wheat', (v) => `${v} ac`);
  bind('cellar', 'cellar', (v) => `$${v}`); bind('pay', 'payTab', (v) => `$${v}`);
}

function turnSeason() {
  const s0 = g.s, t = s0.turn, plan = { ...g.draft };
  const ev = world.ev[t];
  const x = E.eventCtx(t, ev?.hit, ev?.mag);
  const res = E.simulateSeason(s0, plan, x, E.rng(E.mix(g.seed, t, 123)));
  if (x.depot !== null) g.depot = x.depot;
  g.drought = E.seasonOf(t) === 1 && res.s.drought;
  sheet('<div class="kicker">The season turns…</div><p class="muted">Weather, prices, and whatever history landed this quarter.</p>');
  scene.pulse();
  setTimeout(() => {
    const gr = E.grade(s0, plan, g.info[t], res.delta, g.seed);
    g.history.push({ turn: t, verdict: gr.verdict, why: gr.why, delta: res.delta, line: letterLine(t, plan, res), nw: E.netWorth(res.s) });
    g.plan = plan;
    g.s = res.s;
    g.result = { turn: t, lines: res.lines, delta: res.delta, hard: res.hard, ruined: res.s.ruined };
    g.phase = 'result';
    save();
    showResult();
  }, 60);
}

// One sentence for the letter home, from what you did.
function letterLine(t, plan, res) {
  const season = E.seasonOf(t);
  const acts = g.actions.filter((a) => a.turn === t && !a.label.startsWith('Ask')).map((a) => a.label.toLowerCase());
  const bits = [];
  if (season === 0 && plan.corn + plan.wheat) bits.push(`we planted ${plan.corn} acres of corn and ${plan.wheat} of wheat`);
  if (plan.hire) bits.push('I hired out');
  if (acts.length) bits.push(`in town I chose to ${acts.join(', and to ')}`);
  if (res.hard) bits.push('the winter was a hard one');
  if (season === 1 && res.s.drought) bits.push('the summer was dry');
  if (plan.hold && season === 2) bits.push('we held the grain in the crib');
  if (!bits.length) bits.push('we kept on');
  const txt = bits.join('; ');
  return txt[0].toUpperCase() + txt.slice(1) + '.';
}

function showResult() {
  const r = g.result, t = r.turn, season = E.seasonOf(t);
  hud();
  const lines = r.lines.map((l) => `<li class="${l.kind || (l.amt < 0 ? 'neg' : l.amt > 0 ? 'pos' : '')}"><span>${l.label}</span>${l.amt ? `<b>${l.amt > 0 ? '+' : '−'}$${Math.abs(l.amt).toFixed(0)}</b>` : ''}</li>`).join('');
  const yearEnd = season === 3 || t === 21 || r.ruined;
  const next = r.ruined ? 'letter' : yearEnd ? 'letter' : 'next';
  sheet(`
    <div class="kicker">${E.seasonLabel(t)} · The season turns</div>
    <h2>${r.delta >= 0 ? 'The House is ' + money(r.delta) + ' ahead' : 'The House is ' + money(-r.delta) + ' behind'}</h2>
    <ul class="ledger">${lines}</ul>
    ${r.ruined ? `<p class="ruin">${r.ruined}</p>` : ''}
    <p class="letterline">“${g.history[g.history.length - 1].line}”</p>
    <button class="btn" data-go="${next}">${next === 'letter' ? 'Write the letter home' : 'Next season'}</button>`);
}

function showLetter() {
  const r = g.result;
  const year = E.yearOf(r.turn);
  const entries = g.history.filter((h) => E.yearOf(h.turn) === year);
  g.phase = 'letter'; save();
  const vClass = (v) => v.toLowerCase();
  sheet(`
    <div class="kicker">The letter home · ${year}</div>
    <div class="letter">
      <p>Dear Mother,</p>
      ${entries.map((h) => `<p><b>${E.SEASONS[E.seasonOf(h.turn)]}.</b> ${h.line}</p>`).join('')}
      <p>The House stands at ${money(E.netWorth(g.s))}.${g.s.tab > 0 ? ` We owe Pruitt ${money(g.s.tab)}.` : ''}</p>
      <p class="sign">— ${g.name}</p>
    </div>
    <h3>How the decisions held up</h3>
    <p class="muted small">Each plan was run forward across many histories that could have happened, using only what you knew. The verdict judges the decision apart from the luck.</p>
    ${entries.map((h) => `<div class="verdict"><span class="pill ${vClass(h.verdict)}">${h.verdict}</span><b>${E.seasonLabel(h.turn)}</b><p>${h.why}</p></div>`).join('')}
    <div class="legend"><span class="pill sound">Sound</span> good call, good outcome <span class="pill unlucky">Unlucky</span> good call, bad outcome <span class="pill lucky">Lucky</span> bad call, good outcome <span class="pill exposed">Exposed</span> bad call, bad outcome</div>
    <button class="btn" data-go="${r.ruined || r.turn === 21 ? 'almanac' : r.turn === 19 ? 'proveup' : 'next'}">${r.ruined || r.turn === 21 ? 'Open the Almanac' : r.turn === 19 ? 'Prove up' : 'Next season'}</button>`);
}

function nextSeason() {
  g.visitsLeft = 3; g.visited = []; g.phase = 'post';
  save(); hud(); showPost();
}

// Five years on: title, then two years pass quietly before the exam.
function showProveUp() {
  if (!g.interlude) {
    const years = [];
    let s = g.s;
    const r = E.rng(E.mix(g.seed, 555));
    while (s.turn !== 20 && !s.ruined) {
      s = E.simulateSeason(s, E.steadyPlan(s), E.eventCtx(s.turn, false, 0), r).s;
      if (E.seasonOf(s.turn) === 0) years.push({ year: E.yearOf(s.turn) - 1, nw: E.netWorth(s) });
    }
    g.interlude = { years, nw0: E.netWorth(g.s) };
    g.s = s;
    save();
  }
  const I = g.interlude;
  sheet(`
    <div class="kicker">Spring 1871 · The land office</div>
    <h2>You proved up</h2>
    <p>Five years on the claim. Two neighbors swore you lived on it and broke it. The 160 acres are the House’s.</p>
    <p>Then two good, quiet years. ${I.years.map((y) => `${y.year}: ${money(y.nw)}`).join(' · ')}.</p>
    <p>Now it is summer 1873. The House is worth ${money(E.netWorth(g.s))}, most of it land. Land you hold title to can be mortgaged. Avery has noticed.</p>
    <p class="hint">The coda is two seasons. It is the exam. Everything you learned is under pressure at once.</p>
    <button class="btn" data-go="next">Summer 1873</button>`);
}

function showAlmanac() {
  g.phase = 'almanac'; save();
  const tally = { Sound: 0, Unlucky: 0, Lucky: 0, Exposed: 0 };
  for (const h of g.history) tally[h.verdict]++;
  const srcs = {};
  for (const v of Object.values(g.stats)) { (srcs[v.src] = srcs[v.src] || { n: 0, right: 0 }).n++; if (v.right) srcs[v.src].right++; }
  const rivals = E.rivalRuns(60);
  const shapes = Object.entries(g.seenShapes).map(([k, t]) => `<li><b>${SHAPES[k]}</b>, first seen ${EVENTS[t].date}</li>`).join('');
  const nw = g.s.ruined ? 0 : E.netWorth(g.s);
  sheet(`
    <div class="kicker">The Almanac</div>
    <h2>${g.s.ruined ? 'The House left the claim' : `The House of ${g.name}: ${money(nw)}`}</h2>
    ${g.s.ruined ? `<p class="ruin">${g.s.ruined}</p>` : ''}
    <h3>Your decisions</h3>
    <div class="tally">${Object.entries(tally).map(([k, v]) => `<div class="pill ${k.toLowerCase()}">${k} <b>${v}</b></div>`).join('')}</div>
    <p class="muted small">Sound and Unlucky were good calls. Lucky and Exposed were not, whatever happened.</p>
    <h3>Your sources</h3>
    <table class="tbl"><tr><th>Source</th><th>Right</th><th>Cost</th></tr>
      ${Object.entries(srcs).map(([k, v]) => `<tr><td>${SOURCES[k].name}</td><td>${v.right} of ${v.n}</td><td>${SOURCES[k].note}</td></tr>`).join('') || '<tr><td colspan="3">You never asked anyone.</td></tr>'}</table>
    <h3>The rival houses, across 60 histories</h3>
    <p class="muted small">They rode the same kind of branch you got. You only saw one history; here are all of theirs.</p>
    <table class="tbl"><tr><th></th><th>Ruined</th><th>Worst 10%</th><th>Median</th><th>Best 10%</th></tr>
      ${Object.values(rivals).map((v) => `<tr><td><b>${v.name}</b><br><span class="small muted">${v.blurb}</span></td><td>${Math.round(v.ruined * 100)}%</td><td>${money(v.p10)}</td><td>${money(v.median)}</td><td>${money(v.p90)}</td></tr>`).join('')}
      <tr><td><b>You</b></td><td colspan="4">${money(nw)}, in the one history you lived</td></tr></table>
    ${shapes ? `<h3>Shapes you saw</h3><ul>${shapes}</ul><p class="muted small">These are the family lore an heir inherits.</p>` : ''}
    <h3>What changed by 2026, and what didn’t</h3>
    <ul class="bridge">
      <li>Pruitt’s 3%-a-month tab is a credit card at 43% APR.</li>
      <li>The cellar is an emergency fund.</li>
      <li>Cooke’s ads are the influencer pump.</li>
      <li>The county bond vote is the herd.</li>
      <li>The wire cost a dollar; the same news is free now. The edge shrank. The three questions didn’t change.</li>
    </ul>
    <button class="btn" data-go="post-scenario">One last question</button>`, { wide: true });
}

function showFinal() {
  const pre = g.pre, post = g.post;
  const line = (sc, which) => sc ? `${SCENARIOS[which].options[sc.i].text} <b>${sc.score}/2.</b> ${SCENARIOS[which].options[sc.i].why}` : 'Skipped.';
  sheet(`
    <div class="kicker">Before and after</div>
    <h2>${pre && post ? (post.score > pre.score ? 'You read the canary better' : post.score === pre.score ? 'About the same' : 'Worse than before') : 'Done'}</h2>
    <h4>Before turn one</h4><p>${line(pre, 'pre')}</p>
    <h4>After the coda</h4><p>${line(post, 'post')}</p>
    <p class="muted small">This is the measurement the playtest is for: a better decision on a modern scenario you hadn’t seen.</p>
    <p class="hint">“I want to try again because I think I could set my family up differently.”</p>
    <button class="btn" data-go="restart">Play again</button>`);
}

// ---- Events -------------------------------------------------------------------

document.addEventListener('click', (e) => {
  const term = e.target.closest('.term');
  if (term) { e.preventDefault(); marginNote(term.dataset.term, term.dataset.shape); return; }
  if (e.target.closest('#note-close') || e.target.id === 'note') { $('#note').classList.remove('open'); return; }
  const el = e.target.closest('[data-go],[data-visit],[data-act],[data-scenario],[data-hire],[data-hold]');
  if (!el) return;
  const d = el.dataset;
  if (d.visit) return visit(d.visit);
  if (d.act) return doAction(+d.act);
  if (d.hire !== undefined) { g.draft.hire = d.hire === '1'; el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); return; }
  if (d.hold !== undefined) { g.draft.hold = d.hold === '1'; el.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); return; }
  if (d.scenario) {
    const sc = { i: +d.i, score: SCENARIOS[d.scenario].options[+d.i].score };
    if (d.scenario === 'pre') { g.pre = sc; return showNaming(); }
    g.post = sc; g.phase = 'final'; save(); return showFinal();
  }
  switch (d.go) {
    case 'continue': g = load(); world = E.newWorld(g.seed); return resume();
    case 'pre': return showScenario('pre');
    case 'start': {
      const name = ($('#name').value || 'Hollis').trim().slice(0, 18);
      g = newGame(name); world = E.newWorld(g.seed); save(); hud(); return showPost();
    }
    case 'town': return showTown();
    case 'street': g.phase = 'town'; return showTown();
    case 'farm': return showFarm();
    case 'turn': return turnSeason();
    case 'letter': return showLetter();
    case 'next': return nextSeason();
    case 'proveup': g.phase = 'proveup'; return showProveUp();
    case 'almanac': return showAlmanac();
    case 'post-scenario': return showScenario('post');
    case 'restart': try { localStorage.removeItem(SAVE); } catch (err) { /* ignore */ } g = { phase: 'title', s: E.newState(), name: '', pre: null }; hud(); return showScenario('pre');
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'name') $('[data-go="start"]').click(); if (e.key === 'Escape') $('#note').classList.remove('open'); });
$('#grab').addEventListener('click', () => $('#sheet').classList.toggle('collapsed'));

function resume() {
  hud();
  switch (g.phase) {
    case 'town': return showTown();
    case 'farm': return showFarm();
    case 'result': return showResult();
    case 'letter': return showLetter();
    case 'proveup': return showProveUp();
    case 'almanac': return showAlmanac();
    case 'final': return showFinal();
    default: return showPost();
  }
}

scene = new Diorama($('#scene'), $('#labels'), (id) => {
  if (g?.phase === 'town') visit(id);
  else if (g && g.phase !== 'title') toast('Town visits come after the post arrives.');
});
g = { phase: 'title', s: E.newState(), name: '' };
hud();
showTitle();
window.__game = () => g; // for playtest debugging
