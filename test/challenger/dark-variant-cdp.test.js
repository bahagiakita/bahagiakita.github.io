/**
 * test/challenger/dark-variant-cdp.test.js
 * Empirical CDP Verification of Tailwind v4 Dark Variant Scoping & WCAG AA Contrast
 *
 * Specifically tests the issue identified by challenger_gen4_1:
 * - Forced OS light mode: prefers-color-scheme: light
 * - Toggling theme via #theme-toggle
 * - Verifying data-theme="dark" AND .dark class on root
 * - Measuring computed styles of:
 *     - .nav-link-desktop (active & inactive links)
 *     - .hero-stats .num-big (color)
 *     - document.body (background-color)
 * - Calculating exact WCAG AA contrast ratio against dark surface #121612
 * - Testing persistence across full page reload under forced OS light mode
 * - Testing template.html under the same conditions
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SERVER_PORT = 9945;
const CDP_PORT = 9946;

function getRelativeLuminance(rgbStr) {
  const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return 0;
  const [r, g, b] = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(fgRgb, bgRgb) {
  const l1 = getRelativeLuminance(fgRgb);
  const l2 = getRelativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export async function runDarkVariantCdpVerification() {
  console.log('===============================================================');
  console.log('CHALLENGER 3: EMPIRICAL DARK VARIANT SCOPING & CONTRAST TEST');
  console.log('===============================================================');

  const results = {
    passed: 0,
    failed: 0,
    assertions: []
  };

  function assert(condition, message, details = {}) {
    if (condition) {
      results.passed++;
      results.assertions.push({ status: 'PASS', message });
      console.log(`  ✔ PASS: ${message}`);
    } else {
      results.failed++;
      results.assertions.push({ status: 'FAIL', message, details });
      console.error(`  ❌ FAIL: ${message}`, details);
    }
  }

  // 1. Spin up HTTP static server
  const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const filePath = path.join(ROOT, p);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    const mimeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  });

  await new Promise(resolve => server.listen(SERVER_PORT, resolve));
  console.log(`[HTTP Server] Listening on http://127.0.0.1:${SERVER_PORT}`);

  // 2. Launch headless Chromium
  const chromeDir = `/tmp/test-cdp-dark-verify-${Date.now()}`;
  const chromeProcess = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${chromeDir}`
  ]);

  await new Promise(resolve => setTimeout(resolve, 1500));

  async function createCdpSession(targetUrl) {
    const pageRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(targetUrl)}`, { method: 'PUT' });
    const page = await pageRes.json();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    ws.onmessage = evt => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
    };

    function send(method, params = {}) {
      return new Promise(res => {
        const id = msgId++;
        pending.set(id, res);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await new Promise(res => { ws.onopen = res; });
    await send('Page.enable');
    await send('Runtime.enable');

    return { ws, send, targetId: page.id };
  }

  async function waitForDom(session, selector = 'body') {
    for (let i = 0; i < 50; i++) {
      const res = await session.send('Runtime.evaluate', {
        expression: `document.readyState === "complete" && !!document.body && !!document.querySelector('${selector}')`,
        returnByValue: true
      });
      if (res?.result?.result?.value === true) return;
      await new Promise(r => setTimeout(r, 100));
    }
  }

  try {
    const session = await createCdpSession(`http://127.0.0.1:${SERVER_PORT}/index.html`);

    // Force OS media emulation to LIGHT mode
    console.log('\n[Phase 1] Forcing OS media to prefers-color-scheme: light');
    await session.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-color-scheme', value: 'light' }]
    });

    // Reset storage to light mode and reload
    await session.send('Runtime.evaluate', { expression: `localStorage.setItem("bk-theme", "light")` });
    await session.send('Page.reload');
    await waitForDom(session, '.hero-stats .num-big');

    // Verify initial light mode
    const initialEval = await session.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const navLinks = Array.from(document.querySelectorAll(".nav-link-desktop")).map(el => ({
          text: el.textContent.trim(),
          color: window.getComputedStyle(el).color
        }));
        const numBig = document.querySelector(".hero-stats .num-big");
        return {
          dataTheme: root.getAttribute("data-theme"),
          hasDarkClass: root.classList.contains("dark"),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          navLinks: navLinks,
          numColor: numBig ? window.getComputedStyle(numBig).color : null
        };
      })()`,
      returnByValue: true
    });
    const initData = initialEval.result.result.value;
    console.log('  Initial state under OS light mode: dataTheme =', initData.dataTheme, ', bodyBg =', initData.bodyBg);
    assert(initData.dataTheme === 'light', 'Initial data-theme attribute is "light"');
    assert(initData.hasDarkClass === false, 'Initial root classList does NOT contain "dark"');
    assert(initData.bodyBg === 'rgb(251, 249, 245)', `Initial body background is light surface #fbf9f5 (${initData.bodyBg})`);
    assert(initData.numColor === 'rgb(27, 33, 26)', `Initial .hero-stats .num-big color is Sage-900 rgb(27, 33, 26)`);

    // Phase 2: Click #theme-toggle to activate Dark Mode
    console.log('\n[Phase 2] Clicking #theme-toggle to activate Dark Mode under OS light mode');
    const toggleClickRes = await session.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById("theme-toggle");
        if (!btn) return { clicked: false, error: "theme-toggle not found" };
        btn.click();
        return { clicked: true };
      })()`,
      returnByValue: true
    });
    assert(toggleClickRes.result.result.value.clicked === true, '#theme-toggle clicked successfully');

    await new Promise(r => setTimeout(r, 600));

    // Measure post-toggle styles
    const darkEval = await session.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const navLinks = Array.from(document.querySelectorAll(".nav-link-desktop")).map(el => ({
          text: el.textContent.trim(),
          color: window.getComputedStyle(el).color,
          isActive: el.classList.contains("active")
        }));
        const numBig = document.querySelector(".hero-stats .num-big");
        return {
          dataTheme: root.getAttribute("data-theme"),
          hasDarkClass: root.classList.contains("dark"),
          storedTheme: localStorage.getItem("bk-theme"),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          navLinks: navLinks,
          numColor: numBig ? window.getComputedStyle(numBig).color : null
        };
      })()`,
      returnByValue: true
    });

    const darkData = darkEval.result.result.value;
    console.log('  Dark mode state after toggle click: dataTheme =', darkData.dataTheme, ', bodyBg =', darkData.bodyBg);

    // Assertions for dark theme attributes and class
    assert(darkData.dataTheme === 'dark', 'root has data-theme="dark"');
    assert(darkData.hasDarkClass === true, 'root classList contains "dark"');
    assert(darkData.storedTheme === 'dark', 'localStorage bk-theme is "dark"');
    assert(darkData.bodyBg === 'rgb(18, 22, 18)', `document.body has dark surface rgb(18, 22, 18) (#121612)`);

    // Assertions for computed colors
    // Active nav link (index 0 'Beranda') has dark:text-sage-300 rgb(167, 194, 167)
    const activeNav = darkData.navLinks.find(l => l.isActive);
    assert(activeNav && activeNav.color === 'rgb(167, 194, 167)', `Active .nav-link-desktop ('${activeNav?.text}') color is Sage-300 rgb(167, 194, 167)`);

    // Inactive nav links (e.g. 'Fitur', 'Template', etc.) have dark:text-sage-200 rgb(203, 219, 203)
    const inactiveNav = darkData.navLinks.find(l => !l.isActive);
    assert(inactiveNav && inactiveNav.color === 'rgb(203, 219, 203)', `Inactive .nav-link-desktop ('${inactiveNav?.text}') color is Sage-200 rgb(203, 219, 203)`);

    // .hero-stats .num-big has dark:text-sage-100 (#e5ece2 -> rgb(229, 236, 226))
    assert(darkData.numColor === 'rgb(229, 236, 226)', `.hero-stats .num-big color is Sage-100 rgb(229, 236, 226)`);

    // Phase 3: Calculate and verify WCAG AA Contrast Ratios against #121612
    console.log('\n[Phase 3] Calculating WCAG AA Contrast Ratios on dark surface #121612');
    const darkSurfaceRgb = 'rgb(18, 22, 18)';

    const activeNavContrast = calculateContrastRatio(activeNav.color, darkSurfaceRgb);
    const inactiveNavContrast = calculateContrastRatio(inactiveNav.color, darkSurfaceRgb);
    const numContrast = calculateContrastRatio(darkData.numColor, darkSurfaceRgb);

    console.log(`  Active nav link (${activeNav.color}) vs #121612: ${activeNavContrast.toFixed(2)}:1`);
    console.log(`  Inactive nav link (${inactiveNav.color}) vs #121612: ${inactiveNavContrast.toFixed(2)}:1`);
    console.log(`  .hero-stats .num-big (${darkData.numColor}) vs #121612: ${numContrast.toFixed(2)}:1`);

    assert(activeNavContrast >= 4.5, `Active .nav-link-desktop contrast ratio >= 4.5:1 (actual: ${activeNavContrast.toFixed(2)}:1)`);
    assert(activeNavContrast >= 7.0, `Active .nav-link-desktop contrast ratio satisfies WCAG AAA >= 7.0:1 (actual: ${activeNavContrast.toFixed(2)}:1)`);

    assert(inactiveNavContrast >= 4.5, `Inactive .nav-link-desktop contrast ratio >= 4.5:1 (actual: ${inactiveNavContrast.toFixed(2)}:1)`);
    assert(inactiveNavContrast >= 7.0, `Inactive .nav-link-desktop contrast ratio satisfies WCAG AAA >= 7.0:1 (actual: ${inactiveNavContrast.toFixed(2)}:1)`);

    assert(numContrast >= 4.5, `.hero-stats .num-big contrast ratio >= 4.5:1 (actual: ${numContrast.toFixed(2)}:1)`);
    assert(numContrast >= 7.0, `.hero-stats .num-big contrast ratio satisfies WCAG AAA >= 7.0:1 (actual: ${numContrast.toFixed(2)}:1)`);

    // Phase 4: Anti-FOUC and Page Reload Persistence under OS Light Mode
    console.log('\n[Phase 4] Testing Anti-FOUC and Reload Persistence under OS light mode');
    await session.send('Page.reload');
    await waitForDom(session, '.hero-stats .num-big');

    const reloadedEval = await session.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const navLinks = Array.from(document.querySelectorAll(".nav-link-desktop")).map(el => ({
          text: el.textContent.trim(),
          color: window.getComputedStyle(el).color,
          isActive: el.classList.contains("active")
        }));
        const numBig = document.querySelector(".hero-stats .num-big");
        return {
          dataTheme: root.getAttribute("data-theme"),
          hasDarkClass: root.classList.contains("dark"),
          navLinks: navLinks,
          numColor: numBig ? window.getComputedStyle(numBig).color : null
        };
      })()`,
      returnByValue: true
    });
    const reloadedData = reloadedEval.result.result.value;
    console.log('  State after reload (with localStorage bk-theme="dark"): dataTheme =', reloadedData.dataTheme);

    assert(reloadedData.dataTheme === 'dark', 'Post-reload root retains data-theme="dark"');
    assert(reloadedData.hasDarkClass === true, 'Post-reload root retains "dark" class');

    const reloadedActive = reloadedData.navLinks.find(l => l.isActive);
    const reloadedInactive = reloadedData.navLinks.find(l => !l.isActive);
    assert(reloadedActive && reloadedActive.color === 'rgb(167, 194, 167)', 'Post-reload active .nav-link-desktop retains Sage-300 color');
    assert(reloadedInactive && reloadedInactive.color === 'rgb(203, 219, 203)', 'Post-reload inactive .nav-link-desktop retains Sage-200 color');
    assert(reloadedData.numColor === 'rgb(229, 236, 226)', 'Post-reload .hero-stats .num-big retains Sage-100 color');

    // Phase 5: Toggle back to light mode
    console.log('\n[Phase 5] Toggling back to Light Mode');
    await session.send('Runtime.evaluate', {
      expression: `document.getElementById("theme-toggle").click()`
    });
    await new Promise(r => setTimeout(r, 600));

    const revertedEval = await session.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const navLinks = Array.from(document.querySelectorAll(".nav-link-desktop")).map(el => ({
          text: el.textContent.trim(),
          color: window.getComputedStyle(el).color,
          isActive: el.classList.contains("active")
        }));
        const numBig = document.querySelector(".hero-stats .num-big");
        return {
          dataTheme: root.getAttribute("data-theme"),
          hasDarkClass: root.classList.contains("dark"),
          storedTheme: localStorage.getItem("bk-theme"),
          navLinks: navLinks,
          numColor: numBig ? window.getComputedStyle(numBig).color : null
        };
      })()`,
      returnByValue: true
    });
    const revertedData = revertedEval.result.result.value;
    console.log('  State after reverting back to light mode: dataTheme =', revertedData.dataTheme);

    assert(revertedData.dataTheme === 'light', 'Reverted data-theme attribute is "light"');
    assert(revertedData.hasDarkClass === false, 'Reverted root classList does NOT contain "dark"');
    assert(revertedData.storedTheme === 'light', 'localStorage bk-theme updated to "light"');

    const revActive = revertedData.navLinks.find(l => l.isActive);
    const revInactive = revertedData.navLinks.find(l => !l.isActive);
    assert(revActive && revActive.color === 'rgb(57, 69, 53)', `Reverted active .nav-link-desktop color is Sage-700 rgb(57, 69, 53)`);
    assert(revInactive && revInactive.color === 'rgb(57, 69, 53)', `Reverted inactive .nav-link-desktop color is Sage-700 rgb(57, 69, 53)`);
    assert(revertedData.numColor === 'rgb(27, 33, 26)', 'Reverted .hero-stats .num-big color is Sage-900 rgb(27, 33, 26)');

    // Phase 6: Verify template.html under forced OS light mode
    console.log('\n[Phase 6] Verifying template.html under forced OS light mode');
    const gallerySession = await createCdpSession(`http://127.0.0.1:${SERVER_PORT}/template.html`);
    await gallerySession.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-color-scheme', value: 'light' }]
    });
    await gallerySession.send('Runtime.evaluate', { expression: `localStorage.setItem("bk-theme", "light")` });
    await gallerySession.send('Page.reload');
    await waitForDom(gallerySession, '.theme-card');

    // Toggle theme on template.html
    await gallerySession.send('Runtime.evaluate', {
      expression: `document.getElementById("theme-toggle").click()`
    });
    await new Promise(r => setTimeout(r, 600));

    const galleryDarkEval = await gallerySession.send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.documentElement;
        const title = document.querySelector("h1, h2");
        const inactiveChip = document.querySelector(".chip:not(.active)");
        const cardTitle = document.querySelector(".theme-card h3");
        const lead = document.querySelector(".lead");
        return {
          dataTheme: root.getAttribute("data-theme"),
          hasDarkClass: root.classList.contains("dark"),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          titleColor: title ? window.getComputedStyle(title).color : null,
          chipColor: inactiveChip ? window.getComputedStyle(inactiveChip).color : null,
          cardTitleColor: cardTitle ? window.getComputedStyle(cardTitle).color : null,
          leadColor: lead ? window.getComputedStyle(lead).color : null
        };
      })()`,
      returnByValue: true
    });
    const gData = galleryDarkEval.result.result.value;
    console.log('  template.html state after toggle click:', gData);

    assert(gData.dataTheme === 'dark', 'template.html root has data-theme="dark"');
    assert(gData.hasDarkClass === true, 'template.html root classList contains "dark"');
    assert(gData.bodyBg === 'rgb(18, 22, 18)', 'template.html body background is rgb(18, 22, 18)');

    if (gData.chipColor) {
      const chipContrast = calculateContrastRatio(gData.chipColor, darkSurfaceRgb);
      console.log(`  template.html inactive chip (${gData.chipColor}) vs #121612: ${chipContrast.toFixed(2)}:1`);
      assert(chipContrast >= 4.5, `template.html inactive chip contrast >= 4.5:1 (actual: ${chipContrast.toFixed(2)}:1)`);
    }

    if (gData.leadColor) {
      const leadContrast = calculateContrastRatio(gData.leadColor, darkSurfaceRgb);
      console.log(`  template.html lead text (${gData.leadColor}) vs #121612: ${leadContrast.toFixed(2)}:1`);
      assert(leadContrast >= 4.5, `template.html lead text contrast >= 4.5:1 (actual: ${leadContrast.toFixed(2)}:1)`);
    }

    if (gData.cardTitleColor) {
      const cardContrast = calculateContrastRatio(gData.cardTitleColor, darkSurfaceRgb);
      console.log(`  template.html card title (${gData.cardTitleColor}) vs #121612: ${cardContrast.toFixed(2)}:1`);
      assert(cardContrast >= 4.5, `template.html card title contrast >= 4.5:1 (actual: ${cardContrast.toFixed(2)}:1)`);
    }

    session.ws.close();
    gallerySession.ws.close();
  } finally {
    chromeProcess.kill();
    server.close();
    try {
      fs.rmSync(chromeDir, { recursive: true, force: true });
    } catch (e) {}
  }

  console.log('\n===============================================================');
  console.log(`CDP VERIFICATION SUMMARY:`);
  console.log(`  PASSED: ${results.passed}`);
  console.log(`  FAILED: ${results.failed}`);
  console.log(`  VERDICT: ${results.failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES'}`);
  console.log('===============================================================\n');

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('dark-variant-cdp.test.js')) {
  runDarkVariantCdpVerification().then(res => {
    process.exit(res.failed === 0 ? 0 : 1);
  }).catch(err => {
    console.error('Test run error:', err);
    process.exit(1);
  });
}
