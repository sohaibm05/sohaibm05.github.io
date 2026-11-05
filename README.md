# Sohaib Muhammad: portfolio

Plain HTML, CSS and JavaScript. No build step, no framework.

## Run it
Double-click `index.html`. That's it.
(Or, for a local server: `python -m http.server` in this folder, then open http://localhost:8000.)

## Add a project
Open `data/projects.js` and add an object to the list. Order = rank.

```js
{
  title: "FitTrack AI",
  stack: ["Python", "MediaPipe"],
  summary: "Logs gym sets automatically from a camera.",
  link: "https://github.com/sohaibm05/fittrack"
}
```

Add `featured: true` (plus `type`, `hard`, and `image`) to give it the big treatment.
Put screenshots in an `images/` folder and point `image` at them, e.g. `"images/fittrack.png"`.

## Add a testimonial
Open `data/testimonials.js`, add `{ quote, name, role }`, and delete the placeholder.

## The two games (Trials section)
Both live in `games.js`.
- **Iaido:** once you've played it, put your best time in `SOBU_BEST_MS` (e.g. `231`) and visitors get "Sobu's best: 231 ms. Beat it."
- **Build Order:** the `MODULES` list says which project fits which part of SM-01. Edit it if you swap projects in or out.

## Still to fill in
- `index.html`: LinkedIn link and email in the contact section
- `data/projects.js`: screenshots and repo links
- `data/testimonials.js`: real testimonials
- Hero: your photo turned into ink (replaces the small figure)

## Publish free on GitHub Pages
1. Create a repo named `sohaibm05.github.io`
2. Push these files to it
3. The site goes live at https://sohaibm05.github.io
