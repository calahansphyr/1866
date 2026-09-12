# Prove Up — Concept v2

**Working title:** 1866
**Positioning:** Oregon Trail for financial literacy
**Audience:** US, ages 18–25, native mobile
**Status:** concept v2, for group review — not a spec
**Date:** 2026-09-12

Companion docs (private links, share from the page menu):
- Concept doc (this document, designed): https://claude.ai/code/artifact/b15efd96-5c9f-4b82-91e4-c27288216155
- Art-direction canvas (five phone mockups): https://claude.ai/code/artifact/05c09cdd-ffa7-4ccb-9ed5-72418504598c — working files in `design/art-directions/`

---

## Thesis

**The game teaches people to read the canary, not to get rich in Kansas.**

An ordinary person in 1866 had access to real signals — a foreign bank failure on the cable, a railroad surveyor in town, a bill nobody read — and the difference between building a dynasty and losing the farm was mostly *which signals they noticed, and what they did about them.* History is the answer key. The skill transfers to 2026; the answer key does not.

"Prove up" is the Homestead Act term for earning title after five years on the land. It is the arc of the prototype.

---

## Decided

| Decision | Detail |
|---|---|
| Real US history, fixed timeline | Real events on real dates every run. What varies is the player: backstory, county, weather, prices, which information they bought, what they did. ("Shuffled timing" and "systems sim" are shelved, not dead.) |
| Prototype first — twenty turns before anything else | Both teammate reviews said it. Nothing past the prototype section gets built until twenty seasons are fun. |
| One continuous run, not chapters | Civilization-style: 1866 to the present in one game, eras as phases. Generations are events, not resets. |
| The player is the House | You play the family, not a person. A death is an inheritance event — a will, a tax, an heir with different skills — and compounding never breaks. |
| Scarcity start is the default difficulty | $30 inherited, ~$14 to file, a ~$225 gap before the first crop. A comfortable stake is the easy setting. |
| Information is the core system | Every source has a cost, a delay, a reliability, and a bias. The game will let you act on something false and lose — and show you why. |
| Rival houses — light | Three or four scripted families following the same fixed history. A tax roll once a year, an occasional deal, one chart at the end. |
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
- **Measurement:** a short concept check before turn one and after the coda, plus telemetry on every canary seen, acted on, or ignored.
- **Session:** 3–5 minutes a turn, save anywhere. ~90 minutes end to end.
- **Not in it:** other eras, the instrument tree, victory tracks, geography, ventures, multiplayer, cosmetics.

**Success test, verbatim:** *"I want to try again because I think I could set my family up differently."*

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
3. **Every loss is explained.** A good decision can have a bad outcome, but the player sees how reserves, debt, and choices shaped the damage.
4. **Heirs inherit decisions, not just cash.** Soil, reputation, debt, skill, relationships, and family lore (canaries read correctly, passed down as hints).

**Unsolved fifth rule:** the correct strategy has to be the satisfying one. If big swings feel good, the game has taught speculation. Needs its own session before reward tuning.

---

## Curriculum, mapped to 1866

| Concept | On the frontier |
|---|---|
| Emergency fund | The cellar. Get caught empty and you're on the store's tab at 3%/month. |
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
- **Victory tracks:** Legacy (net worth in real dollars), Independence (year passive income covered expenses), Sage (canaries called, weighted by how early), Builder (an enterprise that outlived its founder). Bankruptcy is not game over; the House dissolving is.
- **Flexibility:** breadth of instruments, sizing and structure (never yes/no), geography, ventures with real base rates, deals. A Saver, Speculator, Landlord, Lender, and Builder should each finish respectably and each win a different track.
- **Rival houses:** the Speculator, the Saver, the Builder, Old Money — scripted against known data; the paths you didn't take.

---

## Teammate reviews — what changed

**Adopted:** twenty turns before anything else; no path dominates; explain every loss; heirs inherit decisions; pre/post assessment from day one; heir scene in the prototype; name the frontier's lesson as capital allocation; keep the scarcity start (as default difficulty); "Oregon Trail for financial literacy."

**Pushed back on:** "a Kansas homesteader had essentially nothing to invest in" — overstated (county/rail bonds, town lots, lending, cattle shares, gold vs. greenbacks were all real), but the framing is right and we're using it.

**Confirmed:** information quality as a core system; seasons as turns; 2D illustrated; wealth visibly expanding options; the five-year prove-up as a first objective.

**Still open:** making the correct strategy the satisfying one.

---

## Signal ledger, 1866–1874 (prototype event deck — uncited; research pass pending)

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
| Jul 1870–May 1871 | Franco-Prussian War | Grain demand spikes; Germany unifies | Germany to gold, sells silver — hidden cause of 1873 |
| 1871 | Player proves up | Stake set; the exam begins | — |
| Oct 1871 | Chicago burns | Your buyer's hub is gone; insurers failing | Price chaos, then a rebuilding boom |
| Sep 1872 | Crédit Mobilier exposed | Politicians own what they regulate | Confidence in rail paper cracks |
| Feb 1873 | Coinage Act ("Crime of '73") | Regulatory change in fine print | Western silver and debtors crushed |
| May 9, 1873 | Vienna crashes; on the cable same week | Same pattern as 1866, bigger | European capital exits US rail bonds |
| Summer 1873 | Cooke's ads louder; rail yields rising while roads keep chartering | The seller is nervous | — |
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

1. **The satisfaction problem.** How does patience feel good? Needs a dedicated session before reward tuning.
2. **The assessment.** What's in the pre/post check, who writes it, does it need an outside reviewer?
3. **The heir scene.** How long, and what does the heir get to do?
4. **Where the LLM lives.** Recommendation: narrow — turn cited event cards into period prose; every generated line traceable to a card.
5. **Stack.** React Native / Expo, Flutter, or Swift + Kotlin.
6. **The research pass.** Every ledger row and price needs a source. Who owns it, and what's the citation standard?
7. **Playtest plan.** Ten people, 18–25, who aren't us.
