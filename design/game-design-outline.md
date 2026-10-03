# 1866: Game Design Document

Oct 3, 2026 · @Calahan Larson

## How to read this

This is the game's blueprint. It says what the player does, what the game teaches, and how each lesson is built into a mechanic. Art, code and scripts all follow from it.

It builds on the concept v3 summary in the repo (`Cal_summary.md`) and the round 2 mockups. Anything marked **Decided** came from those. Anything marked **Proposed** is my recommendation and needs the team's yes. The open questions are at the end.

A game design document is never finished. We'll update it after every playtest.

## The pitch

**You play a family from a Kansas homestead in 1866 to the present day.** You walk a small open-world town and talk to neighbors who all want something from you. Each season you make money decisions about debt, savings, land and information, and the world answers. As the chapters roll forward, new tools arrive: banks, the stock exchange, credit cards, the internet. The question never changes: *what do I hold that this news touches, and can my family survive it if things get worse?*

Audience: US players aged 18 to 25, on their phones. Think Oregon Trail crossed with Civilization, told like Zelda.

### Design pillars

Every feature has to serve at least one of these. If it serves none, it's cut.

1. **Learn by living it.** Nothing is taught that the player didn't just do. There are no quizzes and no lectures.
2. **Judge the decision, not the luck.** A good call can still end badly. The game shows which was which (Sound, Unlucky, Lucky, Exposed).
3. **Everyone has an angle.** Every NPC tells the truth as they see it, and every NPC wants something.
4. **Information costs something.** Better news costs money, time or trust. Knowing sooner is an edge, and the edge shrinks as technology spreads.
5. **Your family outlives you.** Compounding, debts and habits pass to the next generation.
6. **Patience has to feel good.** The careful path needs to be as satisfying to play as the risky one.

## Structure: six chapters, one family

**The game is one continuous run split into six chapters, like the eras in Civilization.** Your family, money and reputation carry from one chapter to the next. Each chapter unlocks new tools and new places, and each one ends with a real financial crisis that acts as its boss fight.

| Chapter | Years | What unlocks | How you get news | Boss crisis | Big lesson |
| --- | --- | --- | --- | --- | --- |
| 1. Frontier | 1866–1893 | Land, livestock, the store tab, bank notes, town lots, county bonds | Church talk, weekly paper, telegraph ($1 a message) | Panic of 1873, then 1893 | Emergency fund, cost of debt, leverage |
| 2. Gilded Age | 1894–1913 | Savings accounts, stocks, life insurance, trusts | Daily paper, stock ticker in the city | Panic of 1907 | Diversification, who controls the shares |
| 3. War and Crash | 1914–1945 | Liberty bonds, buying on margin, mutual funds, FDIC, Social Security | Radio, brokerage office | 1929–1933 | Margin, bank runs, deposit insurance |
| 4. Postwar | 1946–1979 | GI Bill mortgage, pensions, the suburbs, credit unions | TV, the Wall Street Journal | 1973–74 oil shock and inflation | Inflation, home ownership, pensions |
| 5. Financialization | 1980–2007 | 401(k), IRA, index funds, credit cards, options | Cable news, the early internet | 1987, 2000, 2008 | Index funds, fees, credit card debt |
| 6. Digital | 2008–today | Trading apps, ETFs, crypto, buy-now-pay-later | Social media, push alerts (free and instant) | 2020, and whatever is next | Hype, scams, attention as a cost |

Each chapter introduces its new tools through the world, not menus. In chapter 2 a stockbroker opens an office in town. In chapter 6 a phone shows up in your hand. The tools from earlier chapters stay, so by the end the player has the full modern toolkit.

**Proposed:** a full run takes 8 to 12 hours. There are also two shorter modes: a single chapter (about 90 minutes) and a single crisis (20 to 30 minutes).

## Time and progression

**Time moves in turns, and turns get shorter when the stakes go up.** In calm years one turn is a whole year. Inside a crisis one turn is a season. That puts most of the player's attention on the moments that matter, and it keeps a 150-year run playable.

| Scale | What it is | What happens |
| --- | --- | --- |
| A turn | One season or one year | The news arrives, you walk the town (3 visits), you set your plan, the turn plays out |
| A year | 4 seasons, or 1 calm-year turn | The letter home: each decision gets a verdict |
| A generation | About 25 years | The head of the family dies or retires. There's a will, an heir with different skills, and family lore |
| A chapter | 20 to 40 years | New tools and places unlock, and a crisis ends it |

### How the player progresses

Money is only part of it. The family grows in four ways, and each one opens up options:

- **Wealth:** you can see it in the world. A soddy becomes a frame house, then a brick one. The town grows around you.
- **Access:** some tools need standing. A bank won't write a mortgage until you hold title. A broker won't open an account below a minimum. Having access is a kind of wealth in itself.
- **Skills:** you learn by spending a visit, for example apprenticing, schooling the heir or learning to read the market page. Skills raise wages or make your news more reliable. At $30 of wealth, learning is usually the best return available.
- **Lore:** each pattern the family has lived through once (a credit crunch abroad, a seller who gets louder, a crowd all voting yes) becomes a hint for heirs the next time it shows up.

