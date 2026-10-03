// The season model and the decision engine. One model, two uses: it turns the
// season you play, and it runs your plan forward across many plausible
// branches to grade the decision separately from the outcome.
//
// Pure functions only, so it runs the same in the browser and in node.

import { EVENTS } from './data.js';

export const C = {
  startCash: 30, filingFee: 14, startAcres: 6, maxAcres: 40, sodPerSeason: 4,
  living: [12, 12, 12, 25], hardWinter: 40,
  cellarBonus: 1.25, tabRate: Math.pow(1.03, 3) - 1, tabLimit: 150,
  noteRate: 0.024, noteSizes: [30, 60], noteTerm: 4,
  cornYield: 25, wheatYield: 13, cornSeed: 0.75, wheatSeed: 1.5,
  cornPrice: 0.48, wheatPrice: 0.95, droughtCorn: 0.35, droughtWheat: 0.75,
  hogBuy: 4, hogValue: 9, hogFeed: 0.5,
  wage: 20, apprenticeBonus: 10, hiredPenalty: 0.8,
  lotPrice: 40, plowPrice: 20, plowBonus: 1.25,
  droughtP: 0.2, hardWinterP: 0.2, choleraP: 0.03,
  weekly: 2, daily: 8, wire: 1, commute: 200,
  landPerAcre: 2, improvementPerAcre: 8, winterWage: 12,
};

export const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
export const FIRST_CODA = 20, LAST_TURN = 21, INTERLUDE = 100, END = 999;

export function seasonOf(t) {
  if (t === 20) return 1;
  if (t === 21) return 2;
  if (t >= INTERLUDE) return (t - INTERLUDE) % 4;
  return t % 4;
}
export function yearOf(t) {
  if (t >= 20 && t < INTERLUDE) return 1873;
  if (t >= INTERLUDE) return 1871 + Math.floor((t - INTERLUDE) / 4);
  return 1866 + Math.floor(t / 4);
}
export const seasonLabel = (t) => `${SEASONS[seasonOf(t)]} ${yearOf(t)}`;
export function nextTurn(t) {
  if (t === 19) return INTERLUDE;
  if (t === INTERLUDE + 8) return 20;
  if (t === LAST_TURN) return END;
  return t + 1;
}

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const mix = (...n) => n.reduce((h, x) => Math.imul(h ^ (x >>> 0), 2654435761) ^ (h >>> 15), 2166136261) >>> 0;

export function newState() {
  return {
    turn: 0, cash: C.startCash - C.filingFee, tab: 0, note: null, mortgage: null,
    cellar: 0, acres: C.startAcres, plow: false, piglets: 0, hogs: 0,
    lot: null, bonds: null, heldBu: { corn: 0, wheat: 0 }, planted: { corn: 0, wheat: 0 },
    hiredYear: 0, drought: false, subs: { weekly: false, daily: false },
    skills: { apprentice: false, market: false }, titled: false, landM: 1, tax: 0,
    ruined: null,
  };
}

// The world: what actually happens this run. Real events on real dates;
// whether and how hard each reaches the county is drawn once per run.
export function newWorld(seed) {
  const r = rng(seed);
  const ev = {};
  for (const t of Object.keys(EVENTS)) {
    const e = EVENTS[t];
    ev[t] = { hit: r() < e.p, mag: e.mag[0] + r() * (e.mag[1] - e.mag[0]) };
  }
  return { seed, ev };
}

export function landValue(s) {
  // Broken sod counts as an improvement even before title; the raw 160 acres
  // count only once they are yours.
  return ((s.titled ? 160 * C.landPerAcre : 0) + s.acres * C.improvementPerAcre) * s.landM;
}
export function netWorth(s) {
  return s.cash + s.cellar / C.cellarBonus + s.piglets * C.hogBuy + s.hogs * C.hogValue
    + s.heldBu.corn * C.cornPrice + s.heldBu.wheat * C.wheatPrice
    + (s.lot ? s.lot.value : 0) + (s.bonds ? s.bonds.value : 0) + (s.plow ? 10 : 0)
    + landValue(s) - s.tab - (s.note ? s.note.amount : 0) - (s.mortgage ? s.mortgage.amount : 0);
}

