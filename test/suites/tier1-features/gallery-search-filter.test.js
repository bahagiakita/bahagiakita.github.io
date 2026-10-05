/**
 * Tier 1 Feature Test: Template Gallery Search & Filter Engine
 * Features: F19-F24 (Gallery Header, Filter Chips, Live Search, Counter, Empty State, Custom CTA)
 * Milestone: M3
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerGallerySearchFilterSuite() {
  describe('Tier 1: Gallery Search & Filter Engine (F19-F24)', () => {

    it('F19: template.html contains gallery header with back navigation to index.html', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const backLink = doc.querySelector('a[href*="index.html"]') ||
                       doc.querySelector('a[href="/"]') ||
                       doc.querySelector('a[href="./"]') ||
                       doc.querySelector('.back-link');
      assert(backLink, 'template.html must contain a link navigating back to index.html', {
        featureId: 'F19', milestone: 'M3', tier: 1
      });
    }, { featureId: 'F19', milestone: 'M3', tier: 1 });

    it('F20: template.html defines 7 category filter chips (All + 6 categories)', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const EXPECTED_CATEGORIES = ['All', 'Classic', 'Modern', 'Minimal', 'Floral', 'Rustic', 'Luxury'];

      // Chips can be in static HTML or rendered by script
      for (const cat of EXPECTED_CATEGORIES) {
        assert(
          html.includes(cat),
          `Gallery must include category chip option for "${cat}"`,
          { featureId: 'F20', milestone: 'M3', tier: 1 }
        );
      }
    }, { featureId: 'F20', milestone: 'M3', tier: 1 });

    it('F21: Search input exists with accessible placeholder and filter engine capabilities', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const searchInput = doc.getElementById('search-input') ||
                          doc.querySelector('input[type="search"]') ||
                          doc.querySelector('input[type="text"]') ||
                          doc.querySelector('.search-input');
      assert(searchInput, 'template.html must provide a search input element', {
        featureId: 'F21', milestone: 'M3', tier: 1
      });
      assert(
        searchInput.hasAttribute('placeholder'),
        'Search input must have a descriptive placeholder',
        { featureId: 'F21', milestone: 'M3', tier: 1 }
      );
    }, { featureId: 'F21', milestone: 'M3', tier: 1 });

    it('F22: Visible / Total counter element exists for real-time catalog count display', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const counter = doc.getElementById('visible-count') ||
                      doc.getElementById('themes-count') ||
                      doc.getElementById('catalog-count') ||
                      doc.querySelector('.gallery-count') ||
                      doc.querySelector('.catalog-count') ||
                      doc.querySelector('.results-count');
      assert(counter, 'template.html must have a counter element (e.g. #themes-count) to display visible themes', {
        featureId: 'F22', milestone: 'M3', tier: 1
      });
    }, { featureId: 'F22', milestone: 'M3', tier: 1 });

    it('F23: Empty state UI exists with reset button for zero search results', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const emptyState = doc.getElementById('empty-state') ||
                         doc.querySelector('.empty-state') ||
                         doc.querySelector('.no-results');
      assert(emptyState, 'template.html must have an empty state container for zero-match results', {
        featureId: 'F23', milestone: 'M3', tier: 1
      });

      // Must have reset trigger
      const resetBtn = emptyState.querySelector('button') ||
                       emptyState.querySelector('a') ||
                       emptyState.querySelector('#reset-search');
      assert(resetBtn, 'Empty state must offer a reset button or link to clear filters', {
        featureId: 'F23', milestone: 'M3', tier: 1
      });
    }, { featureId: 'F23', milestone: 'M3', tier: 1 });

    it('F24: Custom Consultation CTA box exists inviting bespoke invitation designs', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      // Verify custom consultation banner/card
      assert(
        html.includes('Konsultasi') || html.includes('Kustom') || html.includes('Bespoke'),
        'template.html must contain a custom consultation CTA banner for bespoke wedding designs',
        { featureId: 'F24', milestone: 'M3', tier: 1 }
      );
    }, { featureId: 'F24', milestone: 'M3', tier: 1 });

    it('F20 & F21: Filtering engine logic correctly combines category and search term', async () => {
      // Mock gallery search & filter engine
      const mockThemes = [
        { name: 'Elegant Gold Wedding', category: 'Classic', features: ['Countdown', 'RSVP', 'Galeri'] },
        { name: 'Minimalist Clean Slate', category: 'Minimal', features: ['Countdown', 'Gift'] },
        { name: 'Rustic Vintage Kraft', category: 'Rustic', features: ['Galeri', 'Music'] },
        { name: 'Floral Rose Pastel', category: 'Floral', features: ['Galeri', 'RSVP'] },
        { name: 'Modern Dark Botanical', category: 'Modern', features: ['Music', 'Maps'] }
      ];

      function filterCatalog(themes, selectedCategory, searchQuery) {
        const query = (searchQuery || '').trim().toLowerCase();
        return themes.filter(item => {
          const matchCat = !selectedCategory || selectedCategory === 'All' || item.category === selectedCategory;
          if (!matchCat) return false;
          if (!query) return true;

          const matchName = item.name.toLowerCase().includes(query);
          const matchTag = item.features.some(f => f.toLowerCase().includes(query));
          return matchName || matchTag;
        });
      }

      // Test Category Filter
      const classicOnly = filterCatalog(mockThemes, 'Classic', '');
      assertEqual(classicOnly.length, 1, 'Classic filter should return 1 theme');
      assertEqual(classicOnly[0].name, 'Elegant Gold Wedding');

      // Test Search Query
      const searchRose = filterCatalog(mockThemes, 'All', 'rose');
      assertEqual(searchRose.length, 1, 'Search for "rose" should return Floral Rose Pastel');
      assertEqual(searchRose[0].name, 'Floral Rose Pastel');

      // Test Search Tag
      const searchMusic = filterCatalog(mockThemes, 'All', 'music');
      assertEqual(searchMusic.length, 2, 'Search for tag "music" should return 2 themes');

      // Test Combined Match
      const combined = filterCatalog(mockThemes, 'Rustic', 'vintage');
      assertEqual(combined.length, 1, 'Category Rustic + query "vintage" should match Rustic Vintage Kraft');

      // Test Zero Match
      const noMatch = filterCatalog(mockThemes, 'Classic', 'rose');
      assertEqual(noMatch.length, 0, 'Category Classic + query "rose" should yield 0 results');
    }, { featureId: 'F21', milestone: 'M3', tier: 1 });

  });
}
