# Prove Up — Concept v3

**Working title:** 1866
**Positioning:** Oregon Trail for financial literacy
**Audience:** US, ages 18–25, native mobile
**Status:** concept v3, for group review — not a spec
**Date:** 2026-09-12 (v3 same day as v2; see "v3 — what changed" near the end)

Companion docs (private links, share from the page menu):
- Concept doc (this document, designed): https://claude.ai/code/artifact/b15efd96-5c9f-4b82-91e4-c27288216155
- Art-direction canvas (five phone mockups): https://claude.ai/code/artifact/05c09cdd-ffa7-4ccb-9ed5-72418504598c — working files in `design/art-directions/`

---

## Thesis

**The game teaches people to read the canary, not to get rich in Kansas.**

An ordinary person in 1866 had access to real signals — a foreign bank failure on the cable, a railroad surveyor in town, a bill nobody read — and the difference between building a dynasty and losing the farm was mostly *which signals they noticed, and what they did about them.* History is the answer key. The skill transfers to 2026; the answer key does not.

"Prove up" is the Homestead Act term for earning title after five years on the land. It is the arc of the prototype.

**The skill has a name.** Reading the canary is not predicting events. It is a habit of three questions, asked every time news lands:

1. *What do I hold that this touches?*
2. *If this gets worse, what happens to it?*
3. *Can the House survive that?*

Then: reduce, hold, or add — and how much. That habit is what a Kansas farmer in 1873 and a 22-year-old with a brokerage app in 2026 have in common. Everything in the game exists to make the player run those three questions until they do it without being asked.

---

## Decided

| Decision | Detail |
|---|---|
| Real US history — fixed spine, variable transmission | Real events on real dates every run. What varies is *transmission*: how hard each shock hits, how fast it arrives, and whether it reaches your county — within the ranges the record shows. A small deck of real scares that fizzled is mixed in. Rival houses ride the same branch you got. A canary is a probability, never a cheat code, so a second run cannot be played from memory. |
| Decisions are graded, not just outcomes | A decision engine runs each choice forward across the plausible branches and reports expected result, bad-tail result, and chance of ruin, judged against the track the player said they were playing for. Verdicts are shown in review, never live. The engine is built before art or content. |
| The game never tells you what to do | It tells you what happened, how the money moves, and what you hold that it touches. The call is yours. The debrief shows what would have held up. |
| Human capital is an investment | A "learn" action in the three-visits system — apprentice, school the heir, learn to read the gold premium. It costs a visit, which is the real cost, and it raises wages, information reliability, or the heir's skills. At $30 it is usually the best return on the board, and the game should let the player discover that. |
| Technology thesis, stated | Across the eras: instruments change, access costs fall, information edges decay as they spread, and behavior does not change at all. One mechanic carries it — the information cost curve. In 1866 the telegraph is expensive and the edge is real; each later era the fastest source gets cheaper and the edge shrinks. |
| Prototype first — twenty turns before anything else | Both teammate reviews said it. Nothing past the prototype section gets built until twenty seasons are fun. |
| One continuous run, not chapters | Civilization-style: 1866 to the present in one game, eras as phases. Generations are events, not resets. |
| The player is the House | You play the family, not a person. A death is an inheritance event — a will, a tax, an heir with different skills — and compounding never breaks. |
| Scarcity start is the default difficulty | $30 inherited, ~$14 to file, a ~$225 gap before the first crop. A comfortable stake is the easy setting. |
| Information is the core system | Every source has a cost, a delay, a reliability, and a bias. The game will let you act on something false and lose — and show you why. |
| Rival houses — light | Three or four scripted families riding the same branch you got. A tax roll once a year, an occasional deal, one chart at the end — and in the Almanac, each rival across *all* branches, so the Speculator is a distribution, not a moral. |
| 2D, illustrated | Pick the form before the tool. No 3D in the prototype. |
| Frontier era teaches capital allocation | Oxen vs. plow, seed vs. provisions, cash vs. credit, what to hold back for winter. Securities arrive with the Gilded era. |
| No casino loops | No artificial daily hooks, no dopamine taper. |

