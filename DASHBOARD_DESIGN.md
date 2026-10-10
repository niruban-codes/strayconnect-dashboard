# StrayConnect care operations theme

The dashboard shares the mobile palette: ink #111111, paper #FFFDF4, yellow
#FFE335, mint #8FE8BC, pink #FF82BF, purple #BB9AFF and blue #2455FF.
Silkscreen headings and primary actions pair with readable Poppins form and
record text. Font files and their licenses are bundled in public/fonts.

## Visual rules

- Square panels, 3px black borders and solid 3–8px offset shadows.
- Flat surfaces; no gradients or blurred glass panels.
- Pixel mascot and segmented registry meters on the overview.
- Photos identify real animals; decorative sprites do not replace them.
- Verification refers to the passport, never a diagnosis. Care counters show
  saved vaccination and medical records, not invented health percentages.
- Existing rescue, intake, adoption, verification and event workflows remain.
- Sidebar switches to a menu below 900px; cards and forms stack on small screens.
- Keyboard focus indicators and reduced-motion preferences are supported.

## Main files

- src/index.css: design tokens, shell, overview, login and responsive layouts.
- tailwind.config.js: shared colors, fonts, border widths and hard shadows.
- src/components/Overview.jsx: data-driven overview presentation.
- src/components/Sidebar.jsx: desktop and compact navigation.
- src/components/PixelMascot.jsx: original SVG sprite.

## Verification

Run npm run lint, npm run build, and node --test tests/*.test.mjs.
Visual checks use local sample records with database mutations disabled. These
fixtures are temporary and are not part of the shipped application.
