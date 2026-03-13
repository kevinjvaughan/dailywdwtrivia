# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Daily Walt Disney World Trivia — a static single-page web app hosted on GitHub Pages at `dailywdwtrivia.com`. Players answer one trivia question per category per day (9 categories). Answers persist in `localStorage` keyed by date and reset daily.

## Development

There is no build step, bundler, or package manager. The site is plain HTML/CSS/JS served as static files.

**Local development:** open `index.html` directly in a browser, or serve with any static server:

```
python3 -m http.server 8000
```

There are no tests, linters, or CI pipelines configured.

## Architecture

### File roles

- `index.html` — single page: title, 3×3 category button grid, footer (date/timer), and a hidden question modal
- `js/app.js` — all application logic (state, question selection, rendering, event wiring)
- `css/style.css` — all styling; theme colors are CSS custom properties on `:root`
- `data/questions.json` — canonical question bank fetched at runtime
- `assets/fonts/` — Waltograph (Disney-style) font files
- `assets/img/` — decorative Mickey/Minnie images

### Key data flow

1. On page load, `initUI()` fetches `data/questions.json` (falls back to a hardcoded `QUESTIONS` array in `app.js` if fetch fails).
2. Each category button has a `data-category` attribute matching keys in `CATEGORY_LABELS` and `category` values in the JSON.
3. Clicking a category opens the modal and calls `sampleQuestion()`, which deterministically picks a question using a date+category hash so every user sees the same question that day.
4. After answering, state is saved to `localStorage` under key `wdwtrivia_state` via `saveCategoryState()`, and the category card turns green/red via `data-state` attribute.
5. On reload, `loadGameState()` restores card colors and locks already-answered categories.

### Adding new questions

Add objects to `data/questions.json` following the existing schema:

```json
{ "id": "<prefix>-NNN", "category": "<category-slug>", "question": "...", "choices": ["A","B","C","D"], "answerIndex": 0 }
```

The `category` value must match one of the keys in `CATEGORY_LABELS` (in `js/app.js`) and the `data-category` attributes in `index.html`. The nine current categories are: `magic-kingdom`, `epcot`, `hollywood-studios`, `animal-kingdom`, `resorts`, `dining`, `transportation`, `shows-entertainment`, `history`.

### Adding a new category

Requires changes in three places:
1. Add a `<button class="category-card" data-category="new-slug">` to the grid in `index.html`
2. Add the slug → display name entry in `CATEGORY_LABELS` in `js/app.js`
3. Add questions with that category value to `data/questions.json`

### Styling conventions

- All themeable colors live in CSS custom properties on `:root` in `style.css`
- Answer/card states use `data-state="correct|wrong"` attributes, styled via attribute selectors
- Responsive breakpoints: 3 columns (default) → 2 columns (≤720px) → 1 column (≤440px)
- The Waltograph font is the primary typeface; the full fallback chain is defined in `--font-disney`