---

## The prototype: 1866–1871, then the reckoning

**Twenty seasons, one coda, one inheritance.**

- **Scope:** 1866–1871, four seasons a year, twenty turns. Then a two-year coda into the Panic of 1873 — the exam. Then a short playable scene as your heir.
- **Place:** one county in eastern Kansas. Seven buildings: land office, general store, saloon, telegraph, stockyard, bank, newspaper.
- **Backstories:** four, each with a real historical edge and cost — mustered-out Union private, farm kid from Ohio, freedman, German immigrant.
- **Content:** ~40 dated event cards with sources; six recurring characters; three or four rival houses.
- **Debrief:** letters home once a year; the Almanac at the end; one bridge card to the present.
- **Measurement:** a short concept check before turn one and after the coda; a *transfer scenario* before and after (see "How the game teaches"); telemetry on every canary seen, on whether the player opened the exposure view before deciding, and on every decision verdict.
- **Session:** 3–5 minutes a turn, save anywhere. ~90 minutes end to end.
- **Build order:** decision engine first (a spreadsheet-grade model of twenty seasons is enough), then the margin notes and mechanism library, then scenes and art.
- **Not in it:** other eras, the instrument tree, victory tracks, geography, ventures, multiplayer, cosmetics.

**Success tests, two of them:**

- *Engagement, verbatim:* "I want to try again because I think I could set my family up differently."
- *Learning:* on a novel scenario after the coda — one the player has not seen, ideally a modern one — their decision-quality score is measurably better than on the matched scenario before turn one. Transfer, not recall.

If playtesters agree with the engine's verdicts on their own decisions ("yes, that was lucky"), the premise holds. If they argue with the verdicts, fix the engine before anything else.

The heir scene is in the prototype on purpose: it is the most distinctive idea and the cheapest to test.

---

## The loop — one season, one session

1. **The post arrives.** News from whatever sources you pay for — church talk (free, three weeks stale), the weekly Topeka paper, a Kansas City daily by post, the telegraph office. Some is signal, some noise, some a red herring.
2. **A week in town — three visits.** Seven buildings, three visits. Each is an illustrated scene with a character and a decision. You can't see everything, so you learn where to look. Choosing the telegraph over the saloon *is* due diligence.
3. **Set the farm.** One allocation screen: labor and cash across crops, stock, improvements, the winter store, and any paper you hold.
4. **The season turns.** Weather, prices, and whatever fixed history landed this quarter. Every loss is decomposed on screen: *the drought cost $80 · your winter store covered $50 · your 3%/month tab turned the rest into $60 by spring.*
5. **A line in the letter home.** One sentence, composed from what you did, added to this year's letter.

---

## Design rules

1. **Nothing is taught that the player didn't just do.** No quiz bolted onto a story.
2. **No path dominates.** Employment, ownership, saving, and borrowing must each be the correct call somewhere in the run. A debt-free wage earner came through 1873–79 better than a leveraged landowner — build that moment in.
3. **Every loss is explained, and every decision is judged separately from its outcome.** A good decision can have a bad outcome. The player sees how reserves, debt, and choices shaped the damage, and gets a verdict on the decision itself: Sound, Unlucky, Lucky, or Exposed.
4. **Heirs inherit decisions, not just cash.** Soil, reputation, debt, skill, relationships, and family lore (canaries read correctly, passed down as hints).
5. **Explain the mechanism, never the prediction.** Before an event resolves, the game will say how the money moves and what you hold that it touches. It will not say what happens next or what to do.

**Unsolved sixth rule:** the correct strategy has to be the satisfying one. If big swings feel good, the game has taught speculation. Needs its own session before reward tuning. One lever is now available: a boring move that earns "Sound" in the letter home is a reward the old design didn't have.

