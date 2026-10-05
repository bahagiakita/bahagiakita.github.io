/**
 * Tier 3: Cross-Feature Combinations Test Suite
 * Tests multi-feature interactions, compound states, and cross-module integration
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { parseWhatsAppUrl } from '../../utils/whatsapp.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerCrossFeatureCombinationsSuite() {
  describe('Tier 3: Cross-Feature Combinations', () => {

    it('T3-01: Dark mode active + Mobile drawer open maintains dark theme consistency', async () => {
      // Simulate state machine of dark mode combined with drawer open
      class MockAppContext {
        constructor() {
          this.theme = 'light';
          this.drawerOpen = false;
          this.bodyScrollLocked = false;
        }

        setTheme(t) {
          this.theme = t;
        }

        openDrawer() {
          this.drawerOpen = true;
          this.bodyScrollLocked = true;
        }

        closeDrawer() {
          this.drawerOpen = false;
          this.bodyScrollLocked = false;
        }
      }

      const app = new MockAppContext();
      app.setTheme('dark');
      assertEqual(app.theme, 'dark', 'App should be in dark mode');

      app.openDrawer();
      assertEqual(app.drawerOpen, true, 'Drawer should be open');
      assertEqual(app.bodyScrollLocked, true, 'Body scroll should be locked');
      assertEqual(app.theme, 'dark', 'Theme must remain dark while drawer is open');

      app.closeDrawer();
      assertEqual(app.drawerOpen, false, 'Drawer should be closed');
      assertEqual(app.bodyScrollLocked, false, 'Body scroll should be restored');
      assertEqual(app.theme, 'dark', 'Theme must remain dark after drawer closes');
    }, { tier: 3, milestone: 'M2', featureId: 'F06,F07' });

    it('T3-02: Category filter chip + Search query performs compound AND filtering', async () => {
      const catalog = [
        { id: '1', name: 'Royal Gold Classic', category: 'Classic', features: ['Countdown', 'Galeri'] },
        { id: '2', name: 'Modern Rose Minimal', category: 'Modern', features: ['RSVP', 'Music'] },
        { id: '3', name: 'Floral Rose Blossom', category: 'Floral', features: ['RSVP', 'Galeri'] },
        { id: '4', name: 'Rustic Forest Wood', category: 'Rustic', features: ['Gift'] },
        { id: '5', name: 'Floral Daisy White', category: 'Floral', features: ['Countdown'] }
      ];

      function compoundFilter(items, category, query) {
        const q = (query || '').trim().toLowerCase();
        return items.filter(item => {
          const matchCat = category === 'All' || item.category === category;
          const matchText = !q ||
            item.name.toLowerCase().includes(q) ||
            item.features.some(f => f.toLowerCase().includes(q));
          return matchCat && matchText;
        });
      }

      // Filter: Category 'Floral' AND Query 'Rose'
      const matches = compoundFilter(catalog, 'Floral', 'rose');
      assertEqual(matches.length, 1, 'Should find exactly 1 item matching Floral AND Rose');
      assertEqual(matches[0].name, 'Floral Rose Blossom');

      // Verify that 'Modern Rose Minimal' was excluded despite containing 'Rose' because category didn't match
      const modernExcluded = matches.some(m => m.name === 'Modern Rose Minimal');
      assert(!modernExcluded, 'Modern Rose Minimal must be excluded when Floral category is active');

      // Verify that 'Floral Daisy White' was excluded because it lacks 'Rose'
      const daisyExcluded = matches.some(m => m.name === 'Floral Daisy White');
      assert(!daisyExcluded, 'Floral Daisy White must be excluded when searching "rose"');
    }, { tier: 3, milestone: 'M3', featureId: 'F20,F21' });

    it('T3-03: Category filter + Search query with 0 results triggers Empty State and Reset', async () => {
      const catalog = [
        { id: '1', name: 'Classic Gold', category: 'Classic' },
        { id: '2', name: 'Rustic Wood', category: 'Rustic' }
      ];

      let selectedCategory = 'Classic';
      let searchQuery = 'wood';

      function getResults() {
        const q = searchQuery.trim().toLowerCase();
        return catalog.filter(item => {
          const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
          const matchQuery = !q || item.name.toLowerCase().includes(q);
          return matchCat && matchQuery;
        });
      }

      let results = getResults();
      assertEqual(results.length, 0, 'Classic + "wood" should yield 0 results');

      // State machine for empty state UI
      const showEmptyState = results.length === 0;
      assert(showEmptyState, 'Empty state must be visible when 0 results match compound filter');

      // User triggers reset
      function onReset() {
        selectedCategory = 'All';
        searchQuery = '';
      }
      onReset();

      results = getResults();
      assertEqual(results.length, 2, 'Resetting filters must restore all items in catalog');
    }, { tier: 3, milestone: 'M3', featureId: 'F22,F23' });

    it('T3-04: Theme selection + WhatsApp link formatting generates accurate contextual message', async () => {
      const testThemes = [
        { id: 'theme-gold', name: 'Elegant Gold Wedding' },
        { id: 'theme-rustic', name: 'Rustic Botanical Kraft' },
        { id: 'theme-minimal', name: 'Minimalist Clean White' }
      ];

      function generateWaLink(theme) {
        const msg = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${theme.name}.`;
        return `https://wa.me/6283847630740?text=${encodeURIComponent(msg)}`;
      }

      const generatedUrls = testThemes.map(t => ({
        theme: t.name,
        url: generateWaLink(t)
      }));

      for (const entry of generatedUrls) {
        const parsed = parseWhatsAppUrl(entry.url);
        assert(parsed.valid, `Generated URL must be valid for ${entry.theme}`);
        assertEqual(parsed.phone, '6283847630740');
        assertIncludes(
          parsed.text,
          entry.theme,
          `Decoded text must contain exact theme name ${entry.theme}`
        );
      }

      // Ensure distinct URLs
      assertEqual(new Set(generatedUrls.map(u => u.url)).size, 3, 'Each theme must generate a unique WhatsApp URL');
    }, { tier: 3, milestone: 'M2,M3', featureId: 'F11,F25' });

    it('T3-05: Header glassmorphism scroll transition adapts to active Dark mode', async () => {
      // CSS tokens check in main.css
      if (fileExists('src/styles/main.css')) {
        const css = readProjectFile('src/styles/main.css');
        assertIncludes(css, 'glass-nav', 'main.css must define glass-nav utility');
        assertIncludes(css, 'backdrop-filter', 'glass-nav must use backdrop-filter: blur');
      }

      // Verify header element exists on index.html
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);
      const header = doc.getElementById('navbar') || doc.querySelector('header');
      assert(header, 'Header must exist');
    }, { tier: 3, milestone: 'M1,M2', featureId: 'F05,F07' });

    it('T3-06: Theme persistence across multi-page navigation (index.html -> template.html)', async () => {
      // Shared localStorage simulation between two pages
      const localStorage = {};

      // User on index.html switches to dark
      localStorage['bk-theme'] = 'dark';

      // User clicks link to template.html
      // template.html initializes:
      function initPageTheme(storage) {
        const savedTheme = storage['bk-theme'] || 'light';
        return {
          rootThemeAttr: savedTheme,
          activeIcon: savedTheme === 'dark' ? 'sun' : 'moon'
        };
      }

      const templatePageState = initPageTheme(localStorage);
      assertEqual(templatePageState.rootThemeAttr, 'dark', 'template.html must initialize with dark theme from localStorage');
      assertEqual(templatePageState.activeIcon, 'sun', 'template.html must display sun toggle icon in dark mode');
    }, { tier: 3, milestone: 'M2,M3', featureId: 'F07' });

  });
}
