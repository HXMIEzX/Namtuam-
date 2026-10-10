(() => {
  "use strict";

  const root = document.documentElement;
  const storageKey = "namtuam-theme";
  let theme = "light";
  try {
    theme = localStorage.getItem(storageKey) === "dark" ? "dark" : "light";
  } catch (error) {
    console.warn("Could not read the saved theme preference.", error);
  }
  root.dataset.theme = theme;

  function updateToggle() {
    const button = document.getElementById("theme-toggle");
    const icon = document.getElementById("theme-toggle-icon");
    const label = document.getElementById("theme-toggle-label");
    if (!button || !icon || !label) return;
    const nextTheme = theme === "light" ? "dark" : "light";
    const isEnglish = root.lang === "en";
    icon.textContent = theme === "light" ? "☾" : "☀";
    label.textContent = isEnglish
      ? (nextTheme === "dark" ? "Dark theme" : "Light theme")
      : (nextTheme === "dark" ? "ธีมมืด" : "ธีมสว่าง");
    button.setAttribute("aria-label", isEnglish
      ? `Switch to ${nextTheme} theme`
      : `เปลี่ยนเป็นธีม${nextTheme === "dark" ? "มืด" : "สว่าง"}`);
  }

  function initializeToggle() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    button.addEventListener("click", () => {
      theme = theme === "light" ? "dark" : "light";
      root.dataset.theme = theme;
      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        console.warn("Could not save the theme preference in this browser.", error);
      }
      updateToggle();
      window.dispatchEvent(new CustomEvent("namtuam-themechange", { detail: { theme } }));
    });
    updateToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeToggle, { once: true });
  } else {
    initializeToggle();
  }
  window.addEventListener("namtuam-languagechange", updateToggle);
})();