---

## How the game teaches

**The honest constraint first.** Most Kansans in 1873 did not know that a crash in Vienna touched them until their bank called the note. The ones who did were reading a Kansas City daily instead of listening to church talk, or had a German neighbor who read the German-language papers. That gap *is* the lesson. The game does not pretend everyone could have known. It prices knowing, and it shows afterward who knew what, when, and what it cost.

The player is never expected to arrive knowing how a bourse in Vienna reaches a farm in Kansas. The game carries that load in six ways.

### 1. The margin note — the hover state

Every news item, price, and holding has underlined terms. Tap one (long-press on phone) and a note slides up in the margin of the page. It has at most four parts, in this order, and it never has a fifth:

| Tier | What it says | Rule |
|---|---|---|
| **Plain words** | One sentence. What this is, in the language of a smart 20-year-old. | Always shown. |
| **How the money moves** | The mechanism, at most three links. Facts about how the world works, not about the future. | Always shown. Drawn from the mechanism library, so it is cited. |
| **What you hold that this touches** | Your exposures, pulled live from your ledger. | Always shown. This is the game answering question 1 for you until you learn to ask it yourself. |
| **Rhymes with** | A dated earlier event with the same shape, if you were there for it. | Shown on the second appearance of a pattern, never the first. |

**Not in the note, ever:** what happens next, or what to do. That is question 2 and question 3, and they are the player's job.

**Worked example — May 1873, Kansas City daily, six days late:**

> VIENNA — Bourse in collapse. Heavy selling of American railway securities in Frankfurt and London.

Tap *American railway securities*:

- **Plain words.** European investors are dumping the bonds of American railroads.
- **How the money moves.** American railroads are built on borrowed money, much of it European → when Europeans sell, new bonds can't be placed and prices fall → the bankers who promised to sell those bonds get stuck holding them.
- **What you hold that this touches.** Your county's $10,000 rail-bond issue (you voted yes, spring 1871). Your note at the Topeka bank, due October — that bank holds rail paper. Your wheat: the Chicago buyers borrow from the same banks.
- **Rhymes with.** May 1866: a London bank failed, credit tightened, railroad building slowed. You held no paper then.

The player closes the note and decides. The game says nothing more until the season turns.

**After the season (September 1873):** the decomposition on screen adds what the note could not say before. *Jay Cooke & Co. failed Sept 18. Your county bond is quoted at 40 cents. The Topeka bank called your note; you sold the hogs to cover it at a $35 loss. A $60 reserve or a note due in spring instead of fall would have held.* Then the verdict, in the letter home: **Exposed** — bad decision, bad outcome. Or **Unlucky** — sound reserve, but this branch hit hard. The full causal chain, Vienna to your hogs, is drawn only now, after the player has lived it.

**Progressive disclosure.** The first time a mechanism appears the note is full length. The second time it is one line plus "rhymes with." The Almanac keeps every full note, so the glossary the player ends the game with is the one they built by tapping.

### 2. The mechanism library

Every "how the money moves" line is assembled from a small library of plain-words mechanisms, each with a source. The prototype needs roughly fifteen. First draft:

- American railroads are built on borrowed money, much of it from Europe.
- A bond is a loan. Its price falls when sellers outnumber buyers, and its yield rises to match.
- When a big lender fails, everyone else stops lending to see who's next. Credit tightens everywhere at once.
- The gold premium is the market's grade on the greenback. A widening premium means weaker credit.
- A merchant's tab compounds monthly; a bank note compounds yearly. The same dollars cost about triple on the tab.
- Land is worth a lot and sells for nothing in a panic.
- Grain prices are set in Chicago and Liverpool, not in your county.
- A county bond is your taxes pledged against someone else's promise.
- The louder the ad, the more the seller needs you.
- Insurers fail when the same fire hits all their customers at once.
- A war in Europe raises the price of your wheat. Peace lowers it.
- Whoever controls the share count controls the value.
- A boring invention (barbed wire) can end an entire way of making money (the open range).
- A law can change what your money is worth without touching your money.
- What you know is worth exactly what it cost to know it sooner than the next buyer.

