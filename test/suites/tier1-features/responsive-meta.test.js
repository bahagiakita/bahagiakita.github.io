/**
 * Tier 1 Feature Test: Responsive Meta & Mobile-First Ergonomics
 * Features: F26 (Mobile-First Ergonomics), F27 (SEO & Social Metadata)
 * Milestone: M1, M2, M3
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerResponsiveMetaSuite() {
  describe('Tier 1: Responsive Meta & Mobile Ergonomics (F26, F27)', () => {

    it('F26: index.html defines standard responsive viewport meta tag', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const viewport = doc.querySelector('meta[name="viewport"]');
      assert(viewport, 'index.html must have <meta name="viewport"> tag', {
        featureId: 'F26', milestone: 'M2', tier: 1
      });
      const content = viewport.getAttribute('content') || '';
      assertIncludes(content, 'width=device-width', 'viewport meta content must specify width=device-width', {
        featureId: 'F26', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F26', milestone: 'M2', tier: 1 });

    it('F26: template.html defines standard responsive viewport meta tag', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const viewport = doc.querySelector('meta[name="viewport"]');
      assert(viewport, 'template.html must have <meta name="viewport"> tag', {
        featureId: 'F26', milestone: 'M3', tier: 1
      });
      const content = viewport.getAttribute('content') || '';
      assertIncludes(content, 'width=device-width', 'viewport meta content must specify width=device-width', {
        featureId: 'F26', milestone: 'M3', tier: 1
      });
    }, { featureId: 'F26', milestone: 'M3', tier: 1 });

    it('F26: Mobile ergonomics enforcement: overflow-x defense and dynamic viewport classes', async () => {
      const html = readProjectFile('index.html');
      // Verify body or wrapper has overflow-x-hidden
      const hasOverflowDefense = html.includes('overflow-x-hidden') ||
                                 html.includes('max-w-full') ||
                                 (fileExists('src/styles/main.css') && readProjectFile('src/styles/main.css').includes('overflow-x'));
      assert(
        hasOverflowDefense,
        'Application must specify overflow-x-hidden to prevent horizontal scrolling on mobile viewports',
        { featureId: 'F26', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F26', milestone: 'M2', tier: 1 });

    it('F26: Touch target safety: interactive elements enforce minimum 44px height', async () => {
      const cssExists = fileExists('src/styles/main.css');
      if (cssExists) {
        const css = readProjectFile('src/styles/main.css');
        assert(
          css.includes('44px') || css.includes('touch-target-safe'),
          'CSS must define 44px touch target utility or rules',
          { featureId: 'F26', milestone: 'M1', tier: 1 }
        );
      }

      const html = readProjectFile('index.html');
      const doc = parseHTML(html);
      const buttons = doc.querySelectorAll('button');
      assert(buttons.length >= 2, 'index.html must have interactive buttons for touch testing');
    }, { featureId: 'F26', milestone: 'M2', tier: 1 });

    it('F27: SEO Open Graph and Twitter metadata tags are configured', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const ogTitle = doc.querySelector('meta[property="og:title"]');
      const ogDesc = doc.querySelector('meta[property="og:description"]');
      const ogType = doc.querySelector('meta[property="og:type"]');

      assert(ogTitle, 'index.html must contain <meta property="og:title"> for social sharing', {
        featureId: 'F27', milestone: 'M2', tier: 1
      });
      assert(ogDesc, 'index.html must contain <meta property="og:description">', {
        featureId: 'F27', milestone: 'M2', tier: 1
      });
      assert(ogType, 'index.html must contain <meta property="og:type">', {
        featureId: 'F27', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F27', milestone: 'M2', tier: 1 });

    it('F26: Typography includes Google Fonts for Playfair Display, Dancing Script, and Inter', async () => {
      const html = readProjectFile('index.html');
      assert(
        html.includes('Playfair+Display') || html.includes('Playfair Display'),
        'index.html must import Playfair Display font',
        { featureId: 'F26', milestone: 'M2', tier: 1 }
      );
      assert(
        html.includes('Dancing+Script') || html.includes('Dancing Script'),
        'index.html must import Dancing Script font for accents',
        { featureId: 'F26', milestone: 'M2', tier: 1 }
      );
      assert(
        html.includes('Inter'),
        'index.html must import Inter font for body text',
        { featureId: 'F26', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F26', milestone: 'M2', tier: 1 });

  });
}
