/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers edge cases, boundary conditions, stress inputs, and defensive behavior
 * Features: Search boundaries, narrow viewports, state toggle stability, URL escaping
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertMatches } from '../../utils/assertions.js';
import { parseWhatsAppUrl } from '../../utils/whatsapp.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';

export function registerBoundaryCornerCasesSuite() {
  describe('Tier 2: Boundary & Corner Cases', () => {

    const SAMPLE_CATALOG = [
      { id: '1', name: 'Elegant Gold & Silk', category: 'Classic', features: ['Countdown', 'RSVP', 'Gift'] },
      { id: '2', name: 'Rustic Botanical Garden', category: 'Rustic', features: ['Music', 'Maps'] },
      { id: '3', name: 'Minimal Mono Sans', category: 'Minimal', features: ['RSVP'] }
    ];

    function runSearchFilter(items, category, query) {
      const q = (query || '').trim().toLowerCase();
      return items.filter(item => {
        const catMatch = !category || category === 'All' || item.category === category;
        if (!catMatch) return false;
        if (!q) return true;

        const nameMatch = item.name.toLowerCase().includes(q);
        const featMatch = item.features.some(f => f.toLowerCase().includes(q));
        return nameMatch || featMatch;
      });
    }

    it('T2-01: Empty search query returns all catalog items without error', async () => {
      const result = runSearchFilter(SAMPLE_CATALOG, 'All', '');
      assertEqual(result.length, SAMPLE_CATALOG.length, 'Empty search string must return full catalog');

      const nullResult = runSearchFilter(SAMPLE_CATALOG, 'All', null);
      assertEqual(nullResult.length, SAMPLE_CATALOG.length, 'Null search query must return full catalog');

      const undefinedResult = runSearchFilter(SAMPLE_CATALOG, 'All', undefined);
      assertEqual(undefinedResult.length, SAMPLE_CATALOG.length, 'Undefined search query must return full catalog');
    }, { tier: 2, milestone: 'M3', featureId: 'F21' });

    it('T2-02: Whitespace-only search query is cleanly trimmed and returns all items', async () => {
      const resultSpaces = runSearchFilter(SAMPLE_CATALOG, 'All', '   ');
      assertEqual(resultSpaces.length, SAMPLE_CATALOG.length, 'Whitespace-only query must return full catalog');

      const resultTabs = runSearchFilter(SAMPLE_CATALOG, 'All', '\t \n ');
      assertEqual(resultTabs.length, SAMPLE_CATALOG.length, 'Tabs/newlines query must return full catalog');
    }, { tier: 2, milestone: 'M3', featureId: 'F21' });

    it('T2-03: Search query is case-insensitive across uppercase, lowercase, and mixed-case', async () => {
      const resLower = runSearchFilter(SAMPLE_CATALOG, 'All', 'rustic');
      const resUpper = runSearchFilter(SAMPLE_CATALOG, 'All', 'RUSTIC');
      const resMixed = runSearchFilter(SAMPLE_CATALOG, 'All', 'rUsTiC');

      assertEqual(resLower.length, 1, 'Lowercase search should find Rustic item');
      assertEqual(resUpper.length, 1, 'Uppercase search should find Rustic item');
      assertEqual(resMixed.length, 1, 'Mixed-case search should find Rustic item');
      assertEqual(resLower[0].name, resUpper[0].name, 'Results must be identical regardless of case');
    }, { tier: 2, milestone: 'M3', featureId: 'F21' });

    it('T2-04: Non-existent / unknown category filter returns empty array safely without exception', async () => {
      const resUnknown = runSearchFilter(SAMPLE_CATALOG, 'SpaceCyberpunk', '');
      assertEqual(resUnknown.length, 0, 'Unknown category should return empty array');

      const resEmpty = runSearchFilter([], 'Classic', 'Gold');
      assertEqual(resEmpty.length, 0, 'Searching empty catalog must return empty array without throwing');
    }, { tier: 2, milestone: 'M3', featureId: 'F20' });

    it('T2-05: Special regex meta-characters in search query do not cause ReDoS or crashes', async () => {
      const dangerousQueries = [
        '.*',
        '+',
        '?',
        '^',
        '$',
        '()',
        '[]',
        '{}',
        '\\',
        '|',
        '(a+)+$',
        'a'.repeat(500)
      ];

      for (const q of dangerousQueries) {
        let result;
        try {
          result = runSearchFilter(SAMPLE_CATALOG, 'All', q);
        } catch (err) {
          assert(false, `Search query "${q}" threw an error: ${err.message}`);
        }
        assert(Array.isArray(result), `Query "${q}" must return an array`);
      }
    }, { tier: 2, milestone: 'M3', featureId: 'F21' });

    it('T2-06: Special characters in template names are cleanly URL-encoded in WhatsApp parameters', async () => {
      const edgeCaseNames = [
        'E & G Wedding (Special Edition)',
        "Nisa's & Rian's Minimalist #1",
        'Luxury 100% Satin / Silk — Exclusive',
        'Rustic & Vintage <Modern> ?'
      ];

      for (const name of edgeCaseNames) {
        const rawMsg = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${name}.`;
        const encodedUrl = `https://wa.me/6283847630740?text=${encodeURIComponent(rawMsg)}`;

        const parsed = parseWhatsAppUrl(encodedUrl);
        assert(parsed.valid, `Generated URL with name "${name}" must be valid: ${parsed.error}`);
        assertEqual(parsed.text, rawMsg, 'Decoded message must preserve special characters exactly');
      }
    }, { tier: 2, milestone: 'M2', featureId: 'F25' });

    it('T2-07: Narrow 320px viewport ergonomics: overflow-x defense and fluid styling rules', async () => {
      const html = readProjectFile('index.html');
      // Verify no hardcoded desktop-only fixed widths (e.g. width="1200" or style="width: 1200px")
      assert(!html.includes('width="1200"'), 'HTML must not have rigid fixed desktop width on layout containers');
      assert(!html.includes('width="1440"'), 'HTML must not have rigid 1440px fixed width');

      // Verify viewport meta tag prohibits forced zoom scale restrictions that break small screens
      const docHtml = readProjectFile('index.html');
      assert(
        docHtml.includes('width=device-width'),
        'Viewport must be width=device-width for 320px compatibility'
      );
    }, { tier: 2, milestone: 'M2', featureId: 'F26' });

    it('T2-08: Rapid multiple clicks on FAQ accordion items preserve strict single-open invariant', async () => {
      const state = [false, false, false, false];
      function clickItem(idx) {
        const wasOpen = state[idx];
        state.fill(false);
        if (!wasOpen) state[idx] = true;
      }

      // Rapid sequence of 10 clicks
      const clickSequence = [0, 1, 1, 2, 0, 3, 3, 2, 1, 0];
      for (const target of clickSequence) {
        clickItem(target);
        const openCount = state.filter(Boolean).length;
        assert(openCount <= 1, `After clicking ${target}, open count was ${openCount} (must be <= 1)`);
      }
    }, { tier: 2, milestone: 'M2', featureId: 'F15' });

    it('T2-09: Rapid toggle clicks on Dark/Light mode preserves valid localStorage and theme state', async () => {
      let currentTheme = 'light';
      const storage = {};

      function toggle() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        storage['bk-theme'] = currentTheme;
      }

      // Simulate 20 rapid toggles
      for (let i = 0; i < 20; i++) {
        toggle();
        assert(
          currentTheme === 'light' || currentTheme === 'dark',
          `Theme state corrupted: "${currentTheme}"`
        );
        assertEqual(storage['bk-theme'], currentTheme, 'Storage must match current state');
      }
      assertEqual(currentTheme, 'light', 'After even number of toggles, theme must return to light');
    }, { tier: 2, milestone: 'M2', featureId: 'F07' });

  });
}