These are also the citation standard in miniature: each mechanism is a claim historians agree on, with a reference. The event cards carry the dates; the mechanisms carry the *why*.

### 3. Characters as biased teachers

The six recurring characters explain the world, and every one of them has a stake in what you do with the explanation. The banker explains credit and wants you to borrow. The editor explains sources and sells subscriptions. The storekeeper explains the tab and profits from it. The German neighbor reads the German-language papers and knows about Bismarck's currency reform two years before the Topeka weekly mentions it — and wants to buy your back forty. Every explanation is true and every explainer has a motive. That is the due-diligence lesson delivered in scene rather than in a tooltip, and it satisfies rule 1.

### 4. Patterns, not predictions

How does a player *anticipate*? Not by guessing events. By recognizing shapes:

| Shape | First time | Second time |
|---|---|---|
| Credit tightens abroad | Overend Gurney, May 1866 | Vienna, May 1873 |
| The seller gets louder | Town-lot promoters, 1867 | Cooke's ads, summer 1873 |
| Everyone votes yes | The county bond vote, 1869 | Rail-bond mania, 1872 |
| A rule changes in fine print | Greenback legal-tender rulings | The Coinage Act, 1873 |

The prototype deck is built so that every shape appears twice before the coda. "Rhymes with" fires on the second appearance. The Almanac's last page lists the shapes the player saw and how they responded each time — that is the "family lore" heirs inherit.

### 5. The source track record

Every source the player pays for gets a scorecard in the Almanac: how many of its stories were right, how late it was, and what it cost. *Church talk: 2 of 7 right, three weeks late, free. Kansas City daily: 6 of 7, six days late, $8 a year.* The player who heard about Vienna in June is shown, in the debrief, that it was on the wire May 9 and in the Topeka weekly May 17. Information quality is taught as a receipt, not a lecture.

### 6. The transfer scenario

Before turn one and after the coda the player gets one short scenario the game has not shown them — the post-game one should be modern: $2,000 in checking, a headline, a credit-card balance, rent due Friday. The same decision engine scores both. The difference is the learning measurement. This is the number that answers "does the game work," and it is the number the playtest is for.

### Sequencing — four blocks of five turns

| Turns | New idea | Kept under pressure |
|---|---|---|
| 1–5 | Reserves and the cost of debt | — |
| 6–10 | Diversification and paying for information | Reserves, debt |
| 11–15 | Leverage and liquidity | All of the above |
| 16–20 | Bubbles, the herd, due diligence | All of the above |
| Coda | Regulatory shock and the panic — the exam | Everything |

One big idea per block; the earlier ideas recur under new conditions. The margin notes in a block are full length for that block's idea and one line for the rest.

---

## The decision engine

The same model that turns the season — weather, prices, credit, the fixed spine with variable transmission — is run forward from each decision point across many plausible branches. That is the whole engine. One model, two uses: play the season, grade the choice.

**Per decision it reports three numbers:** the expected result, the bad-tail result (worst fifth of branches), and the chance of ruin (the House dissolves within two years). **It judges against the track the player declared** — Legacy, Independence, Sage, or Builder — and lets them peek at the others, because a 22-year-old with no dependents can rationally carry more risk than a House with three children.

**The verdict is a 2×2, in one word:**

| | Good outcome | Bad outcome |
|---|---|---|
| **Good decision** | Sound | Unlucky |
| **Bad decision** | Lucky | Exposed |

**Shown in review, never live.** Chess apps show the evaluation bar after the game. Here the verdicts appear in the letter home and the Almanac. Shown during play they turn the game into a quiz and break rule 1.

**Always in words as well as numbers.** *Your winter store covered a normal winter but not a drought. Droughts hit this county about one year in five. You were Unlucky, not Exposed.*

