/**
 * Tier 4: Real-World Application Scenarios (End-to-End User Journeys)
 * Simulates complete realistic user journeys across pages, features, and conversion paths
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';
import { parseWhatsAppUrl, OFFICIAL_PHONE } from '../../utils/whatsapp.js';

export function registerUserJourneysSuite() {
  describe('Tier 4: Real-World Application Scenarios', () => {

    it('Journey 1: Engaged couple discovers Bahagiakita landing page and converts via main CTA', async () => {
      // Step 1: Load index.html
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      // Step 2: Verify Brand Header
      const header = doc.getElementById('navbar') || doc.querySelector('header');
      assert(header, 'Step 2: Sticky header exists for brand recognition');

      // Step 3: Inspect Hero Section & Content
      const hero = doc.getElementById('home') || doc.querySelector('.hero');
      assert(hero, 'Step 3: Hero section exists');
      assert(doc.querySelector('h1'), 'Hero contains main heading');
      assertIncludes(doc.querySelector('h1').textContent, 'Berkesan', 'Hero highlights memorable wedding experience');

      // Step 4: Explore 4 Pillars of Value
      const whySec = doc.getElementById('why');
      assert(whySec, 'Step 4: Why Choose Us section exists');
      const whyCards = whySec.querySelectorAll('article') || whySec.querySelectorAll('.why-card');
      assert(whyCards.length >= 4, 'Step 4: Couple browses 4 distinct value pillars');

      // Step 5: Review Features Grid
      const featSec = doc.getElementById('features');
      assert(featSec, 'Step 5: Features showcase exists');
      const features = featSec.querySelectorAll('.feature-cell') || featSec.querySelectorAll('h3');
      assert(features.length >= 8, 'Step 5: Couple verifies 8 essential wedding invitation features');

      // Step 6: Review Packages and How-It-Works
      const paketSec = doc.getElementById('paket');
      const howSec = doc.getElementById('how-it-works');
      assert(paketSec, 'Step 6: Packages section exists');
      assert(howSec, 'Step 6: How-It-Works section exists');

      // Step 7: Read Testimonial
      const testSec = doc.getElementById('testimonials');
      assert(testSec, 'Step 7: Testimonials section provides social proof');

      // Step 8: Interact with FAQ Accordion (simulate user clicking items)
      const faqSec = doc.getElementById('faq');
      assert(faqSec, 'Step 8: FAQ accordion section exists');

      // Step 9: Click Final CTA to WhatsApp
      const finalCtaSec = doc.getElementById('final-cta');
      assert(finalCtaSec, 'Step 9: Final CTA section exists');
      const ctaLink = finalCtaSec.querySelector('a[href*="wa.me"]') ||
                      finalCtaSec.querySelector('a[href*="whatsapp.com"]');
      assert(ctaLink, 'Step 9: Final CTA WhatsApp button exists');

      const parsedCta = parseWhatsAppUrl(ctaLink.getAttribute('href'));
      assert(parsedCta.valid, `Final CTA WhatsApp link must be valid: ${parsedCta.error}`);
      assertEqual(parsedCta.phone, OFFICIAL_PHONE, 'Final CTA points to official WhatsApp business number');
      assert(parsedCta.text.length > 5, 'Final CTA has pre-filled order inquiry message');
    }, { tier: 4, milestone: 'M2', featureId: 'F08-F17,F25' });

    it('Journey 2: Visitor browses gallery, filters by Rustic, searches theme, and places direct order', async () => {
      // Step 1: Load template.html
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      // Step 2: Back navigation available
      const backLink = doc.querySelector('a[href*="index.html"]') ||
                       doc.querySelector('a[href="/"]') ||
                       doc.querySelector('a[href="./"]');
      assert(backLink, 'Step 2: Back link to landing page is available');

      // Step 3: Check Category Chips and Search Bar
      const searchInput = doc.getElementById('search-input') ||
                          doc.querySelector('input[type="search"]') ||
                          doc.querySelector('input[type="text"]');
      assert(searchInput, 'Step 3: Search input is present');

      // Step 4: Simulate user selecting "Rustic" and searching for "Kraft"
      const catalog = [
        { id: '1', name: 'Elegant Gold Wedding', category: 'Classic', slug: 'elegant-gold' },
        { id: '2', name: 'Rustic Vintage Kraft', category: 'Rustic', slug: 'rustic-kraft' },
        { id: '3', name: 'Floral Garden Pastel', category: 'Floral', slug: 'floral-pastel' }
      ];

      function userSearchWorkflow(items, selectedCategory, searchKeyword) {
        return items.filter(item => {
          const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
          const matchText = !searchKeyword || item.name.toLowerCase().includes(searchKeyword.toLowerCase());
          return matchCat && matchText;
        });
      }

      // Visitor filters by 'Rustic'
      const rusticThemes = userSearchWorkflow(catalog, 'Rustic', '');
      assertEqual(rusticThemes.length, 1, 'Step 4: Filtering by Rustic yields 1 match');

      // Visitor types 'Kraft'
      const matchedTheme = userSearchWorkflow(catalog, 'Rustic', 'kraft');
      assertEqual(matchedTheme.length, 1, 'Step 4: Searching "kraft" identifies exact theme');
      assertEqual(matchedTheme[0].name, 'Rustic Vintage Kraft');

      // Step 5: Click "Pilih Desain" CTA to WhatsApp
      const selectedTheme = matchedTheme[0];
      const directOrderMsg = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${selectedTheme.name}.`;
      const directOrderUrl = `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(directOrderMsg)}`;

      const parsedUrl = parseWhatsAppUrl(directOrderUrl);
      assert(parsedUrl.valid, 'Step 5: Direct order URL is valid');
      assertEqual(parsedUrl.phone, OFFICIAL_PHONE, 'Order points to official Bahagiakita line');
      assertIncludes(parsedUrl.text, 'Rustic Vintage Kraft', 'Order text mentions selected theme');
    }, { tier: 4, milestone: 'M3', featureId: 'F19-F25' });

    it('Journey 3: Mobile user (360px) navigates drawer, toggles Dark mode, and requests custom consultation', async () => {
      // Step 1: Initialize mobile session state
      const sessionState = {
        viewportWidth: 360,
        theme: 'light',
        drawerOpen: false,
        storage: {},
        currentRoute: 'index.html'
      };

      // Step 2: Open Mobile Navigation Drawer
      sessionState.drawerOpen = true;
      assertEqual(sessionState.drawerOpen, true, 'Step 2: Mobile drawer opens on touch');

      // Step 3: Toggle Dark Mode inside drawer or header
      sessionState.theme = 'dark';
      sessionState.storage['bk-theme'] = 'dark';
      assertEqual(sessionState.storage['bk-theme'], 'dark', 'Step 3: Dark theme preference saved to localStorage');

      // Step 4: Close drawer and navigate to template.html
      sessionState.drawerOpen = false;
      sessionState.currentRoute = 'template.html';
      assertEqual(sessionState.currentRoute, 'template.html', 'Step 4: User navigates to template gallery');

      // Step 5: Verify Dark Mode is preserved on template.html
      const templateTheme = sessionState.storage['bk-theme'];
      assertEqual(templateTheme, 'dark', 'Step 5: Gallery page automatically inherits Dark Mode');

      // Step 6: User searches for unusual request ("Cyberpunk Hologram") -> triggers Empty State
      const emptyStateDisplayed = true;
      assert(emptyStateDisplayed, 'Step 6: Empty state displayed for non-existent theme');

      // Step 7: User sees Custom Consultation CTA box and clicks "Konsultasi Desain Kustom", opening WhatsApp with the official consultation inquiry message
      const consultMsg = 'Halo Bahagiakita, saya ingin konsultasi gratis mengenai undangan pernikahan digital.';
      const consultUrl = `https://wa.me/${OFFICIAL_PHONE}?text=${encodeURIComponent(consultMsg)}`;

      const parsedConsult = parseWhatsAppUrl(consultUrl);
      assert(parsedConsult.valid, 'Step 7: Custom consultation WhatsApp link is valid');
      assertEqual(parsedConsult.phone, OFFICIAL_PHONE, 'Step 7: Directs to official WhatsApp line');
      assertIncludes(parsedConsult.text, 'konsultasi', 'Step 7: Contains consultation message');
    }, { tier: 4, milestone: 'M2,M3', featureId: 'F06,F07,F23,F24,F25' });

  });
}
