/**
 * test/challenger/m3-viewport-ergonomics-stress.test.js
 * Empirical Challenger 2 Suite for Milestone 3:
 * Multi-Viewport Ergonomics, Horizontal Overflow & Layout Invariants
 *
 * Verifies:
 * 1. Production Build & Bundled Asset Integrity (npm run build, dist/ outputs)
 * 2. Multi-Viewport Layout & Horizontal Overflow (360px, 390px, 430px, 768px, 1024px, 1440px)
 * 3. FOUT / Offline Font Loading Stress (Ligature overflow in #theme-toggle)
 * 4. Touch Target Dimensions (>= 44x44px across buttons, inputs, links, chips, toggles)
 * 5. Dark Mode Instantaneous Toggle & Persistence via localStorage ('bk-theme')
 */

import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST = fs.existsSync(path.join(ROOT, 'dist', 'index.html'))
  ? path.join(ROOT, 'dist')
  : ROOT;
const REQUIRED_VIEWPORTS = [360, 390, 430, 768, 1024, 1440];

export async function runM3ViewportErgonomicsTests() {
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
    measurements: {}
  };

  function assert(condition, message, details = {}) {
    if (condition) {
      results.passed++;
      results.tests.push({ status: 'PASS', message });
      console.log(`  ✔ PASS: ${message}`);
    } else {
      results.failed++;
      results.tests.push({ status: 'FAIL', message, details });
      console.error(`  ❌ FAIL: ${message}`);
      if (Object.keys(details).length > 0) {
        console.error('     Details:', JSON.stringify(details, null, 2));
      }
    }
  }

  console.log('===============================================================');
  console.log('CHALLENGER 2: M3 MULTI-VIEWPORT ERGONOMICS & LAYOUT INVARIANTS');
  console.log('===============================================================\n');

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 1: Production Multi-Page Build & Asset Integrity
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('[Suite 1] Production Multi-Page Build & Asset Integrity');

  // 1.1 Trigger / verify npm run build
  let buildError = null;
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
  } catch (err) {
    buildError = err.message;
  }
  assert(!buildError, 'npm run build executes cleanly with exit code 0', { error: buildError });

  // 1.2 Verify template.html and index.html exist and have content
  const templateDistPath = path.join(DIST, 'template.html');
  const indexDistPath = path.join(DIST, 'index.html');
  assert(fs.existsSync(templateDistPath), 'Production template.html exists in build/root output');
  assert(fs.existsSync(indexDistPath), 'Production index.html exists in build/root output');

  const templateDistContent = fs.readFileSync(templateDistPath, 'utf-8');
  const indexDistContent = fs.readFileSync(indexDistPath, 'utf-8');
  assert(templateDistContent.length > 5000, 'template.html is non-empty production HTML', { size: templateDistContent.length });
  assert(indexDistContent.length > 10000, 'index.html is non-empty production HTML', { size: indexDistContent.length });

  // 1.3 Verify HTML structure invariants
  assert(templateDistContent.includes('<!doctype html>') || templateDistContent.includes('<!DOCTYPE html>'), 'template.html contains valid doctype');
  assert(templateDistContent.includes('<meta name="viewport"'), 'template.html contains viewport meta tag');
  assert(templateDistContent.includes('<title>'), 'template.html contains title tag');

  // 1.4 Verify all referenced bundled assets exist on disk
  const assetRegex = /(?:href|src)=["']((?:\.?\/)?(?:assets|dist|src)\/[^"']+\.(?:css|js|svg|ico))["']/g;
  let match;
  const referencedAssets = new Set();
  while ((match = assetRegex.exec(templateDistContent)) !== null) {
    referencedAssets.add(match[1]);
  }
  while ((match = assetRegex.exec(indexDistContent)) !== null) {
    referencedAssets.add(match[1]);
  }

  assert(referencedAssets.size >= 2, 'Build generates referenced CSS and JS bundles', { count: referencedAssets.size });
  referencedAssets.forEach(assetPath => {
    const cleanPath = assetPath.replace(/^(\.\/|\/)/, '');
    const diskPath = path.join(DIST, cleanPath);
    const exists = fs.existsSync(diskPath);
    const size = exists ? fs.statSync(diskPath).size : 0;
    assert(exists && size > 0, `Bundled asset ${assetPath} exists on disk (${size} bytes)`);
  });

  // 1.5 Verify complete OpenDesign purge in production output
  assert(!templateDistContent.includes('data-od-id'), 'template.html contains zero data-od-id attributes');
  assert(!templateDistContent.includes('data-screen-label'), 'template.html contains zero data-screen-label attributes');
  assert(!templateDistContent.includes('speaker-notes'), 'template.html contains zero speaker-notes attributes');

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 2 & 3: Headless Chromium Browser Verification
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 2] Spin up Static Server & Headless Chromium CDP');

  const serverPort = 9890;
  const cdpPort = 9240;

  const staticServer = http.createServer((req, res) => {
    let filePath = path.join(DIST, req.url.split('?')[0]);
    if (filePath.endsWith('/')) filePath += 'index.html';
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve) => staticServer.listen(serverPort, resolve));
  console.log(`  ✔ Static test server listening on http://127.0.0.1:${serverPort}`);

  const chromeProc = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=/tmp/chromium-challenger-m3-${Date.now()}`
  ]);

  await new Promise(r => setTimeout(r, 1200));

  let msgIdCounter = 1;
  async function createBrowserSession(pagePath) {
    const verRes = await fetch(`http://127.0.0.1:${cdpPort}/json/new?http://127.0.0.1:${serverPort}/${pagePath}`, { method: 'PUT' });
    const page = await verRes.json();
    const ws = new WebSocket(page.webSocketDebuggerUrl);

    const pending = new Map();
    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data);
        pending.delete(data.id);
      }
    };

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgIdCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');
    return { send, ws, pageId: page.id };
  }

  const { send, ws } = await createBrowserSession('template.html');

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 2: Multi-Viewport Layout & Horizontal Overflow (Fonts Loaded)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 2] Multi-Viewport Layout & Horizontal Overflow Stress');
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  await new Promise(r => setTimeout(r, 1000));

  results.measurements.viewports = {};

  for (const width of REQUIRED_VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768
    });
    await new Promise(r => setTimeout(r, 300));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientW = doc.clientWidth;
        const diff = scrollW - clientW;
        return {
          clientWidth: clientW,
          scrollWidth: scrollW,
          diff: diff,
          hasHorizontalScroll: diff > 1
        };
      })()`,
      returnByValue: true
    });

    const m = evalRes.result.result.value;
    results.measurements.viewports[width] = m;

    assert(
      !m.hasHorizontalScroll,
      `Viewport ${width}px: zero horizontal overflow (clientWidth: ${m.clientWidth}px, scrollWidth: ${m.scrollWidth}px, diff: ${m.diff}px)`,
      m
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 3: FOUT / Latent Webfont Layout Shift Stress (Adversarial Angle)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 3] Adversarial FOUT / Unloaded Font Stress Harness');

  // Evaluate ligature text width before icon replacement inside #theme-toggle
  const foutStress = await send('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.getElementById("theme-toggle");
      const sun = toggle ? toggle.querySelector(".sun-icon") : null;
      const rToggle = toggle ? toggle.getBoundingClientRect() : null;
      const rSun = sun ? sun.getBoundingClientRect() : null;
      const styleToggle = toggle ? window.getComputedStyle(toggle) : null;
      return {
        toggleWidth: rToggle ? rToggle.width : 0,
        sunWidth: rSun ? rSun.width : 0,
        hasOverflowHidden: styleToggle ? styleToggle.overflow === "hidden" : false,
        toggleRight: rToggle ? rToggle.right : 0
      };
    })()`,
    returnByValue: true
  });

  const foutData = foutStress.result.result.value;
  results.measurements.fout = foutData;

  // We test if #theme-toggle protects against ligature text overflow
  assert(
    foutData.hasOverflowHidden,
    '#theme-toggle has overflow:hidden to prevent ligature text ("light_mode" 109px) spilling during FOUT',
    foutData
  );

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 4: Touch Target Dimensions Stress Harness (>= 44x44px)
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 4] Touch Target Dimensions Stress Harness (>= 44x44px)');

  // Reset to desktop 1440px for full visibility
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 400));

  const targetEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const elements = Array.from(document.querySelectorAll("button, input, a, [role=\\"tab\\"]"));
      return elements.map(el => {
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const isVisible = r.width > 0 && r.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        return {
          tag: el.tagName,
          id: el.id || "",
          cls: el.className ? String(el.className).split(" ")[0] : "",
          text: el.innerText ? el.innerText.trim().slice(0, 30).replace(/\\n/g, " ") : (el.value || el.placeholder || ""),
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
          visible: isVisible,
          meets44x44: r.width >= 43.5 && r.height >= 43.5
        };
      });
    })()`,
    returnByValue: true
  });

  const allTargets = targetEval.result.result.value;
  const visibleTargets = allTargets.filter(t => t.visible);
  results.measurements.touchTargets = visibleTargets;

  // 4.1 Primary Controls: Theme Toggle
  const themeToggle = visibleTargets.find(t => t.id === 'theme-toggle');
  assert(themeToggle && themeToggle.meets44x44, `Theme toggle is >= 44x44px (actual: ${themeToggle?.width}x${themeToggle?.height}px)`);

  // 4.2 Primary Controls: All 7 Category Chips
  const chips = visibleTargets.filter(t => t.cls === 'chip');
  assert(chips.length >= 7, `All 7 category chips are present and visible (found: ${chips.length})`);
  chips.forEach((c, idx) => {
    assert(c.meets44x44, `Category chip #${idx + 1} "${c.text}" is >= 44x44px (actual: ${c.width}x${c.height}px)`);
  });

  // 4.3 Primary Controls: Search Input
  const searchInput = visibleTargets.find(t => t.id === 'search-input');
  assert(searchInput && searchInput.meets44x44, `Search input is >= 44x44px (actual: ${searchInput?.width}x${searchInput?.height}px)`);

  // 4.4 Primary Controls: All 14 Theme Card CTAs
  const cardCtas = visibleTargets.filter(t => t.cls === 'btn' && t.text.includes('Pilih Tema'));
  assert(cardCtas.length === 14, `All 14 theme card CTA buttons are present and visible (found: ${cardCtas.length})`, { found: cardCtas.length });
  cardCtas.forEach((cta, idx) => {
    assert(cta.meets44x44, `Theme card #${idx + 1} CTA is >= 44x44px (actual: ${cta.width}x${cta.height}px)`);
  });

  // 4.5 Primary Controls: Navigation & Consultation CTAs
  const navBack = visibleTargets.find(t => t.cls === 'nav-back');
  assert(navBack && navBack.meets44x44, `Header back button is >= 44x44px (actual: ${navBack?.width}x${navBack?.height}px)`);

  const bespokeCta = visibleTargets.find(t => t.text.includes('Konsultasi Desain Kustom'));
  assert(bespokeCta && bespokeCta.meets44x44, `Bespoke consultation CTA is >= 44x44px (actual: ${bespokeCta?.width}x${bespokeCta?.height}px)`);

  const socialLinks = visibleTargets.filter(t => t.cls === 'social-link');
  assert(socialLinks.length === 3, `All 3 footer social icon links are present (found: ${socialLinks.length})`);
  socialLinks.forEach((sl, idx) => {
    assert(sl.meets44x44, `Social link #${idx + 1} is >= 44x44px (actual: ${sl.width}x${sl.height}px)`);
  });

  // 4.6 Stress Violation Target: Clear Search Button (#clear-search)
  // Now type in search input to reveal #clear-search button and measure its rendered dimensions
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById("search-input");
      if (input) {
        input.value = "rustic";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const filteredTargetEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const clearBtn = document.getElementById("clear-search");
      const r = clearBtn ? clearBtn.getBoundingClientRect() : null;
      const style = clearBtn ? window.getComputedStyle(clearBtn) : null;
      const isVisible = r && r.width > 0 && r.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      return {
        tag: clearBtn ? clearBtn.tagName : "",
        id: clearBtn ? clearBtn.id : "",
        cls: clearBtn ? String(clearBtn.className).split(" ")[0] : "",
        width: r ? Math.round(r.width * 10) / 10 : 0,
        height: r ? Math.round(r.height * 10) / 10 : 0,
        visible: isVisible,
        meets44x44: r ? r.width >= 43.5 && r.height >= 43.5 : false
      };
    })()`,
    returnByValue: true
  });

  const clearBtn = filteredTargetEval.result.result.value;

  assert(
    clearBtn && clearBtn.visible && clearBtn.meets44x44,
    `Search clear button (#clear-search) meets mandatory >= 44x44px touch target (actual: ${clearBtn?.width}x${clearBtn?.height}px)`,
    clearBtn || {}
  );

  // Restore search
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.getElementById("search-input");
      if (input) {
        input.value = "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  /* ─────────────────────────────────────────────────────────────────────────
   * SUITE 5: Dark Mode Instantaneous Toggle & Persistence Harness
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n[Suite 5] Dark Mode Instantaneous Toggle & Persistence');

  // Set initial light mode
  await send('Runtime.evaluate', {
    expression: `(() => {
      localStorage.setItem("bk-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      if (window.applyTheme) window.applyTheme("light");
    })()`
  });

  // Click #theme-toggle to dark
  const toggleToDark = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById("theme-toggle");
      btn.click();
      return {
        theme: document.documentElement.getAttribute("data-theme"),
        hasDarkClass: document.documentElement.classList.contains("dark"),
        storage: localStorage.getItem("bk-theme")
      };
    })()`,
    returnByValue: true
  });
  const tDark = toggleToDark.result.result.value;
  assert(tDark.theme === 'dark' && tDark.hasDarkClass && tDark.storage === 'dark', 'First toggle click instantaneously activates dark mode and persists to localStorage', tDark);

  // Click #theme-toggle to light
  const toggleToLight = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById("theme-toggle");
      btn.click();
      return {
        theme: document.documentElement.getAttribute("data-theme"),
        hasDarkClass: document.documentElement.classList.contains("dark"),
        storage: localStorage.getItem("bk-theme")
      };
    })()`,
    returnByValue: true
  });
  const tLight = toggleToLight.result.result.value;
  assert(tLight.theme === 'light' && !tLight.hasDarkClass && tLight.storage === 'light', 'Second toggle click instantaneously restores light mode and persists to localStorage', tLight);

  // Reload with dark persisted
  await send('Runtime.evaluate', { expression: 'localStorage.setItem("bk-theme", "dark")' });
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 1200));

  const reloadDark = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        theme: document.documentElement.getAttribute("data-theme"),
        hasDarkClass: document.documentElement.classList.contains("dark"),
        storage: localStorage.getItem("bk-theme")
      };
    })()`,
    returnByValue: true
  });
  const rDark = reloadDark.result.result.value;
  assert(rDark.theme === 'dark' && rDark.hasDarkClass && rDark.storage === 'dark', 'Page reload preserves dark mode via anti-FOUC script & localStorage', rDark);

  // Cleanup Chrome & Server
  chromeProc.kill();
  staticServer.close();

  /* ─────────────────────────────────────────────────────────────────────────
   * VERDICT SUMMARY
   * ───────────────────────────────────────────────────────────────────────── */
  console.log('\n===============================================================');
  console.log('CHALLENGER 2 VERIFICATION SUMMARY:');
  console.log(`  PASSED : ${results.passed}`);
  console.log(`  FAILED : ${results.failed}`);
  const verdict = results.failed === 0 ? 'APPROVE' : 'FAIL';
  console.log(`  VERDICT: ${verdict}`);
  console.log('===============================================================\n');

  results.verdict = verdict;
  return results;
}

if (process.argv[1] && process.argv[1].endsWith('m3-viewport-ergonomics-stress.test.js')) {
  runM3ViewportErgonomicsTests()
    .then((res) => {
      process.exit(res.failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal error in challenger test runner:', err);
      process.exit(1);
    });
}