**Rivals get graded too.** At the end the player sees each rival house across all branches, not just the one they shared: *the Speculator was ruined in seven of ten histories and rich in three; you saw one.* That is the honest lesson about leverage, and it stops the Speculator from being a morality play.

**Why this is first.** If the engine can tell a player "that was lucky" and "that was sound" in words they agree with, the premise fulfills the educational goal. If it cannot, nothing downstream can. A spreadsheet-grade model of twenty seasons is enough to find out.

---

## Curriculum, mapped to 1866

The Almanac gives every row a third column at the end of the run: *what changed by 2026, and what didn't.* That column is the technology thesis made concrete — the store tab is a 42% APR card, Cooke's ads are the influencer pump, the county bond vote is the herd.

| Concept | On the frontier |
|---|---|
| Emergency fund | The cellar. Get caught empty and you're on the store's tab at 3%/month. |
| Human capital | A visit spent learning instead of trading. Read the gold premium yourself, apprentice at the smithy, school the heir. Usually the best return on the board at $30. |
| Cost of debt | Merchant's tab vs. bank note vs. neighbor's loan — same dollars, wildly different cost. |
| Compounding, both ways | Lend at 10%/year; owe at 3%/month. |
| Income vs. wealth | Wages or equity — each right at a different moment; the game doesn't say which. |
| Diversification | Corn, hogs, a town lot. The grasshoppers eat one, not all. |
| Liquidity | Land is rich but won't sell in a panic. Gold is poor but spends anywhere. |
| Inflation and currency | Greenbacks vs. gold — the daily premium in the paper. |
| Risk vs. return | Rail bonds at 7%, a Treasury at 5%, gold at 0%. Why is Cooke paying more? |
| Leverage | Mortgage the farm to buy town lots. 1872 makes it look brilliant. |
| Bubbles and the herd | The county railroad-bond vote. |
| Due diligence | Cooke's ads: the louder the ad, the more nervous the seller. |
| Information quality | Which source, at what cost, with what delay and what motive. |
| Regulatory shock | The Coinage Act, buried in fine print. |
| Insurance and mutual aid | The raising bee; hail cover; the Chicago fire that took the insurers with it. |
| Patience | The five-year prove-up. Commutation is always one tap away. |
| Estate planning | The will. |

---

## The full run (north star — not the build)

One continuous game, 1866 to the present. Every event is a dated card with sources and dependencies; every instrument is a real return series.

| Era | Years | Unlocks | Boss fight |
|---|---|---|---|
| Frontier | 1866–1893 | Land, livestock, merchant credit, county and rail bonds, the bank | 1873 · 1893 |
| Gilded / Industrial | 1894–1913 | Stocks, trusts, life insurance, the savings account | 1907 |
| War & Crash | 1914–1945 | Liberty bonds, margin, mutual funds, FDIC, Social Security | 1929–33 |
| Postwar | 1946–1979 | GI Bill mortgage, pensions, the suburb, inflation | 1973–74 |
| Financialization | 1980–2007 | 401(k), index funds, IRAs, credit cards, options | 1987 · 2000 · 2008 |
| Digital | 2008–present | ETFs, apps, crypto, zero-commission trading | 2020, and next |

- **Instrument tree:** gated by era *and* by the House's access (wealth, literacy). Access to instruments is itself a form of wealth.
- **Turns:** adaptive — a year per turn in calm stretches, a season per turn inside crises. ~160 turns, 3–5 min each, **8–12 hours** for a full run. Lengths: Quick (one era, ~90 min), Standard (full), Scenario (one crisis, 20–30 min).
- **Cutoff:** the current real year; the last screen is the bridge to the player's own life.
- **Victory tracks:** Legacy (net worth in real dollars), Independence (year passive income covered expenses), Sage (Sound verdicts on canaries, weighted by how early — decision quality, not calls), Builder (an enterprise that outlived its founder). Bankruptcy is not game over; the House dissolving is.
- **Technology thesis across eras:** the information cost curve. Telegraph subscriber → ticker → terminal → free app. Each era the fastest source gets cheaper and the edge it buys shrinks. The instruments change every era; the three questions never do.
- **Flexibility:** breadth of instruments, sizing and structure (never yes/no), geography, ventures with real base rates, deals. A Saver, Speculator, Landlord, Lender, and Builder should each finish respectably and each win a different track.
- **Rival houses:** the Speculator, the Saver, the Builder, Old Money — scripted against known data; the paths you didn't take.

