/**
 * src/js/gallery.js
 * Bahagiakita Template Gallery Controller & Interactive Filtering Engine
 * Pure Vanilla ES Module
 */

import { THEMES, CATEGORIES, generateWaLink, OFFICIAL_WA_NUMBER } from "./themes-data.js";

/* ─────────────────────────────────────────────────────────────────────────
 * 1. THEME ENGINE (Dark / Light Mode)
 * Canonical storage key: "bk-theme" ("dark" | "light")
 * DOM attribute: <html data-theme="..."> and class "dark"
 * ───────────────────────────────────────────────────────────────────────── */

export const THEME_STORAGE_KEY = "bk-theme";

/**
 * Determines current user theme preference from localStorage or OS media query.
 * @returns {"dark" | "light"}
 */
export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {}
  return (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ? "dark"
    : "light";
}

/**
 * Applies theme attribute to <html> element, synchronizes icons, and persists in localStorage.
 * @param {"dark" | "light"} theme
 */
export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {}

  const toggles = document.querySelectorAll("#theme-toggle, .theme-toggle");
  toggles.forEach(toggle => {
    const isDark = theme === "dark";
    toggle.setAttribute("aria-label", isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    toggle.setAttribute("title", isDark ? "Mode Terang" : "Mode Gelap");

    const sunIcon = toggle.querySelector(".sun-icon");
    const moonIcon = toggle.querySelector(".moon-icon");
    if (sunIcon && moonIcon) {
      sunIcon.style.display = isDark ? "inline-block" : "none";
      moonIcon.style.display = isDark ? "none" : "inline-block";
    } else {
      const genericIcon = toggle.querySelector(".material-symbols-outlined") || toggle.querySelector(".theme-icon");
      if (genericIcon) {
        genericIcon.textContent = isDark ? "light_mode" : "dark_mode";
      }
    }
  });
}

/**
 * Toggles current theme between light and dark.
 * @returns {"dark" | "light"} Next active theme
 */
export function toggleTheme() {
  const current = (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme")) || getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

let themeEngineInitialized = false;

/**
 * Initializes the theme engine and sets up event listeners.
 * Guarded with idempotency flag to prevent duplicate listeners on #theme-toggle.
 */
export function initThemeEngine() {
  if (typeof document === "undefined") return;
  const initialTheme = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  applyTheme(initialTheme);

  if (themeEngineInitialized) return;
  themeEngineInitialized = true;

  const toggles = document.querySelectorAll("#theme-toggle, .theme-toggle");
  toggles.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });

  try {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", (e) => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (!saved || saved === "system") {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    }
  } catch (e) {}
}

/* ─────────────────────────────────────────────────────────────────────────
 * 2. STICKY HEADER & GLASSMORPHY
 * Adds frosted glass styling on scroll > 50px
 * ───────────────────────────────────────────────────────────────────────── */

let stickyHeaderInitialized = false;

export function initStickyHeader() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const navbar = document.getElementById("navbar") || document.querySelector("header");
  if (!navbar) return;

  function updateHeader() {
    const isScrolled = window.scrollY > 50;
    navbar.classList.toggle("scrolled", isScrolled);
    navbar.classList.toggle("glass-nav", isScrolled);
  }

  if (stickyHeaderInitialized) {
    updateHeader();
    return;
  }
  stickyHeaderInitialized = true;

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

/* ─────────────────────────────────────────────────────────────────────────
 * 3. FILTERING & SEARCH ENGINE (ReDoS-Immune Substring Match)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Safely escapes special HTML characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pure filter function that combines category and debounced query.
 * ReDoS-immune: uses String.prototype.includes without regular expression compilation.
 *
 * @param {Array<Object>} themes - Catalog items
 * @param {string} category - Selected category ('all' | 'Classic' | 'Modern' | ...)
 * @param {string} query - User search input
 * @returns {Array<Object>} Filtered catalog items
 */
