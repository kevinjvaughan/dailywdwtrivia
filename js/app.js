// UI categories must match `data-category` attributes in index.html and
// `category` values in data/questions.json.
const CATEGORY_LABELS = {
  "magic-kingdom": "Magic Kingdom",
  epcot: "Epcot",
  "hollywood-studios": "Hollywood Studios",
  "animal-kingdom": "Animal Kingdom",
  resorts: "Resorts",
  dining: "Dining",
  transportation: "Transportation",
  "shows-entertainment": "Shows & Entertainment",
  history: "History",
};

// Data shape expected from data/questions.json.
/** @typedef {{ id: string, category: string, question: string, choices: string[], answerIndex: number, explanation?: string }} TriviaQuestion */

/** @type {TriviaQuestion[] | null} */
let QUESTIONS_CACHE = null;

/** @type {{ category: string | null, lastQuestionIdByCategory: Record<string, string | undefined> }} */
const state = {
  category: null,
  lastQuestionIdByCategory: {},
};

function $(sel) {
  return document.querySelector(sel);
}

// Modal open/close is done by toggling a data attribute (keeps CSS simple).
function setModalOpen(isOpen) {
  const modal = $("#question-modal");
  if (!modal) return;
  if (isOpen) {
    modal.setAttribute("data-open", "true");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const closeBtn = modal.querySelector("[data-close-modal]");
    if (closeBtn instanceof HTMLElement) closeBtn.focus();
  } else {
    modal.removeAttribute("data-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

// Loads questions once and caches them in-memory.
async function loadQuestions() {
  if (QUESTIONS_CACHE) return QUESTIONS_CACHE;
  // Cache-bust to avoid stale JSON when testing locally / after deploys.
  const cacheBust = `v=${Date.now()}`;
  const res = await fetch(`data/questions.json?${cacheBust}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load questions.json (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("questions.json must be an array");
  QUESTIONS_CACHE = data;
  return QUESTIONS_CACHE;
}

// Pick a question in the category, avoiding repeating the last one (if possible).
function sampleQuestion(questions, category) {
  const inCat = questions.filter((q) => q && q.category === category);
  if (inCat.length === 0) return null;

  const lastId = state.lastQuestionIdByCategory[category];
  if (inCat.length === 1) return inCat[0];

  for (let tries = 0; tries < 6; tries++) {
    const q = inCat[Math.floor(Math.random() * inCat.length)];
    if (q.id !== lastId) return q;
  }
  return inCat[0];
}

function clearAnswersUI() {
  const answers = $("#answers");
  const feedback = $("#feedback");
  if (answers) answers.textContent = "";
  if (feedback) feedback.textContent = "";
}

// Render a question into the modal and wire up answer buttons.
function renderQuestion(q) {
  const categoryEl = $("#question-category");
  const questionEl = $("#question-text");
  const answersEl = $("#answers");
  const feedbackEl = $("#feedback");

  if (!questionEl || !answersEl) return;

  if (!q) {
    if (categoryEl) categoryEl.textContent = "";
    questionEl.textContent = "No questions found for this category yet.";
    answersEl.textContent = "";
    if (feedbackEl) feedbackEl.textContent = "";
    return;
  }

  state.lastQuestionIdByCategory[q.category] = q.id;

  if (categoryEl) categoryEl.textContent = CATEGORY_LABELS[q.category] ?? q.category;
  questionEl.textContent = q.question;
  answersEl.textContent = "";
  if (feedbackEl) feedbackEl.textContent = "";

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      const buttons = answersEl.querySelectorAll("button.answer-btn");
      buttons.forEach((b) => b.setAttribute("disabled", "true"));

      // We highlight correct/wrong and show feedback text; we don't track score yet.
      if (idx === q.answerIndex) {
        btn.dataset.state = "correct";
        if (feedbackEl) feedbackEl.textContent = "Correct!";
      } else {
        btn.dataset.state = "wrong";
        const correctBtn = answersEl.querySelectorAll("button.answer-btn")[q.answerIndex];
        if (correctBtn instanceof HTMLElement) correctBtn.dataset.state = "correct";
        const correctChoice = q.choices[q.answerIndex];
        if (feedbackEl) feedbackEl.textContent = `Not quite — correct answer: ${correctChoice}`;
      }
    });
    answersEl.appendChild(btn);
  });
}

async function openCategory(category) {
  state.category = category;
  clearAnswersUI();
  setModalOpen(true);

  try {
    const questions = await loadQuestions();
    const q = sampleQuestion(questions, category);
    renderQuestion(q);
  } catch (err) {
    renderQuestion(null);
    const questionEl = $("#question-text");
    if (questionEl) questionEl.textContent = "Couldn’t load questions. Try refreshing the page.";
  }
}

// Wires up all interactions (category selection, modal close, next question, deep link).
function initUI() {
  const buttons = document.querySelectorAll("[data-category]");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      if (!category) return;
      openCategory(category);
      window.location.hash = `#${category}`;
    });
  }

  // Close modal via click on backdrop or close button.
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute("data-close-modal")) setModalOpen(false);
  });

  // Esc closes the modal.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setModalOpen(false);
  });

  const nextBtn = $("#next-question");
  if (nextBtn) {
    // "Next question" keeps the same category and selects another question (if available).
    nextBtn.addEventListener("click", async () => {
      const category = state.category;
      if (!category) return;
      clearAnswersUI();
      try {
        const questions = await loadQuestions();
        const q = sampleQuestion(questions, category);
        renderQuestion(q);
      } catch {
        renderQuestion(null);
      }
    });
  }

  // Deep-link support: load a category if URL has a hash.
  const initialHash = window.location.hash.replace(/^#/, "");
  if (initialHash && CATEGORY_LABELS[initialHash]) {
    openCategory(initialHash);
  }

  initFooterStats();
}

function initFooterStats() {
  const dateEl = $("#game-date");
  const timerEl = $("#game-timer");
  if (!dateEl || !timerEl) return;

  // Set today's date (e.g., "Monday, March 2nd")
  const today = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };

  // Custom logic to add "st", "nd", "rd", "th" to the day
  const rawDate = today.toLocaleDateString('en-US', options);
  const day = today.getDate();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  // The default locale string looks like "Monday, March 2". We append the suffix.
  dateEl.textContent = rawDate + suffix;

  // Timer logic
  let secondsElapsed = 0;
  setInterval(() => {
    secondsElapsed++;
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    timerEl.textContent = `${formattedMinutes}:${formattedSeconds}`;
  }, 1000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI, { once: true });
} else {
  initUI();
}

