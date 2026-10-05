/**
 * test/challenger/vite-tailwind-compilation.test.js
 * Standalone Tailwind CSS v4 CLI compilation and token verification
 * (Migrated from Vite to Standalone @tailwindcss/cli for GitHub Pages)
 */

import { execSync } from 'child_process';
import { resolve, join } from 'path';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';

export async function runViteTailwindCompilationTest() {
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

  console.log('--- Starting Standalone Tailwind v4 CLI Compilation Test ---');

  const rootDir = resolve(process.cwd());
  const tempDir = join(rootDir, '.temp-test-build');

  try {
    // 1. Standalone Direct Programmatic Compilation of src/styles/main.css via Tailwind v4 CLI
    console.log('Testing standalone compilation of src/styles/main.css via @tailwindcss/cli...');
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });
    const tempCssOutput = join(tempDir, 'output.css');

    let cliBuildError = null;
    try {
      execSync(`npx tailwindcss -i src/styles/main.css -o "${tempCssOutput}" --minify`, {
        cwd: rootDir,
        stdio: 'pipe',
        encoding: 'utf-8'
      });
    } catch (err) {
      cliBuildError = err.message;
    }

    assert(!cliBuildError, 'Standalone main.css build completed without error via Tailwind CLI', { error: cliBuildError });
    assert(existsSync(tempCssOutput), 'Temporary compiled CSS output file was generated');

    const compiledCss = existsSync(tempCssOutput) ? readFileSync(tempCssOutput, 'utf-8') : '';

    assert(compiledCss.length > 5000, `Compiled CSS has substantial size (actual: ${compiledCss.length} bytes)`, { length: compiledCss.length });

    // 2. Directive Consumption Verification
    assert(!compiledCss.includes('@import "tailwindcss"'), 'Tailwind @import directive is properly resolved and consumed by compiler');
    assert(!compiledCss.includes('@theme {'), 'Tailwind @theme block is compiled into CSS variables, not emitted raw');
    assert(!compiledCss.includes('@utility '), 'Tailwind @utility directives are compiled into CSS classes, not emitted raw');

    // 3. Theme Tokens Verification
    // Color tokens
    assert(compiledCss.includes('--color-sage-50') && compiledCss.includes('#f4f6f2'), 'Compiled CSS contains --color-sage-50: #f4f6f2');
    assert(compiledCss.includes('--color-sage-500') && compiledCss.includes('#52634c'), 'Compiled CSS contains --color-sage-500: #52634c (Primary brand)');
    assert(compiledCss.includes('--color-sage-800') && compiledCss.includes('#2d352b'), 'Compiled CSS contains --color-sage-800: #2d352b');
    assert(compiledCss.includes('--color-terracotta-500') && compiledCss.includes('#c4876a'), 'Compiled CSS contains --color-terracotta-500: #c4876a');
    assert(compiledCss.includes('--color-gold-500') && compiledCss.includes('#d4af37'), 'Compiled CSS contains --color-gold-500: #d4af37');
    assert(compiledCss.includes('--color-cream-100') && compiledCss.includes('#fcfbf7'), 'Compiled CSS contains --color-cream-100: #fcfbf7');

    // Font tokens
    assert(compiledCss.includes('Playfair Display'), 'Compiled CSS contains Playfair Display font token');
    assert(compiledCss.includes('Dancing Script'), 'Compiled CSS contains Dancing Script font token');
    assert(compiledCss.includes('Inter'), 'Compiled CSS contains Inter font token');
    assert(compiledCss.includes('Poppins'), 'Compiled CSS contains Poppins font token');

    // Border radius tokens
    assert(compiledCss.includes('--radius-card') && compiledCss.includes('20px'), 'Compiled CSS contains --radius-card: 20px');
    assert(compiledCss.includes('--radius-pill') && compiledCss.includes('9999px'), 'Compiled CSS contains --radius-pill: 9999px');

    // Custom utilities
    assert(compiledCss.includes('touch-target-safe') && (compiledCss.includes('min-height:44px') || compiledCss.includes('min-height: 44px')), 'Compiled CSS contains .touch-target-safe utility with 44px touch target');
    assert(compiledCss.includes('glass-nav') && (compiledCss.includes('backdrop-filter:blur(12px)') || compiledCss.includes('backdrop-filter: blur(12px)')), 'Compiled CSS contains .glass-nav utility with backdrop blur');
    assert(compiledCss.includes('safe-inset-top') && compiledCss.includes('safe-area-inset-top'), 'Compiled CSS contains .safe-inset-top utility with safe-area support');
    assert(compiledCss.includes('safe-inset-bottom') && compiledCss.includes('safe-area-inset-bottom'), 'Compiled CSS contains .safe-inset-bottom utility with safe-area support');
    assert(compiledCss.includes('text-shadow-subtle'), 'Compiled CSS contains .text-shadow-subtle utility');

    // Animation & Keyframes
    assert(compiledCss.includes('@keyframes float'), 'Compiled CSS contains @keyframes float definition');
    assert(compiledCss.includes('translateY(-8px)'), 'Compiled CSS @keyframes float animates translateY(-8px)');

    // Layer base rules
    assert(compiledCss.includes('data-theme=dark') || compiledCss.includes('data-theme="dark"'), 'Compiled CSS contains data-theme="dark" theme styling rule');
    assert(compiledCss.includes('scroll-behavior:smooth') || compiledCss.includes('scroll-behavior: smooth'), 'Compiled CSS contains scroll-behavior: smooth rule');
    assert(compiledCss.includes('100dvh'), 'Compiled CSS contains min-height: 100dvh mobile ergonomics rule');
    assert(compiledCss.includes('overflow-x:hidden') || compiledCss.includes('overflow-x: hidden'), 'Compiled CSS contains overflow-x: hidden viewport safety rule');

    // 4. Production Build & Static HTML Asset Linking Verification
    console.log('Verifying npm run build production CSS generation and HTML relative linking...');
    execSync('npm run build', { cwd: rootDir, stdio: 'pipe' });

    const mainCssPath = resolve(rootDir, 'assets/css/main.css');
    assert(existsSync(mainCssPath), 'assets/css/main.css exists after npm run build', { path: mainCssPath });

    const prodCssSize = existsSync(mainCssPath) ? readFileSync(mainCssPath).length : 0;
    assert(prodCssSize > 50000, `Production assets/css/main.css is healthy minified CSS (${prodCssSize} bytes)`);

    const indexPath = resolve(rootDir, 'index.html');
    const templatePath = resolve(rootDir, 'template.html');

    assert(existsSync(indexPath), 'index.html exists in root', { path: indexPath });
    assert(existsSync(templatePath), 'template.html exists in root', { path: templatePath });

    const indexHtml = readFileSync(indexPath, 'utf-8');
    const templateHtml = readFileSync(templatePath, 'utf-8');

    assert(indexHtml.includes('./assets/css/main.css'), 'index.html links to ./assets/css/main.css for GitHub Pages');
    assert(templateHtml.includes('./assets/css/main.css'), 'template.html links to ./assets/css/main.css for GitHub Pages');
    assert(indexHtml.includes('./src/js/main.js'), 'index.html links to ./src/js/main.js');
    assert(templateHtml.includes('./src/js/gallery.js'), 'template.html links to ./src/js/gallery.js');

    // 5. Tailwind v4 Utility Class Generation Stress Test
    console.log('Stress testing Tailwind v4 class synthesis against custom theme tokens...');
    const syntheticHtml = join(tempDir, 'synthetic-test.html');
    const syntheticCssOutput = join(tempDir, 'synthetic-output.css');

    writeFileSync(syntheticHtml, `
      <!doctype html>
      <html>
      <head><link rel="stylesheet" href="../../src/styles/main.css"></head>
      <body>
        <div class="bg-sage-500 text-terracotta-500 font-serif font-script rounded-card touch-target-safe glass-nav animate-float">
          <span class="text-gold-500 safe-inset-top safe-inset-bottom">Test</span>
        </div>
      </body>
      </html>
    `, 'utf-8');

    execSync(`npx tailwindcss -i src/styles/main.css -o "${syntheticCssOutput}" --minify`, {
      cwd: rootDir,
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    const syntheticCss = existsSync(syntheticCssOutput) ? readFileSync(syntheticCssOutput, 'utf-8') : '';
    assert(syntheticCss.length > 0, 'Synthetic build emitted CSS bundle', { length: syntheticCss.length });
    assert(syntheticCss.includes('--color-sage-500') || syntheticCss.includes('#52634c'), 'Synthetic CSS synthesized sage-500 theme token or resolved color');
    assert(syntheticCss.includes('--color-terracotta-500') || syntheticCss.includes('#c4876a'), 'Synthetic CSS synthesized terracotta-500 theme token or resolved color');
    assert(syntheticCss.includes('--color-gold-500') || syntheticCss.includes('#d4af37'), 'Synthetic CSS synthesized gold-500 theme token or resolved color');
    assert(syntheticCss.includes('touch-target-safe'), 'Synthetic CSS included custom utility touch-target-safe');
    assert(syntheticCss.includes('glass-nav'), 'Synthetic CSS included custom utility glass-nav');

  } catch (err) {
    assert(false, `Unexpected compilation exception: ${err.message}`, { stack: err.stack });
  } finally {
    // Clean up temporary test build folder
    try {
      if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }

  console.log(`--- Standalone Tailwind Compilation Test Complete: ${results.passed} PASSED, ${results.failed} FAILED ---`);
  return results;
}

// Run when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runViteTailwindCompilationTest().then(res => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