export function filterThemes(themes, category, query) {
  if (!Array.isArray(themes)) return [];
  const q = (query || "").trim().toLowerCase();
  const cat = (category || "all").toLowerCase();

  return themes.filter(item => {
    if (!item) return false;
    const itemCat = (item.category || "").toLowerCase();
    const matchCategory = cat === "all" || cat === "semua" || itemCat === cat;
    if (!matchCategory) return false;
    if (!q) return true;

    const matchName = (item.name || "").toLowerCase().includes(q);
    const matchCategoryText = itemCat.includes(q);
    const matchFeatures = Array.isArray(item.features) && item.features.some(f => (f || "").toLowerCase().includes(q));
    const matchDescription = (item.description || "").toLowerCase().includes(q);

    return matchName || matchCategoryText || matchFeatures || matchDescription;
  });
}

/**
 * Calculates item counts per category for live badge display.
 * @param {Array<Object>} themes
 * @param {Array<Object>} categories
 * @returns {Record<string, number>}
 */
export function getCategoryCounts(themes, categories) {
  const counts = { all: (themes || []).length };
  if (!Array.isArray(themes) || !Array.isArray(categories)) return counts;

  categories.forEach(cat => {
    if (cat.id && cat.id !== "all") {
      counts[cat.id] = themes.filter(t => (t.category || "").toLowerCase() === cat.id.toLowerCase()).length;
    }
  });

  return counts;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 4. DOM CARD RENDERING & TEMPLATES
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Generates an accessible, zero-404 responsive theme card HTML string.
 * Uses escapeHtml defensively across all dynamic tokens including CSS linear-gradient color values.
 * @param {Object} theme
 * @param {number} index
 * @returns {string} HTML markup
 */
export function createThemeCard(theme, index = 0) {
  const waLink = generateWaLink(theme.name);
  const c1 = (theme.palette && theme.palette[0]) || (theme.gradient && theme.gradient.from) || "#52634c";
  const c2 = (theme.palette && theme.palette[1]) || (theme.gradient && theme.gradient.to) || "#1b211a";
  const rawDeg = (theme.gradient && theme.gradient.deg) !== undefined ? theme.gradient.deg : 165;
  const deg = Number.isFinite(Number(rawDeg)) ? Number(rawDeg) : 165;
  const safeC1 = escapeHtml(c1);
  const safeC2 = escapeHtml(c2);
  const line1 = (theme.monogram && theme.monogram.line1) || (theme.name ? theme.name.split(" ")[0] : "");
  const line2 = (theme.monogram && theme.monogram.line2) || (theme.name ? theme.name.split(" ").slice(1).join(" ") : "");

  const badgeHtml = theme.badge
    ? `<span class="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase bg-sage-500/90 dark:bg-sage-600/90 text-white shadow-xs border border-white/20">${escapeHtml(theme.badge)}</span>`
    : "";

  const paletteDots = (theme.palette || []).map(color => (
    `<span class="dot w-3.5 h-3.5 rounded-full border border-black/15 dark:border-white/20 shadow-xs inline-block" style="background-color: ${escapeHtml(color)};" title="${escapeHtml(color)}"></span>`
  )).join("");

  const featurePills = (theme.features || []).map(f => (
    `<span class="tag text-[10px] sm:text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-sage-100 dark:bg-sage-900/80 text-sage-800 dark:text-sage-200 border border-sage-200/60 dark:border-sage-800/60">${escapeHtml(f)}</span>`
  )).join("");

  return `
    <article class="theme-card card card-hov group rounded-2xl bg-[var(--color-surface)] border border-sage-200/80 dark:border-sage-800/80 p-4 sm:p-5 flex flex-col shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300" data-category="${escapeHtml(theme.category)}" data-name="${escapeHtml((theme.name || "").toLowerCase())}">
      <!-- Aspect 3:4 Thumbnail Container with zero-404 CSS Fallback -->
      <div class="theme-thumb relative aspect-[3/4] w-full rounded-xl overflow-hidden mb-4 shadow-inner flex flex-col justify-between p-4 sm:p-5 text-white select-none transition-transform duration-300 group-hover:scale-[1.01]" style="background: linear-gradient(${deg}deg, ${safeC1}, ${safeC2}); --c1: ${safeC1}; --c2: ${safeC2};">
        <!-- Top Bar: Category & Highlight Badges -->
        <div class="flex items-center justify-between gap-2 z-10">
          <span class="theme-category px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase bg-black/40 backdrop-blur-sm border border-white/20 text-white shadow-xs">
            ${escapeHtml(theme.category)}
          </span>
          ${badgeHtml}
        </div>

        <!-- Center Monogram -->
        <div class="theme-thumb-mark my-auto text-center py-4 px-2 z-10">
          <p class="font-serif text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-md leading-tight">
            ${escapeHtml(line1)}
          </p>
          <p class="font-script text-2xl sm:text-3xl md:text-4xl text-cream-100 drop-shadow-md mt-1 leading-none">
            ${escapeHtml(line2)}
          </p>
        </div>

        <!-- Subtle Bottom Gradient Vignette -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
      </div>

      <!-- Theme Body & Info -->
      <div class="theme-body flex flex-col flex-1">
        <h3 class="font-serif text-base sm:text-lg font-bold text-[var(--color-fg)] mb-1.5 leading-snug line-clamp-1">
          ${escapeHtml(theme.name)}
        </h3>

        <!-- Color Palette Dots -->
        <div class="palette-dots flex items-center gap-1.5 mb-2.5" aria-label="Palet warna">
          ${paletteDots}
        </div>

        <p class="text-xs text-sage-600 dark:text-sage-300 leading-relaxed mb-3 line-clamp-2">
          ${escapeHtml(theme.description || "")}
        </p>

        <!-- Feature Pills -->
        <div class="theme-tags flex flex-wrap gap-1.5 mb-4">
          ${featurePills}
        </div>

        <!-- Direct WhatsApp Order CTA -->
        <div class="mt-auto pt-2">
          <a
            href="${waLink}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-primary theme-cta w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-sage-600 hover:bg-sage-700 text-white shadow-xs transition-all active:scale-95 touch-target-safe"
          >
            <span>Pilih Tema</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
 * 5. GALLERY CONTROLLER & STATE COORDINATION
 * ───────────────────────────────────────────────────────────────────────── */

export class GalleryController {
  constructor(options = {}) {
    this.themes = options.themes || THEMES || [];
    this.categories = options.categories || CATEGORIES || [];
    this.activeCategory = "all";
    this.searchQuery = "";
    this.searchDebounceTimer = null;

    // DOM Elements
    this.grid = options.grid || document.getElementById("themes-grid");
    this.chipsContainer = options.chipsContainer || document.getElementById("filter-chips");
    this.searchInput = options.searchInput || document.getElementById("search-input");
    this.clearSearchBtn = options.clearSearchBtn || document.getElementById("clear-search");
    this.visibleCountEl = options.visibleCountEl || document.getElementById("visible-count");
    this.totalCountEl = options.totalCountEl || document.getElementById("total-count");
    this.emptyStateEl = options.emptyStateEl || document.getElementById("empty-state");
    this.resetFilterBtn = options.resetFilterBtn || document.getElementById("reset-filter");
  }

  init() {
    this.renderCategoryChips();
    this.bindEvents();

    // Synchronize initial input value if pre-filled (bfcache / reload)
    if (this.searchInput && this.searchInput.value) {
      const val = this.searchInput.value;
      this.searchQuery = val.trim().toLowerCase();
      if (this.clearSearchBtn) {
        this.clearSearchBtn.classList.toggle("hidden", val.trim().length === 0);
      }
    }

    this.applyFilter();
  }

  renderCategoryChips() {
    if (!this.chipsContainer) return;
    const counts = getCategoryCounts(this.themes, this.categories);

    // If chips are already statically present, update counts & events; otherwise generate
    const existingButtons = this.chipsContainer.querySelectorAll("button");
    if (existingButtons.length >= 7) {
      existingButtons.forEach(btn => {
        const filter = (btn.getAttribute("data-filter") || "").toLowerCase();
        const countKey = filter === "all" || filter === "semua" ? "all" : btn.getAttribute("data-filter");
        const count = counts[countKey] !== undefined ? counts[countKey] : (counts[filter] || 0);
        const countSpan = btn.querySelector(".chip-count");
        if (countSpan) {
          countSpan.textContent = `(${count})`;
        }
      });
      return;
    }

    // Dynamic generation if empty or incomplete
    this.chipsContainer.innerHTML = this.categories.map(cat => {
      const isAll = cat.id === "all";
      const count = counts[cat.id] || 0;
      const label = cat.label || cat.id;
      const isActive = (isAll && this.activeCategory === "all") || (this.activeCategory === cat.id);

      return `
        <button
          type="button"
          class="chip min-h-[44px] px-4 py-2 rounded-full border text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer touch-target-safe ${
            isActive
              ? "active border-sage-600 dark:border-sage-500 bg-sage-600 dark:bg-sage-600 text-white font-semibold shadow-xs"
              : "border-sage-200 dark:border-sage-800 bg-[var(--color-surface)] text-sage-700 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-800"
          }"
          data-filter="${cat.id}"
          role="tab"
          aria-selected="${isActive ? "true" : "false"}"
        >
          <span>${escapeHtml(label)}</span>
          <span class="chip-count font-normal opacity-80 ml-1">(${count})</span>
        </button>
      `;
    }).join("");
  }

  updateChipActiveState() {
    if (!this.chipsContainer) return;
    const chips = this.chipsContainer.querySelectorAll(".chip, button[data-filter]");
    chips.forEach(chip => {
      const filter = (chip.getAttribute("data-filter") || "").toLowerCase();
      const isActive = (this.activeCategory.toLowerCase() === filter) || (this.activeCategory === "all" && (filter === "all" || filter === "semua"));

      chip.classList.toggle("active", isActive);
      chip.setAttribute("aria-selected", isActive ? "true" : "false");

      if (isActive) {
        chip.className = "chip active min-h-[44px] px-4 py-2 rounded-full border border-sage-600 dark:border-sage-500 bg-sage-600 dark:bg-sage-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shadow-xs cursor-pointer touch-target-safe";
      } else {
        chip.className = "chip min-h-[44px] px-4 py-2 rounded-full border border-sage-200 dark:border-sage-800 bg-[var(--color-surface)] text-sage-700 dark:text-sage-300 hover:bg-sage-100 dark:hover:bg-sage-800 text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer touch-target-safe";
      }
    });
  }

  bindEvents() {
    // 1. Category Chips Click
    if (this.chipsContainer) {
      this.chipsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-filter], .chip");
        if (!btn) return;
        e.preventDefault();
        const filter = btn.getAttribute("data-filter") || "all";
        this.activeCategory = filter;
        this.updateChipActiveState();
        this.applyFilter();
      });
    }

    // 2. Search Input (Debounced 150ms with live input & search clear event listeners)
    if (this.searchInput) {
      const handleSearchInput = () => {
        clearTimeout(this.searchDebounceTimer);
        const val = this.searchInput.value || "";

        if (this.clearSearchBtn) {
          this.clearSearchBtn.classList.toggle("hidden", val.trim().length === 0);
        }

        this.searchDebounceTimer = setTimeout(() => {
          this.searchQuery = val.trim().toLowerCase();
          this.applyFilter();
        }, 150);
      };

      this.searchInput.addEventListener("input", handleSearchInput);
      this.searchInput.addEventListener("search", handleSearchInput);
    }

    // 3. Clear Search Button
    if (this.clearSearchBtn) {
      this.clearSearchBtn.addEventListener("click", (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        clearTimeout(this.searchDebounceTimer);
        if (this.searchInput) {
          this.searchInput.value = "";
          this.searchInput.focus();
        }
        this.clearSearchBtn.classList.add("hidden");
        this.searchQuery = "";
        this.applyFilter();
      });
    }

    // 4. Reset Filter Button (in Empty State)
    if (this.resetFilterBtn) {
      this.resetFilterBtn.addEventListener("click", (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        this.resetFilters();
      });
    }

    // 5. Global Shortcut: Escape clears search if focused
    if (typeof document !== "undefined") {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.searchInput && document.activeElement === this.searchInput) {
          this.resetFilters();
        }
      });
    }
  }

  resetFilters() {
    clearTimeout(this.searchDebounceTimer);
    this.activeCategory = "all";
    this.searchQuery = "";
    if (this.searchInput) {
      this.searchInput.value = "";
    }
    if (this.clearSearchBtn) {
      this.clearSearchBtn.classList.add("hidden");
    }
    this.updateChipActiveState();
    this.applyFilter();
  }

  applyFilter() {
    const results = filterThemes(this.themes, this.activeCategory, this.searchQuery);
    const visibleCount = results.length;
    const totalCount = this.themes.length;

    // Update Counter Elements
    if (this.visibleCountEl) {
      this.visibleCountEl.textContent = String(visibleCount);
    }
    if (this.totalCountEl) {
      this.totalCountEl.textContent = String(totalCount);
    }

    // Update Grid & Empty State
    if (this.grid) {
      if (visibleCount > 0) {
        this.grid.innerHTML = results.map((t, idx) => createThemeCard(t, idx)).join("");
        this.grid.classList.remove("hidden");
      } else {
        this.grid.innerHTML = "";
        this.grid.classList.add("hidden");
      }
    }

    if (this.emptyStateEl) {
      if (visibleCount === 0) {
        this.emptyStateEl.classList.remove("hidden");
        this.emptyStateEl.classList.add("is-visible");
      } else {
        this.emptyStateEl.classList.add("hidden");
        this.emptyStateEl.classList.remove("is-visible");
      }
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * 6. INITIALIZATION COORDINATOR (Idempotency Protected)
 * ───────────────────────────────────────────────────────────────────────── */

let galleryInitialized = false;
let activeGalleryController = null;

/**
 * Initializes the entire Gallery application.
 * Guarded with idempotency flag to guarantee that multiple programmatic calls
 * do not attach duplicate event listeners to #theme-toggle or #search-input.
 * @returns {GalleryController | null} Active controller instance
 */
export function initGallery() {
  if (galleryInitialized) {
    return activeGalleryController;
  }
  galleryInitialized = true;

  initThemeEngine();
  initStickyHeader();

  activeGalleryController = new GalleryController({
    themes: THEMES,
    categories: CATEGORIES
  });
  activeGalleryController.init();

  return activeGalleryController;
}

/**
 * Resets initialization flags for test harnesses or dynamic re-binding.
 */
export function resetGalleryInitState() {
  galleryInitialized = false;
  activeGalleryController = null;
  themeEngineInitialized = false;
  stickyHeaderInitialized = false;
}

// Auto-initialize when DOM is ready in browser environment
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGallery);
  } else {
    initGallery();
  }
}

// Expose on window for runtime testing & assertions
if (typeof window !== "undefined") {
  window.initGallery = initGallery;
  window.filterThemes = filterThemes;
  window.getCategoryCounts = getCategoryCounts;
  window.GalleryController = GalleryController;
  window.THEME_STORAGE_KEY = THEME_STORAGE_KEY;
  window.__resetGalleryInitState = resetGalleryInitState;
}
