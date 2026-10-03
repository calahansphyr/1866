// Content for the 1866 prototype: the event deck (fixed spine, variable
// transmission), the mechanism library behind the margin notes, the seven
// buildings, and the transfer scenarios. Text markup: [[term|shown words]]
// becomes a tappable margin-note link.
//
// Every number here is *invented* or *modeled* for the prototype; the research
// pass in Cal_summary.md has not happened yet.

// Each card hits on `turn`. `p` is the chance the shock actually reaches this
// county on this run; `mag` is the range of how hard. The daily paper and the
// wire show `foreshadow` one season early. Sources report `hitLine` or
// `missLine` with their own reliability, so a cheap source can be wrong.
export const EVENTS = {
  0: {
    date: 'May 1866', title: 'A London bank fails', shape: 'credit',
    headline: 'LONDON. Overend, Gurney & Co. has failed. The [[bankrate|Bank of England rate]] is 10 per cent.',
    hitLine: 'The Topeka bank has stopped writing new notes until it sees who is next.',
    missLine: 'The Topeka bank says London is a long way off and it is lending as usual.',
    p: 0.5, mag: [0, 0],
    apply: (x) => { x.creditTight = true; x.callP = 0.5; },
    effect: 'The bank will not lend this season, and may call notes.',
  },
  1: {
    date: 'Summer 1866', title: 'The cable works',
    headline: 'The Atlantic cable is working. London prices reach New York the same day, if you pay the [[telegraph|telegraph]].',
    hitLine: 'The wire office says Chicago now prices wheat off Liverpool hour by hour.',
    missLine: 'The wire office says Chicago now prices wheat off Liverpool hour by hour.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'No direct effect. Fresh news got cheaper for whoever pays.',
  },
  2: {
    date: 'Fall 1866', title: 'War in Germany', shape: 'war',
    foreshadow: 'Prussia and Austria are mobilizing. European grain buyers are nervous.',
    headline: 'Prussia beats Austria in seven weeks. European buyers are bidding for [[grain|American wheat]].',
    hitLine: 'Chicago wheat bids are up sharply this week.',
    missLine: 'Chicago says the war was too short to matter to wheat.',
    p: 0.6, mag: [0.1, 0.3],
    apply: (x, m) => { x.wheatM *= 1 + m; },
    effect: 'Wheat sells higher at harvest.',
  },
  3: {
    date: 'Winter 1866', title: 'Talk of a hard winter',
    headline: 'Old settlers say the geese went south early. A hard [[reserve|winter]] is coming, they say.',
    hitLine: 'The almanac and the Army post both expect a long cold.',
    missLine: 'The Army surgeon at Fort Riley says the geese are always early.',
    p: 0.35, mag: [0, 0],
    apply: (x) => { x.hardWinterP = 0.6; },
    effect: 'A hard winter is likelier, so winter costs more.',
  },
  4: {
    date: 'Spring 1867', title: 'McCoy builds at Abilene', shape: 'louder',
    headline: 'Joseph McCoy has bought every board in Abilene and is building [[livestock|stock pens]]. Promoters are selling [[lot|town lots]] by the grade.',
    hitLine: 'Hog and cattle buyers are paying more at the yards already.',
    missLine: 'The yards say McCoy is a dreamer and prices are flat.',
    p: 0.7, mag: [0.2, 0.5],
    apply: (x, m) => { x.hogM *= 1 + m; },
    effect: 'Hogs sell for more at the stockyard.',
  },
  5: {
    date: 'Summer 1867', title: 'Rail graders arrive',
    foreshadow: 'The Kansas Pacific is hiring graders west of Topeka.',
    headline: 'Kansas Pacific grading crews are working toward Salina, paying cash [[wages|wages]].',
    hitLine: 'The grading boss is paying a dollar more a day than last month.',
    missLine: 'The crews are full; the boss is turning men away.',
    p: 0.8, mag: [10, 20],
    apply: (x, m) => { x.wageBonus += Math.round(m); },
    effect: 'Hiring out pays more this season.',
  },
  6: {
    date: 'Fall 1867', title: 'Treaty at Medicine Lodge',
    headline: 'A treaty is signed at Medicine Lodge Creek. The Army is buying [[grain|corn]] for the posts.',
    hitLine: 'Army contractors are bidding for corn at the depot.',
    missLine: 'The contracts went to Missouri dealers; local corn is unchanged.',
    p: 0.5, mag: [0.05, 0.2],
    apply: (x, m) => { x.cornM *= 1 + m; },
    effect: 'Corn sells higher at harvest.',
  },
  7: {
    date: 'Winter 1867', title: 'The gold premium widens', shape: 'credit',
    headline: 'Gold is at 140 in New York. The [[gold|gold premium]] is widening again.',
    hitLine: 'Eastern banks are calling in loans to the West.',
    missLine: 'Bankers say the premium is just Wall Street noise.',
    p: 0.3, mag: [0, 0],
    apply: (x) => { x.creditTight = true; x.callP = 0.4; },
    effect: 'The bank will not lend this season, and may call notes.',
  },
  8: {
    date: 'Spring 1868', title: 'The Erie War',
    headline: 'In New York, Drew, Fisk and Gould printed new Erie [[shares|shares]] faster than Vanderbilt could buy them.',
    hitLine: 'Nothing about it touches a Kansas farm this season.',
    missLine: 'Nothing about it touches a Kansas farm this season.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'No effect on you. Not every headline is about you.',
  },
  9: {
    date: 'Summer 1868', title: 'Dry spring',
    headline: 'No rain since April in the eastern counties. Talk of [[drought|drought]].',
    hitLine: 'The creeks are lower than anyone remembers in June.',
    missLine: 'Rain is falling at Lawrence; the dry spell looks local and short.',
    p: 0.4, mag: [0, 0],
    apply: (x) => { x.droughtP = 0.6; },
    effect: 'Drought is likelier this summer.',
  },
  10: {
    date: 'Fall 1868', title: 'Where the depot goes', shape: 'herd',
    foreshadow: 'Surveyors are walking two routes past the county seat.',
    headline: 'The railroad is choosing its depot. Every [[lot|town lot]] owner in the county is sure it is theirs.',
    hitLine: 'The surveyors were seen driving stakes right through the town plat.',
    missLine: 'The surveyors were seen driving stakes three miles north of town.',
    p: 0.4, mag: [0, 0],
    apply: (x) => { x.depot = true; },
    apply0: (x) => { x.depot = false; },
    effect: 'If the depot comes, town lots go up fivefold. If not, they are worth almost nothing.',
  },
  11: {
    date: 'Winter 1868', title: 'The bond vote', shape: 'herd',
    headline: 'The county votes in spring on $10,000 of [[countybond|railroad bonds]]. Everyone you meet is voting yes.',
    hitLine: 'The vote looks certain to pass.',
    missLine: 'A few farmers are organizing against it.',
    p: 0.85, mag: [0, 0],
    apply: (x) => { x.bondTax = 3; },
    effect: 'If it passes, every farm pays a bond tax from now on.',
  },
  12: {
    date: 'Spring 1869', title: 'The golden spike',
    headline: 'The Pacific railroad is joined at Promontory. More [[grain|grain]] will move east, and faster.',
    hitLine: 'Wheat buyers expect more competition from the West.',
    missLine: 'Wheat buyers say nothing changes this year.',
    p: 0.5, mag: [0.05, 0.1],
    apply: (x, m) => { x.wheatM *= 1 - m; },
    effect: 'Wheat a little cheaper.',
  },
  13: {
    date: 'Summer 1869', title: 'Someone is buying gold',
    foreshadow: 'Brokers whisper that Gould and Fisk are buying gold.',
    headline: 'Gould and Fisk are buying [[gold|gold]] in New York. The premium is climbing.',
    hitLine: 'Grain dealers are worried: a gold squeeze can freeze the export trade.',
    missLine: 'Grain dealers shrug: the Treasury will sell gold if it goes too far.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'Nothing yet. Watch the next season.',
  },
  14: {
    date: 'Fall 1869', title: 'Black Friday', shape: 'credit',
    foreshadow: 'The gold corner is near its peak. Grain merchants are holding off.',
    headline: 'September 24: the gold corner broke. "A gold panic is a [[grain|wheat]] panic," the Chicago men say.',
    hitLine: 'Chicago grain fell hard the same day. Harvest bids are down.',
    missLine: 'Chicago grain dipped and came back by the week’s end.',
    p: 0.8, mag: [0.1, 0.3],
    apply: (x, m) => { x.wheatM *= 1 - m; x.cornM *= 1 - m / 2; },
    effect: 'Grain sells far lower at harvest. Holding to spring avoids the worst.',
  },
  15: {
    date: 'Winter 1869', title: 'A ruling in fine print', shape: 'fineprint',
    headline: 'The Supreme Court hears whether greenbacks must be taken for old debts. A [[fineprint|ruling]] could change what your dollars are worth.',
    hitLine: 'Lawyers say debts may have to be paid in gold.',
    missLine: 'Lawyers expect the Court to change its mind before long.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'No direct effect. Rules can move money without touching it.',
  },
  16: {
    date: 'Spring 1870', title: 'Hog cholera in Missouri',
    headline: 'Hog cholera is killing whole [[livestock|herds]] across the Missouri line.',
    hitLine: 'Two farms in the next county have lost their hogs.',
    missLine: 'The county vet says it hasn’t crossed the river.',
    p: 0.5, mag: [0, 0],
    apply: (x) => { x.choleraP = 0.5; },
    effect: 'Hogs much likelier to die this season.',
  },
  17: {
    date: 'Summer 1870', title: 'France declares war', shape: 'war',
    foreshadow: 'France and Prussia are trading insults over Spain.',
    headline: 'France has declared war on Prussia. Europe will need [[grain|American wheat]].',
    hitLine: 'Liverpool is already bidding up next harvest.',
    missLine: 'Russia has a big crop; Liverpool is calm.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'Nothing yet. Harvest is next season.',
  },
  18: {
    date: 'Fall 1870', title: 'War prices', shape: 'war',
    foreshadow: 'The war is going badly for France. Paris may be besieged.',
    headline: 'Paris is besieged. [[grain|Wheat]] is wanted everywhere in Europe.',
    hitLine: 'Chicago wheat is at a two-year high.',
    missLine: 'Russian wheat is flooding in; prices are only a little higher.',
    p: 0.75, mag: [0.2, 0.4],
    apply: (x, m) => { x.wheatM *= 1 + m; },
    effect: 'Wheat sells much higher at harvest.',
  },
  19: {
    date: 'Winter 1870', title: 'Five years on the claim',
    headline: 'In the spring you can [[proveup|prove up]]: five years lived on the land, and the title is yours.',
    hitLine: 'Witnesses are lined up for the land office.',
    missLine: 'Witnesses are lined up for the land office.',
    p: 1, mag: [0, 0], apply: () => {}, effect: 'The title is yours at the end of this season.',
  },
  // The coda: two seasons of 1873. The exam.
  20: {
    date: 'Summer 1873', title: 'Vienna', shape: 'credit',
    foreshadow: 'Congress passed a coinage bill in February. Hardly anyone read it.',
    headline: 'VIENNA. The bourse has collapsed. Heavy selling of [[railbonds|American railway securities]] in Frankfurt and London. Jay Cooke advertises his [[louder|Northern Pacific bonds]] in every paper.',
    hitLine: 'New York banks are holding cash and slowing new loans.',
    missLine: 'New York says Vienna is a European affair.',
    p: 0.4, mag: [0, 0],
    apply: (x) => { x.creditTight = true; x.callP = 0.2; },
    effect: 'Credit tightens early.',
  },
  21: {
    date: 'Fall 1873', title: 'Jay Cooke fails', shape: 'credit',
    foreshadow: 'Northern Pacific bonds are not selling. Cooke’s ads are getting louder.',
    headline: 'September 18: Jay Cooke & Co. has failed. The Stock Exchange is closed. [[credit|Credit]] has stopped.',
    hitLine: 'The Topeka bank is calling every note it can.',
    missLine: 'The Topeka bank is holding firm for now.',
    p: 0.9, mag: [0.15, 0.35],
    apply: (x, m) => { x.creditTight = true; x.callP = 0.8; x.wheatM *= 1 - m; x.cornM *= 1 - m / 2; x.lotM = 0.3; x.bondM = 0.4; x.landM = 0.6; },
    effect: 'The Panic of 1873. Notes called, prices down, paper and lots crushed.',
  },
};

