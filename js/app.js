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

const QUESTIONS = [
  { "id": "mk-001", "category": "magic-kingdom", "question": "What is the name of the icon castle in Magic Kingdom?", "choices": ["Cinderella Castle", "Sleeping Beauty Castle", "Beast's Castle", "Aurora Castle"], "answerIndex": 0 },
  { "id": "epcot-001", "category": "epcot", "question": "In what year did EPCOT open at Walt Disney World?", "choices": ["1971", "1982", "1994", "2001"], "answerIndex": 1 },
  { "id": "hs-001", "category": "hollywood-studios", "question": "Star Wars: Galaxy's Edge is located in which park?", "choices": ["Disney's Hollywood Studios", "EPCOT", "Animal Kingdom", "Magic Kingdom"], "answerIndex": 0 },
  { "id": "ak-001", "category": "animal-kingdom", "question": "What is the name of the tree icon located in the center of Disney's Animal Kingdom?", "choices": ["Tree of Life", "Tree of Wonders", "Discovery Tree", "Nature's Crown"], "answerIndex": 0 },
  { "id": "res-001", "category": "resorts", "question": "Which monorail loop includes Disney's Contemporary Resort?", "choices": ["Resort monorail loop", "EPCOT loop", "Skyliner loop", "Watercraft loop"], "answerIndex": 0 },
  { "id": "din-001", "category": "dining", "question": "Which park is home to 'Be Our Guest Restaurant'?", "choices": ["Magic Kingdom", "EPCOT", "Animal Kingdom", "Hollywood Studios"], "answerIndex": 0 },
  { "id": "trans-001", "category": "transportation", "question": "What is the name of the gondola transportation system at Walt Disney World?", "choices": ["Disney Skyliner", "Disney Skyway", "Disney Gondolas", "Aerial Transit"], "answerIndex": 0 },
  { "id": "show-001", "category": "shows-entertainment", "question": "Fantasmic! is a nighttime spectacular in which park?", "choices": ["Disney's Hollywood Studios", "Magic Kingdom", "EPCOT", "Animal Kingdom"], "answerIndex": 0 },
  { "id": "hist-001", "category": "history", "question": "What year did Walt Disney World Resort open?", "choices": ["1955", "1971", "1982", "1992"], "answerIndex": 1 }
];

/** @type {{ category: string | null }} */
const state = {
  category: null,
};

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function loadGameState() {
  const key = getTodayKey();
  const saved = localStorage.getItem('wdwtrivia_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.date === key) {
        return parsed.categories || {};
      }
    } catch (e) { }
  }
  return {};
}

function saveCategoryState(category, isCorrect, answerIndex) {
  const key = getTodayKey();
  const stateObj = loadGameState();
  stateObj[category] = {
    stateString: isCorrect ? 'correct' : 'wrong',
    selectedIndex: answerIndex
  };
  localStorage.setItem('wdwtrivia_state', JSON.stringify({
    date: key,
    categories: stateObj
  }));
}

function updateCategoryCardUI(category, stateString) {
  const btn = document.querySelector(`.category-card[data-category="${category}"]`);
  if (btn) {
    btn.setAttribute("data-state", stateString);
    btn.setAttribute("disabled", "true");
  }
}

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

// Pick the matching question for the category.
function sampleQuestion(questions, category) {
  const inCat = questions.filter((q) => q && q.category === category);
  if (inCat.length === 0) return null;
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

  if (categoryEl) categoryEl.textContent = CATEGORY_LABELS[q.category] ?? q.category;
  questionEl.textContent = q.question;
  answersEl.textContent = "";
  if (feedbackEl) feedbackEl.textContent = "";

  const savedState = loadGameState()[q.category];
  const hasAnswered = !!savedState;

  q.choices.forEach((choice, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-btn";
    btn.textContent = choice;

    // If they already answered this category today, lock the buttons and show the outcome immediately
    if (hasAnswered) {
      btn.setAttribute("disabled", "true");
      if (idx === q.answerIndex) {
        btn.dataset.state = "correct";
      } else if (idx === savedState.selectedIndex) {
        btn.dataset.state = "wrong";
      }

      // Show feedback immediately based on past outcome
      if (savedState.stateString === "correct") {
        if (feedbackEl) feedbackEl.textContent = "Correct!";
      } else {
        const correctChoice = q.choices[q.answerIndex];
        if (feedbackEl) feedbackEl.textContent = `Not quite — correct answer: ${correctChoice}`;
      }
    }

    btn.addEventListener("click", () => {
      const buttons = answersEl.querySelectorAll("button.answer-btn");
      buttons.forEach((b) => b.setAttribute("disabled", "true"));

      // We highlight correct/wrong and show feedback text; we don't track score yet.
      if (idx === q.answerIndex) {
        btn.dataset.state = "correct";
        if (feedbackEl) feedbackEl.textContent = "Correct!";
        saveCategoryState(q.category, true, idx);
        updateCategoryCardUI(q.category, 'correct');
      } else {
        btn.dataset.state = "wrong";
        const correctBtn = answersEl.querySelectorAll("button.answer-btn")[q.answerIndex];
        if (correctBtn instanceof HTMLElement) correctBtn.dataset.state = "correct";
        const correctChoice = q.choices[q.answerIndex];
        if (feedbackEl) feedbackEl.textContent = `Not quite — correct answer: ${correctChoice}`;
        saveCategoryState(q.category, false, idx);
        updateCategoryCardUI(q.category, 'wrong');
      }
    });
    answersEl.appendChild(btn);
  });
}

function openCategory(category) {
  state.category = category;
  clearAnswersUI();
  setModalOpen(true);

  const q = sampleQuestion(QUESTIONS, category);
  renderQuestion(q);
}

// Wires up all interactions (category selection, modal close, next question, deep link).
function initUI() {
  const gameState = loadGameState();

  const buttons = document.querySelectorAll("[data-category]");
  for (const btn of buttons) {
    const category = btn.getAttribute("data-category");
    if (category && gameState[category]) {
      btn.setAttribute("data-state", gameState[category].stateString);
      btn.setAttribute("disabled", "true");
    }

    btn.addEventListener("click", () => {
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