export function eventCtx(t, hit, mag) {
  const x = {
    wheatM: 1, cornM: 1, hogM: 1, wageBonus: 0, creditTight: false, callP: 0,
    choleraP: C.choleraP, droughtP: C.droughtP, hardWinterP: C.hardWinterP,
    depot: null, lotM: 1, bondM: 1, landM: 1, bondTax: 0,
  };
  const e = EVENTS[t];
  if (e) { if (hit) e.apply(x, mag); else if (e.apply0) e.apply0(x, mag); }
  return x;
}

const clone = (s) => ({
  ...s, note: s.note && { ...s.note }, mortgage: s.mortgage && { ...s.mortgage },
  lot: s.lot && { ...s.lot }, bonds: s.bonds && { ...s.bonds },
  heldBu: { ...s.heldBu }, planted: { ...s.planted }, subs: { ...s.subs }, skills: { ...s.skills },
});
const money = (n) => `$${Math.round(n)}`;

// Pay from cash first; the rest goes on the tab.
function spend(s, amt, L, label) {
  if (amt <= 0) return;
  const fromCash = Math.min(s.cash, amt);
  s.cash -= fromCash;
  const onTab = amt - fromCash;
  s.tab += onTab;
  L.push({ label: onTab > 0.5 ? `${label} (${money(onTab)} on the tab)` : label, amt: -amt });
}

// Forced selling to meet a called loan: hogs, then the lot, at panic prices.
function raise(s, need, L, why) {
  let got = Math.min(s.cash, need); s.cash -= got;
  if (got < need && s.hogs > 0) {
    const sell = s.hogs * C.hogValue * 0.7; s.hogs = 0; got += sell;
    L.push({ label: `${why}: sold the hogs at a forced price`, amt: sell, kind: 'bad' });
  }
  if (got < need && s.lot) {
    const sell = s.lot.value * 0.5; s.lot = null; got += sell;
    L.push({ label: `${why}: sold the town lot for half`, amt: sell, kind: 'bad' });
  }
  if (got < need && s.bonds) {
    const sell = s.bonds.value * 0.8; s.bonds = null; got += sell;
    L.push({ label: `${why}: sold the bonds`, amt: sell, kind: 'bad' });
  }
  if (got > need) { s.cash += got - need; got = need; }
  return need - got; // shortfall
}

