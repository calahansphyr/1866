# 1866: Prove Up (playable prototype)

Chapter One, the Frontier, 1866 to 1873, played top-down in the browser. Open `index.html` through any static server (`python3 -m http.server` in this folder) and play at phone width.

## How it plays

- Each year has two seasons, spring and harvest, of three days each. Walking around is free. The road over the creek between your claim and town takes an hour each way, and field work and business take daylight too. At dusk the day ends wherever you are.
- In spring you buy seed in town, sow it, and break new prairie. In the harvest you cut the wheat before it shatters after day 3, then sell it, put up jars and settle debts.
- A line at the bottom of the screen always names the next thing to do. A red pin marks where it is, or an arrow at the edge of the screen points the way; tap Go to walk there. It points at places, never at choices.
- Everything in the store, bank, telegraph office and house can be tapped for a closer look. Pruitt's book lies open on his counter and grows a line every time something goes on it.
- Some things come to you on their own days: a salesman on market day, a neighbor asking for help, Brandt selling his forty, the news of 1873.
- Every December a letter home stamps each call Sound, Lucky, Unlucky or Exposed, and shows the ten winters that might have come.

## Files

- `main.js`: the economy, the calendar, visitors, dialogs, the letter grader and the Almanac.
- `engine.js`: canvas, camera, tap-to-walk with pathfinding, hold-to-steer, keyboard, sprites, daylight.
- `scenery.js`: the town map, buildings, props and room interiors, all drawn in code.
- `art.js`: generated character art. Rebuild with `python3 design/build_art.py` from the repo root.

`window.__prove` exposes game state for automated playtests.