export const SHAPES = {
  credit: 'Credit tightens abroad',
  louder: 'The seller gets louder',
  herd: 'Everyone votes yes',
  fineprint: 'A rule changes in fine print',
  war: 'War in Europe, wheat in Kansas',
};

// The mechanism library. Each margin note: plain words, how the money moves
// (at most three links), what you hold that this touches (live from the
// ledger). Never what happens next, never what to do.
export const MECH = {
  tab: {
    name: 'The store tab',
    plain: 'Pruitt lets you take goods now and pay later. He charges 3 per cent a month.',
    how: ['3% a month compounds to about 43% a year', 'Interest is added to the balance every month', 'Past $150, Pruitt stops giving credit'],
    touches: (s) => [s.tab > 0 ? `You owe Pruitt $${s.tab.toFixed(0)}.` : 'You owe Pruitt nothing.'],
  },
  note: {
    name: 'A bank note',
    plain: 'A loan from the Topeka bank, at 10 per cent a year, due in one year.',
    how: ['10% a year is about a quarter of what the tab costs', 'The bank borrows from eastern banks', 'When credit tightens, the bank can call the note early'],
    touches: (s) => [s.note ? `Your note: $${s.note.amount.toFixed(0)}, due ${s.note.dueLabel}.` : 'You have no bank note.'],
  },
  bankrate: {
    name: 'The bank rate',
    plain: 'What the Bank of England charges other banks. 10% means money is scarce in London.',
    how: ['American railroads borrow in London', 'When London money is scarce, American banks lend less', 'Your Topeka bank borrows from New York, which borrows from London'],
    touches: (s) => [s.note ? `Your $${s.note.amount.toFixed(0)} note at the Topeka bank.` : 'No note at the bank, so nothing to call.', s.tab > 0 ? `Your $${s.tab.toFixed(0)} tab, if you hoped to refinance it.` : 'No tab.'],
  },
  credit: {
    name: 'Credit',
    plain: 'Lending. When a big lender fails, everyone stops lending to see who’s next.',
    how: ['A failure makes every lender want cash', 'Banks call loans and stop new ones', 'Anything you must sell, you sell at the worst price'],
    touches: (s) => holdingsList(s),
  },
  grain: {
    name: 'Grain prices',
    plain: 'Your wheat and corn are priced in Chicago and Liverpool, not in your county.',
    how: ['Liverpool buys for Europe; Chicago buys for Liverpool', 'A war or a bad harvest in Europe raises the bid', 'A money panic in New York freezes the buyers'],
    touches: (s) => [s.planted.corn + s.planted.wheat > 0 ? `${s.planted.corn} acres of corn and ${s.planted.wheat} of wheat in the ground.` : `${s.acres} broken acres, nothing planted yet.`, s.heldBu.wheat + s.heldBu.corn > 0 ? `${Math.round(s.heldBu.wheat)} bu wheat and ${Math.round(s.heldBu.corn)} bu corn in the crib.` : 'No grain in the crib.'],
  },
  reserve: {
    name: 'The cellar',
    plain: 'Food and fuel put up before winter. It is your emergency fund.',
    how: ['Bought at harvest, stores cost about a fifth less than at the store in January', 'A normal winter eats $25; a hard one $40', 'Whatever the cellar doesn’t cover goes on the tab at 3% a month'],
    touches: (s) => [`Your cellar holds $${s.cellar.toFixed(0)} of stores.`],
  },
  telegraph: {
    name: 'The telegraph',
    plain: 'News by wire, the same week. A dollar a visit.',
    how: ['Fresh news is worth most before everyone has it', 'The church hears it three months late, for free', 'What you know is worth exactly what it cost to know it sooner'],
    touches: (s) => [`You read: church talk${s.subs.weekly ? ', the Topeka weekly' : ''}${s.subs.daily ? ', the Kansas City daily' : ''}.`],
  },
  gold: {
    name: 'The gold premium',
    plain: 'How many greenback dollars it takes to buy 100 in gold. It’s the market’s grade on the greenback.',
    how: ['Exporters are paid in gold; you are paid in greenbacks', 'A wider premium means weaker credit', 'A squeeze on gold can freeze the grain trade'],
    touches: (s) => [`Your cash ($${s.cash.toFixed(0)}) is greenbacks.`, s.heldBu.wheat + s.planted.wheat > 0 ? 'Your wheat is sold to exporters.' : 'You hold no wheat.'],
  },
  livestock: {
    name: 'Livestock',
    plain: 'Hogs bought young and fed up for a year sell for about twice what you paid.',
    how: ['Hogs eat corn you could sell', 'One disease can take a whole herd', 'A new market nearby raises what buyers pay'],
    touches: (s) => [`${s.hogs} grown hogs, ${s.piglets} piglets.`],
  },
  lot: {
    name: 'A town lot',
    plain: 'A building lot in town, sold by promoters who say the railroad is coming.',
    how: ['A lot near the depot can go up fivefold', 'A lot in a town the railroad skips is worth almost nothing', 'Land is worth a lot and sells for nothing in a panic'],
    touches: (s) => [s.lot ? `You own a town lot carried at $${s.lot.value.toFixed(0)}.` : 'You own no town lot.'],
  },
  louder: {
    name: 'The loud seller',
    plain: 'The louder the ad, the more the seller needs your money.',
    how: ['Easy sales need no ads', 'A seller who can’t place paper with banks goes to the public', 'Ask why they are paying more than everyone else'],
    touches: (s) => [s.lot ? 'You bought a town lot from a promoter.' : 'You have bought nothing from a promoter.', s.bonds ? `You hold $${s.bonds.face} of railway bonds.` : 'You hold no railway bonds.'],
  },
  wages: {
    name: 'Wages',
    plain: 'Cash for your work. Certain this season, but it doesn’t build anything you own.',
    how: ['A hand who hires out isn’t breaking sod', 'Crops half-tended yield less', 'A skill raises every wage after it'],
    touches: (s) => [s.skills.apprentice ? 'You apprenticed at the yards: wages are higher.' : 'You have no trade.', `${s.acres} acres broken.`],
  },
  drought: {
    name: 'Drought',
    plain: 'A dry summer. In this county, about one year in five.',
    how: ['Corn needs July rain; wheat is mostly made by then', 'One crop is one bet', 'A dry year is a cellar year'],
    touches: (s) => [`${s.planted.corn} acres of corn, ${s.planted.wheat} of wheat.`, `Cellar: $${s.cellar.toFixed(0)}.`],
  },
  countybond: {
    name: 'A county railroad bond',
    plain: 'The county borrows to pay a railroad to come. Your taxes repay it.',
    how: ['A county bond is your taxes pledged against someone else’s promise', 'The tax is owed whether the road is built or not', 'Everyone voting yes is not a reason'],
    touches: (s) => [s.titled ? 'Your proved-up land is taxed.' : 'Your claim will be taxed.', s.tax ? `You pay $${s.tax} a season now.` : 'No bond tax yet.'],
  },
  shares: {
    name: 'Shares',
    plain: 'Pieces of a company. Print more, and each piece is worth less.',
    how: ['Whoever controls the share count controls the value', 'Insiders can dilute outsiders', 'A Kansas farm holds no Erie shares'],
    touches: () => ['Nothing you own.'],
  },
  fineprint: {
    name: 'Fine print',
    plain: 'A law or ruling that changes what money is worth without touching your money.',
    how: ['Debts are written in dollars; the law says what a dollar is', 'Debtors gain when dollars get cheaper', 'Creditors gain when dollars get dearer'],
    touches: (s) => [s.tab + (s.note ? s.note.amount : 0) > 0 ? `Your debts: $${(s.tab + (s.note ? s.note.amount : 0)).toFixed(0)}.` : 'You owe nothing.'],
  },
  railbonds: {
    name: 'Railway bonds',
    plain: 'Loans to railroads. Europeans held a great many of them.',
    how: ['American railroads are built on borrowed money, much of it European', 'When Europeans sell, new bonds can’t be placed and prices fall', 'The bankers who promised to sell them get stuck holding them'],
    touches: (s) => holdingsList(s),
  },
  proveup: {
    name: 'Proving up',
    plain: 'Five years living on the claim and the 160 acres are yours. Or pay $1.25 an acre to commute early.',
    how: ['Land you hold title to can be sold or mortgaged', 'Land without title is worth nothing to a lender', 'Commuting turns $200 of cash into land today'],
    touches: (s) => [s.titled ? 'You hold title.' : 'You do not hold title yet.'],
  },
};