// A plan is the allocation screen: hire out or work the claim, what to
// plant, what to put up in the cellar and pay toward the tab after the
// season's income, and whether to hold the harvest to spring.
export function simulateSeason(s0, plan, ctxIn, r) {
  const s = clone(s0);
  const L = [];
  const x = ctxIn;
  const season = seasonOf(s.turn);
  const nw0 = netWorth(s0);

  // Spring: last fall's held grain sells, then plant.
  if (season === 0 && (s.heldBu.corn || s.heldBu.wheat)) {
    const f = 0.95 * (1 + (r() - 0.5) * 0.15);
    const v = (s.heldBu.corn * C.cornPrice + s.heldBu.wheat * C.wheatPrice) * f;
    s.cash += v; s.heldBu = { corn: 0, wheat: 0 };
    L.push({ label: 'Sold the grain you held over winter', amt: v });
  }
  if (season === 0) {
    const corn = Math.max(0, Math.min(plan.corn || 0, s.acres));
    const wheat = Math.max(0, Math.min(plan.wheat || 0, s.acres - corn));
    s.planted = { corn, wheat };
    spend(s, corn * C.cornSeed + wheat * C.wheatSeed, L, `Seed for ${corn} ac corn, ${wheat} ac wheat`);
    if (s.subs.weekly) spend(s, C.weekly, L, 'Topeka weekly, a year');
    if (s.subs.daily) spend(s, C.daily, L, 'Kansas City daily, a year');
  }

  // Labor.
  if (plan.hire) {
    const w = (season === 3 ? C.winterWage : C.wage) + (s.skills.apprentice ? C.apprenticeBonus : 0) + x.wageBonus;
    s.cash += w;
    L.push({ label: x.wageBonus ? `Wages hiring out (rail graders paid ${money(x.wageBonus)} extra)` : 'Wages hiring out', amt: w });
    if (season <= 2) s.hiredYear++;
  } else if (season <= 1 && s.acres < C.maxAcres) {
    s.acres = Math.min(C.maxAcres, s.acres + C.sodPerSeason);
    L.push({ label: `Broke ${C.sodPerSeason} more acres of sod`, amt: 0, kind: 'note' });
  }

  // Weather.
  if (season === 1) s.drought = r() < x.droughtP;
  let hard = false;
  if (season === 3) hard = r() < x.hardWinterP;

  // Living costs: the cellar first, then cash, then the tab.
  const cost = season === 3 ? (hard ? C.hardWinter : C.living[3]) : C.living[season];
  const fromCellar = Math.min(s.cellar, cost);
  s.cellar -= fromCellar;
  if (fromCellar > 0) L.push({ label: `The cellar covered ${money(fromCellar)} of ${hard ? 'a hard winter' : 'living costs'}`, amt: 0, kind: 'good' });
  spend(s, cost - fromCellar, L, hard ? 'A hard winter: food and fuel' : 'Living costs');

  // Fall harvest.
  if (season === 2 && s.planted.corn + s.planted.wheat > 0) {
    const pen = Math.pow(C.hiredPenalty, s.hiredYear) * (s.plow ? C.plowBonus : 1);
    const cf = s.drought ? C.droughtCorn : 1, wf = s.drought ? C.droughtWheat : 1;
    const cornBu = s.planted.corn * C.cornYield * cf * pen * (1 + (r() - 0.5) * 0.3);
    const wheatBu = s.planted.wheat * C.wheatYield * wf * pen * (1 + (r() - 0.5) * 0.3);
    const cp = C.cornPrice * x.cornM * (1 + (r() - 0.5) * 0.15);
    const wp = C.wheatPrice * x.wheatM * (1 + (r() - 0.5) * 0.4);
    if (s.drought) L.push({ label: 'Drought: corn yield cut by two thirds, wheat by a quarter', amt: 0, kind: 'bad' });
    if (s.hiredYear) L.push({ label: `Half-tended fields: yields down ${Math.round((1 - Math.pow(C.hiredPenalty, s.hiredYear)) * 100)}%`, amt: 0, kind: 'note' });
    if (plan.hold) {
      s.heldBu.corn += cornBu; s.heldBu.wheat += wheatBu;
      L.push({ label: `Held ${Math.round(cornBu)} bu corn and ${Math.round(wheatBu)} bu wheat in the crib to sell in spring`, amt: 0, kind: 'note' });
    } else {
      const v = cornBu * cp + wheatBu * wp;
      s.cash += v;
      const pct = Math.round((wp / C.wheatPrice - 1) * 100);
      L.push({ label: `Harvest sold: ${Math.round(cornBu)} bu corn at ${cp.toFixed(2)}, ${Math.round(wheatBu)} bu wheat at ${wp.toFixed(2)}${Math.abs(pct) >= 8 ? ` (wheat ${pct > 0 ? '+' : ''}${pct}% vs normal)` : ''}`, amt: v });
    }
    s.planted = { corn: 0, wheat: 0 }; s.hiredYear = 0; s.drought = false;
  }

  // Hogs: feed, disease, the young grow up each fall.
  const head = s.hogs + s.piglets;
  if (head) {
    spend(s, head * C.hogFeed, L, `Feed for ${head} hogs`);
    if (r() < x.choleraP) {
      const lostH = Math.ceil(s.hogs * 0.6), lostP = Math.ceil(s.piglets * 0.6);
      s.hogs -= lostH; s.piglets -= lostP;
      L.push({ label: `Hog cholera: lost ${lostH + lostP} head`, amt: -(lostH * C.hogValue + lostP * C.hogBuy), kind: 'bad' });
    }
    if (season === 2) { s.hogs += s.piglets; s.piglets = 0; }
  }

  // Taxes and paper.
  if (x.bondTax) s.tax = x.bondTax;
  if (s.tax) spend(s, s.tax, L, 'County railroad-bond tax');
  if (s.lot && x.depot !== null) {
    s.lot.value = x.depot ? 200 : 12;
    L.push({ label: x.depot ? 'The depot is coming to town: your lot is worth $200' : 'The railroad went three miles north: your lot is worth $12', amt: s.lot.value - 40, kind: x.depot ? 'good' : 'bad' });
  }
  if (s.lot && x.lotM !== 1) { const v0 = s.lot.value; s.lot.value *= x.lotM; L.push({ label: 'Panic: no buyers for town lots', amt: s.lot.value - v0, kind: 'bad' }); }
  if (s.bonds) {
    const cpn = s.bonds.face * 0.073 / 4; s.cash += cpn;
    L.push({ label: 'Bond interest', amt: cpn });
    if (x.bondM !== 1) { const v0 = s.bonds.value; s.bonds.value *= x.bondM; L.push({ label: 'Railway bonds quoted at 40 cents', amt: s.bonds.value - v0, kind: 'bad' }); }
  }
  if (x.landM !== 1 && s.titled) { const v0 = landValue(s); s.landM *= x.landM; L.push({ label: 'Land prices fall in the panic (on paper)', amt: landValue(s) - v0, kind: 'bad' }); }

  // The bank note: interest, due date, and calls when credit tightens.
  if (s.note) {
    const i = s.note.amount * C.noteRate; s.note.amount += i;
    L.push({ label: 'Interest on the bank note (10%/yr)', amt: -i });
    const called = x.creditTight && r() < x.callP;
    if (s.turn + 1 >= s.note.due || called) {
      const due = s.note.amount; s.note = null;
      const short = raise(s, due, L, called ? 'The bank called your note' : 'Your note came due');
      L.push({ label: called ? 'The bank called your note early' : 'Repaid the bank note', amt: -(due - short), kind: called ? 'bad' : undefined });
      if (short > 0) { s.tab += short; L.push({ label: 'Pruitt covered the rest on the tab', amt: -short, kind: 'bad' }); }
    }
  }
  if (s.mortgage) {
    const i = s.mortgage.amount * C.noteRate; s.mortgage.amount += i;
    L.push({ label: 'Mortgage interest', amt: -i });
    if (x.creditTight && r() < x.callP) {
      const due = s.mortgage.amount; s.mortgage = null;
      const short = raise(s, due, L, 'The bank called the mortgage');
      if (short > 0) {
        const sale = landValue(s) * 0.5; s.titled = false; s.cash += Math.max(0, sale - short);
        L.push({ label: 'The bank took the farm and sold it for half', amt: -landValue({ ...s, titled: true }), kind: 'bad' });
        s.ruined = 'The bank called the mortgage in the panic. Land sells for nothing in a panic, and the farm went for half its value.';
      } else L.push({ label: 'The bank called the mortgage; you paid it', amt: -due, kind: 'bad' });
    }
  }

  // After the season's income: the cellar, then the tab, as planned.
  const fill = Math.max(0, Math.min(plan.cellar || 0, s.cash));
  const bonus = season === 2 ? C.cellarBonus : 1;
  if (fill > 0) { s.cash -= fill; s.cellar += fill * bonus; L.push({ label: bonus > 1 ? `Put up ${money(fill)} of stores at harvest prices (worth ${money(fill * bonus)} in January)` : `Put up ${money(fill)} of stores at store prices`, amt: 0, kind: 'good' }); }
  const pay = Math.max(0, Math.min(plan.payTab || 0, s.cash, s.tab));
  if (pay > 0) { s.cash -= pay; s.tab -= pay; L.push({ label: 'Paid down the tab', amt: 0, kind: 'good' }); }

  if (s.tab > 0.005) {
    const i = s.tab * C.tabRate; s.tab += i;
    L.push({ label: 'Tab interest (3%/month)', amt: -i, kind: i > 5 ? 'bad' : undefined });
  } else s.tab = 0;
  if (s.tab > C.tabLimit && !s.ruined) {
    s.ruined = `The tab passed $${C.tabLimit}. Pruitt cut off your credit, and with nothing in the cellar the House left the claim.`;
  }

  // Five years on the land: prove up.
  if (s.turn === 19 && !s.ruined && !s.titled) {
    s.titled = true;
    L.push({ label: 'Proved up: the 160 acres are yours', amt: landValue(s), kind: 'good' });
  }

  s.turn = nextTurn(s.turn);
  return { s, lines: L, hard, delta: netWorth(s) - nw0 };
}

