# Console redesign: research and decisions

Why the site looks the way it does and what it borrowed. Research ran on 2026-11-09. Unless
noted, sources were read (HTML, code, write-ups), not run in a browser, so motion and feel in
other people's sites are unconfirmed.

## What others did

| Site | How it is built | What we took |
| --- | --- | --- |
| [Goodgrowth](https://www.goodgrowth.com/) | Three.js, GSAP, Web Audio. A CSS "Insert Disc" gate hands off to a 3D scene. | Click-to-insert as the opening beat and as the gesture that unlocks audio. Web Audio ticks scheduled in one pass and rate-capped. |
| [Saud's PS2 portfolio](https://www.imsaud.me/) | CSS 3D menu with no WebGL. | A memory card as a content object, extended here so saves are sized in months. Its lack of reduced-motion handling is the counter-example. |
| [Bruno Simon, 2025](https://bruno-simon.com/) | Three.js with WebGPU, in an MIT repo. | Restrained bloom, and real text in the initial HTML even though the experience is a canvas. |
| [Henry Heffernan](https://henryheffernan.com/) | Three.js with a DOM OS on a 3D monitor. | Keep content as real DOM. Its empty initial HTML is what to avoid. |
| [Open Studios](https://openstudios.xyz/) | HTML first, 3D opt-in. | The plain version is a first-class page, not an error state. |
| [Jorge Molina](https://jorgemolina.dev/) | React, R3F. Mode selector with a load timeout. | A small state machine with a way out when 3D loads slowly. |
| [web.dev 3D game menu](https://web.dev/building-a-3d-game-menu-component/) | Real DOM menu with CSS depth. | The menu stays real buttons, with arrow keys and gamepad moving focus. |

## Ideas this site adds

- **One body of blocks.** The boot monogram and every menu icon are the same few hundred cubes
  rearranging, so navigating feels like one object changing shape.
- **A lid that really opens.** Drag a disc into the console, or tap it. Grab the console to spin it.
- **Saves sized in months.** Each job is a save file, with 1 block = 1 month.
- **Two ways in, one intro.** Insert a disc to reach a title screen, or power on empty to reach
  the system menu. The intro is shared and the branch comes after it.
- **A hidden chime.** Hold Z during boot.

## Decisions

- **Plain three.js r187, WebGL, pmndrs/postprocessing.** WebGPU would rule out this post stack
  and `onBeforeCompile`, and a scene this small gains little from it. `postprocessing` 6.39.6
  caps its peer range below r188, so `three` is pinned exactly. Upgrades are deliberate work.
- **The console, stage and audio are generated in code.** Photos and logos are the only image
  files. The trade-off is CPU work at startup.
- **Content is real HTML.** Sections are Vue on top of the canvas. The whole portfolio is also
  prerendered into `index.html`, where the old site's HTML body was empty.

## Performance notes

Frame rate could not be measured reliably in the desktop app's preview pane: its rate swung from
3 to 121 fps with no change to the page. Testing on a real phone is still to do. MSAA and
`backdrop-filter` were left out as conservative choices for phone GPUs, not because of a measured
gain.
