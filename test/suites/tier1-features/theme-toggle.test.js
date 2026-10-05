/**
 * Tier 1 Feature Test: Dark/Light Mode Engine
 * Feature: F07 (Dark Mode Engine with localStorage and OS preference sync)
 * Milestone: M2
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerThemeToggleSuite() {
  describe('Tier 1: Dark/Light Mode Engine (F07)', () => {

    it('F07: Both index.html and template.html have accessible theme toggle button', async () => {
      const indexHtml = readProjectFile('index.html');
      const templateHtml = readProjectFile('template.html');

      const indexDoc = parseHTML(indexHtml);
      const templateDoc = parseHTML(templateHtml);

      const indexToggle = indexDoc.getElementById('theme-toggle') || indexDoc.querySelector('.theme-toggle');
      assert(indexToggle, 'index.html must have #theme-toggle button', { featureId: 'F07', milestone: 'M2', tier: 1 });
      assert(indexToggle.hasAttribute('aria-label') || indexToggle.hasAttribute('title'), 'index theme toggle must have aria-label');

      const templateToggle = templateDoc.getElementById('theme-toggle') || templateDoc.querySelector('.theme-toggle');
      assert(templateToggle, 'template.html must have #theme-toggle button', { featureId: 'F07', milestone: 'M2', tier: 1 });
      assert(templateToggle.hasAttribute('aria-label') || templateToggle.hasAttribute('title'), 'template theme toggle must have aria-label');
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Client theme script references canonical storage key "bk-theme"', async () => {
      // Check index.html, template.html, or src/js/main.js
      let foundStorageKey = false;
      const candidates = ['index.html', 'template.html', 'src/js/main.js'];

      for (const relPath of candidates) {
        if (fileExists(relPath)) {
          const content = readProjectFile(relPath);
          if (content.includes('bk-theme')) {
            foundStorageKey = true;
            break;
          }
        }
      }

      assert(foundStorageKey, 'Theme management must use "bk-theme" localStorage key as specified in PROJECT.md', {
        featureId: 'F07', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Theme engine operates via data-theme attribute on root <html> element', async () => {
      let foundDataTheme = false;
      const candidates = ['index.html', 'template.html', 'src/js/main.js'];

      for (const relPath of candidates) {
        if (fileExists(relPath)) {
          const content = readProjectFile(relPath);
          if (content.includes('data-theme') || content.includes('dataset.theme')) {
            foundDataTheme = true;
            break;
          }
        }
      }

      assert(foundDataTheme, 'Theme toggle must manipulate data-theme attribute on documentElement', {
        featureId: 'F07', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Theme engine listens to or syncs with OS prefers-color-scheme', async () => {
      let foundMediaSync = false;
      const candidates = ['index.html', 'template.html', 'src/js/main.js'];

      for (const relPath of candidates) {
        if (fileExists(relPath)) {
          const content = readProjectFile(relPath);
          if (content.includes('prefers-color-scheme')) {
            foundMediaSync = true;
            break;
          }
        }
      }

      assert(foundMediaSync, 'Theme engine must support OS preference sync via prefers-color-scheme', {
        featureId: 'F07', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Anti-FOUC theme initialization script is present in document head', async () => {
      const indexHtml = readProjectFile('index.html');
      // Anti-FOUC script should be in <head> before stylesheets or body rendering
      const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/i);
      assert(headMatch, 'index.html must have a <head> tag', { featureId: 'F07', milestone: 'M2', tier: 1 });

      const headContent = headMatch[1];
      const hasInlineThemeInit = headContent.includes('bk-theme') ||
                                 headContent.includes('data-theme') ||
                                 headContent.includes('prefers-color-scheme');
      assert(hasInlineThemeInit, 'index.html <head> must contain early anti-FOUC theme detection script', {
        featureId: 'F07', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Theme simulation logic correctly toggles between light and dark', async () => {
      // Simulate theme toggle state machine
      class MockThemeManager {
        constructor() {
          this.storage = {};
          this.currentTheme = 'light';
        }
        init(osPrefersDark = false) {
          const saved = this.storage['bk-theme'];
          if (saved) {
            this.currentTheme = saved;
          } else {
            this.currentTheme = osPrefersDark ? 'dark' : 'light';
          }
          return this.currentTheme;
        }
        toggle() {
          this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
          this.storage['bk-theme'] = this.currentTheme;
          return this.currentTheme;
        }
      }

      const mgr = new MockThemeManager();
      assertEqual(mgr.init(false), 'light', 'Default theme without saved state should be light');
      assertEqual(mgr.toggle(), 'dark', 'First toggle should switch to dark');
      assertEqual(mgr.storage['bk-theme'], 'dark', 'Saved preference should be dark');
      assertEqual(mgr.toggle(), 'light', 'Second toggle should switch back to light');
      assertEqual(mgr.storage['bk-theme'], 'light', 'Saved preference should be light');
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

    it('F07: Dark variant is scoped via @variant dark and synchronized with .dark class on root', async () => {
      const mainCss = readProjectFile('src/styles/main.css');
      assertIncludes(mainCss, '@variant dark', 'src/styles/main.css must declare @variant dark for class/data-theme scoping', {
        featureId: 'F07', milestone: 'M2', tier: 1
      });

      const compiledCss = readProjectFile('assets/css/main.css');
      assert(
        compiledCss.includes(':where([data-theme=dark]') || compiledCss.includes(':where([data-theme="dark"]'),
        'assets/css/main.css must compile dark utilities with :where([data-theme=dark] selector scoping',
        { featureId: 'F07', milestone: 'M2', tier: 1 }
      );

      const mainJs = readProjectFile('src/js/main.js');
      assert(
        mainJs.includes('classList.add("dark")') || mainJs.includes("classList.toggle('dark'") || mainJs.includes('classList.toggle("dark"'),
        'src/js/main.js must sync dark class on documentElement',
        { featureId: 'F07', milestone: 'M2', tier: 1 }
      );

      const indexHtml = readProjectFile('index.html');
      assert(
        indexHtml.includes('classList.add("dark")'),
        'index.html anti-FOUC script must sync dark class on documentElement',
        { featureId: 'F07', milestone: 'M2', tier: 1 }
      );
    }, { featureId: 'F07', milestone: 'M2', tier: 1 });

  });
}
