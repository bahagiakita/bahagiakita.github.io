/**
 * test/challenger/theme-validation.test.js
 * Empirical validation & stress tests for src/js/themes-data.js
 */

import { themesData, THEMES, CATEGORIES, OFFICIAL_WA_NUMBER, generateWaLink } from '../../src/js/themes-data.js';

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_CATEGORIES = new Set(['Classic', 'Modern', 'Minimal', 'Floral', 'Rustic', 'Luxury']);
const EXPECTED_WA_NUMBER = '6283847630740';

export function runThemeValidation() {
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
      console.error(`❌ FAIL: ${message}`, details);
    }
  }

  console.log('--- Starting Theme Data Validation & Stress Tests ---');

  // 1. Export checks
  assert(Array.isArray(themesData), 'themesData is exported as an array');
  assert(Array.isArray(THEMES), 'THEMES alias is exported as an array');
  assert(themesData === THEMES, 'THEMES is identical reference to themesData');
  assert(Array.isArray(CATEGORIES), 'CATEGORIES is exported as an array');
  assert(typeof generateWaLink === 'function', 'generateWaLink is exported as a function');
  assert(OFFICIAL_WA_NUMBER === EXPECTED_WA_NUMBER, `OFFICIAL_WA_NUMBER is canonical "${EXPECTED_WA_NUMBER}"`, { actual: OFFICIAL_WA_NUMBER });

  // 2. Count check
  assert(themesData.length === 14, `themesData has exactly 14 items (found: ${themesData.length})`, { count: themesData.length });

  // 3. Uniqueness tracking
  const seenIds = new Set();
  const seenSlugs = new Set();
  const seenNames = new Set();

  themesData.forEach((theme, index) => {
    const prefix = `[Item ${index + 1}: ${theme.name || theme.id}]`;

    // ID check
    assert(typeof theme.id === 'string' && theme.id.length > 0, `${prefix} has valid id string`, { id: theme.id });
    assert(!seenIds.has(theme.id), `${prefix} id is unique: "${theme.id}"`, { id: theme.id });
    seenIds.add(theme.id);

    // Name check
    assert(typeof theme.name === 'string' && theme.name.trim().length > 0, `${prefix} has non-empty name`, { name: theme.name });
    assert(!seenNames.has(theme.name), `${prefix} name is unique: "${theme.name}"`, { name: theme.name });
    seenNames.add(theme.name);

    // Slug check
    assert(typeof theme.slug === 'string' && SLUG_REGEX.test(theme.slug), `${prefix} has valid kebab-case slug "${theme.slug}"`, { slug: theme.slug });
    assert(!seenSlugs.has(theme.slug), `${prefix} slug is unique: "${theme.slug}"`, { slug: theme.slug });
    seenSlugs.add(theme.slug);

    // Category check
    assert(ALLOWED_CATEGORIES.has(theme.category), `${prefix} has valid category "${theme.category}"`, { category: theme.category });

    // isFeatured check
    assert(typeof theme.isFeatured === 'boolean', `${prefix} isFeatured is a boolean`, { isFeatured: theme.isFeatured });

    // Palette check (length 3, valid hex)
    assert(Array.isArray(theme.palette) && theme.palette.length === 3, `${prefix} palette has exactly 3 colors`, { palette: theme.palette });
    if (Array.isArray(theme.palette)) {
      theme.palette.forEach((color, colorIdx) => {
        assert(HEX_COLOR_REGEX.test(color), `${prefix} palette[${colorIdx}] "${color}" is valid HEX`, { color });
      });
    }

    // Gradient stops check
    assert(typeof theme.gradient === 'object' && theme.gradient !== null, `${prefix} gradient is an object`, { gradient: theme.gradient });
    if (theme.gradient) {
      assert(HEX_COLOR_REGEX.test(theme.gradient.from), `${prefix} gradient.from "${theme.gradient.from}" is valid HEX`, { from: theme.gradient.from });
      assert(HEX_COLOR_REGEX.test(theme.gradient.to), `${prefix} gradient.to "${theme.gradient.to}" is valid HEX`, { to: theme.gradient.to });
      if (theme.gradient.deg !== undefined) {
        assert(typeof theme.gradient.deg === 'number' && !isNaN(theme.gradient.deg), `${prefix} gradient.deg is a valid number`, { deg: theme.gradient.deg });
      }
    }

    // Monogram check
    assert(typeof theme.monogram === 'object' && theme.monogram !== null, `${prefix} monogram is an object`, { monogram: theme.monogram });
    if (theme.monogram) {
      assert(typeof theme.monogram.line1 === 'string' && theme.monogram.line1.trim().length > 0, `${prefix} monogram.line1 is non-empty`, { line1: theme.monogram.line1 });
      assert(typeof theme.monogram.line2 === 'string' && theme.monogram.line2.trim().length > 0, `${prefix} monogram.line2 is non-empty`, { line2: theme.monogram.line2 });
    }

    // Features check
    assert(Array.isArray(theme.features) && theme.features.length >= 1, `${prefix} features array has at least 1 feature`, { features: theme.features });
    if (Array.isArray(theme.features)) {
      theme.features.forEach((feat, featIdx) => {
        assert(typeof feat === 'string' && feat.trim().length > 0, `${prefix} features[${featIdx}] is a non-empty string`, { feature: feat });
      });
    }

    // Description check
    assert(typeof theme.description === 'string' && theme.description.trim().length > 0, `${prefix} description is a non-empty string`);

    // WhatsApp Message check
    assert(typeof theme.waMessage === 'string' && theme.waMessage.includes(theme.name), `${prefix} waMessage contains theme name`, { waMessage: theme.waMessage });

    // WhatsApp Link Generation verification
    const link = generateWaLink(theme.name);
    assert(link.startsWith(`https://wa.me/${EXPECTED_WA_NUMBER}?text=`), `${prefix} generateWaLink starts with correct base and number`, { link });
    const urlObj = new URL(link);
    assert(urlObj.hostname === 'wa.me', `${prefix} URL hostname is wa.me`);
    assert(urlObj.pathname === `/${EXPECTED_WA_NUMBER}`, `${prefix} URL pathname is /${EXPECTED_WA_NUMBER}`);
    const decodedText = urlObj.searchParams.get('text');
    assert(decodedText.includes(theme.name), `${prefix} URL text parameter decodes to contain "${theme.name}"`, { decodedText });
  });

  // 4. Category list completeness
  const categoryIds = CATEGORIES.map(c => c.id);
  assert(categoryIds.includes('all'), 'CATEGORIES includes "all"');
  ALLOWED_CATEGORIES.forEach(cat => {
    assert(categoryIds.includes(cat), `CATEGORIES includes "${cat}"`);
  });

  // 5. Stress Testing generateWaLink with edge cases & adversarial inputs
  console.log('--- Stress Testing generateWaLink Edge Cases ---');
  const adversarialCases = [
    { name: '', label: 'empty string' },
    { name: 'Romeo & Juliet <3 "Special" / 100% #1 ? test=true', label: 'special characters and URL reserved chars' },
    { name: 'Tema Pernikahan Adat Minang: "Suntiang Emas" & Bunga Melati', label: 'Indonesian quotes and punctuation' },
    { name: '✨ 💍 💐 Wedding Emoji Extravaganza 🎉', label: 'emojis' },
    { name: 'Multi\nLine\r\nText\tWith\0Controls', label: 'newlines and control characters' },
    { name: '<script>alert("XSS")</script>', label: 'script tag / XSS payload' }
  ];

  adversarialCases.forEach(({ name, label }) => {
    try {
      const generatedUrl = generateWaLink(name);
      const parsedUrl = new URL(generatedUrl);
      assert(parsedUrl.hostname === 'wa.me', `[Edge: ${label}] Hostname is wa.me`);
      assert(parsedUrl.pathname === `/${EXPECTED_WA_NUMBER}`, `[Edge: ${label}] Target number is ${EXPECTED_WA_NUMBER}`);
      const decodedParam = parsedUrl.searchParams.get('text');
      assert(decodedParam.includes(name), `[Edge: ${label}] Decoded parameter accurately recovers input string without corruption`);
    } catch (err) {
      assert(false, `[Edge: ${label}] Threw unexpected error: ${err.message}`, { error: err });
    }
  });

  console.log(`--- Theme Data Validation Complete: ${results.passed} PASSED, ${results.failed} FAILED ---`);
  return results;
}

// Run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const res = runThemeValidation();
  process.exit(res.failed > 0 ? 1 : 0);
}
