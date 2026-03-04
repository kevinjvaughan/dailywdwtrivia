/**
 * ============================================================================
 * WALT DISNEY WORLD DAILY TRIVIA - Main Application File
 * ============================================================================
 * This file handles all user interactions, game state management, question
 * rendering, and UI updates for the trivia game. Questions are fetched from
 * data/questions.json, but fallback to bundled QUESTIONS array if fetch fails.
 * Game state is persisted to localStorage, keyed by date, so answers are
 * remembered throughout the day.
 */

/**
 * Map of category identifiers to display names.
 * Must match:
 * - `data-category` attributes in index.html
 * - `category` values in data/questions.json
 */
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

/**
 * TypeScript typedef documentation for trivia questions.
 * Each question has a unique ID, category, question text, four choices,
 * the correct answer index, and optional explanation.
 */
/** @typedef {{ id: string, category: string, question: string, choices: string[], answerIndex: number, explanation?: string }} TriviaQuestion */

/**
 * Fallback questions array embedded in the page.
 * Used if data/questions.json fails to load (e.g., offline mode).
 * In production, these are overwritten by fetchQuestions() with live data.
let QUESTIONS = [
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

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

// Tracks the currently selected category (used to pass data to modal handler)
let lastFocusedTile = null;

/**
 * Global application state object.
 * Tracks the category that the user is currently interacting with.
 */
/** @type {{ category: string | null }} */
const state = {
  category: null,
};

// Used to trap keyboard focus inside the modal (accessibility feature)
let focusTrapHandler = null;

// ============================================================================
// DATE AND LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Generates a unique key for today's date in YYYY-M-D format.
 * Used to store/retrieve game progress so questions reset daily.
 * @returns {string} e.g., "2026-3-4"
 */
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

/**
 * Fetches questions from the live data/questions.json file.
 * If the fetch succeeds, overwrites the QUESTIONS array.
 * If the fetch fails, silently falls back to the hardcoded QUESTIONS array,
 * allowing the game to work offline.
 */
async function fetchQuestions() {
  try {
    const res = await fetch("data/questions.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      QUESTIONS = data;
    }
  } catch (err) {
    // Fall back to the baked-in QUESTIONS array so the game still works offline.
    console.warn("Falling back to bundled questions:", err);
  }
}

/**
 * Loads all game state for today from localStorage.
 * Returns an object mapping category names to their answer state.
 * @returns {Object} e.g., { "magic-kingdom": { stateString: "correct", selectedIndex: 0 }, ... }
 */
function loadGameState() {
  const key = getTodayKey();
  const saved = localStorage.getItem('wdwtrivia_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Only return state if it's from today (not yesterday's data)
      if (parsed.date === key) {
        return parsed.categories || {};
      }
    } catch (e) { }
  }
  return {};
}

/**
 * Saves a player's answer for a specific category to localStorage.
 * Includes whether they got it right/wrong and which answer they selected.
 * @param {string} category - The category identifier
 * @param {boolean} isCorrect - Whether the selected answer was correct
 * @param {number} answerIndex - The index of the choice they selected
 */
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

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Updates the visual state of a category card after answering.
 * Sets the data-state attribute to trigger CSS styling (green for correct, red for wrong).
 * @param {string} category - The category identifier
 * @param {string} stateString - Either "correct" or "wrong"
 */
function updateCategoryCardUI(category, stateString) {
  const btn = document.querySelector(`.category-card[data-category="${category}"]`);
  if (btn) {
    btn.setAttribute("data-state", stateString);
  }
}

/**
 * Utility shorthand for document.querySelector(selector)
 * Makes the code more concise throughout the file.
 */