**Proposed:** generations change hands at fixed points in history. The new heir picks one trait (frugal, bold, scholarly, sociable), which changes their starting skills and which NPCs warm to them.

## The core loop

The same five beats run every turn. They match the five mockup screens.

1. **The news arrives.** It comes in the era's medium: a rider, a telegraph, a newspaper, a radio, a ticker, a phone. It might be late, it might be wrong, and it might be gossip.
2. **Walk the town.** You get three visits (the boots in the header). Each one is a person or a place. Talking costs a visit, so choosing who to listen to is itself a decision.
3. **Make the calls.** Inside a building you make one concrete money choice: plant, borrow, save, buy, sell, insure, learn. Each choice is a physical action, like signing a book, handing over coins or shaking a hand.
4. **The turn plays out.** The world moves: a harvest, prices, weather, a bank run. You watch it happen in the town, not in a spreadsheet.
5. **The letter home.** Every decision gets a stamp: **Sound, Lucky, Unlucky or Exposed**, along with the ten ways it could have gone. This is where the lesson lands.

**The key idea:** the game grades the decision, not the outcome. If you made a good call and got unlucky, you're told so. If you made a reckless call and won, you're told that too. That's the one habit the game exists to build.

## What it teaches, era by era

Each lesson is a **mechanic** the player has to use to survive the era, not a text they read.

| Era | Concept | How it's built into play |
| --- | --- | --- |
| Frontier | Interest and compounding | The store tab grows 3% a month, and you can see it on the ledger page each visit |
| Frontier | Saving and buffers | Cellar jars: food you put by is the emergency fund |
| Frontier | Investing in yourself | Breaking sod and learning a trade pay off slowly but surely |
| Gilded | Collateral and mortgages | The bank wants your land title; miss payments and you watch the sign go up |
| Gilded | Monopoly and pricing | The rail line sets freight rates; a co-op with neighbors is the counter |
| War & Crash | Leverage and margin | Buying stock at 10% down feels great until the call comes |
| War & Crash | Bank runs and deposit insurance | A run on the bank is a crowd in the street; after 1933 the FDIC sign changes the crowd |
| Postwar | Diversification and index funds | Picking one stock vs. owning a slice of all of them, shown over many years |
| Postwar | Inflation | Prices on the store shelf creep up while your cash sits still |
| Financialization | Credit scores and cards | A plastic card that makes buying easy, and a score that follows you |
| Financialization | Retirement accounts and fees | A 1% fee looks tiny until the 30-year letter |
| Digital | Scams, hype, and risk | Viral tips, meme stocks and crypto, with the same old patterns underneath |
| Digital | Information overload | News is instant and free; the hard part is knowing who to trust |

Across every era the thread is the same: **interest, risk, information, time.**

## Teaching without homework

Rules every screen follows:

- **No quizzes, no glossary popups, no lectures.** A word like "interest" appears only when a character says it.
- **Show the number in the world.** Debt is a book on Pruitt's counter that gets thicker. Savings are jars on a shelf. Risk is ten little winters lined up.
- **People explain, with motives.** The storekeeper wants you on credit. The banker wants collateral. Neither is lying, and neither is neutral.
- **Consequences come later.** A choice in spring pays out in winter. Delayed results are the most realistic and the most memorable.
- **The letter is the debrief.** It's in your own voice, and it names one thing to remember. That's the only "lesson" text in the game.
- **Optional depth.** A ledger icon opens the math for players who want it. Nobody is required to open it.

## Core systems

Five systems sit under everything. If you're new to building games, build them in this order.

- **Money:** cash, debts (each with a rate and a holder), assets (land, stock, savings) and income. Every turn, interest is applied and the ledger updates.
- **Credit:** who will lend to you depends on what you own and how you've paid before. Paying on time opens doors. Missing payments closes them and raises rates.
- **Information:** each piece of news has a source with a hidden reliability. Gossip is cheap and often wrong, the telegraph is fast but terse, and the paper is late but detailed. The player learns whom to trust by experience.
- **The decision engine:** when a turn resolves, the game quietly runs the same choice through ten possible versions of the season. That's how it can stamp Sound, Lucky, Unlucky or Exposed, and draw the ten jars.
- **The family:** the family carries over between generations, as do its debts, its skills and its lore. That gives long-term thinking a real payoff.

## NPCs

Every NPC wants something from you. That want is how they teach.

| NPC | Wants | Teaches |
| --- | --- | --- |
| Pruitt, the storekeeper | Your business on credit | Interest, tabs, the cost of convenience |
| The banker | Safe loans with collateral | Mortgages, credit history, bank runs |
| Widow Ames, a neighbor | Help, and help back | Saving, community insurance, co-ops |
| The rail agent | High freight rates | Monopoly, bargaining power |
| The drummer (traveling salesman) | A quick sale | Hype, too-good-to-be-true deals |
| The telegraph clerk | Nothing, but sees everything | Information, sources, timing |
| The schoolteacher | Your children in class | Investing in skills |

NPCs **carry across eras** as their descendants. Pruitt's grandson runs the department store, and his great-grandson runs a credit card company. Players see the same motives in new clothes.

