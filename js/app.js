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

async function loadQuestions() {
  if (QUESTIONS_CACHE) return QUESTIONS_CACHE;
  const res = await fetch("data/questions.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load questions.json (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("questions.json must be an array");
  QUESTIONS_CACHE = data;
  return QUESTIONS_CACHE;
}

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

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute("data-close-modal")) setModalOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setModalOpen(false);
  });

  const nextBtn = $("#next-question");
  if (nextBtn) {
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI, { once: true });
} else {
  initUI();
}