// ---- Plans -----------------------------------------------------------------

export function steadyPlan(s) {
  const season = seasonOf(s.turn);
  const p = { hire: false, corn: 0, wheat: 0, cellar: 0, payTab: 999, hold: false };
  if (season === 0) { p.corn = Math.ceil(s.acres / 2); p.wheat = s.acres - p.corn; }
  if ((s.cash < 5 && s.tab > 60) || season === 3) p.hire = true;
  if (season === 2) p.cellar = Math.max(0, 32 - s.cellar);
  return p;
}

// The rival houses ride the same branch you got.
export const RIVALS = {
  saver: {
    name: 'The Saver', blurb: 'Fills the cellar, pays the tab first, never borrows.',
    plan: (s) => ({ ...steadyPlan(s), cellar: seasonOf(s.turn) === 2 ? Math.max(0, 42 - s.cellar) : 0 }),
    visit: () => {},
  },
  spec: {
    name: 'The Speculator', blurb: 'All wheat, always borrowed, buys the lot and the bonds.',
    plan: (s) => {
      const p = steadyPlan(s);
      if (seasonOf(s.turn) === 0) { p.wheat = s.acres; p.corn = 0; }
      p.cellar = seasonOf(s.turn) === 2 ? Math.max(0, 15 - s.cellar) : 0;
      return p;
    },
    visit: (s, x) => {
      if (!s.note && !x.creditTight) borrow(s, 60);
      if (s.turn >= 4 && s.turn <= 9 && !s.lot) buyLot(s);
      if (s.turn === 20 && s.titled && !s.mortgage && !x.creditTight) { mortgage(s, 400); buyBonds(s, Math.floor(s.cash / 50) * 50); }
    },
  },
  hand: {
    name: 'The Wage Hand', blurb: 'Hires out every season, keeps a small field.',
    plan: (s) => {
      const p = { ...steadyPlan(s), hire: true };
      if (seasonOf(s.turn) === 0) { p.corn = Math.min(s.acres, 6); p.wheat = 0; }
      return p;
    },
    visit: (s) => { if (!s.skills.apprentice && s.turn === 1) s.skills.apprentice = true; },
  },
};