---

## Teammate reviews — what changed

**Adopted:** twenty turns before anything else; no path dominates; explain every loss; heirs inherit decisions; pre/post assessment from day one; heir scene in the prototype; name the frontier's lesson as capital allocation; keep the scarcity start (as default difficulty); "Oregon Trail for financial literacy."

**Pushed back on:** "a Kansas homesteader had essentially nothing to invest in" — overstated (county/rail bonds, town lots, lending, cattle shares, gold vs. greenbacks were all real), but the framing is right and we're using it.

**Confirmed:** information quality as a core system; seasons as turns; 2D illustrated; wealth visibly expanding options; the five-year prove-up as a first objective.

**Still open:** making the correct strategy the satisfying one.

---

## v3 — what changed

Same day as v2, after a premise review against the educational goal (18–25, real research, how world events reach a personal portfolio, how opportunity differs by wealth and era).

**Weakness found → change made:**

- A fixed timeline teaches the answer key; the Sage track rewarded prescience → *fixed spine, variable transmission*, real false alarms, Sage re-scored on decision quality.
- The success test measured engagement, not learning → second success test: the transfer scenario.
- Grading outcomes rewards luck; the base rate (~40% of homesteaders proved up) would teach helplessness → *the decision engine* and the Sound/Unlucky/Lucky/Exposed verdict; luck and skill split on screen.
- The Speculator rival always lost in 1873 — a morality play → rivals graded across branches.
- "How do they know Vienna matters?" had no answer → *How the game teaches*: the margin note, the mechanism library, biased characters, patterns, source scorecards.
- No stated thesis about technology → stated; carried by the information cost curve and the Almanac's third column.
- Human capital missing, though it is the best return at $30 → the learn action.
- Sixteen concepts in twenty turns → four blocks of five.
- Ledger uncited → citation standard: every number tagged *measured*, *modeled*, or *invented*, with a source. Numbers we cannot source become modeled ranges, which the transmission model needs anyway.

**Build order changed:** engine → margin notes and mechanisms → scenes and art.

---

## Signal ledger, 1866–1874 (prototype event deck — uncited; research pass pending)

Dates and events are the fixed spine. The "What happened" column is the *recorded* branch; the transmission model varies magnitude, arrival, and county incidence around it, within sourced ranges. Rows marked † are the second appearance of a shape and fire "rhymes with."

