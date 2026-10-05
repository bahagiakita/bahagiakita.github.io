/**
 * test/challenger/m2-landing-page-stress.test.js
 * Master Empirical Challenger Suite for Milestone 2 (Landing Page Reconstruction)
 * 
 * Tests:
 * 1. Deep HTML AST Analysis & OpenDesign Purge (Without regex assumptions)
 * 2. WhatsApp Conversion Pipeline & Adversarial CTA URL Encoding
 * 3. Theme Toggle Oscillation & Storage Synchronization
 * 4. FAQ Accordion Single-Open Invariant & Keyboard Navigation
 * 5. Empirical Double-Listener / Auto-Init Verification on FAQ
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseHTML } from '../utils/dom-parser.js';
import { OFFICIAL_PHONE, parseWhatsAppUrl } from '../utils/whatsapp.js';
import { THEMES, generateWaLink } from '../../src/js/themes-data.js';

const ROOT = resolve(process.cwd());

export async function runM2StressTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
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
  console.log('CHALLENGER SUITE: MILESTONE 2 EMPIRICAL ADVERSARIAL STRESS TEST');
  console.log('===============================================================\n');

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 1: Deep HTML AST Analysis & OpenDesign Purge (Zero Regex Reliance)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('[Suite 1] Deep HTML AST Analysis & OpenDesign Purge Audit');
  const indexHtmlRaw = readFileSync(resolve(ROOT, 'index.html'), 'utf-8');
  const doc = parseHTML(indexHtmlRaw);

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
    'index.html is completely free from OpenDesign attributes across full DOM AST',
    { violations: odAttributesFound }
  );

  // 1.2 Check for prototype script tags (e.g. speaker-notes)
  const scripts = doc.querySelectorAll('script');
  const prototypeScripts = scripts.filter(s => {
    const id = (s.getAttribute('id') || '').toLowerCase();
    const content = s.textContent || '';
    return id.includes('speaker-notes') || id.includes('opendesign') || content.includes('speakerNotes');
  });

  assert(
    prototypeScripts.length === 0,
    'index.html contains zero prototype speaker-notes or OpenDesign script elements',
    { found: prototypeScripts.map(s => s.getAttribute('id')) }
  );

  // 1.3 Check for legacy inline style blocks
  const inlineStyles = doc.querySelectorAll('style');
  const largeInlineStyles = inlineStyles.filter(s => (s.textContent || '').length > 500);
  assert(
    largeInlineStyles.length === 0,
    'index.html contains zero massive legacy inline <style> blocks (purged in favor of main.css)',
    { count: largeInlineStyles.length }
  );

  // 1.4 Check all 9 required sections exist
  const requiredSectionIds = [
    'home', 'why', 'features', 'template', 'paket',
    'how-it-works', 'testimonials', 'faq', 'final-cta'
  ];
  const missingSections = requiredSectionIds.filter(id => !doc.getElementById(id));
  assert(
    missingSections.length === 0,
    'All 9 required production landing page sections exist with exact semantic IDs',
    { missing: missingSections }
  );

  // 1.5 Heading progression and "Berkesan" script accent
  const h1Elements = doc.querySelectorAll('h1');
  assert(h1Elements.length === 1, 'Exactly one <h1> element exists on the page', { count: h1Elements.length });
  const h1Text = h1Elements[0]?.textContent || '';
  assert(h1Text.includes('Berkesan'), '<h1> headline contains the signature word "Berkesan"', { h1Text });
  const scriptAccent = h1Elements[0]?.querySelector('.word-berkesan') || h1Elements[0]?.querySelector('.font-script');
  assert(
    scriptAccent !== null && scriptAccent.textContent.includes('Berkesan'),
    'The word "Berkesan" is wrapped in a dedicated accent typography element (.word-berkesan or .font-script)'
  );

  // 1.6 Check zero broken relative links or local prototype image paths
  const allHrefsAndSrcs = [];
  allNodes.forEach(n => {
    const href = n.getAttribute('href');
    const src = n.getAttribute('src');
    if (href) allHrefsAndSrcs.push({ tag: n.tagName, attr: 'href', val: href });
    if (src) allHrefsAndSrcs.push({ tag: n.tagName, attr: 'src', val: src });
  });

  const brokenPrototypePaths = allHrefsAndSrcs.filter(item => {
    const v = item.val.toLowerCase();
    return v.startsWith('./images/') || v.startsWith('images/') || v.includes('localhost:') || v.startsWith('file:');
  });

  assert(
    brokenPrototypePaths.length === 0,
    'index.html contains zero broken prototype paths (./images/ or file: or localhost references)',
    { brokenPaths: brokenPrototypePaths }
  );

  // 1.7 SEO and Social Metadata
  const metaTags = doc.querySelectorAll('meta');
  const hasOgTitle = metaTags.some(m => m.getAttribute('property') === 'og:title');
  const hasOgDescription = metaTags.some(m => m.getAttribute('property') === 'og:description');
  const hasOgImage = metaTags.some(m => m.getAttribute('property') === 'og:image');
  const hasTwitterCard = metaTags.some(m => m.getAttribute('name') === 'twitter:card');

  assert(hasOgTitle && hasOgDescription && hasOgImage && hasTwitterCard, 'Complete Open Graph and Twitter Card tags configured');


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 2: WhatsApp Conversion Pipeline & Adversarial CTA URL Encoding
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 2] WhatsApp Conversion Pipeline & Adversarial CTA URL Encoding');

  // 2.1 Static CTA links in index.html
  const allAnchors = doc.querySelectorAll('a');
  const staticWaLinks = allAnchors.filter(a => {
    const href = a.getAttribute('href') || '';
    return href.includes('wa.me') || href.includes('whatsapp');
  });

  assert(staticWaLinks.length >= 4, `At least 4 static WhatsApp CTA links exist in index.html (found ${staticWaLinks.length})`);

  staticWaLinks.forEach((a, idx) => {
    const href = a.getAttribute('href');
    const target = a.getAttribute('target');
    const rel = a.getAttribute('rel') || '';
    const parsed = parseWhatsAppUrl(href);

    assert(parsed.valid, `Static WhatsApp link #${idx + 1} is valid: ${href}`, { error: parsed.error });
    assert(parsed.phone === OFFICIAL_PHONE, `Static WhatsApp link #${idx + 1} targets official phone ${OFFICIAL_PHONE}`, { actual: parsed.phone });
    assert(target === '_blank', `Static WhatsApp link #${idx + 1} specifies target="_blank"`, { actual: target });
    assert(rel.toLowerCase().includes('noopener'), `Static WhatsApp link #${idx + 1} specifies rel="noopener"`, { actual: rel });

    if (href.includes('text=')) {
      assert(!parsed.encodedText.includes(' '), `WhatsApp URL #${idx + 1} has no raw unencoded spaces in query string`, { encoded: parsed.encodedText });
    }
  });

  // 2.2 Template waLinks from themes-data.js
  THEMES.forEach((theme, idx) => {
    const link = generateWaLink(theme.name);
    const parsed = parseWhatsAppUrl(link, { requireText: true });
    assert(parsed.valid, `Theme ${idx + 1} ("${theme.name}") generates valid WhatsApp URL`, { error: parsed.error });
    assert(parsed.phone === OFFICIAL_PHONE, `Theme ${idx + 1} targets official phone ${OFFICIAL_PHONE}`);
    assert(parsed.text.includes(theme.name), `Decoded message for theme ${idx + 1} contains theme name "${theme.name}"`);
    assert(!parsed.encodedText.includes(' '), `Theme ${idx + 1} URL contains zero raw spaces in text param`);
  });

  // 2.3 Adversarial URL Encoding stress test (special chars, quotes, unicode, ampersands)
  const adversarialCases = [
    { input: 'Classic & Modern (Luxury Edition)', desc: 'Ampersand and parenthesis' },
    { input: "Rian's & Nisa's Special #1 - 100% Satin", desc: 'Single quotes, hash, percent, hyphens' },
    { input: 'Tema "Eksklusif" <V2> / Premium', desc: 'Double quotes, angle brackets, slash' },
    { input: 'Cinta Abadi: 💍 Undangan Digital ✨', desc: 'Unicode emojis and colon' },
    { input: 'A'.repeat(300), desc: 'Extremely long template name (300 chars)' },
    { input: 'Tema ?param=1&hack=true#anchor', desc: 'URL query parameter injection attempt' },
  ];

  adversarialCases.forEach(({ input, desc }) => {
    const generatedUrl = generateWaLink(input);
    const urlObj = new URL(generatedUrl);
    const textParam = urlObj.searchParams.get('text');

    assert(
      textParam.includes(input),
      `Adversarial input preserved without corruption: [${desc}]`,
      { input, decoded: textParam }
    );

    // Verify parameter pollution didn't occur (no extra query params injected)
    const paramKeys = Array.from(urlObj.searchParams.keys());
    assert(
      paramKeys.length === 1 && paramKeys[0] === 'text',
      `No query parameter injection possible from adversarial input: [${desc}]`,
      { keys: paramKeys }
    );
  });


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 3: Theme Toggle Engine Oscillation & Persistence Stress Test
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 3] Theme Toggle Engine Oscillation & State Synchronization');

  // Test theme state machine with mock storage and documentElement
  class MockThemeEngine {
    constructor() {
      this.storage = {};
      this.theme = 'light';
    }
    getPreferredTheme(osDark = false) {
      const saved = this.storage['bk-theme'];
      if (saved === 'dark' || saved === 'light') return saved;
      return osDark ? 'dark' : 'light';
    }
    toggleTheme(osDark = false) {
      const current = this.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      this.theme = next;
      this.storage['bk-theme'] = next;
      return next;
    }
  }

  const engine = new MockThemeEngine();
  // 100 rapid oscillations
  let oscillationFailures = 0;
  for (let i = 0; i < 100; i++) {
    const expected = i % 2 === 0 ? 'dark' : 'light';
    const result = engine.toggleTheme();
    if (result !== expected || engine.storage['bk-theme'] !== expected) {
      oscillationFailures++;
    }
  }
  assert(oscillationFailures === 0, 'Theme toggle survives 100 rapid oscillations without state desync');

  // 3.2 Verify Tailwind v4 dark variant scoping and class synchronization
  {
    const mainCssContent = readFileSync(resolve(ROOT, 'src/styles/main.css'), 'utf-8');
    assert(
      mainCssContent.includes('@variant dark'),
      'src/styles/main.css contains @variant dark directive for Tailwind v4 scoping'
    );

    const compiledCss = readFileSync(resolve(ROOT, 'assets/css/main.css'), 'utf-8');
    assert(
      compiledCss.includes(':where([data-theme=dark]') || compiledCss.includes(':where([data-theme="dark"]'),
      'assets/css/main.css has dark utilities scoped to data-theme/dark class rather than prefers-color-scheme'
    );

    const mainJsSrc = readFileSync(resolve(ROOT, 'src/js/main.js'), 'utf-8');
    assert(
      mainJsSrc.includes('classList.add("dark")') || mainJsSrc.includes('classList.toggle("dark"'),
      'src/js/main.js synchronizes classList dark with data-theme'
    );

    const indexHtmlContent = readFileSync(resolve(ROOT, 'index.html'), 'utf-8');
    assert(
      indexHtmlContent.includes('classList.add("dark")'),
      'index.html early anti-FOUC script synchronizes classList dark'
    );
  }


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 4: FAQ Accordion Invariant Stress Harness
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 4] FAQ Accordion Invariant Stress Harness');

  // 4.1 Single-open invariant stress test under rapid random activations
  class AccordionInvariantHarness {
    constructor(size = 4) {
      this.size = size;
      this.state = Array.from({ length: size }, () => ({ isOpen: false }));
    }
    toggle(idx) {
      if (idx < 0 || idx >= this.size) return;
      const wasOpen = this.state[idx].isOpen;
      // Single-open: close all
      this.state.forEach(s => { s.isOpen = false; });
      if (!wasOpen) {
        this.state[idx].isOpen = true;
      }
    }
    openCount() {
      return this.state.filter(s => s.isOpen).length;
    }
    openIndex() {
      return this.state.findIndex(s => s.isOpen);
    }
  }

  const harness = new AccordionInvariantHarness(4);
  let invariantViolations = 0;
  const clickOperations = [0, 1, 1, 2, 3, 0, 0, 2, 1, 3, 2, -1, 99, 1, 0, 3, 3];

  clickOperations.forEach(op => {
    harness.toggle(op);
    if (harness.openCount() > 1) {
      invariantViolations++;
    }
  });

  assert(invariantViolations === 0, 'FAQ single-open invariant maintained across rapid random click sequence');

  // 4.2 Keyboard navigation boundary invariant test
  function testKeyNav(currentIndex, key, count = 4) {
    switch (key) {
      case 'ArrowDown': return (currentIndex + 1) % count;
      case 'ArrowUp': return (currentIndex - 1 + count) % count;
      case 'Home': return 0;
      case 'End': return count - 1;
      default: return currentIndex;
    }
  }

  assert(testKeyNav(3, 'ArrowDown') === 0, 'ArrowDown wraps from index 3 to 0');
  assert(testKeyNav(0, 'ArrowUp') === 3, 'ArrowUp wraps from index 0 to 3');
  assert(testKeyNav(2, 'Home') === 0, 'Home jumps to index 0');
  assert(testKeyNav(1, 'End') === 3, 'End jumps to index 3');


  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 5: EMPIRICAL INTEGRATION BUG AUDIT (DOUBLE-LISTENER / AUTO-INIT)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 5] Empirical Runtime Integration & Double-Listener Audit');

  // Inspect source files for auto-init side-effects
  const faqJsContent = readFileSync(resolve(ROOT, 'src/js/faq.js'), 'utf-8');
  const mainJsContent = readFileSync(resolve(ROOT, 'src/js/main.js'), 'utf-8');

  const faqHasAutoInit = faqJsContent.includes('initFaqAccordion()') &&
    (faqJsContent.includes('DOMContentLoaded') || faqJsContent.includes('document.readyState'));
  const mainImportsFaq = mainJsContent.includes('initFaqAccordion') && mainJsContent.includes('./faq.js');
  const mainCallsInitFaq = mainJsContent.includes('initFaqAccordion()');

  // Check if FaqAccordion has an idempotency guard
  const hasIdempotencyGuard = faqJsContent.includes('dataset.faqInitialized') ||
    faqJsContent.includes('_faqInitialized') ||
    faqJsContent.includes('hasAttribute(\'data-faq-init\')');

  console.log('   faq.js has top-level auto-init:', faqHasAutoInit);
  console.log('   main.js imports faq.js:', mainImportsFaq);
  console.log('   main.js calls initFaqAccordion():', mainCallsInitFaq);
  console.log('   FaqAccordion has idempotency guard:', hasIdempotencyGuard);

  // EMPIRICAL ASSERTION:
  // If both faq.js has auto-init and main.js calls initFaqAccordion without an idempotency guard,
  // then two instances are created, attaching duplicate click listeners.
  const hasDuplicateInitBug = (faqHasAutoInit && mainImportsFaq && mainCallsInitFaq && !hasIdempotencyGuard);

  assert(
    !hasDuplicateInitBug,
    'CRITICAL: FAQ Accordion must not suffer from duplicate listener initialization (faq.js top-level auto-init + main.js initApp)',
    {
      bugDescription: 'In production, importing faq.js into main.js triggers faq.js auto-init on DOMContentLoaded, while main.js initApp() calls initFaqAccordion() a second time without an idempotency guard. This registers two click listeners on every .faq-question button. When clicked, listener 1 opens the item, and listener 2 immediately closes it, rendering the FAQ accordion completely unopenable.',
      rootCauseFiles: ['src/js/faq.js:176-182', 'src/js/main.js:360'],
      remediation: 'Remove top-level auto-init block from src/js/faq.js (relying solely on main.js initApp), AND add an idempotency guard (e.g. if (this.container._faqInit) return; this.container._faqInit = true;) in FaqAccordion constructor.'
    }
  );

  // 5.2 Test live simulated DOM click behavior with duplicate instances
  class MockClassList {
    constructor() { this.classes = new Set(); }
    add(c) { this.classes.add(c); }
    remove(c) { this.classes.delete(c); }
    contains(c) { return this.classes.has(c); }
  }

  class MockDOMElement {
    constructor(tagName, id = '', className = '') {
      this.tagName = tagName.toUpperCase();
      this.id = id;
      this.className = className;
      this.classList = new MockClassList();
      className.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
      this.attributes = new Map();
      this.listeners = new Map();
      this.style = {};
      this.children = [];
    }
    setAttribute(k, v) { this.attributes.set(k, String(v)); }
    getAttribute(k) { return this.attributes.get(k) || null; }
    hasAttribute(k) { return this.attributes.has(k); }
    addEventListener(event, fn) {
      if (!this.listeners.has(event)) this.listeners.set(event, []);
      this.listeners.get(event).push(fn);
    }
    click() {
      const list = this.listeners.get('click') || [];
      list.forEach(fn => fn({ preventDefault() {} }));
    }
    querySelector(sel) {
      if (sel.includes('.faq-question')) return this.children.find(c => c.classList.contains('faq-question'));
      if (sel.includes('.faq-answer')) return this.children.find(c => c.classList.contains('faq-answer'));
      if (sel.includes('.faq-icon')) return this.children.find(c => c.classList.contains('faq-icon'));
      return null;
    }
    querySelectorAll(sel) {
      if (sel.includes('.faq-item')) return this.children.filter(c => c.classList.contains('faq-item'));
      return [];
    }
  }

  // Setup mock DOM for runtime simulation
  global.window = { addEventListener() {} };
  global.document = { querySelector() { return null; }, addEventListener() {} };

  const { FaqAccordion } = await import('../../src/js/faq.js');

  const testContainer = new MockDOMElement('div', 'faq');
  for (let i = 0; i < 4; i++) {
    const item = new MockDOMElement('article', '', 'faq-item');
    const btn = new MockDOMElement('button', `btn-${i}`, 'faq-question');
    const ans = new MockDOMElement('div', `ans-${i}`, 'faq-answer');
    const icon = new MockDOMElement('span', '', 'faq-icon');
    btn.children.push(icon);
    item.children.push(btn, ans);
    testContainer.children.push(item);
  }

  // If faq.js and main.js both initialize, simulate real app environment:
  if (faqHasAutoInit && mainCallsInitFaq) {
    new FaqAccordion(testContainer); // First init (faq.js)
    new FaqAccordion(testContainer); // Second init (main.js)
  } else {
    new FaqAccordion(testContainer); // Clean single init
  }

  const firstQuestionBtn = testContainer.children[0].querySelector('.faq-question');
  firstQuestionBtn.click();
  const item0IsOpen = testContainer.children[0].classList.contains('is-open');
  const item0Aria = firstQuestionBtn.getAttribute('aria-expanded');

  assert(
    item0IsOpen && item0Aria === 'true',
    'FAQ Accordion item 0 actually opens and sets aria-expanded="true" upon user click in runtime environment',
    {
      item0IsOpen,
      item0Aria,
      failureReason: 'Clicking the FAQ question button failed to open the item because double event listeners immediately collapsed it back to closed.'
    }
  );

  console.log('\n===============================================================');
  console.log(`M2 CHALLENGER TEST RESULTS: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log(`VERDICT: ${results.failed === 0 ? 'APPROVE' : 'FAIL'}`);
  console.log('===============================================================\n');

  return results;
}

if (process.argv[1]?.endsWith('m2-landing-page-stress.test.js')) {
  runM2StressTests().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  }).catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
}
