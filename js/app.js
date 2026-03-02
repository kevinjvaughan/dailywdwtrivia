function initCategoryButtons() {
  const buttons = document.querySelectorAll("[data-category]");
  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      if (!category) return;
      window.location.hash = `#${category}`;
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCategoryButtons, { once: true });
} else {
  initCategoryButtons();
}

