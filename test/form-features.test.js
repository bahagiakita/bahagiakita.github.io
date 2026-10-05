import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const htmlContent = readFileSync(resolve(rootDir, 'form/index.html'), 'utf-8');
const appJsContent = readFileSync(resolve(rootDir, 'form/js/form-app.js'), 'utf-8');
const validationJsContent = readFileSync(resolve(rootDir, 'form/js/form-validation.js'), 'utf-8');
const submitJsContent = readFileSync(resolve(rootDir, 'form/js/form-submit.js'), 'utf-8');
const cssContent = readFileSync(resolve(rootDir, 'form/css/form-styles.css'), 'utf-8');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

console.log('Testing Form Alignment with wedding-config.js:');

// Test 1: Religion options in HTML
assert(
  htmlContent.includes('name="agama" value="islam"') &&
  htmlContent.includes('name="agama" value="kristen"') &&
  htmlContent.includes('name="agama" value="katolik"') &&
  htmlContent.includes('name="agama" value="hindu"') &&
  htmlContent.includes('name="agama" value="buddha"') &&
  htmlContent.includes('name="agama" value="universal"'),
  'form/index.html contains all 6 religion options (Islam, Kristen, Katolik, Hindu, Buddha, Lainnya)'
);

// Test 2: Photo mode in HTML
assert(
  htmlContent.includes('name="mode-foto" value="pakai-foto"') &&
  htmlContent.includes('name="mode-foto" value="tanpa-foto"'),
  'form/index.html contains both photo modes (Pakai Foto Sendiri vs Mode Tanpa Foto)'
);

// Test 3: No mention of "susul via WA"
assert(
  !htmlContent.includes('menyusul via WhatsApp') &&
  !htmlContent.includes('susul via WA'),
  'form/index.html does not contain "susul via WA" or "menyusul via WhatsApp"'
);

// Test 4: Physical gift recipient name field exists
assert(
  htmlContent.includes('id="nama-penerima-kado"') &&
  htmlContent.includes('name="nama-penerima-kado"'),
  'form/index.html contains nama-penerima-kado input field'
);

// Test 5: YouTube prewedding video toggle and link field exist
assert(
  htmlContent.includes('id="toggle-youtube"') &&
  htmlContent.includes('id="link-youtube"'),
  'form/index.html contains toggle-youtube and link-youtube fields'
);

// Test 6: Dynamic ceremony labels in form-app.js
assert(
  appJsContent.includes('CEREMONY_PRESETS') &&
  appJsContent.includes('setupAgamaSelection') &&
  appJsContent.includes('setupPhotoModeSelection') &&
  appJsContent.includes('setupYouTubeToggle'),
  'form/js/form-app.js defines CEREMONY_PRESETS and setup handlers'
);

// Test 7: Validation rules include link-youtube and pattern safety
assert(
  validationJsContent.includes('link-youtube') &&
  validationJsContent.includes('rules.pattern && value && !rules.pattern.test(value)'),
  'form/js/form-validation.js includes link-youtube validation and safe pattern test'
);

// Test 8: Form submit collects new fields
assert(
  submitJsContent.includes('data["agama"]') &&
  submitJsContent.includes('data["nama-acara-1"]') &&
  submitJsContent.includes('data["mode-foto"]') &&
  submitJsContent.includes('data["has-photos"]') &&
  submitJsContent.includes('data["nama-penerima-kado"]') &&
  submitJsContent.includes('data["youtube-enabled"]') &&
  submitJsContent.includes('data["link-youtube"]'),
  'form/js/form-submit.js collects all new fields in collectFormData'
);

// Test 9: CSS styles for religion and photo mode
assert(
  cssContent.includes('.religion-grid') &&
  cssContent.includes('.religion-card') &&
  cssContent.includes('.photo-mode-grid') &&
  cssContent.includes('.photo-mode-card') &&
  cssContent.includes('.no-photos-info-card'),
  'form/css/form-styles.css contains styling for religion, photo mode, and silhouette notice'
);

// Test 10: Landing page does not link to form
const landingContent = readFileSync(resolve(rootDir, 'index.html'), 'utf-8');
assert(
  !landingContent.includes('href="/form"') &&
  !landingContent.includes('href="./form"') &&
  !landingContent.includes('href="form"'),
  'index.html does not link to /form'
);

// Test 11: Bank list datalist and inputs have list="bank-list"
assert(
  htmlContent.includes('<datalist id="bank-list">') &&
  htmlContent.includes('id="bank-1" name="bank-1" class="form-input" placeholder="BCA" list="bank-list"') &&
  htmlContent.includes('<option value="BCA">') &&
  htmlContent.includes('<option value="Mandiri">') &&
  htmlContent.includes('<option value="BSI (Bank Syariah Indonesia)">') &&
  htmlContent.includes('<option value="QRIS">'),
  'form/index.html contains datalist with bank options and links inputs with list="bank-list"'
);

// Test 12: Dress code and Protocols toggles exist in HTML
assert(
  htmlContent.includes('id="toggle-dress-code"') &&
  htmlContent.includes('id="sub-dress-code"') &&
  htmlContent.includes('id="dress-code-theme"') &&
  htmlContent.includes('id="toggle-protocols"') &&
  htmlContent.includes('id="sub-protocols"') &&
  htmlContent.includes('id="protocols-tips"'),
  'form/index.html contains toggle-dress-code, toggle-protocols, and their sub-sections'
);

// Test 13: form-app.js handles toggles for dress code and protocols
assert(
  appJsContent.includes('toggleDressCode') &&
  appJsContent.includes('toggleProtocols'),
  'form/js/form-app.js sets up event listeners for dress code and protocols toggles'
);

// Test 14: form-submit.js collects dress code and protocols
assert(
  submitJsContent.includes('data["dress-code-enabled"]') &&
  submitJsContent.includes('data["dress-code-theme"]') &&
  submitJsContent.includes('data["protocols-enabled"]') &&
  submitJsContent.includes('data["protocols-tips"]'),
  'form/js/form-submit.js collects dress code and protocols data properly'
);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
