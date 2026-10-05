/**
 * Tier 1 Feature Test: Sticky Glassmorphism Header & Mobile Drawer
 * Features: F05 (Sticky Header), F06 (Mobile Drawer Menu)
 * Milestone: M2
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes, assertMatches } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerNavigationDrawerSuite() {
  describe('Tier 1: Sticky Header & Mobile Drawer (F05, F06)', () => {

    it('F05: Header element contains brand logo, desktop navigation, and theme toggle', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const header = doc.getElementById('navbar') || doc.querySelector('header');
      assert(header, 'Sticky header element must exist (id="navbar" or <header>)', {
        featureId: 'F05', milestone: 'M2', tier: 1
      });

      // Brand link
      const brand = header.querySelector('.brand') || header.querySelector('a');
      assert(brand, 'Header must contain brand identity link', { featureId: 'F05', milestone: 'M2' });

      // Nav links container
      const nav = header.querySelector('nav');
      assert(nav, 'Header must contain desktop <nav> element', { featureId: 'F05', milestone: 'M2' });

      // Theme toggle button
      const themeToggle = header.querySelector('#theme-toggle') || header.querySelector('.theme-toggle');
      assert(themeToggle, 'Header must provide theme toggle button', { featureId: 'F05', milestone: 'M2' });
    }, { featureId: 'F05', milestone: 'M2', tier: 1 });

    it('F05: Header styles or client script handle sticky scroll transition (>50px)', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);
      const header = doc.getElementById('navbar') || doc.querySelector('header');
      assert(header, 'Header must exist', { featureId: 'F05', milestone: 'M2' });

      // Check for sticky / fixed positioning classes
      const headerClasses = header.classList.toArray();
      const hasSticky = headerClasses.some(c => c.includes('sticky') || c.includes('fixed') || c === 'topnav');
      assert(hasSticky, 'Header must have sticky or fixed positioning styling', {
        featureId: 'F05', milestone: 'M2', tier: 1
      });

      // Check that main.js exists or is referenced to attach scroll listener
      assert(
        html.includes('main.js') || fileExists('src/js/main.js'),
        'main.js script must be referenced to handle scroll transitions',
        { featureId: 'F05', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F05', milestone: 'M2', tier: 1 });

    it('F06: Mobile drawer element exists with aria-hidden attribute', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const drawer = doc.getElementById('mobile-menu') || doc.querySelector('.mobile-menu');
      assert(drawer, 'Mobile drawer element must exist with id="mobile-menu"', {
        featureId: 'F06', milestone: 'M2', tier: 1
      });
      assert(
        drawer.hasAttribute('aria-hidden'),
        'Mobile drawer element must have initial aria-hidden attribute for accessibility',
        { featureId: 'F06', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F06', milestone: 'M2', tier: 1 });

    it('F06: Mobile drawer contains comprehensive navigation links matching site sections', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const drawer = doc.getElementById('mobile-menu') || doc.querySelector('.mobile-menu');
      assert(drawer, 'Mobile drawer must exist', { featureId: 'F06', milestone: 'M2' });

      const links = drawer.querySelectorAll('a');
      assert(
        links.length >= 4,
        `Mobile drawer must contain at least 4 navigation links, found ${links.length}`,
        { featureId: 'F06', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F06', milestone: 'M2', tier: 1 });

    it('F06: Mobile menu hamburger trigger button exists and provides aria-label', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const trigger = doc.getElementById('mobile-menu-btn') ||
                      doc.getElementById('menu-btn') ||
                      doc.getElementById('mobile-menu-trigger') ||
                      doc.querySelector('button[aria-label*="menu" i]') ||
                      doc.querySelector('.hamburger');
      assert(trigger, 'Mobile menu trigger button must exist with accessible label or id', {
        featureId: 'F06', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F06', milestone: 'M2', tier: 1 });

    it('F06: Drawer backdrop or close button is defined to allow dismissal', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const drawer = doc.getElementById('mobile-menu') || doc.querySelector('.mobile-menu');
      assert(drawer, 'Drawer must exist', { featureId: 'F06', milestone: 'M2' });

      // Check for close button or backdrop
      const closeBtn = drawer.querySelector('#close-menu') ||
                       drawer.querySelector('.menu-close') ||
                       drawer.querySelector('button');
      assert(closeBtn, 'Drawer must contain a dismiss button or clickable close trigger', {
        featureId: 'F06', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F06', milestone: 'M2', tier: 1 });

  });
}
