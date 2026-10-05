/**
 * Tier 1 Feature Test: Build Infrastructure & Tailwind CSS v4 Setup
 * Features: F01 (Vite Multi-Page Build), F02 (Tailwind CSS v4 @theme), F04 (Brand Assets & Fallbacks)
 * Milestone: M1
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes, assertMatches } from '../../utils/assertions.js';
import { fileExists, readProjectFile, readJsonFile } from '../../utils/file-helpers.js';

export function registerBuildInfraSuite() {
  describe('Tier 1: Build Infrastructure & Tailwind CSS v4 (F01, F02, F04)', () => {

    it('F01: package.json specifies standalone Tailwind v4 CLI dependencies & build scripts', async () => {
      assert(fileExists('package.json'), 'package.json must exist in project root', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });

      const pkg = readJsonFile('package.json');
      assert(pkg.scripts, 'package.json must define "scripts"', { featureId: 'F01', milestone: 'M1' });
      assert(
        pkg.scripts.build === 'npm run build:css' || (pkg.scripts.build && pkg.scripts.build.includes('tailwindcss')),
        'build script must execute Tailwind CLI build',
        { featureId: 'F01', milestone: 'M1' }
      );
      assert(
        pkg.scripts.dev && pkg.scripts.dev.includes('tailwindcss'),
        'dev script must execute Tailwind CLI watch',
        { featureId: 'F01', milestone: 'M1' }
      );
      assert(
        pkg.scripts.preview && (pkg.scripts.preview.includes('serve') || pkg.scripts.preview.includes('preview')),
        'preview script must be defined for local static preview',
        { featureId: 'F01', milestone: 'M1' }
      );

      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      assert(allDeps['@tailwindcss/cli'], '@tailwindcss/cli must be listed in dependencies or devDependencies', { featureId: 'F01', milestone: 'M1' });
      assert(allDeps.tailwindcss, 'tailwindcss must be listed in dependencies or devDependencies', { featureId: 'F01', milestone: 'M1' });
    }, { featureId: 'F01', milestone: 'M1', tier: 1 });

    it('F01: static HTML pages are configured with relative assets for GitHub Pages deployment', async () => {
      assert(fileExists('index.html'), 'index.html must exist in project root', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });
      assert(fileExists('template.html'), 'template.html must exist in project root', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });
      assert(fileExists('.nojekyll'), '.nojekyll must exist in project root for GitHub Pages', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });

      const indexContent = readProjectFile('index.html');
      const templateContent = readProjectFile('template.html');

      assertIncludes(indexContent, './assets/css/main.css', 'index.html must reference ./assets/css/main.css', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });
      assertIncludes(templateContent, './assets/css/main.css', 'template.html must reference ./assets/css/main.css', {
        featureId: 'F01', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F01', milestone: 'M1', tier: 1 });

    it('F02: src/styles/main.css adopts Tailwind CSS v4 CSS-first engine (@import "tailwindcss")', async () => {
      assert(fileExists('src/styles/main.css'), 'src/styles/main.css must exist', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });

      const cssContent = readProjectFile('src/styles/main.css');
      assert(
        cssContent.includes('@import "tailwindcss"') || cssContent.includes("@import 'tailwindcss'"),
        'main.css must contain @import "tailwindcss";',
        { featureId: 'F02', milestone: 'M1', tier: 1 }
      );
      assertIncludes(cssContent, '@theme', 'main.css must declare @theme block for token definitions', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F02', milestone: 'M1', tier: 1 });

    it('F02: src/styles/main.css defines complete Sage Green color palette and typography tokens', async () => {
      assert(fileExists('src/styles/main.css'), 'src/styles/main.css must exist', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });

      const cssContent = readProjectFile('src/styles/main.css');
      // Sage Green tokens 50 - 900
      const expectedTokens = [
        '--color-sage-50',
        '--color-sage-100',
        '--color-sage-200',
        '--color-sage-300',
        '--color-sage-400',
        '--color-sage-500',
        '--color-sage-600',
        '--color-sage-700',
        '--color-sage-800',
        '--color-sage-900'
      ];
      for (const token of expectedTokens) {
        assertIncludes(cssContent, token, `main.css @theme must define ${token}`, {
          featureId: 'F02', milestone: 'M1', tier: 1
        });
      }

      // Font tokens
      assertIncludes(cssContent, '--font-serif', 'main.css @theme must define --font-serif (Playfair Display)', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
      assertIncludes(cssContent, '--font-script', 'main.css @theme must define --font-script (Dancing Script)', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
      assertIncludes(cssContent, '--font-sans', 'main.css @theme must define --font-sans (Inter)', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F02', milestone: 'M1', tier: 1 });

    it('F02: src/styles/main.css provides touch-target-safe and glass-nav custom utilities', async () => {
      assert(fileExists('src/styles/main.css'), 'src/styles/main.css must exist', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });

      const cssContent = readProjectFile('src/styles/main.css');
      assertIncludes(cssContent, '@utility touch-target-safe', 'main.css must define @utility touch-target-safe (44px min)', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
      assertIncludes(cssContent, '@utility glass-nav', 'main.css must define @utility glass-nav with backdrop blur', {
        featureId: 'F02', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F02', milestone: 'M1', tier: 1 });

    it('F04: Brand assets and static files exist with local vector fallbacks (zero-404)', async () => {
      assert(fileExists('src/assets/logo.svg'), 'Brand vector logo must exist at src/assets/logo.svg', {
        featureId: 'F04', milestone: 'M1', tier: 1
      });
      assert(fileExists('public/favicon.ico'), 'Favicon must exist at public/favicon.ico', {
        featureId: 'F04', milestone: 'M1', tier: 1
      });
      assert(fileExists('public/robots.txt'), 'Robots.txt must exist at public/robots.txt', {
        featureId: 'F04', milestone: 'M1', tier: 1
      });

      const logoContent = readProjectFile('src/assets/logo.svg');
      assertMatches(logoContent, /<svg[^>]*>/i, 'logo.svg must be a valid SVG document', {
        featureId: 'F04', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F04', milestone: 'M1', tier: 1 });

  });
}