### How dialogue is scripted

Each line of dialogue is a small data entry, not code. A line has:

- **who** says it
- **when** it can appear (the era, the season, or a condition such as "tab over $40" or "the player ignored this NPC last time")
- **text**, written in period voice
- **truth:** whether the hint is reliable, and how often
- **choices:** what the player can say back, and what each one changes

This lets a writer add hundreds of lines without touching the engine. NPCs also **remember**: whether you paid, whether you listened, whether their tip was right.

## Replayability

History is fixed, but how you hear about it isn't.

- **A fixed spine:** the Panic of 1873, 1929 and 2008 always happen. That's the teaching backbone.
- **Variable timing and signals:** which season it hits, who warns you, and whether the warning is true all change each run.
- **Local shocks:** weather, fires, a neighbor's illness and a new railroad are rolled per run.
- **Different heirs:** traits change what's easy and who trusts you.
- **Different starts:** choose a homestead, a city shop or a dockworker's family. Each one meets the same history from a different angle.
- **Rival families:** two or three other families play alongside you with their own styles (cautious, bold, crooked). Comparing the end of the game shows how differently things could have gone.
- **Challenge runs:** for example, "Start in debt" or "Never borrow."

## World and exploration

- **One town that grows.** It's a single map that changes with the eras: a dirt main street, then brick, then a downtown, then a suburb and a strip mall. You always know where you are.
- **Enterable buildings.** Each one is where a set of decisions happens: the store, the bank, the telegraph office, the school, the exchange (from the Gilded era on), and later a brokerage and a phone in your pocket.
- **Visits are the clock.** Walking is free and talking costs a visit, so exploring has meaning without a timer.
- **Secrets reward curiosity.** A bulletin board with rumors, a back-room card game (gambling, Exposed), an old-timer on a bench who remembers the last panic.
- **Art rule:** toy 3D for the world where you act, ink on paper for anything you read.

## Build plan

Build small and playable first. Each step should be something you can hand to a tester.

1. **The vertical slice:** one town, Frontier era only, 1866–1873. Three buildings (store, bank, telegraph), four NPCs, the full core loop and the letter. It ends with the Panic of 1873. *This is the next prototype.*
2. **The second chapter:** the Gilded era. The town upgrades, the exchange opens, and the first generational handoff happens.
3. **The engine pass:** move all dialogue and events into data files so a writer can add content.
4. **Playtest with students:** watch whether they can explain compound interest afterward without having been taught it.
5. **The remaining chapters**, one at a time.

**Tech:** the browser, HTML and Three.js, as now. No install needed, and it runs on school Chromebooks.

## Decisions so far

- **The player:** young adults, 18 to 25 and into their early 30s. The reading level is adult and the tone is direct and never childish. These are people who are opening their first credit card, signing a lease, or getting their first 401(k) form.
- **Session length:** one chapter takes 30 to 45 minutes, and a full run takes about 4 to 5 hours. Replays should feel different (see Replayability), and once a run is finished, chapter select opens up.
- **The game is the teacher:** there's no classroom and no human teacher. The game teaches each player individually, in four ways:
  - **A mentor in the family.** The family elder (a grandmother in 1866, with a new elder each generation) can be asked for advice at any time, and asking is free. She never gives the answer. She asks the question you should be asking ("What happens to that tab if the harvest is late?").
  - **It notices patterns.** The game tracks which ideas each player struggles with. If you keep getting stamped Exposed on borrowing, the world brings borrowing back in new forms until you get a Sound stamp. Ideas you've mastered come up less often.
  - **A warning before big mistakes.** Before a choice that could ruin the family, the elder or a trusted NPC speaks up once. You can still go ahead. The lesson sticks better when it was your call.
  - **A chapter review.** At the end of each chapter the elder writes a short note: what you did well, one habit to work on, and links into the Almanac. It's the closest the game gets to a report card, and it's written as a letter, not a grade.
- **History:** the game stays focused on economics and doesn't go deep into social history such as sharecropping or redlining.
- **The Almanac (glossary and help):** an in-game reference book. An entry unlocks the first time you run into the term in play. Each entry has three parts:
  - **What it is,** in one or two plain sentences.
  - **What it did to you,** pulled from your own run (for example, "Your 1867 store tab cost $11 in interest").
  - **Today:** the modern version, such as a credit card APR, a BNPL plan or a payday loan.
  - The Almanac is always optional, so it stays show-don't-tell. It's where the lesson connects to real life.
- **Standing:** it carries between chapters. It's made of wealth, credit record, skills, reputation with NPCs, and lore. A strong finish in one chapter opens doors in the next (better loan terms, early access to the exchange, trusted tips). A weak finish means a harder start but never a dead end. Wealth helps, but standing is what opens options. The guiding idea is John Wooden's: luck is when preparation meets opportunity. The unit is the family, and the score is family standing.
- **Making your family:** at the start, the player names the family and its first head, and picks the look from toy-style presets for skin tone, hair, face and clothes. Each heir gets a quick look editor at the generational handoff, starting from the parents' looks. Appearance is cosmetic only: no NPC or price reacts to it, in line with the economics-only focus.