function $(sel) {
  return document.querySelector(sel);
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

/**
 * Opens or closes the question modal overlay.
 * When opening: traps keyboard focus inside the modal, focuses the close button.
 * When closing: removes focus trap, restores focus to the clicked category tile.
 * @param {boolean} isOpen - True to show the modal, false to hide it
 */
function setModalOpen(isOpen) {
  const modal = $("#question-modal");
  if (!modal) return;
  if (isOpen) {
    modal.setAttribute("data-open", "true");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const closeBtn = modal.querySelector("[data-close-modal]");
    if (closeBtn instanceof HTMLElement) closeBtn.focus();

    // Simple focus trap inside the modal for keyboard users.
    // Prevents Tab from moving focus outside the modal while it's open.
    const focusables = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    focusTrapHandler = (evt) => {
      if (evt.key !== "Tab" || focusables.length === 0) return;
      if (evt.shiftKey && document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      } else if (!evt.shiftKey && document.activeElement === last) {
        evt.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", focusTrapHandler);
  } else {
    modal.removeAttribute("data-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (focusTrapHandler) {
      document.removeEventListener("keydown", focusTrapHandler);
      focusTrapHandler = null;
    }
    // Restore focus to the category tile that was clicked
    if (lastFocusedTile instanceof HTMLElement) {
      lastFocusedTile.focus();
    }
  }
}

// ============================================================================
// QUESTION SELECTION AND RENDERING
// ============================================================================

/**
 * Picks a deterministic question for a given category based on today's date.
 * Same question appears every day until tomorrow, ensuring consistent daily gameplay.
 * @param {TriviaQuestion[]} questions - Array of question objects
 * @param {string} category - The category identifier to filter by
 * @returns {TriviaQuestion|null} The selected question or null if category not found
 */
function sampleQuestion(questions, category) {
  const inCat = questions.filter((q) => q && q.category === category);
  if (inCat.length === 0) return null;
  // Deterministic per-day selection so questions rotate every calendar day.
  // Hash the date + category to pick the same question for everyone today.
  const key = `${getTodayKey()}-${category}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  const idx = hash % inCat.length;
  return inCat[idx];
}

/**
 * Clears previous question content and feedback from the modal.
 * Called before rendering a new question.
 */
function clearAnswersUI() {
  const answers = $("#answers");
  const feedback = $("#feedback");
  if (answers) answers.textContent = "";
  if (feedback) feedback.textContent = "";
}

/**
 * Renders a question and its answer choices into the modal.
 * If the player has already answered this category today, shows the outcome
 * immediately and disables further interaction.
 * Otherwise, wires up click handlers to each answer button.
 * @param {TriviaQuestion} q - The question object to render
 */
function renderQuestion(q) {
  const questionEl = $("#question-text");
  const answersEl = $("#answers");
  const feedbackEl = $("#feedback");

  if (!questionEl || !answersEl) return;

  if (!q) {
    questionEl.textContent = "No questions found for this category yet.";
    answersEl.textContent = "";
    if (feedbackEl) feedbackEl.textContent = "";
    return;
  }

  questionEl.textContent = q.question;
  answersEl.textContent = "";
  if (feedbackEl) feedbackEl.textContent = "";

  // Check if the player has already answered this category today
  const savedState = loadGameState()[q.category];
  const hasAnswered = !!savedState;

  // Create a button for each answer choice
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

    // Wire up click handler for new answers (only if not already answered)
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

/**
 * Opens a category by showing the modal with its question.
 * @param {string} category - The category identifier to open
 */
function openCategory(category) {
  state.category = category;
  clearAnswersUI();
  setModalOpen(true);

  const q = sampleQuestion(QUESTIONS, category);
  renderQuestion(q);
}

// ============================================================================
// INITIALIZATION AND EVENT WIRING
// ============================================================================

/**
 * Main initialization function. Called when the DOM is ready.
 * Wires up all event listeners, loads game state, and handles deep linking.
 */
async function initUI() {
  // Load fresh questions first so deep links and UI use live data.
  await fetchQuestions();

  const gameState = loadGameState();

  // Wire up all category buttons
  const buttons = document.querySelectorAll("[data-category]");
  for (const btn of buttons) {
    const category = btn.getAttribute("data-category");
    
    // If this category was answered today, show the result with color coding
    if (category && gameState[category]) {
      btn.setAttribute("data-state", gameState[category].stateString);
    }

    // Open the question modal when a category is clicked
    btn.addEventListener("click", () => {
      if (!category) return;
      lastFocusedTile = btn;
      openCategory(category);
      // Update URL hash to support browser back button and bookmarking
      window.location.hash = `#${category}`;
    });
  }

  // Close modal via click on backdrop or close button.
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.hasAttribute("data-close-modal")) setModalOpen(false);
  });

  // Esc key closes the modal.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setModalOpen(false);
  });

  // Deep-link support: if the URL has a hash (e.g., #magic-kingdom),
  // automatically open that category when the page loads.
  const initialHash = window.location.hash.replace(/^#/, "");
  if (initialHash && CATEGORY_LABELS[initialHash]) {
    openCategory(initialHash);
  }

  // Initialize footer with date and timer
  initFooterStats();
}

/**
 * Initializes the footer with today's date and an elapsed time counter.
 * Formats the date with proper ordinal suffixes (e.g., "Monday, March 3rd").
 */
function initFooterStats() {
  const dateEl = $("#game-date");
  const timerEl = $("#game-timer");
  if (!dateEl || !timerEl) return;

  // Set today's date with formatting (e.g., "Monday, March 2nd")
  const today = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric' };

  // Custom logic to add "st", "nd", "rd", "th" to the day (ordinal suffix)
  const rawDate = today.toLocaleDateString('en-US', options);
  const day = today.getDate();
  let suffix = "th";
  if (day % 10 === 1 && day !== 11) suffix = "st";
  else if (day % 10 === 2 && day !== 12) suffix = "nd";
  else if (day % 10 === 3 && day !== 13) suffix = "rd";

  // The default locale string looks like "Monday, March 2". We append the suffix.
  dateEl.textContent = rawDate + suffix;

  // Timer logic: increments every second and displays in MM:SS format
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

/**
 * Wait for the DOM to be ready, then initialize the application.
 * If the DOM is already loaded, initialize immediately.
 * If still loading, wait for DOMContentLoaded event.
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUI, { once: true });
} else {
  initUI();
}
