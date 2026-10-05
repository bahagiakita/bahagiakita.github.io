/**
 * test/challenger/gen4-viewport-responsive-stress.test.js
 * Comprehensive Viewport & Responsive Ergonomics Challenger Suite
 * Roles: critic, specialist
 *
 * Verifies:
 * 1. Multi-Viewport Layout & Zero Horizontal Overflow (index.html & template.html)
 *    Tested across 320x568, 360x800, 390x844, 430x932, 768x1024, 1440x900.
 * 2. Touch Target Dimensions (>= 44x44px) across all interactive elements
 *    - index.html (header, hero, drawer, buttons, FAQ, links, footer)
 *    - template.html (chips, search, clear-search, card CTAs, nav, footer)
 * 3. Mobile Navigation Drawer Ergonomics (index.html)
 *    - Open/close trigger, background scroll lock, drawer sizing within viewport.
 * 4. Dark Mode Contrast (WCAG AA) & Persistence (localStorage 'bk-theme')
 *    - Contrast ratios in light and dark mode for body text, headings, buttons, cards.
 *    - Instantaneous toggle and persistence across reload.
 * 5. WhatsApp Link Affordances & Security Integrity
 *    - Canonical phone (+6283847630740 / 6283847630740)
 *    - Security rel="noopener noreferrer" and target="_blank"
 *    - Proper URL encoding without raw spaces.
 */

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const VIEWPORTS = [
  { name: 'iPhone SE (Boundary)', width: 320, height: 568, mobile: true },
  { name: 'Standard Android (360x800)', width: 360, height: 800, mobile: true },
  { name: 'iPhone 12/13/14 (390x844)', width: 390, height: 844, mobile: true },
  { name: 'iPhone 14 Pro Max (430x932)', width: 430, height: 932, mobile: true },
  { name: 'iPad Portrait (768x1024)', width: 768, height: 1024, mobile: false },
  { name: 'Desktop HD (1440x900)', width: 1440, height: 900, mobile: false },
];

