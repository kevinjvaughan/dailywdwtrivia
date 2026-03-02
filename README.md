# wdwtrivia
Daily Walt Disney World Trivia game with different categories, questions change every 24 hours.

## Project structure

- `index.html`: single page UI (category grid + question modal)
- `css/style.css`: styling + Waltograph font loading
- `js/app.js`: loads questions and drives the modal UI
- `data/questions.json`: trivia question data (JSON)
- `assets/fonts/`: web fonts (e.g. `waltograph42.otf`)

## `data/questions.json` format

The file is an array of question objects:

- `id` (string): unique identifier (e.g. `"mk-001"`)
- `category` (string): must match a `data-category` in `index.html`
- `question` (string): the prompt text
- `choices` (string[]): multiple choice answers shown as buttons
- `answerIndex` (number): 0-based index into `choices`

Example:

```json
[
  {
    "id": "epcot-001",
    "category": "epcot",
    "question": "In what year did EPCOT open at Walt Disney World?",
    "choices": ["1971", "1982", "1994", "2001"],
    "answerIndex": 1
  }
]
```
