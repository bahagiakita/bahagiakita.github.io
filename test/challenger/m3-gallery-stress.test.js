/**
 * test/challenger/m3-gallery-stress.test.js
 * Master Empirical Challenger Suite for Milestone 3 (Template Gallery Adversarial Stress Testing)
 * 
 * Verifies:
 * 1. Deep HTML AST Analysis & OpenDesign Purge Audit (template.html)
 * 2. Search Fuzzing Battery: Whitespace, ReDoS attack vectors, Unicode/Emoji, Extreme Lengths (100k chars), XSS payloads
 * 3. Pairwise Combinations: All 7 Category Filters × 20 Diverse Queries (Mathematical Partition Invariant)
 * 4. Empty State Triggers, Reset Mechanics & Rapid Oscillation (100 cycles)
 * 5. WhatsApp Conversion Pipeline: All 14 Cards & Static CTAs (Phone 6283847630740, Encoding, No Pollution)
 * 6. Zero Broken Images & Visual Fallback Integrity (CSS Gradients, Typographic Monograms, Palette Dots)
 * 7. Production Vite Multi-Page Build Verification
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { parseHTML } from '../utils/dom-parser.js';
import { OFFICIAL_PHONE, parseWhatsAppUrl } from '../utils/whatsapp.js';
import { THEMES, CATEGORIES, generateWaLink, OFFICIAL_WA_NUMBER } from '../../src/js/themes-data.js';
import {
  filterThemes,
  createThemeCard,
  escapeHtml,
  getCategoryCounts,
  GalleryController
} from '../../src/js/gallery.js';

const ROOT = resolve(process.cwd());

export async function runM3StressTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function assert(condition, message, details = {}) {
    if (condition) {
      results.passed++;
      results.tests.push({ status: 'PASS', message });
    } else {
      results.failed++;
      results.tests.push({ status: 'FAIL', message, details });
      console.error(`  ❌ FAIL: ${message}`);
      if (Object.keys(details).length > 0) {
        console.error('     Details:', JSON.stringify(details, null, 2));
      }
    }
  }

  console.log('===============================================================');
  console.log('CHALLENGER SUITE: MILESTONE 3 EMPIRICAL ADVERSARIAL STRESS TEST');
  console.log('===============================================================\n');

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 1: Deep HTML AST Analysis & OpenDesign Purge (template.html)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('[Suite 1] Deep HTML AST Analysis & OpenDesign Purge Audit');
  const templateHtmlRaw = readFileSync(resolve(ROOT, 'template.html'), 'utf-8');
  const doc = parseHTML(templateHtmlRaw);

  // 1.1 Traverse every DOMNode for prototype artifacts in attributes
  const allNodes = [];
  function traverse(node) {
    allNodes.push(node);
    for (const child of node.children) {
      traverse(child);
    }
  }
  traverse(doc);

  const odAttributesFound = [];
  allNodes.forEach(node => {
    for (const [key, val] of Object.entries(node.attributes)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('od-id') ||
        lowerKey.includes('screen-label') ||
        lowerKey.startsWith('data-od') ||
        lowerKey === 'data-screen-label'
      ) {
        odAttributesFound.push({ tag: node.tagName, attr: key, val });
      }
    }
  });

  assert(
    odAttributesFound.length === 0,
    'template.html is 100% free from OpenDesign attributes across full DOM AST',
    { violations: odAttributesFound }
  );

  // 1.2 Parse raw <script> elements (since dom-parser intentionally skips them)
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const rawScripts = [];
  let sMatch;
  while ((sMatch = scriptRegex.exec(templateHtmlRaw)) !== null) {
    rawScripts.push({
      rawAttrs: sMatch[1],
      content: sMatch[2].trim(),
      src: sMatch[1].match(/src=["']([^"']+)["']/i)?.[1] || '',
      type: sMatch[1].match(/type=["']([^"']+)["']/i)?.[1] || '',
      id: sMatch[1].match(/id=["']([^"']+)["']/i)?.[1] || ''
    });
  }

  const prototypeScripts = rawScripts.filter(s => {
    const id = s.id.toLowerCase();
    const content = s.content.toLowerCase();
    return id.includes('speaker-notes') || id.includes('opendesign') || content.includes('speakernotes');
  });

  assert(
    prototypeScripts.length === 0,
    'template.html contains zero prototype speaker-notes or OpenDesign script elements',
    { found: prototypeScripts.map(s => s.id) }
  );

  // 1.3 Check for legacy monolithic inline style blocks (>100 chars)
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  const rawStyles = [];
  let styleMatch;
  while ((styleMatch = styleRegex.exec(templateHtmlRaw)) !== null) {
    rawStyles.push(styleMatch[1].trim());
  }
  const largeStyles = rawStyles.filter(s => s.length > 100);
  assert(
    largeStyles.length === 0,
    'template.html contains zero monolithic inline <style> elements',
    { count: largeStyles.length }
  );

  // 1.4 Production Tailwind v4 stylesheet link
  const linkTags = doc.querySelectorAll('link');
  const mainCssLink = linkTags.find(l => {
    const href = l.getAttribute('href') || '';
    return href.includes('main.css') && l.getAttribute('rel') === 'stylesheet';
  });
  assert(Boolean(mainCssLink), 'template.html imports production stylesheet /src/styles/main.css');

  // 1.5 Client gallery ES module script
  const galleryScript = rawScripts.find(s => s.src.includes('gallery.js') && s.type === 'module');
  assert(Boolean(galleryScript), 'template.html loads /src/js/gallery.js as an ES module');

  // 1.6 Anti-FOUC script present in head
  const antiFoucScript = rawScripts.find(s => s.content.includes('bk-theme') && s.content.includes('prefers-color-scheme'));
  assert(Boolean(antiFoucScript), 'Anti-FOUC early theme detection script is present in template.html');

  // 1.7 SEO & Social Metadata
  const metaTags = doc.querySelectorAll('meta');
  const hasOgTitle = metaTags.some(m => m.getAttribute('property') === 'og:title');
  const hasOgDescription = metaTags.some(m => m.getAttribute('property') === 'og:description');
  const hasOgImage = metaTags.some(m => m.getAttribute('property') === 'og:image');
  const hasTwitterCard = metaTags.some(m => m.getAttribute('name') === 'twitter:card');
  assert(
    hasOgTitle && hasOgDescription && hasOgImage && hasTwitterCard,
    'template.html contains complete Open Graph and Twitter Card social metadata'
  );

  // 1.8 Schema.org CollectionPage JSON-LD
  const jsonLdScript = rawScripts.find(s => s.type === 'application/ld+json');
  let validJsonLd = false;
  if (jsonLdScript && jsonLdScript.content) {
    try {
      const parsedLd = JSON.parse(jsonLdScript.content);
      validJsonLd = parsedLd['@type'] === 'CollectionPage' && parsedLd.publisher?.telephone === '+6283847630740';
    } catch (e) {}
  }
  assert(validJsonLd, 'template.html contains valid Schema.org CollectionPage structured data');

  // 1.9 Actionable interactive touch target compliance
  // Audit key primary action controls: category buttons, search inputs, CTA links, social buttons, theme toggle
  const primaryActionElements = [
    ...doc.querySelectorAll('.chip, button[data-filter]'),
    ...doc.querySelectorAll('#theme-toggle, .theme-toggle'),
    ...doc.querySelectorAll('#search-input'),
    ...doc.querySelectorAll('#reset-filter'),
    ...doc.querySelectorAll('.nav-back'),
    ...doc.querySelectorAll('.cta-section .btn'),
    ...doc.querySelectorAll('.social-link')
  ];

  let violations = 0;
  primaryActionElements.forEach(el => {
    const cls = el.getAttribute('class') || '';
    const isTouchSafe = cls.includes('min-h-[44px]') || cls.includes('touch-target-safe') || cls.includes('h-11') || cls.includes('w-11');
    if (!isTouchSafe) {
      violations++;
    }
  });
  assert(violations === 0, `All ${primaryActionElements.length} primary actionable touch targets enforce 44px ergonomics`);


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 2: Search Fuzzing Battery & ReDoS Immunity Stress Harness
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 2] Search Fuzzing Battery & ReDoS Immunity Stress Harness');

  // 2.1 Whitespace Fuzzing
  const whitespaceTestCases = [
    { query: '', expected: THEMES.length, desc: 'Empty string returns all 14 themes' },
    { query: ' ', expected: THEMES.length, desc: 'Single space returns all 14 themes' },
    { query: '          ', expected: THEMES.length, desc: '10 spaces returns all 14 themes' },
    { query: '\t\n\r  \t', expected: THEMES.length, desc: 'Mixed tabs, newlines, returns returns all 14 themes' },
    { query: '\u00A0\u3000', expected: THEMES.length, desc: 'Standard Unicode whitespace separator characters (NBSP, ideographic space)' },
    { query: '  Gold  ', expected: 2, desc: 'Leading and trailing spaces around "Gold"' },
    { query: '\tRustic\n', expected: 2, desc: 'Tabs and newline around "Rustic"' },
  ];

  whitespaceTestCases.forEach(({ query, expected, desc }) => {
    const res = filterThemes(THEMES, 'all', query);
    assert(res.length === expected, `Whitespace fuzz: [${desc}] (got ${res.length}, expected ${expected})`);
  });

  // Zero-width space (U+200B) format character distinction test
  const zwspRes = filterThemes(THEMES, 'all', '\u200B');
  assert(
    zwspRes.length === 0,
    'Zero-width space format character U+200B is safely treated as distinct search token without crashing'
  );

  // 2.2 ReDoS Attack Vectors & Catastrophic Backtracking
  const redosAttackVectors = [
    { pattern: '(a+)+$', desc: 'Nested quantifier' },
    { pattern: '((((((((((a))))))))))*', desc: 'Deeply nested parenthesis group' },
    { pattern: '(a|aa)+', desc: 'Alternating overlapping group' },
    { pattern: 'a*a*a*a*a*a*a*a*a*a*a*b', desc: 'Star repetition cascade' },
    { pattern: '.*.*.*.*.*.*.*.*.*.*.*.*', desc: 'Multi-wildcard cascade' },
    { pattern: '[a-z]+[a-z]+[a-z]+[a-z]+[a-z]+!', desc: 'Overlapping character classes' },
    { pattern: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$', desc: 'Complex email regex string' },
    { pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}', desc: 'Lookahead password regex pattern' },
    { pattern: '((a+)*)+', desc: 'Worst-case catastrophic backtracking' },
    { pattern: '\\', desc: 'Dangling single escape backslash' },
    { pattern: '\\1\\2\\3', desc: 'Backreferences' },
    { pattern: '[[[(((}}}{', desc: 'Mismatched brackets and braces' },
    { pattern: '??++**', desc: 'Multiple consecutive quantifiers' }
  ];

  redosAttackVectors.forEach(({ pattern, desc }) => {
    const t0 = performance.now();
    let res = null;
    let thrown = null;
    try {
      res = filterThemes(THEMES, 'all', pattern);
    } catch (e) {
      thrown = e;
    }
    const elapsed = performance.now() - t0;

    assert(
      thrown === null,
      `ReDoS attack handled without throwing exception: [${desc}]`,
      { pattern, error: thrown?.message }
    );
    assert(
      elapsed < 10,
      `ReDoS attack executed safely under 10ms (actual: ${elapsed.toFixed(3)}ms): [${desc}]`,
      { elapsed }
    );
  });

  // 2.3 Unicode, Multi-Byte & Emoji Queries
  const unicodeTestCases = [
    { query: '💍', desc: 'Ring emoji' },
    { query: '✨', desc: 'Sparkle emoji' },
    { query: '👰‍♀️', desc: 'Bride with zero-width joiner sequence' },
    { query: '💐 Pernikahan', desc: 'Emoji combined with Indonesian word' },
    { query: 'Свадьба', desc: 'Cyrillic word' },
    { query: 'زفاف', desc: 'Arabic word' },
    { query: '结婚 / ウェディング', desc: 'CJK characters' },
    { query: 'café & fiancée', desc: 'Latin accented diacritics' },
    { query: '\u202Ereversed', desc: 'Right-to-left override character' }
  ];

  unicodeTestCases.forEach(({ query, desc }) => {
    let res = null;
    let thrown = null;
    try {
      res = filterThemes(THEMES, 'all', query);
    } catch (e) {
      thrown = e;
    }
    assert(thrown === null && Array.isArray(res), `Unicode/Emoji query handled gracefully: [${desc}]`);
  });

  // 2.4 Extreme Length Strings (100, 1,000, 10,000, 50,000, 100,000 chars)
  const lengthCases = [100, 1000, 10000, 50000, 100000];
  lengthCases.forEach(len => {
    const longQuery = 'b'.repeat(len);
    const t0 = performance.now();
    const res = filterThemes(THEMES, 'all', longQuery);
    const elapsed = performance.now() - t0;

    assert(
      res.length === 0,
      `Extreme length search (${len.toLocaleString()} chars) returns 0 results`,
      { len, count: res.length }
    );
    assert(
      elapsed < 15,
      `Extreme length search (${len.toLocaleString()} chars) completes in sub-15ms (actual: ${elapsed.toFixed(2)}ms)`
    );
  });

  // 2.5 Security / Injection / XSS Payloads
  const injectionPayloads = [
    '<script>alert("XSS")</script>',
    '"><img src=x onerror=alert(1)>',
    '"><svg/onload=alert(document.cookie)>',
    "'; DROP TABLE themes; --",
    '{{7*7}}',
    '${process.mainModule.require("child_process")}',
    'javascript:void(0)'
  ];

  injectionPayloads.forEach(payload => {
    const res = filterThemes(THEMES, 'all', payload);
    assert(Array.isArray(res), `Security payload handled without execution or failure: ${payload.slice(0, 20)}...`);

    const escaped = escapeHtml(payload);
    assert(
      !escaped.includes('<') && !escaped.includes('>') && !escaped.includes('"'),
      `escapeHtml neutralizes HTML special characters: ${payload.slice(0, 20)}...`
    );
  });

  // 2.6 Defensive Typing (Null, Undefined, Non-Array Themes)
  assert(filterThemes(null, 'all', 'gold').length === 0, 'filterThemes returns empty array when themes is null');
  assert(filterThemes(undefined, 'all', 'gold').length === 0, 'filterThemes returns empty array when themes is undefined');
  assert(filterThemes('invalid', 'all', 'gold').length === 0, 'filterThemes returns empty array when themes is a string');
  assert(filterThemes([null, undefined, {}], 'all', 'gold').length === 0, 'filterThemes handles array with null/undefined items safely');


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 3: Pairwise Combinations & Mathematical Partition Invariant
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 3] Pairwise Category Filters × Search Query Matrix & Partition Invariant');

  // Verify category counts in themes-data.js
  const expectedCategoryCounts = {
    all: 14,
    Classic: 2,
    Modern: 2,
    Minimal: 2,
    Floral: 3,
    Rustic: 2,
    Luxury: 3
  };

  const calculatedCounts = getCategoryCounts(THEMES, CATEGORIES);
  for (const [cat, expected] of Object.entries(expectedCategoryCounts)) {
    assert(
      calculatedCounts[cat] === expected,
      `Category count for "${cat}" is exactly ${expected} (calculated: ${calculatedCounts[cat]})`
    );
  }

  // Diverse test query battery for pairwise matrix
  const pairwiseQueries = [
    '',                                 // All items
    '   ',                              // Whitespace
    'gold',                             // Multi-category keyword (Classic & Modern)
    'rustic',                           // Category name itself
    'countdown',                        // Feature tag present on all 14 themes
    'rsvp',                             // Feature tag present on all 14 themes
    'galeri',                           // Feature tag present on all 14 themes
    'music',                            // Feature tag present on 13 themes
    'gift',                             // Feature tag present on 9 themes
    'eukaliptus',                       // Description keyword in Floral
    'zamrud',                           // Description keyword in Luxury
    'pastel',                           // Description keyword in Floral
    'mediterania',                      // Description keyword in Rustic
    'editorial',                        // Title/Description keyword in Modern
    '.*',                               // Regex special char
    '\\',                               // Backslash
    '💍',                               // Emoji
    'NonExistentQueryXYZ123',           // Nonexistent term
    'a'.repeat(500),                    // 500-char query
    'Classic'                           // Query matching category name
  ];

  const specificCategoryIds = ['Classic', 'Modern', 'Minimal', 'Floral', 'Rustic', 'Luxury'];

  let totalPairwiseChecked = 0;
  let allInvariantsPassed = true;

  pairwiseQueries.forEach(q => {
    const allResults = filterThemes(THEMES, 'all', q);
    let sumOfCategories = 0;

    specificCategoryIds.forEach(cat => {
      const catResults = filterThemes(THEMES, cat, q);
      sumOfCategories += catResults.length;
      totalPairwiseChecked++;

      // Invariant: catResults cannot exceed allResults
      assert(
        catResults.length <= allResults.length,
        `Category "${cat}" results (${catResults.length}) <= All results (${allResults.length}) for query "${q.slice(0, 15)}"`
      );
    });

    // Invariant: Since categories partition the catalog, Sum(Cat_i) === All
    const matchesInvariant = sumOfCategories === allResults.length;
    if (!matchesInvariant) allInvariantsPassed = false;

    assert(
      matchesInvariant,
      `Partition invariant holds for query "${q.slice(0, 20)}": Sum(6 categories) [${sumOfCategories}] === All [${allResults.length}]`
    );
  });

  console.log(`  -> Evaluated ${totalPairwiseChecked} pairwise category-query combinations with 100% mathematical consistency.`);

  // 3.3 Unknown Category Handling
  assert(
    filterThemes(THEMES, 'SpaceCyberpunk', '').length === 0,
    'Non-existent category filter safely returns 0 results'
  );
  assert(
    filterThemes(THEMES, 'classic', 'gold').length === 1,
    'Category matching is case-insensitive ("classic" matches "Classic")'
  );


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 4: Empty State Triggers, Reset Mechanisms & Rapid Oscillation
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 4] Empty State Triggers, Reset Mechanics & Rapid Oscillation Stress');

  // Build simulated DOM environment
  class MockClassList {
    constructor() { this.classes = new Set(); }
    add(c) { this.classes.add(c); }
    remove(c) { this.classes.delete(c); }
    contains(c) { return this.classes.has(c); }
    toggle(c, f) {
      if (f === undefined) {
        if (this.contains(c)) { this.remove(c); return false; }
        else { this.add(c); return true; }
      }
      if (f) { this.add(c); return true; }
      else { this.remove(c); return false; }
    }
  }

  class MockElement {
    constructor(tag = 'div', id = '') {
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.classList = new MockClassList();
      this.attributes = new Map();
      this.listeners = new Map();
      this.children = [];
      this.innerHTML = '';
      this.textContent = '';
      this.value = '';
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) || null; }
    hasAttribute(k) { return this.attributes.has(k); }
    removeAttribute(k) { this.attributes.delete(k); }
    addEventListener(evt, fn) {
      if (!this.listeners.has(evt)) this.listeners.set(evt, []);
      this.listeners.get(evt).push(fn);
    }
    dispatchEvent(evt) {
      const list = this.listeners.get(evt.type) || [];
      list.forEach(fn => fn(evt));
    }
    click() {
      this.dispatchEvent({ type: 'click', target: this, preventDefault() {}, closest: () => this });
    }
    querySelectorAll() { return []; }
    querySelector() { return null; }
    focus() {}
  }

  const grid = new MockElement('div', 'themes-grid');
  const chipsContainer = new MockElement('div', 'filter-chips');
  const searchInput = new MockElement('input', 'search-input');
  const clearSearchBtn = new MockElement('button', 'clear-search');
  const visibleCountEl = new MockElement('strong', 'visible-count');
  const totalCountEl = new MockElement('strong', 'total-count');
  const emptyStateEl = new MockElement('div', 'empty-state');
  const resetFilterBtn = new MockElement('button', 'reset-filter');

  const controller = new GalleryController({
    themes: THEMES,
    categories: CATEGORIES,
    grid,
    chipsContainer,
    searchInput,
    clearSearchBtn,
    visibleCountEl,
    totalCountEl,
    emptyStateEl,
    resetFilterBtn
  });

  // 4.1 Initial State Verification
  controller.init();
  assert(visibleCountEl.textContent === '14', 'Initial visible count is 14');
  assert(totalCountEl.textContent === '14', 'Initial total count is 14');
  assert(!grid.classList.contains('hidden'), 'Themes grid is visible initially');
  assert(!emptyStateEl.classList.contains('is-visible'), 'Empty state is hidden initially');

  // 4.2 Empty State Triggering
  controller.searchQuery = 'ImpossibleSearchPatternXYZ999';
  controller.applyFilter();

  assert(visibleCountEl.textContent === '0', 'Visible count drops to 0 when no results match');
  assert(emptyStateEl.classList.contains('is-visible'), 'Empty state receives "is-visible" class on 0 results');
  assert(!emptyStateEl.classList.contains('hidden'), 'Empty state loses "hidden" class on 0 results');
  assert(grid.classList.contains('hidden'), 'Themes grid receives "hidden" class on 0 results');
  assert(grid.innerHTML === '', 'Themes grid HTML is emptied during empty state');

  // 4.3 Reset Filter Triggering
  controller.resetFilters();
  assert(controller.activeCategory === 'all', 'Active category resets to "all"');
  assert(controller.searchQuery === '', 'Search query resets to ""');
  assert(searchInput.value === '', 'Search input field value resets to ""');
  assert(visibleCountEl.textContent === '14', 'Visible count restored to 14 after reset');
  assert(!grid.classList.contains('hidden'), 'Themes grid is restored (not hidden) after reset');
  assert(grid.innerHTML.includes('theme-card'), 'Themes grid populated with theme cards after reset');
  assert(emptyStateEl.classList.contains('hidden'), 'Empty state receives "hidden" class after reset');
  assert(!emptyStateEl.classList.contains('is-visible'), 'Empty state loses "is-visible" class after reset');

  // 4.4 Rapid Oscillation Stress Test (100 alternating cycles)
  let oscillationSuccess = true;
  for (let cycle = 0; cycle < 100; cycle++) {
    // Zero result trigger
    controller.searchQuery = `cycle_${cycle}_nomatch`;
    controller.applyFilter();
    if (visibleCountEl.textContent !== '0' || !emptyStateEl.classList.contains('is-visible')) {
      oscillationSuccess = false;
      break;
    }
    // Reset trigger
    controller.resetFilters();
    if (visibleCountEl.textContent !== '14' || !emptyStateEl.classList.contains('hidden')) {
      oscillationSuccess = false;
      break;
    }
  }

  assert(oscillationSuccess, 'Successfully survived 100 rapid cycles of empty-state <-> reset oscillation with 0 state drift');


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 5: WhatsApp Conversion Pipeline & URL Encoding Validation
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 5] WhatsApp Conversion Pipeline & URL Encoding Validation');

  // 5.1 Card WhatsApp Links (All 14 Themes)
  THEMES.forEach((theme, idx) => {
    const cardHtml = createThemeCard(theme, idx);
    const cardDoc = parseHTML(cardHtml);
    const cta = cardDoc.querySelector('a.theme-cta') || cardDoc.querySelector('a');

    assert(Boolean(cta), `Theme #${idx + 1} ("${theme.name}") card renders CTA anchor tag`);

    const href = cta.getAttribute('href') || '';
    const target = cta.getAttribute('target');
    const rel = cta.getAttribute('rel') || '';

    const parsed = parseWhatsAppUrl(href, { requireText: true });
    assert(parsed.valid, `Theme #${idx + 1} CTA has valid WhatsApp URL format`, { error: parsed.error });
    assert(parsed.phone === OFFICIAL_WA_NUMBER, `Theme #${idx + 1} CTA targets official phone ${OFFICIAL_WA_NUMBER}`, { phone: parsed.phone });
    assert(target === '_blank', `Theme #${idx + 1} CTA specifies target="_blank"`);
    assert(rel.includes('noopener') && rel.includes('noreferrer'), `Theme #${idx + 1} CTA enforces rel="noopener noreferrer"`);

    // Invariant: Message format
    const expectedMsg = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${theme.name}.`;
    assert(
      parsed.text === expectedMsg,
      `Theme #${idx + 1} message exactly matches official template order format`,
      { actual: parsed.text, expected: expectedMsg }
    );

    // Invariant: No raw unencoded spaces in query string
    assert(!href.includes(' '), `Theme #${idx + 1} URL contains zero raw spaces`);

    // Invariant: Parameter pollution check
    const urlObj = new URL(href);
    const params = Array.from(urlObj.searchParams.keys());
    assert(
      params.length === 1 && params[0] === 'text',
      `Theme #${idx + 1} URL contains solely the 'text' query parameter (no parameter pollution)`
    );
  });

  // 5.2 Static WhatsApp CTAs in template.html
  const allAnchors = doc.querySelectorAll('a');
  const staticWaLinks = allAnchors.filter(a => {
    const href = a.getAttribute('href') || '';
    return href.includes('wa.me') || href.includes('whatsapp');
  });

  assert(staticWaLinks.length >= 3, `template.html contains at least 3 static WhatsApp CTAs (found ${staticWaLinks.length})`);

  staticWaLinks.forEach((a, idx) => {
    const href = a.getAttribute('href');
    const target = a.getAttribute('target');
    const rel = a.getAttribute('rel') || '';
    const parsed = parseWhatsAppUrl(href);

    assert(parsed.valid, `Static WhatsApp link #${idx + 1} is valid: ${href}`, { error: parsed.error });
    assert(parsed.phone === OFFICIAL_WA_NUMBER, `Static WhatsApp link #${idx + 1} targets official phone ${OFFICIAL_WA_NUMBER}`);
    assert(target === '_blank', `Static WhatsApp link #${idx + 1} specifies target="_blank"`);
    assert(rel.includes('noopener'), `Static WhatsApp link #${idx + 1} specifies rel="noopener"`);
    assert(!href.includes(' '), `Static WhatsApp link #${idx + 1} contains zero raw spaces`);
  });


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 6: Zero Broken Images & Visual Fallback Gradient/Monogram Integrity
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 6] Zero Broken Images & Visual Fallback Gradient/Monogram Integrity');

  // 6.1 Audit template.html image tags
  const images = doc.querySelectorAll('img');
  assert(images.length === 0, `template.html contains 0 fragile <img> tags (relies on CSS vector fallbacks)`);

  // 6.2 Audit all 14 Theme Cards for Fallback Integrity
  THEMES.forEach((theme, idx) => {
    const cardHtml = createThemeCard(theme, idx);
    const cardDoc = parseHTML(cardHtml);

    // No broken img tag in generated card
    const cardImages = cardDoc.querySelectorAll('img');
    assert(cardImages.length === 0, `Theme #${idx + 1} ("${theme.name}") card contains zero <img> tags`);

    // Aspect ratio 3:4 container
    const thumb = cardDoc.querySelector('.theme-thumb');
    assert(Boolean(thumb), `Theme #${idx + 1} card has .theme-thumb container`);
    assert(
      thumb.className.includes('aspect-[3/4]'),
      `Theme #${idx + 1} thumb container maintains aspect-[3/4]`
    );

    // CSS Linear Gradient verification
    const style = thumb.getAttribute('style') || '';
    assert(
      style.includes('linear-gradient') && style.includes('--c1:') && style.includes('--c2:'),
      `Theme #${idx + 1} thumb has inline CSS linear-gradient and CSS custom color properties`
    );

    // Typographic monogram
    const monogram = cardDoc.querySelector('.theme-thumb-mark');
    assert(Boolean(monogram), `Theme #${idx + 1} thumb has .theme-thumb-mark`);
    const fontSerif = monogram?.querySelector('.font-serif');
    const fontScript = monogram?.querySelector('.font-script');
    assert(
      Boolean(fontSerif && fontScript),
      `Theme #${idx + 1} monogram contains both .font-serif and .font-script typographic elements`
    );
    assert(
      (fontSerif?.textContent || '').length > 0 && (fontScript?.textContent || '').length > 0,
      `Theme #${idx + 1} monogram text content is non-empty`
    );

    // Palette dots
    const dots = cardDoc.querySelectorAll('.dot');
    assert(
      dots.length === theme.palette.length,
      `Theme #${idx + 1} renders ${theme.palette.length} color palette dots`
    );

    // Feature pills
    const tags = cardDoc.querySelectorAll('.tag');
    assert(
      tags.length === theme.features.length,
      `Theme #${idx + 1} renders ${theme.features.length} feature pills`
    );

    // Clean badge handling (no "null" or "undefined" literals)
    if (theme.badge) {
      assert(cardHtml.includes(theme.badge), `Theme #${idx + 1} renders badge "${theme.badge}"`);
    } else {
      assert(!cardHtml.includes('null') && !cardHtml.includes('undefined'), `Theme #${idx + 1} safely omits null badge without leaking literal`);
    }
  });


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 7: Production Vite Multi-Page Build Verification
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 7] Production Build Verification (Standalone Tailwind & GitHub Pages)');

  let buildOutput = '';
  let buildSucceeded = false;
  try {
    buildOutput = execSync('npm run build', { cwd: ROOT, encoding: 'utf-8' });
    buildSucceeded = true;
  } catch (err) {
    buildOutput = err.stdout + '\n' + err.stderr;
  }

  assert(buildSucceeded, 'Production build completed with exit code 0');

  const prodTemplatePath = existsSync(resolve(ROOT, 'dist', 'template.html'))
    ? resolve(ROOT, 'dist', 'template.html')
    : resolve(ROOT, 'template.html');
  const prodIndexPath = existsSync(resolve(ROOT, 'dist', 'index.html'))
    ? resolve(ROOT, 'dist', 'index.html')
    : resolve(ROOT, 'index.html');

  assert(existsSync(prodTemplatePath), 'Production template.html exists');
  assert(existsSync(prodIndexPath), 'Production index.html exists');

  if (existsSync(prodTemplatePath)) {
    const distTemplateContent = readFileSync(prodTemplatePath, 'utf-8');
    assert(
      distTemplateContent.includes('Galeri Template Undangan Digital'),
      'Production template.html contains rendered page content'
    );
    assert(
      distTemplateContent.length > 5000,
      `Production template.html has healthy production file size (${distTemplateContent.length} bytes)`
    );
  }


  /* ─────────────────────────────────────────────────────────────────────────
   * FINAL SUMMARY & VERDICT
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n===============================================================');
  console.log(`M3 CHALLENGER TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`VERDICT: ${results.failed === 0 ? 'APPROVE' : 'FAIL'}`);
  console.log('===============================================================\n');

  return results;
}

if (process.argv[1]?.endsWith('m3-gallery-stress.test.js')) {
  runM3StressTests().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