function holdingsList(s) {
  const out = [];
  if (s.note) out.push(`Your $${s.note.amount.toFixed(0)} bank note, due ${s.note.dueLabel}.`);
  if (s.mortgage) out.push(`Your $${s.mortgage.amount.toFixed(0)} mortgage on the farm.`);
  if (s.tab > 0) out.push(`Your $${s.tab.toFixed(0)} tab at Pruitt’s.`);
  if (s.bonds) out.push(`$${s.bonds.face} of railway bonds.`);
  if (s.lot) out.push('Your town lot.');
  if (s.planted.wheat + s.heldBu.wheat > 0) out.push('Your wheat: Chicago buyers borrow from the same banks.');
  if (!out.length) out.push('Nothing on credit. Your crops and hogs, at whatever buyers will pay.');
  return out;
}

export const BUILDINGS = [
  { id: 'store', name: 'General Store', who: 'Pruitt, storekeeper', color: 0xE07A5F },
  { id: 'bank', name: 'Bank', who: 'Avery, banker', color: 0x8FA8C8 },
  { id: 'land', name: 'Land Office', who: 'The clerk', color: 0xC9A66B },
  { id: 'wire', name: 'Telegraph', who: 'Miss Duval, operator', color: 0x6E9BC5 },
  { id: 'paper', name: 'Newspaper', who: 'Hale, editor', color: 0xEADBC0 },
  { id: 'yards', name: 'Stockyard', who: 'The drover', color: 0xA8734A },
  { id: 'saloon', name: 'Saloon', who: 'Brandt and the regulars', color: 0xB5654A },
];