// ---- Visit actions that change the ledger ----------------------------------

export function noteDueLabel(t) { return seasonLabel(t); }
export function borrow(s, amt) {
  s.note = { amount: amt, due: s.turn + C.noteTerm, dueLabel: noteDueLabel(s.turn + C.noteTerm) };
  s.cash += amt;
}
export function mortgage(s, amt) { s.mortgage = { amount: amt }; s.cash += amt; }
export function buyLot(s) { spendNow(s, C.lotPrice); s.lot = { value: C.lotPrice }; }
export function buyBonds(s, face) {
  spendNow(s, face);
  s.bonds = s.bonds ? { face: s.bonds.face + face, value: s.bonds.value + face } : { face, value: face };
}
export function spendNow(s, amt) {
  const c = Math.min(s.cash, amt); s.cash -= c; s.tab += amt - c;
}

// ---- The decision engine ---------------------------------------------------

// What the player knew: the best source they saw this season for this
// season's card, and whether it said "hit". Bayes on the source's reliability.
export function posterior(t, info) {
  const e = EVENTS[t];
  if (!e) return 0;
  if (!info) return e.p;
  const r = info.r, p = e.p;
  return info.said ? p * r / (p * r + (1 - p) * (1 - r)) : p * (1 - r) / (p * (1 - r) + (1 - p) * r);
}

function sampleCtx(t, pHit, r) {
  const e = EVENTS[t];
  if (!e) return eventCtx(t, false, 0);
  return eventCtx(t, r() < pHit, e.mag[0] + r() * (e.mag[1] - e.mag[0]));
}

// Run a plan forward `horizon` seasons across `n` branches.
export function runBranches(s, plan, info, { n = 90, horizon = 4, seed = 1 } = {}) {
  const pHit = posterior(s.turn, info);
  const out = [], first = [];
  let ruin = 0;
  const nw0 = netWorth(s);
  for (let i = 0; i < n; i++) {
    const r = rng(mix(seed, i, 7));
    let res = simulateSeason(s, plan, sampleCtx(s.turn, pHit, r), r);
    first.push(res.delta);
    let st = res.s;
    for (let h = 1; h < horizon && !st.ruined && st.turn !== END; h++) {
      const x = sampleCtx(st.turn, EVENTS[st.turn]?.p ?? 0, r);
      st = simulateSeason(st, steadyPlan(st), x, r).s;
    }
    if (st.ruined) ruin++;
    out.push(netWorth(st) - nw0 - (st.ruined ? 100 : 0));
  }
  out.sort((a, b) => a - b); first.sort((a, b) => a - b);
  const mean = out.reduce((a, b) => a + b, 0) / n;
  const p20 = out[Math.floor(n * 0.2)];
  const ruinP = ruin / n;
  return { mean, p20, ruinP, score: 0.5 * mean + 0.5 * p20 - 250 * ruinP, first };
}

export function candidatePlans(s, player) {
  const season = seasonOf(s.turn);
  const acres = season === 0 ? Math.max(1, (player.corn || 0) + (player.wheat || 0)) : 0;
  const plans = [];
  for (const hire of [false, true])
    for (const payTab of [0, 999])
      for (const split of season === 0 ? [0, 0.5, 1] : [null])
        for (const cellar of season === 2 ? [0, 25, 45] : [0, 30])
          for (const hold of season === 2 ? [false, true] : [false]) {
            const p = { hire, payTab, cellar, hold, corn: 0, wheat: 0 };
            if (split !== null) { p.wheat = Math.round(acres * split); p.corn = acres - p.wheat; }
            plans.push(p);
          }
  return plans;
}

