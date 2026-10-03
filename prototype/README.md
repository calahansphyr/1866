# 1866 · Prove Up: Three.js prototype

A playable slice of the concept in `Cal_summary.md` (concept v3): twenty seasons on a Kansas claim, 1866–1870, then a two-season coda into the Panic of 1873. The art follows direction **I · Diorama** in `design/art-directions/`: your claim and the town as a small isometric world that grows as the House does.

It is plain static HTML and ES modules. Three.js loads from the jsDelivr CDN through an import map. There is no build step.

## Run it

```sh
cd prototype
python3 -m http.server 8000
```

Open http://localhost:8000. Opening `index.html` straight from disk won't work because browsers block ES modules on `file://`. To play on a phone, serve it on your LAN and open `http://<your-computer's-ip>:8000`, or put the folder on any static host (GitHub Pages works).

## How to play

Each season has five steps, matching "The loop" in the concept doc:

1. **The post arrives.** You get the news from whatever sources you pay for. Church talk is free and unreliable. The Topeka Weekly and the Kansas City Daily cost money and are right more often, and the Daily also sees a season ahead. Tap any underlined phrase to open a **margin note**. It gives you the plain words, how the money moves, and what you hold that the news touches. It never tells you what happens next.
2. **A week in town: three visits.** Tap a building in the diorama, or pick one from the list. There are seven buildings, and each has a character with a motive. The banker wants you to borrow. The editor sells subscriptions. Pruitt profits from the tab. Choosing the telegraph over the saloon *is* due diligence.
3. **Set the farm.** Choose what to plant (in spring), whether to work the claim or hire out, how much to put up in the cellar, and how much to pay toward the tab. In fall, choose whether to sell the harvest or hold it to spring.
4. **The season turns.** Every dollar is broken down on screen: the drought, the cellar covering the winter, the tab's 3% a month.
5. **The letter home.** At the end of each year, every season's decision gets a verdict: **Sound, Unlucky, Lucky, or Exposed**. Verdicts are shown only here and never during play.

After twenty seasons you prove up and get the title. Two quiet years pass, and then the 1873 coda is the exam. The **Almanac** at the end shows your verdicts, a scorecard for each news source, and three rival houses run across 60 histories. After that comes a modern "transfer" question, matched to the one you answered before turn one.

Controls: tap to choose, drag to turn the diorama, and pinch or scroll to zoom. The game saves after every step (in localStorage), and **Continue** on the title screen resumes your game.

## What's in it

| Concept doc idea | Where it lives |
|---|---|
| Fixed spine, variable transmission | `data.js` `EVENTS`: real dated events. `engine.js` `newWorld()` draws whether and how hard each one reaches the county on this run. |
| The decision engine and the 2×2 verdict | `engine.js` `grade()`: runs your plan and about 20 alternatives forward one year across 90 branches each. It scores expected result, worst-fifth result, and chance of ruin, then places what actually happened inside your own plan's spread of outcomes. |
| Judged on what you knew | `posterior()`: the branches use the best source you read this season, weighted by that source's reliability. |
| Margin notes and the mechanism library | `data.js` `MECH`. Each note has plain words, how the money moves (at most three steps), what you hold that this touches (read live from your ledger), and "rhymes with" when a shape repeats. |
| Characters as biased teachers | `main.js` `buildingActions()` |
| Information has a cost, a delay and a reliability | `SOURCES` in `main.js`. Each source's track record is scored in the Almanac. |
| Human capital | Apprentice at the stockyard (higher wages) and learn the market page at the newspaper (every source becomes more reliable). Each costs a visit. |
| Rivals as distributions, not morals | `engine.js` `RIVALS` and `rivalRuns()` |
| Transfer scenario before and after | `data.js` `SCENARIOS` |
| "Money makes your world expand" | `scene.js`: sod gets broken into fields, the soddy becomes a frame house, a barn appears, the cellar mound grows, the rail grade shows up, and the seasons repaint the ground. |

## Not in it yet

Backstories, the heir scene, the declared victory track (the grader uses a single risk-balanced score), the county bond vote as a player choice, progressive disclosure in the margin notes, and telemetry. **Every number is invented or modeled.** None of it comes from the research pass yet.

## A note on 3D

The concept doc says "2D, illustrated. No 3D in the prototype." This prototype uses Three.js because the team asked for it. It uses 3D only for the diorama hub, where the Diorama art direction already calls for an isometric world. All the reading, choosing and verdicts are flat 2D panels. If the group sticks with 2D, `scene.js` can be swapped out without touching `engine.js` or `main.js`.

## Engine sanity check

The engine is pure JS, so you can run it in node:

```sh
node -e "import('./prototype/engine.js').then(E => console.log(E.rivalRuns(60)))"
```