export const RUMORS = [
  { text: 'A man swears the grasshoppers are coming up from Texas this year.', true: false },
  { text: 'Somebody says the Army will pay double for hay next month.', true: false },
  { text: 'They say Pruitt is raising his prices once the snow comes.', true: true },
  { text: 'A drover says Texas longhorns are $4 a head down south and $40 up here.', true: true },
  { text: 'Word is the bank in Lawrence is short of cash.', true: false },
  { text: 'A surveyor drank here last night and wouldn’t say which way the line goes.', true: true },
  { text: 'They say gold will be at par by Christmas.', true: false },
];

// Transfer scenarios: one before the game, one after. Same decision engine
// idea in words: the best answer protects the household first.
export const SCENARIOS = {
  pre: {
    title: 'Before you start',
    setup: 'It’s 2026. You have $1,500 in checking. Rent of $700 is due next week. You owe $500 on a store card at 29% APR. Your manager just cut everyone’s hours for "a few weeks." A friend says a new token is about to pop and you should put $600 in now.',
    options: [
      { text: 'Put $600 in the token. You can pay the card later.', score: 0, why: 'Your income just got less certain. This bet could leave you short on rent.' },
      { text: 'Pay rent and pay off the whole card. Keep $300.', score: 1, why: 'Killing 29% debt is a great return, but $300 is a thin cushion with your hours cut.' },
      { text: 'Pay rent, pay $200 on the card, keep $600 until your hours are back.', score: 2, why: 'The cut hours are the canary. A cushion first, then the expensive debt.' },
      { text: 'Pay rent, make the minimum payment, keep the rest in checking.', score: 1, why: 'Safe this month, but the card keeps compounding at 29%.' },
    ],
  },
  post: {
    title: 'One more, in 2026',
    setup: 'You have $2,000 in checking. Rent of $900 is due Friday. You owe $600 on a credit card at 24% APR. A headline says your employer’s industry is announcing layoffs. A coworker is pitching a trading app with margin: "borrow and double it."',
    options: [
      { text: 'Open the app and put in $1,000 on margin.', score: 0, why: 'Borrowing to bet when your income is at risk is the 1873 mortgage.' },
      { text: 'Pay rent and pay off the card. Keep $500.', score: 1, why: 'Paying 24% debt is a strong move, but the layoff headline touches your paycheck.' },
      { text: 'Pay rent, pay $300 on the card, keep $800 until the layoff news is clear.', score: 2, why: 'You asked what the headline touches (your job) and kept the cellar full.' },
      { text: 'Pay rent, minimum on the card, keep the rest.', score: 1, why: 'Safe, but the card keeps compounding at 2% a month.' },
    ],
  },
};
