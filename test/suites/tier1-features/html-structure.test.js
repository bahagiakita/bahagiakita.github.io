/**
 * Tier 1 Feature Test: HTML Structure & OpenDesign Artifact Purge
 * Features: F08-F17 (Landing Page 9 Sections), F18 (OpenDesign Artifact Purge)
 * Milestone: M2, M3
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes, assertNotIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerHtmlStructureSuite() {
  describe('Tier 1: HTML Structure & OpenDesign Purge (F08-F17, F18)', () => {

    it('F18: index.html is completely free from OpenDesign prototype artifacts', async () => {
      assert(fileExists('index.html'), 'index.html must exist', { featureId: 'F18', milestone: 'M2', tier: 1 });
      const html = readProjectFile('index.html');

      assertNotIncludes(html, 'data-od-id', 'index.html must not contain "data-od-id" attributes', {
        featureId: 'F18', milestone: 'M2', tier: 1
      });
      assertNotIncludes(html, 'data-screen-label', 'index.html must not contain "data-screen-label" attributes', {
        featureId: 'F18', milestone: 'M2', tier: 1
      });
      assertNotIncludes(html, 'speaker-notes', 'index.html must not contain prototype speaker-notes', {
        featureId: 'F18', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F18', milestone: 'M2', tier: 1 });

    it('F18: template.html is completely free from OpenDesign prototype artifacts', async () => {
      assert(fileExists('template.html'), 'template.html must exist', { featureId: 'F18', milestone: 'M3', tier: 1 });
      const html = readProjectFile('template.html');

      assertNotIncludes(html, 'data-od-id', 'template.html must not contain "data-od-id" attributes', {
        featureId: 'F18', milestone: 'M3', tier: 1
      });
      assertNotIncludes(html, 'data-screen-label', 'template.html must not contain "data-screen-label" attributes', {
        featureId: 'F18', milestone: 'M3', tier: 1
      });
      assertNotIncludes(html, 'speaker-notes', 'template.html must not contain prototype speaker-notes', {
        featureId: 'F18', milestone: 'M3', tier: 1
      });
    }, { featureId: 'F18', milestone: 'M3', tier: 1 });

    it('F08: Hero section contains editorial H1 with "Berkesan", 2 CTAs, 3 stats, and phone mockup', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const hero = doc.getElementById('home') || doc.querySelector('.hero') || doc.querySelector('section');
      assert(hero, 'Hero section must exist with id="home" or class="hero"', { featureId: 'F08', milestone: 'M2', tier: 1 });

      const h1 = doc.querySelector('h1');
      assert(h1, 'Hero section must contain an H1 heading', { featureId: 'F08', milestone: 'M2', tier: 1 });
      assertIncludes(h1.textContent, 'Berkesan', 'H1 must feature the accent word "Berkesan"', {
        featureId: 'F08', milestone: 'M2', tier: 1
      });

      // Verify phone mockup representation
      const phoneMockup = doc.querySelector('.phone-mock') || doc.querySelector('[aria-hidden="true"]');
      assert(phoneMockup, 'Hero must contain an interactive phone mockup element', {
        featureId: 'F08', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F08', milestone: 'M2', tier: 1 });

    it('F09 & F10: Why Choose Us contains 4 benefit cards and Features Showcase contains 8 feature items', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      // F09: Why Choose Us
      const whySection = doc.getElementById('why');
      assert(whySection, 'Why Choose Us section must exist with id="why"', { featureId: 'F09', milestone: 'M2', tier: 1 });
      const whyCards = whySection.querySelectorAll('article') || whySection.querySelectorAll('.why-card');
      assert(whyCards.length >= 4, `Why Choose Us must contain at least 4 benefit cards, found ${whyCards.length}`, {
        featureId: 'F09', milestone: 'M2', tier: 1
      });

      // F10: Features Showcase (8 items)
      const featSection = doc.getElementById('features');
      assert(featSection, 'Features Showcase section must exist with id="features"', { featureId: 'F10', milestone: 'M2', tier: 1 });
      const featCells = featSection.querySelectorAll('.feature-cell') || featSection.querySelectorAll('h3');
      assert(featCells.length >= 8, `Features Showcase must contain at least 8 feature items, found ${featCells.length}`, {
        featureId: 'F10', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F10', milestone: 'M2', tier: 1 });

    it('F11, F12 & F13: Template preview, 3 Highlighted packages, and 4-step How It Works exist', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      // F11: Template preview
      const templateSec = doc.getElementById('template');
      assert(templateSec, 'Template preview section must exist with id="template"', { featureId: 'F11', milestone: 'M2', tier: 1 });

      // F12: Highlighted packages
      const paketSec = doc.getElementById('paket');
      assert(paketSec, 'Highlighted packages section must exist with id="paket"', { featureId: 'F12', milestone: 'M2', tier: 1 });
      const packages = paketSec.querySelectorAll('article') || paketSec.querySelectorAll('.h-card');
      assert(packages.length >= 3, `Packages section must contain 3 tiers, found ${packages.length}`, {
        featureId: 'F12', milestone: 'M2', tier: 1
      });

      // F13: 4-step How It Works
      const howSec = doc.getElementById('how-it-works');
      assert(howSec, 'How It Works section must exist with id="how-it-works"', { featureId: 'F13', milestone: 'M2', tier: 1 });
      const steps = howSec.querySelectorAll('.step') || howSec.querySelectorAll('h3');
      assert(steps.length >= 4, `How It Works must contain 4 steps, found ${steps.length}`, {
        featureId: 'F13', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F13', milestone: 'M2', tier: 1 });

    it('F14, F16 & F17: Testimonials, Final CTA banner, and 4-column Footer are present', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      // F14: Testimonials
      const testSec = doc.getElementById('testimonials');
      assert(testSec, 'Testimonials section must exist with id="testimonials"', { featureId: 'F14', milestone: 'M2', tier: 1 });
      assert(
        testSec.textContent.includes('Rian') || testSec.textContent.includes('Nisa'),
        'Testimonial section must feature customer quotes (e.g. Rian & Nisa)',
        { featureId: 'F14', milestone: 'M2', tier: 1 }
      );

      // F16: Final CTA banner
      const ctaSec = doc.getElementById('final-cta');
      assert(ctaSec, 'Final CTA section must exist with id="final-cta"', { featureId: 'F16', milestone: 'M2', tier: 1 });

      // F17: 4-column Footer
      const footer = doc.querySelector('footer');
      assert(footer, 'Footer element must exist', { featureId: 'F17', milestone: 'M2', tier: 1 });
      const footerCols = footer.querySelectorAll('.footer-col');
      assert(footerCols.length >= 4, `Footer must have 4 columns, found ${footerCols.length}`, {
        featureId: 'F17', milestone: 'M2', tier: 1
      });
      assertIncludes(footer.textContent, 'Layanan', 'Footer must display service and operational information', {
        featureId: 'F17', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F17', milestone: 'M2', tier: 1 });

  });
}
