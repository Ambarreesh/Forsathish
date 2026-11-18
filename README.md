# Sathish S — Portfolio

Personal portfolio of Sathish S, Mechanical Engineering student at Chennai Institute of Technology.

Static site — plain HTML, CSS and JavaScript, no build step.

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly from disk also works, but a local server is closer to how it runs when hosted.)

## Deploy

Any static host works. For GitHub Pages: **Settings → Pages → Deploy from branch → `main` / root**.

## Structure

- `index.html` — all content
- `css/style.css` — theme and layout
- `js/motion.js` — springs, ticker, smooth scroll, text splitting
- `js/drive.js` — the pinned car sequence
- `js/main.js` — hero, nav, reveals, seams, project art, research animation
- `assets/` — portrait, car images, résumé