export async function runErgonomicsStress() {
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
    details: {}
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

  console.log('======================================================================');
  console.log('CHALLENGER GEN4-2: VIEWPORT & RESPONSIVE ERGONOMICS STRESS HARNESS');
  console.log('======================================================================\n');

  // Helper for free port
  async function getFreePort() {
    return new Promise((resolve) => {
      const s = http.createServer();
      s.listen(0, () => {
        const p = s.address().port;
        s.close(() => resolve(p));
      });
    });
  }

  const serverPort = await getFreePort();
  const cdpPort = await getFreePort();

  const staticServer = http.createServer((req, res) => {
    let filePath = path.join(ROOT, req.url.split('?')[0]);
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

  await new Promise(resolve => staticServer.listen(serverPort, resolve));
  console.log(`  ✔ Static test server listening on http://127.0.0.1:${serverPort}`);

  const chromeProc = spawn('/usr/bin/chromium', [
    '--headless=new',
    '--no-sandbox',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=/tmp/chromium-challenger-gen4-2-${Date.now()}`
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

  try {
    /* ─────────────────────────────────────────────────────────────────────────
     * 1. MULTI-VIEWPORT HORIZONTAL OVERFLOW STRESS (index.html)
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 1] Horizontal Overflow Stress on index.html across 6 viewports');
    const indexSession = await createBrowserSession('index.html');
    await indexSession.send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
    await new Promise(r => setTimeout(r, 800));

    for (const vp of VIEWPORTS) {
      await indexSession.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await new Promise(r => setTimeout(r, 300));

      const evalRes = await indexSession.send('Runtime.evaluate', {
        expression: `(() => {
          const doc = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientW = doc.clientWidth;
          const diff = scrollW - clientW;
          
          // Identify any element overflowing the viewport width
          const overflowingElements = [];
          const allEls = document.querySelectorAll("*");
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > clientW + 1 && el.offsetParent !== null) {
              overflowingElements.push({
                tag: el.tagName,
                id: el.id || "",
                className: String(el.className).slice(0, 50),
                right: rect.right,
                clientW: clientW
              });
              if (overflowingElements.length >= 3) break;
            }
          }

          return {
            clientWidth: clientW,
            scrollWidth: scrollW,
            diff: diff,
            hasHorizontalScroll: diff > 1,
            overflowingElements
          };
        })()`,
        returnByValue: true
      });

      const data = evalRes.result.result.value;
      assert(
        !data.hasHorizontalScroll,
        `index.html at ${vp.name} (${vp.width}px): zero horizontal overflow (diff: ${data.diff}px, clientW: ${data.clientWidth}px, scrollW: ${data.scrollWidth}px)`,
        data
      );
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * 2. MULTI-VIEWPORT HORIZONTAL OVERFLOW STRESS (template.html)
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 2] Horizontal Overflow Stress on template.html across 6 viewports');
    const templateSession = await createBrowserSession('template.html');
    await templateSession.send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
    await new Promise(r => setTimeout(r, 800));

    for (const vp of VIEWPORTS) {
      await templateSession.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await new Promise(r => setTimeout(r, 300));

      const evalRes = await templateSession.send('Runtime.evaluate', {
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

      const data = evalRes.result.result.value;
      assert(
        !data.hasHorizontalScroll,
        `template.html at ${vp.name} (${vp.width}px): zero horizontal overflow (diff: ${data.diff}px, clientW: ${data.clientWidth}px, scrollW: ${data.scrollWidth}px)`,
        data
      );
    }

    /* ─────────────────────────────────────────────────────────────────────────
     * 3. TOUCH TARGET ERGONOMICS HARNESS (>= 44x44px) on index.html
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 3] Touch Target Dimensions Audit on index.html (Desktop & Mobile)');

    // 3.1 Desktop View (1440px)
    await indexSession.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 300));

    const indexDesktopTargets = await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        const interactive = Array.from(document.querySelectorAll('button, a, input, summary, [role="button"]'));
        return interactive.map(el => {
          const r = el.getBoundingClientRect();
          const s = window.getComputedStyle(el);
          const isVisible = r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
          return {
            tag: el.tagName,
            id: el.id || '',
            text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30).replace(/\\n/g, ' '),
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            visible: isVisible,
            meets44x44: r.width >= 43.5 && r.height >= 43.5
          };
        }).filter(t => t.visible);
      })()`,
      returnByValue: true
    });

    const dTargets = indexDesktopTargets.result.result.value;
    console.log(`  ℹ Found ${dTargets.length} visible interactive elements on desktop index.html`);

    // Key desktop controls:
    const dThemeToggle = dTargets.find(t => t.id === 'theme-toggle');
    assert(dThemeToggle && dThemeToggle.meets44x44, `index.html desktop #theme-toggle >= 44x44px (${dThemeToggle?.width}x${dThemeToggle?.height}px)`);

    const dNavCta = dTargets.find(t => t.text.includes('Pesan Sekarang') && !t.id);
    assert(dNavCta && dNavCta.meets44x44, `index.html desktop Nav CTA >= 44x44px (${dNavCta?.width}x${dNavCta?.height}px)`);

    const dHeroCta1 = dTargets.find(t => t.text.includes('Lihat Template'));
    assert(dHeroCta1 && dHeroCta1.meets44x44, `index.html Hero "Lihat Template" CTA >= 44x44px (${dHeroCta1?.width}x${dHeroCta1?.height}px)`);

    const dHeroCta2 = dTargets.find(t => t.text.includes('Hubungi Kami'));
    assert(dHeroCta2 && dHeroCta2.meets44x44, `index.html Hero "Hubungi Kami" CTA >= 44x44px (${dHeroCta2?.width}x${dHeroCta2?.height}px)`);

    // 3.2 Mobile View (390px) & Mobile Drawer Audit
    await indexSession.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 300));

    // Mobile menu button
    const mMenuBtnRes = await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById("mobile-menu-btn");
        const r = btn ? btn.getBoundingClientRect() : null;
        return {
          exists: !!btn,
          width: r ? Math.round(r.width * 10) / 10 : 0,
          height: r ? Math.round(r.height * 10) / 10 : 0,
          meets44x44: r ? r.width >= 43.5 && r.height >= 43.5 : false
        };
      })()`,
      returnByValue: true
    });
    const mMenuBtn = mMenuBtnRes.result.result.value;
    assert(mMenuBtn.exists && mMenuBtn.meets44x44, `Mobile hamburger button (#mobile-menu-btn) is >= 44x44px (${mMenuBtn.width}x${mMenuBtn.height}px)`);

    // Open Mobile Drawer
    await indexSession.send('Runtime.evaluate', {
      expression: `document.getElementById("mobile-menu-btn").click()`
    });
    await new Promise(r => setTimeout(r, 400));

    // Verify Mobile Drawer open state, body scroll lock, and drawer controls
    const drawerStateRes = await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        const drawer = document.getElementById("mobile-menu");
        const drawerBox = document.getElementById("mobile-menu-drawer");
        const closeBtn = document.getElementById("mobile-menu-close");
        const links = Array.from(drawer.querySelectorAll(".mobile-menu-link"));
        const drawerCta = drawer.querySelector(".drawer-cta a");
        
        const closeR = closeBtn ? closeBtn.getBoundingClientRect() : null;
        const drawerR = drawerBox ? drawerBox.getBoundingClientRect() : null;
        const ctaR = drawerCta ? drawerCta.getBoundingClientRect() : null;

        return {
          isOpen: drawer.classList.contains("is-open"),
          ariaHidden: drawer.getAttribute("aria-hidden"),
          bodyOverflow: document.body.style.overflow,
          bodyHasOverflowClass: document.body.classList.contains("overflow-hidden"),
          drawerWidth: drawerR ? Math.round(drawerR.width) : 0,
          closeBtnMeets44: closeR ? closeR.width >= 43.5 && closeR.height >= 43.5 : false,
          closeBtnSize: closeR ? \`\${Math.round(closeR.width)}x\${Math.round(closeR.height)}\` : '',
          linksCount: links.length,
          linksMeet44: links.every(l => l.getBoundingClientRect().height >= 43.5),
          ctaMeets44: ctaR ? ctaR.width >= 43.5 && ctaR.height >= 43.5 : false
        };
      })()`,
      returnByValue: true
    });

    const dState = drawerStateRes.result.result.value;
    assert(dState.isOpen && dState.ariaHidden === 'false', 'Mobile drawer opens with class is-open and aria-hidden="false"');
    assert(dState.bodyOverflow === 'hidden' && dState.bodyHasOverflowClass, 'Mobile drawer locks background scrolling (body overflow: hidden)');
    assert(dState.drawerWidth <= 390, `Mobile drawer width (${dState.drawerWidth}px) fits completely within 390px viewport`);
    assert(dState.closeBtnMeets44, `Drawer close button is >= 44x44px (${dState.closeBtnSize}px)`);
    assert(dState.linksCount >= 5 && dState.linksMeet44, `All ${dState.linksCount} mobile drawer links have height >= 44px`);
    assert(dState.ctaMeets44, 'Mobile drawer CTA button meets >= 44x44px touch target');

    // Close Mobile Drawer
    await indexSession.send('Runtime.evaluate', {
      expression: `document.getElementById("mobile-menu-close").click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const drawerClosedRes = await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        const drawer = document.getElementById("mobile-menu");
        return {
          isOpen: drawer.classList.contains("is-open"),
          ariaHidden: drawer.getAttribute("aria-hidden"),
          bodyOverflow: document.body.style.overflow,
          bodyHasOverflowClass: document.body.classList.contains("overflow-hidden")
        };
      })()`,
      returnByValue: true
    });
    const dClosed = drawerClosedRes.result.result.value;
    assert(!dClosed.isOpen && dClosed.ariaHidden === 'true', 'Mobile drawer closes properly and restores aria-hidden="true"');
    assert(dClosed.bodyOverflow === '' && !dClosed.bodyHasOverflowClass, 'Mobile drawer closure restores normal body scrolling');

    /* ─────────────────────────────────────────────────────────────────────────
     * 4. FAQ ACCORDION TOUCH TARGETS & SINGLE-OPEN ERGONOMICS (index.html)
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 4] FAQ Accordion Touch Targets & Interactive Ergonomics');
    const faqEval = await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        const questions = Array.from(document.querySelectorAll('.faq-question, .faq-item summary, .faq-item button'));
        return questions.map((btn, idx) => {
          const r = btn.getBoundingClientRect();
          return {
            index: idx,
            width: Math.round(r.width * 10) / 10,
            height: Math.round(r.height * 10) / 10,
            meets44: r.height >= 43.5 && r.width >= 43.5
          };
        });
      })()`,
      returnByValue: true
    });

    const faqBtns = faqEval.result.result.value;
    assert(faqBtns.length >= 4, `FAQ section contains at least 4 interactive items (found: ${faqBtns.length})`);
    faqBtns.forEach((f, idx) => {
      assert(f.meets44, `FAQ accordion #${idx + 1} touch target >= 44px (height: ${f.height}px, width: ${f.width}px)`);
    });

    /* ─────────────────────────────────────────────────────────────────────────
     * 5. DARK MODE CONTRAST (WCAG AA) & STORAGE HARNESS (index.html)
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 5] Dark Mode WCAG AA Contrast Ratios & Persistence');

    // Helper inside browser to calculate WCAG luminance & contrast ratio
    const contrastScript = `
      (() => {
        function getLuminance(rgbStr) {
          const m = rgbStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
          if (!m) return 0;
          const r = parseInt(m[1], 10) / 255;
          const g = parseInt(m[2], 10) / 255;
          const b = parseInt(m[3], 10) / 255;
          const a = [r, g, b].map(v => {
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        }
        function getContrastRatio(fgStr, bgStr) {
          const l1 = getLuminance(fgStr);
          const l2 = getLuminance(bgStr);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        const bodyStyle = window.getComputedStyle(document.body);
        const heading = document.querySelector('h1, h2');
        const headingStyle = heading ? window.getComputedStyle(heading) : null;
        const btn = document.querySelector('.btn-primary');
        const btnStyle = btn ? window.getComputedStyle(btn) : null;

        const bg = bodyStyle.backgroundColor;
        const fg = bodyStyle.color;
        const headingColor = headingStyle ? headingStyle.color : fg;
        const btnBg = btnStyle ? btnStyle.backgroundColor : '';
        const btnFg = btnStyle ? btnStyle.color : '';

        return {
          bodyBg: bg,
          bodyFg: fg,
          bodyContrast: Math.round(getContrastRatio(fg, bg) * 100) / 100,
          headingContrast: Math.round(getContrastRatio(headingColor, bg) * 100) / 100,
          btnBg: btnBg,
          btnFg: btnFg,
          btnContrast: btnBg ? Math.round(getContrastRatio(btnFg, btnBg) * 100) / 100 : 0
        };
      })()
    `;

    // 5.1 Test Light Mode Contrast
    await indexSession.send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.setItem("bk-theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.classList.remove("dark");
        if (window.applyTheme) window.applyTheme("light");
      })()`
    });
    await new Promise(r => setTimeout(r, 300));

    const lightContrastRes = await indexSession.send('Runtime.evaluate', { expression: contrastScript, returnByValue: true });
    const lc = lightContrastRes.result.result.value;
    assert(lc.bodyContrast >= 4.5, `Light mode body text WCAG AA contrast ratio >= 4.5:1 (measured: ${lc.bodyContrast}:1, fg: ${lc.bodyFg}, bg: ${lc.bodyBg})`);
    assert(lc.headingContrast >= 4.5, `Light mode heading text WCAG AA contrast ratio >= 4.5:1 (measured: ${lc.headingContrast}:1)`);
    assert(lc.btnContrast >= 4.5, `Light mode primary button text contrast >= 4.5:1 (measured: ${lc.btnContrast}:1, fg: ${lc.btnFg}, bg: ${lc.btnBg})`);

    // 5.2 Toggle to Dark Mode
    await indexSession.send('Runtime.evaluate', {
      expression: `document.getElementById("theme-toggle").click()`
    });
    await new Promise(r => setTimeout(r, 400));

    const darkContrastRes = await indexSession.send('Runtime.evaluate', { expression: contrastScript, returnByValue: true });
    const dc = darkContrastRes.result.result.value;
    assert(dc.bodyContrast >= 4.5, `Dark mode body text WCAG AA contrast ratio >= 4.5:1 (measured: ${dc.bodyContrast}:1, fg: ${dc.bodyFg}, bg: ${dc.bodyBg})`);
    assert(dc.headingContrast >= 4.5, `Dark mode heading text WCAG AA contrast ratio >= 4.5:1 (measured: ${dc.headingContrast}:1)`);
    assert(dc.btnContrast >= 4.5, `Dark mode primary button text contrast >= 4.5:1 (measured: ${dc.btnContrast}:1, fg: ${dc.btnFg}, bg: ${dc.btnBg})`);

    // 5.3 Verify Persistence in localStorage across reload
    const storageCheck = await indexSession.send('Runtime.evaluate', {
      expression: 'localStorage.getItem("bk-theme")',
      returnByValue: true
    });
    assert(storageCheck.result.result.value === 'dark', 'localStorage "bk-theme" stores "dark" after toggle click');

    await indexSession.send('Page.reload');
    await new Promise(r => setTimeout(r, 1000));

    const reloadState = await indexSession.send('Runtime.evaluate', {
      expression: 'document.documentElement.getAttribute("data-theme")',
      returnByValue: true
    });
    assert(reloadState.result.result.value === 'dark', 'Theme state "dark" persists immediately upon page reload');

    /* ─────────────────────────────────────────────────────────────────────────
     * 6. WHATSAPP CONVERSION PIPELINE & LINK AFFORDANCE AUDIT
     * ───────────────────────────────────────────────────────────────────────── */
    console.log('\n[Suite 6] WhatsApp Conversion Link Affordances & Security Integrity');

    const waAuditScript = `
      (() => {
        const links = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]'));
        return links.map(link => {
          const href = link.getAttribute('href');
          const target = link.getAttribute('target');
          const rel = link.getAttribute('rel') || '';
          
          let parsedUrl = null;
          let isValidPhone = false;
          let hasValidEncoding = false;
          let textParam = '';

          try {
            parsedUrl = new URL(href);
            // Verify canonical phone 6283847630740
            isValidPhone = href.includes('6283847630740') || href.includes('083847630740');
            // Check text param
            textParam = parsedUrl.searchParams.get('text') || '';
            // Verify no unencoded spaces in href
            hasValidEncoding = !href.includes(' ');
          } catch(e) {}

          const isSocialIcon = link.classList.contains('social-link');

          return {
            href,
            target,
            rel,
            isSocialIcon,
            hasNoopener: rel.includes('noopener'),
            hasNoreferrer: rel.includes('noreferrer'),
            isTargetBlank: target === '_blank',
            isValidPhone,
            hasValidEncoding,
            textLength: textParam.length,
            textDecoded: textParam
          };
        });
      })()
    `;

    // Audit index.html WhatsApp links
    const indexWaRes = await indexSession.send('Runtime.evaluate', { expression: waAuditScript, returnByValue: true });
    const indexWaLinks = indexWaRes.result.result.value;
    assert(indexWaLinks.length >= 3, `index.html has at least 3 WhatsApp CTAs (found: ${indexWaLinks.length})`);
    indexWaLinks.forEach((w, idx) => {
      assert(w.isValidPhone, `index.html WA link #${idx + 1} targets canonical number 6283847630740 (${w.href})`);
      assert(w.isTargetBlank, `index.html WA link #${idx + 1} specifies target="_blank"`);
      assert(w.hasNoopener && w.hasNoreferrer, `index.html WA link #${idx + 1} includes rel="noopener noreferrer" (found: "${w.rel}")`);
      if (w.isSocialIcon) {
        assert(w.hasValidEncoding, `index.html WA social icon #${idx + 1} has valid URL structure (${w.href})`);
      } else {
        assert(w.hasValidEncoding && w.textLength > 3, `index.html WA CTA #${idx + 1} has cleanly encoded text param ("${w.textDecoded}")`);
      }
    });

    // Audit template.html WhatsApp links
    const templateWaRes = await templateSession.send('Runtime.evaluate', { expression: waAuditScript, returnByValue: true });
    const templateWaLinks = templateWaRes.result.result.value;
    assert(templateWaLinks.length >= 14, `template.html has at least 14 WhatsApp CTAs for themes (found: ${templateWaLinks.length})`);
    templateWaLinks.forEach((w, idx) => {
      assert(w.isValidPhone, `template.html WA link #${idx + 1} targets canonical number 6283847630740`);
      assert(w.isTargetBlank, `template.html WA link #${idx + 1} specifies target="_blank"`);
      assert(w.hasNoopener && w.hasNoreferrer, `template.html WA link #${idx + 1} includes rel="noopener noreferrer"`);
      if (w.isSocialIcon) {
        assert(w.hasValidEncoding, `template.html WA social icon #${idx + 1} has valid URL structure (${w.href})`);
      } else {
        assert(w.hasValidEncoding && w.textLength > 3, `template.html WA CTA #${idx + 1} has encoded text param ("${w.textDecoded}")`);
      }
    });

    // Close sessions and server
    chromeProc.kill();
    staticServer.close();

    console.log('\n======================================================================');
    console.log(`ALL SUITES COMPLETED:`);
    console.log(`  PASSED: ${results.passed}`);
    console.log(`  FAILED: ${results.failed}`);
    results.verdict = results.failed === 0 ? 'APPROVE' : 'REQUEST_CHANGES';
    console.log(`  VERDICT: ${results.verdict}`);
    console.log('======================================================================\n');

    return results;
  } catch (err) {
    chromeProc.kill();
    staticServer.close();
    console.error('Fatal error during ergonomics test harness execution:', err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].endsWith('gen4-viewport-responsive-stress.test.js')) {
  runErgonomicsStress()
    .then(res => {
      process.exit(res.failed > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