// Grade the player's plan against the alternatives, then place the actual
// outcome inside the player's own branch distribution.
export function grade(s, plan, info, actualDelta, seed) {
  const opts = { seed: mix(seed, s.turn) };
  const me = runBranches(s, plan, info, opts);
  const cands = candidatePlans(s, plan).map((p) => ({ p, ...runBranches(s, p, info, opts) }));
  const best = cands.reduce((a, b) => (b.score > a.score ? b : a));
  const worst = cands.reduce((a, b) => (b.score < a.score ? b : a));
  const gap = best.score - me.score;
  const goodDecision = gap <= Math.max(8, 0.2 * (best.score - worst.score)) && me.ruinP <= 0.15;
  const below = me.first.filter((d) => d < actualDelta - 0.01).length;
  const tied = me.first.filter((d) => Math.abs(d - actualDelta) <= 0.01).length;
  const pct = (below + tied / 2) / me.first.length;
  const goodOutcome = pct >= 0.3;
  const verdict = goodDecision ? (goodOutcome ? 'Sound' : 'Unlucky') : (goodOutcome ? 'Lucky' : 'Exposed');
  return { verdict, me, best, pct, why: explain(s, plan, best.p, me, best, goodDecision) };
}

function explain(s, mine, best, me, b, good) {
  const season = seasonOf(s.turn);
  const nums = `Across the branches your plan averaged ${signed(me.mean)} over a year, ${signed(me.p20)} in the worst fifth, with a ${Math.round(me.ruinP * 100)}% chance of ruin.`;
  if (good) return `${nums} Nothing on the board was clearly safer.`;
  const tips = [];
  if ((best.cellar || 0) > (mine.cellar || 0) + 10) tips.push(`putting up about $${best.cellar} for winter would have held through a hard winter, which comes about one year in five`);
  if (best.payTab > 0 && !(mine.payTab > 0) && s.tab > 5) tips.push('paying down the tab would have stopped 3% a month compounding against you');
  if (best.hire && !mine.hire) tips.push('hiring out would have brought in cash the tab could not take from you');
  if (!best.hire && mine.hire && season <= 1) tips.push('working the claim would have broken more sod, and land compounds');
  if (season === 0 && Math.abs((best.wheat || 0) - (mine.wheat || 0)) > 2) tips.push(best.wheat > 0 && best.corn > 0 ? 'splitting corn and wheat would have spread the risk' : best.wheat > mine.wheat ? 'more wheat would have paid better on what you knew' : 'more corn would have been safer on what you knew');
  if (season === 2 && best.hold !== !!mine.hold) tips.push(best.hold ? 'holding the harvest to spring would have dodged a price you had reason to fear' : 'selling at harvest would have put cash in the cellar');
  if ((mine.cellar || 0) > (best.cellar || 0) + 20) tips.push('cash tied up in the cellar was cash the tab kept charging on');
  return `${nums} A better plan existed: ${tips[0] || 'a different mix of the same choices'}.`;
}
export const signed = (n) => `${n < 0 ? '−' : '+'}$${Math.abs(Math.round(n))}`;

// Rivals across many histories: the Speculator is a distribution, not a moral.
export function rivalRuns(n = 60) {
  const res = {};
  for (const [k, rv] of Object.entries(RIVALS)) {
    const finals = []; let ruined = 0;
    for (let i = 0; i < n; i++) {
      const w = newWorld(mix(99, i));
      const r = rng(mix(5, i));
      let s = newState();
      while (s.turn !== END && !s.ruined) {
        const ev = w.ev[s.turn];
        const x = eventCtx(s.turn, ev?.hit, ev?.mag);
        rv.visit(s, x);
        s = simulateSeason(s, rv.plan(s), x, r).s;
      }
      if (s.ruined) ruined++;
      finals.push(s.ruined ? 0 : netWorth(s));
    }
    finals.sort((a, b) => a - b);
    res[k] = { name: rv.name, blurb: rv.blurb, ruined: ruined / n, p10: finals[Math.floor(n * 0.1)], median: finals[Math.floor(n / 2)], p90: finals[Math.floor(n * 0.9)] };
  }
  return res;
}
