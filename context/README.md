# Context — Dress the context

A dress-code platform that works like a personal stylist. People pick their
department, the occasion, the weather, the level of formality and their
wardrobe, and get complete looks, single pieces, shoes, accessories and nail
shades that fit the moment. Company rules show up as advice, right where they
matter.

Static site, no build step: `index.html`, `css/styles.css` and the scripts in
`js/`. The catalogs live in `js/*-data.js`; photos are in `assets/`, with
lighter 600 px copies in each folder's `600/` subfolder (`js/variantes-data.js`
maps them, so cards load the small file and phones can still use the full one).

Run it locally with any static server, e.g. `python3 -m http.server`.

Design & product: Paola Bertoni.
