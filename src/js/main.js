/**
 * src/js/main.js
 * Bahagiakita Landing Page Coordinator & Interactive Behaviors
 * Pure Vanilla ES Module
 */

import { THEMES, generateWaLink } from "./themes-data.js";
import { initFaqAccordion } from "./faq.js";

/* ─────────────────────────────────────────────────────────────────────────
 * 1. THEME ENGINE (Dark / Light Mode)
 * Canonical storage key: "bk-theme" ("dark" | "light")
 * DOM attribute: <html data-theme="...">
 * ───────────────────────────────────────────────────────────────────────── */

export const THEME_STORAGE_KEY = "bk-theme";

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
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
      if (isDark) {
        sunIcon.style.display = "inline-block";
        moonIcon.style.display = "none";
      } else {
        sunIcon.style.display = "none";
        moonIcon.style.display = "inline-block";
      }
    } else {
      const genericIcon = toggle.querySelector(".material-symbols-outlined") || toggle.querySelector(".theme-icon");
      if (genericIcon) {
        genericIcon.textContent = isDark ? "light_mode" : "dark_mode";
      }
    }
  });
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

export function initThemeEngine() {
  const initialTheme = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  applyTheme(initialTheme);

  const toggles = document.querySelectorAll("#theme-toggle, .theme-toggle");
  toggles.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });

  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved || saved === "system") {
        applyTheme(e.matches ? "dark" : "light");
      }
    });
  } catch (e) {}
}

/* ─────────────────────────────────────────────────────────────────────────
 * 2. STICKY HEADER & GLASSMORPHY
 * Adds frosted glass styling on scroll > 50px
 * ───────────────────────────────────────────────────────────────────────── */

export function initStickyHeader() {
  const navbar = document.getElementById("navbar") || document.querySelector("header");
  if (!navbar) return;

  function updateHeader() {
    const isScrolled = window.scrollY > 50;
    navbar.classList.toggle("scrolled", isScrolled);
    navbar.classList.toggle("glass-nav", isScrolled);
    navbar.classList.toggle("shadow-sm", isScrolled);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

/* ─────────────────────────────────────────────────────────────────────────
 * 3. ACTIVE SECTION SCROLL SPY & SMOOTH SCROLLING
 * ───────────────────────────────────────────────────────────────────────── */

export function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link-desktop, nav a[href^=\"#\"]"));

  if (sections.length === 0 || navLinks.length === 0) return;

  function onScroll() {
    const scrollPos = window.scrollY + 120;
    let currentId = "";

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section.offsetTop <= scrollPos) {
        currentId = section.id;
      }
    }

    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      const isActive = href === "#" + currentId;
      link.classList.toggle("active", isActive);
      link.classList.toggle("text-sage-600", isActive);
      link.classList.toggle("dark:text-sage-300", isActive);
      link.classList.toggle("font-semibold", isActive);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

