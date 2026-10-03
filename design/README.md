# Design

Working design material for 1866. The live, editable versions are on claude.ai; these files are snapshots.

- `game-design-outline.md`: the game outline (chapters, core loop, curriculum, NPCs, replayability, build plan, decisions so far). Live doc: https://claude.ai/code/artifact/9aee6ae3-e70e-454f-8bb8-3c5d414ffc7c
- `mockups/`: phone-screen mockups. `canvas.json` groups them into rounds: Round 1 (three art directions), Round 2 (the mixed toy-and-paper direction, one season start to finish) and Round 3 (family creation, the elder, the Almanac, chapter end, and the cast sheet). Live board: https://claude.ai/artifact/1jGrKpNqfb2fKbz7E57ogD
  - Open any `*.dc.html` directly in a browser; `support.js` is a small stand-in for the board's runtime so they render on their own.
- `characters.py`: generates the toy-figure character art (player and NPCs) as SVG. `cast.svg.html` is a preview of the cast.
- `build_art.py`: writes `play/art.js` (portraits plus front and back walking sprites for the cast, townsfolk and every player preset). Run `python3 design/build_art.py` from the repo root after changing `characters.py`.