| When | What you could see | What it meant | What happened |
|---|---|---|---|
| May 1866 | Overend, Gurney & Co. fails in London; Bank rate 10% | World credit center tightened; US railroads borrow there | Credit to US roads slowed |
| Jun–Aug 1866 | Austro-Prussian War | European demand; Prussia rising | Set up German unification |
| Jul 1866 | Transatlantic cable works | Information speed changed | Telegraph subscribers gain an edge |
| 1866–70 | Kansas Pacific surveyors, then graders (Salina & Hays 1867, Denver 1870) | Lots near the line triple; land off the line is worthless | Boom towns; many "cities" never got a depot |
| 1866–79 | Daily gold premium in the paper | Currency unstable; widening premium = weaker credit | Par not reached until 1879 |
| Spring 1867 | McCoy buys Abilene's lumber, builds stockyards, advertises in Texas | Real money betting on the cattle trail | $4/head Texas → $40 Abilene; hundreds of thousands by 1871 |
| Mar 1867 | Alaska purchased, mocked | Looks stupid; is it? | Gold and resources followed |
| Oct 1867 | Medicine Lodge Treaty | Which land is "safe" just changed | Raids reduced in settled counties |
| 1868 | Erie War | Whoever controls the share count controls value | Erie shareholders diluted to nothing |
| 1868–72 | Kansas counties vote railroad bonds | Public leverage on a private promise | Decades of debt on lines never built |
| Sep 24, 1869 | Black Friday gold corner | A gold panic is a wheat panic | Grain fell ~20% in a day |
| 1869 | Suez opens; transcontinental completed | Shipping routes reset | More capital chasing railroads |
| Jan 1870 | Standard Oil incorporated | Consolidation coming | ~90% of refining within a decade |
| Jul 1870–May 1871 | Franco-Prussian War | Grain demand spikes; Germany unifies | Germany to gold, sells silver — one of the debated causes of 1873, with rail overbuilding and the Coinage Act |
| 1871 | Player proves up | Stake set; the exam begins | — |
| Oct 1871 | Chicago burns | Your buyer's hub is gone; insurers failing | Price chaos, then a rebuilding boom |
| Sep 1872 | Crédit Mobilier exposed | Politicians own what they regulate | Confidence in rail paper cracks |
| Feb 1873 | Coinage Act ("Crime of '73") | Regulatory change in fine print | Western silver and debtors crushed |
| May 9, 1873 † | Vienna crashes; on the cable same week | Same pattern as 1866, bigger | European capital exits US rail bonds |
| Summer 1873 † | Cooke's ads louder; rail yields rising while roads keep chartering | The seller is nervous | — |
| Sep 18, 1873 | Jay Cooke & Co. fails; NYSE closes ten days | The Panic of 1873 | Long Depression to 1879 — the exam grade |
| 1874 | Grasshopper plague; barbed wire patented | Uninsurable risk; a boring invention ends the open range | Crop wipeout; fenced land within a decade |

---

## Art directions under evaluation

Five phone mockups of the same moment (Spring 1867, McCoy's offer), in `design/art-directions/`:

- **A · Plat Map** — ink-on-paper county map as the hub (v2 default)
- **B · Storybook** — painted scenes, narrative first, choice cards
- **C · Pixel Frontier** — retro pixel art, Oregon Trail dialog box
- **D · Broadsheet** — the newspaper is the interface
- **E · Tickertape** — contemporary fintech UI, 1867 content

---

## Open questions, in the order they block the prototype

1. **The decision engine.** How small can the twenty-season model be and still produce verdicts playtesters agree with? What are the transmission ranges per event, and who sources them?
2. **The transfer scenario.** Write the pre and post scenarios. Who reviews them — one outside finance educator, minimum.
3. **The margin-note voice.** Plain words for a 20-year-old, in period. Who writes the fifteen mechanisms, and how do we keep "how the money moves" from leaking into "what happens next"?
4. **The satisfaction problem.** How does patience feel good? The "Sound" verdict is one lever; needs its own session before reward tuning.
5. **The heir scene.** How long, and what does the heir get to do? Family lore (the shapes seen, and how the House responded) is now the inheritance.
6. **Where the LLM lives.** Recommendation: narrow — turn cited event cards and mechanism lines into period prose; every generated line traceable to a card or a mechanism.
7. **Stack.** React Native / Expo, Flutter, or Swift + Kotlin. Decision deferred until the engine exists as a spreadsheet.
8. **The research pass.** Citation standard is set (measured / modeled / invented, with source). Who owns it? Starting points: Homer & Sylla for rates, USDA and the Kansas Board of Agriculture for prices, county land-office records for land, the standard frontier-farming histories for base rates.
9. **Playtest plan.** Ten people, 18–25, who aren't us. Now includes the pre/post transfer scenario and a "do you agree with your verdicts" interview.