export function initSmoothScroll() {
  const HEADER_OFFSET = 80;

  document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth"
      });

      if (window.history?.pushState) {
        window.history.pushState(null, "", href);
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * 4. MOBILE DRAWER NAVIGATION & ACCESSIBLE FOCUS TRAP
 * Opens from right, backdrop blur, body scroll lock, Escape close,
 * focus restoration, and strict WAI-ARIA keyboard Tab trap.
 * ───────────────────────────────────────────────────────────────────────── */

export function initMobileDrawer() {
  const menuBtn = document.getElementById("mobile-menu-btn") ||
                  document.getElementById("menu-btn") ||
                  document.querySelector(".hamburger");
  const drawer = document.getElementById("mobile-menu") || document.querySelector(".mobile-menu");
  if (!drawer) return;

  // Idempotency guard: prevent duplicate event listener attachment
  if (drawer.dataset.drawerInitialized === "true") return;
  drawer.dataset.drawerInitialized = "true";

  const closeBtn = drawer.querySelector("#mobile-menu-close") ||
                   drawer.querySelector("#close-menu") ||
                   drawer.querySelector(".menu-close");
  const backdrop = drawer.querySelector("#mobile-menu-backdrop") ||
                   drawer.querySelector(".menu-backdrop");
  const drawerContent = drawer.querySelector("#mobile-menu-drawer") || drawer;
  const menuLinks = drawer.querySelectorAll("a");

  const FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function getFocusableElements() {
    return Array.from(drawerContent.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
    );
  }

  function openDrawer() {
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    document.body.classList.add("overflow-hidden");

    // Focus close button on open for immediate keyboard dismissal
    requestAnimationFrame(() => {
      if (closeBtn) {
        closeBtn.focus();
      } else {
        const focusable = getFocusableElements();
        if (focusable.length > 0) focusable[0].focus();
      }
    });
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.focus();
    }
    document.body.style.overflow = "";
    document.body.classList.remove("overflow-hidden");
  }

  if (menuBtn) menuBtn.addEventListener("click", openDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  drawer.addEventListener("click", (e) => {
    if (e.target === drawer || e.target === backdrop) {
      closeDrawer();
    }
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      closeDrawer();

      if (href && href.startsWith("#") && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const targetTop = target.getBoundingClientRect().top + window.scrollY - 80;
          requestAnimationFrame(() => {
            window.scrollTo({
              top: Math.max(0, targetTop),
              behavior: "smooth",
            });
          });
        }
      }
    });
  });

  // Consolidated keyboard navigation: Escape key to dismiss & Tab key focus trap
  document.addEventListener("keydown", (e) => {
    if (!drawer.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeDrawer();
      return;
    }

    if (e.key === "Tab") {
      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: wrapping backward from first to last
        if (document.activeElement === firstElement || !drawer.contains(document.activeElement)) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: wrapping forward from last to first
        if (document.activeElement === lastElement || !drawer.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  });
}

/* ─────────────────────────────────────────────────────────────────────────
 * 5. DYNAMIC TEMPLATE PREVIEW RENDERING
 * Loads THEMES from themes-data.js, renders top featured cards into #themes-grid
 * Zero-404 guaranteed: uses dynamic CSS gradients & typographic monograms
 * Purges all OpenDesign artifacts (no data-od-id)
 * ───────────────────────────────────────────────────────────────────────── */

export function renderThemeCards(themes, container) {
  if (!container) return;

  const html = themes.map(theme => {
    const paletteDots = theme.palette.map(color =>
      `<span class="dot inline-block w-4 h-4 rounded-full border border-white/60 dark:border-black/30 shadow-xs" style="background-color: ${color};" title="${color}"></span>`
    ).join("");

    const featureTags = theme.features.slice(0, 3).map(feat =>
      `<span class="tag text-[11px] px-2.5 py-0.5 rounded-full bg-sage-100 dark:bg-sage-900/60 text-sage-700 dark:text-sage-300 font-medium">${feat}</span>`
    ).join("");

    const waLink = generateWaLink(theme.name);
    const grad = theme.gradient || { from: theme.palette[0], to: theme.palette[1] || theme.palette[0], deg: 165 };
    const monogramLine1 = theme.monogram?.line1 || theme.name.split(" ")[0] || "";
    const monogramLine2 = theme.monogram?.line2 || theme.name.split(" ").slice(1).join(" ") || "";

    const badgeHtml = theme.badge
      ? `<span class="absolute top-3 right-3 z-10 text-[11px] font-bold px-2.5 py-1 rounded-full bg-terracotta-500 text-white shadow-xs">${theme.badge}</span>`
      : "";

    return `
      <article class="theme-card group flex flex-col rounded-2xl bg-[var(--color-surface)] border border-border-subtle overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <!-- Thumbnail with CSS Gradient & Monogram (Zero-404) -->
        <div class="theme-thumb relative aspect-[16/10] w-full p-4 flex flex-col justify-between overflow-hidden" style="background: linear-gradient(${grad.deg}deg, ${grad.from}, ${grad.to});">
          <div class="flex items-center justify-between z-10">
            <span class="theme-category text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/20">
              ${theme.category}
            </span>
            ${badgeHtml}
          </div>

          <!-- Monogram Centerpiece -->
          <div class="theme-thumb-mark my-auto text-center z-10 select-none drop-shadow-md">
            <div class="font-serif text-2xl font-bold text-white tracking-wide italic leading-tight">
              ${monogramLine1}
            </div>
            ${monogramLine2 ? `<div class="font-script text-xl text-cream-200 leading-tight mt-0.5">&amp; ${monogramLine2}</div>` : ""}
          </div>

          <div class="absolute -bottom-6 -right-6 w-24 h-24 text-white/10 pointer-events-none select-none">
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,0 Q70,40 100,50 Q60,70 50,100 Q40,60 0,50 Q40,40 50,0 Z"/></svg>
          </div>
        </div>

        <!-- Card Body -->
        <div class="theme-body p-5 flex flex-col flex-1 justify-between gap-4">
          <div>
            <h3 class="font-serif text-lg font-bold text-sage-900 dark:text-sage-100 group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors">
              ${theme.name}
            </h3>
            <p class="text-xs text-sage-600 dark:text-sage-300 line-clamp-2 mt-1.5 leading-relaxed">
              ${theme.description || ""}
            </p>
          </div>

          <div class="space-y-3 pt-2 border-t border-sage-100 dark:border-sage-800/60">
            <div class="palette-dots flex items-center gap-1.5">
              ${paletteDots}
            </div>

            <div class="theme-tags flex flex-wrap gap-1.5">
              ${featureTags}
            </div>

            <!-- Direct WhatsApp CTA (touch-target safe: min-h-44px) -->
            <a
              href="${waLink}"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary theme-cta w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-sage-500 hover:bg-sage-600 text-white shadow-xs transition-colors touch-target-safe"
            >
              <span>Pilih Tema</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  container.innerHTML = html;
}

export function initThemesPreview() {
  const grid = document.getElementById("themes-grid");
  if (!grid) return;

  const featured = THEMES.filter(t => t.isFeatured);
  const displayThemes = featured.length >= 3
    ? featured.concat(THEMES.filter(t => !t.isFeatured)).slice(0, 6)
    : THEMES.slice(0, 6);

  renderThemeCards(displayThemes, grid);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 6. INITIALIZATION COORDINATOR
 * ───────────────────────────────────────────────────────────────────────── */

let appInitialized = false;

export function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  initThemeEngine();
  initStickyHeader();
  initScrollSpy();
  initSmoothScroll();
  initMobileDrawer();
  initThemesPreview();
  initFaqAccordion();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
}

export default initApp;
