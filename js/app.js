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
  { "id": "mk-001", "category": "magic-kingdom", "question": "Before it became the Tomorrowland Transit Authority PeopleMover, the elevated ride began its 1975 run under which name?", "choices": ["WEDWay PeopleMover", "Tomorrowland Skyway", "Future Flight", "Astro-Glide"], "answerIndex": 0 },
  { "id": "mk-002", "category": "magic-kingdom", "question": "How tall is Cinderella Castle at its tallest point, excluding the optional height of any flags or decorations?", "choices": ["189 feet", "180 feet", "200 feet", "178 feet"], "answerIndex": 0 },
  { "id": "mk-003", "category": "magic-kingdom", "question": "Which Magic Kingdom attraction's queue and narrative were reimagined for the 2024 and 2025 retrofit to remove a controversial Auctioneer scene?", "choices": ["Pirates of the Caribbean", "The Enchanted Tiki Room", "Splash Mountain", "Jungle Cruise"], "answerIndex": 0 },
  { "id": "mk-004", "category": "magic-kingdom", "question": "The final stop of the Walt Disney World Railroad around Magic Kingdom's full circuit is at which station?", "choices": ["Main Street, U.S.A.", "Fantasyland", "Frontierland", "Tomorrowland"], "answerIndex": 2 },
  { "id": "epcot-001", "category": "epcot", "question": "Which EPCOT pavilion opened on October 1, 1983, as a sequel of sorts to the former General Motors attraction sponsored by GE?", "choices": ["Horizons", "The Land", "World of Motion", "Wonders of Life"], "answerIndex": 0 },
  { "id": "epcot-002", "category": "epcot", "question": "The former Figment character of 'Journey Into Imagination' is primarily associated with which original EPCOT pavilion?", "choices": ["Journey Into Imagination", "The Living Seas", "Spaceship Earth", "The CommuniCore"], "answerIndex": 0 },
  { "id": "epcot-003", "category": "epcot", "question": "Which EPCOT attraction features the song 'Soarin' Around the World' and scenes of the Great Wall and the Matterhorn?", "choices": ["Soarin'", "Living with the Land", "Mission: SPACE", "Test Track"], "answerIndex": 0 },
  { "id": "epcot-004", "category": "epcot", "question": "The World Showcase lagoon is officially named for which EPCOT feature?", "choices": ["World Showcase Lagoon", "The Reflecting Pool", "Lake Promise", "Discovery Bay"], "answerIndex": 0 },
  { "id": "hs-001", "category": "hollywood-studios", "question": "Which Hollywood Studios attraction opened in 1989 inside a reproduction of Grauman's Chinese Theatre?", "choices": ["The Great Movie Ride", "Indiana Jones Epic Stunt Spectacular", "Star Tours", "Muppet*Vision 3D"], "answerIndex": 0 },
  { "id": "hs-002", "category": "hollywood-studios", "question": "Before Star Wars: Galaxy's Edge, the land now occupied by that area was known as which themed section?", "choices": ["A backlot district", "Sunset Boulevard", "Disney-MGM Studios' residential section", "The Streets of America"], "answerIndex": 3 },
  { "id": "hs-003", "category": "hollywood-studios", "question": "The Tower of Terror storyline begins with the hotel losing guests during a thunderstorm in which year?", "choices": ["1939", "1927", "1947", "1955"], "answerIndex": 0 },
  { "id": "hs-004", "category": "hollywood-studios", "question": "Which attraction is the in-universe training setting for the Star Wars: Rise of the Resistance queue at Black Spire Outpost?", "choices": ["The Resistance staging bunker", "A First Order Star Destroyer", "Batuu's royal palace", "A Jawa sandcrawler"], "answerIndex": 0 },
  { "id": "ak-001", "category": "animal-kingdom", "question": "The Tree of Life stands approximately how tall, making it the park's central icon?", "choices": ["145 feet", "125 feet", "160 feet", "100 feet"], "answerIndex": 0 },
  { "id": "ak-002", "category": "animal-kingdom", "question": "Approximately how many acres does the Kilimanjaro Safaris savanna cover?", "choices": ["110 acres", "35 acres", "75 acres", "180 acres"], "answerIndex": 0 },
  { "id": "ak-003", "category": "animal-kingdom", "question": "Expedition Everest is themed to the Forbidden Mountain and the legend of which creature?", "choices": ["The Yeti", "The Abominable Snowman", "The Chupacabra", "The Dragon of Pandora"], "answerIndex": 0 },
  { "id": "ak-004", "category": "animal-kingdom", "question": "Which animal kingdom area was originally concept art for a mythical themed land that was never built?", "choices": ["Beastly Kingdom", "Dinoland, U.S.A.", "Camp Minnie-Mickey", "The Oasis"], "answerIndex": 0 },
  { "id": "res-001", "category": "resorts", "question": "Which deluxe resort's lobby and exterior are inspired by Yellowstone National Park's Old Faithful Inn?", "choices": ["Disney's Wilderness Lodge", "Port Orleans Riverside", "Disney's Grand Floridian Resort", "Fort Wilderness"], "answerIndex": 0 },
  { "id": "res-002", "category": "resorts", "question": "On which floor of Disney's Contemporary Resort was the original 1971 Top of the World restaurant located?", "choices": ["15th floor", "5th floor", "10th floor", "12th floor"], "answerIndex": 0 },
  { "id": "res-003", "category": "resorts", "question": "Which resort is themed around turn-of-the-century Atlantic City and is built around Crescent Lake?", "choices": ["Disney's BoardWalk Inn", "Beach Club Resort", "Saratoga Springs", "Old Key West"], "answerIndex": 0 },
  { "id": "res-004", "category": "resorts", "question": "Which Walt Disney World resort opened in 1991 as the original moderate resort in the Port Orleans family?", "choices": ["Port Orleans Resort - Riverside", "Port Orleans Resort - French Quarter", "Coronado Springs", "Caribbean Beach"], "answerIndex": 1 },
  { "id": "din-001", "category": "dining", "question": "Which table-service restaurant at EPCOT is located inside the Mexico pavilion's recreated Mesoamerican pyramid?", "choices": ["San Angel Inn Restaurante", "Via Napoli", "Biergarten Restaurant", "Le Cellier"], "answerIndex": 0 },
  { "id": "din-002", "category": "dining", "question": "Which Disney Springs restaurant is famous for its vintage-style amphicar rides into Lake Buena Vista?", "choices": ["The Boathouse", "Raglan Road", "Homecomin'", "Wolfgang Puck Bar & Grill"], "answerIndex": 0 },
  { "id": "din-003", "category": "dining", "question": "Victoria & Albert's at Disney's Grand Floridian Resort became the first restaurant in Florida to earn which top rating?", "choices": ["AAA Five Diamond", "Michelin three-star", "Forbes five-star", "Zagat 30"], "answerIndex": 0 },
  { "id": "din-004", "category": "dining", "question": "Which dinner show at Fort Wilderness has been serving audiences since 1974?", "choices": ["Hoop-Dee-Doo Musical Revue", "Disney's Spirit of Aloha Dinner Show", "Mickey's Backyard BBQ", "The Enchanted Feast"], "answerIndex": 0 },
  { "id": "trans-001", "category": "transportation", "question": "Which resort is home to the central hub station of the Disney Skyliner system?", "choices": ["The Riviera Resort", "Caribbean Beach Resort", "Art of Animation", "Pop Century"], "answerIndex": 1 },
  { "id": "trans-002", "category": "transportation", "question": "The Walt Disney World Railroad departs and returns to which Magic Kingdom station?", "choices": ["Main Street, U.S.A.", "Frontierland", "Fantasyland", "Tomorrowland"], "answerIndex": 0 },
  { "id": "trans-003", "category": "transportation", "question": "Which ferryboat is named for the Imagineer who supervised construction of the Walt Disney World ferries?", "choices": ["Liberty Belle", "Richard F. Irvine", "Admiral Joe Fowler", "General Joe Potter"], "answerIndex": 1 },
  { "id": "trans-004", "category": "transportation", "question": "Which monorail line stops at EPCOT and the Transportation and Ticket Center?", "choices": ["The EPCOT line", "The Resort line", "The Express line", "The Skyliner loop"], "answerIndex": 0 },
  { "id": "show-001", "category": "shows-entertainment", "question": "Fantasmic! originally debuted at Disney's Hollywood Studios in which year?", "choices": ["1998", "1995", "2001", "2011"], "answerIndex": 0 },
  { "id": "show-002", "category": "shows-entertainment", "question": "Which Magic Kingdom parade debuted in 2014 and features the song 'Celebrate the Magic'?", "choices": ["Festival of Fantasy", "Dream Along with Mickey", "Move It! Shake It!", "Main Street Electrical Parade"], "answerIndex": 0 },
  { "id": "show-003", "category": "shows-entertainment", "question": "The Voices of Liberty are an eight-part a cappella ensemble that performs in which EPCOT pavilion?", "choices": ["The American Adventure", "Italy", "The Land", "Impressions de France"], "answerIndex": 0 },
  { "id": "show-004", "category": "shows-entertainment", "question": "Which nighttime spectacular replaced Wishes! at Magic Kingdom in 2017?", "choices": ["Happily Ever After", "Disney Enchantment", "Remember... Dreams Come True", "The Magic, the Memories and You"], "answerIndex": 0 },
  { "id": "hist-001", "category": "history", "question": "Before the Walt Disney World project was publicly announced, what codename was used for the Florida property?", "choices": ["Project X", "Project Blue", "The Florida Project", "Project Tomorrow"], "answerIndex": 2 },
  { "id": "hist-002", "category": "history", "question": "Which Disney brother officially dedicated Walt Disney World at a ceremony on October 25, 1971?", "choices": ["Roy O. Disney", "Roy E. Disney", "Walt Disney", "Card Walker"], "answerIndex": 0 },
  { "id": "hist-003", "category": "history", "question": "The Walt Disney World property is governed by the Reedy Creek Improvement District, originally established by Florida law in which year?", "choices": ["1967", "1961", "1971", "1982"], "answerIndex": 0 },
  { "id": "hist-004", "category": "history", "question": "Approximately how many acres did Walt Disney's Florida property initially cover when the resort was announced?", "choices": ["27,400 acres", "43,000 acres", "15,000 acres", "60,000 acres"], "answerIndex": 0 }
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
