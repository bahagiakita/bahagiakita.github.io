/**
 * test/challenger/run-all-challenges.js
 * Master test harness for Milestone 1 Challenger verification
 */

import { runThemeValidation } from './theme-validation.test.js';
import { runViteTailwindCompilationTest } from './vite-tailwind-compilation.test.js';

async function main() {
  console.log('====================================================');
  console.log('CHALLENGER HARNESS: MILESTONE 1 EMPIRICAL CHALLENGE');
  console.log('====================================================\n');

  const startTime = Date.now();

  const themeResults = runThemeValidation();
  console.log('\n----------------------------------------------------\n');
  const viteResults = await runViteTailwindCompilationTest();

  const totalPassed = themeResults.passed + viteResults.passed;
  const totalFailed = themeResults.failed + viteResults.failed;
  const durationMs = Date.now() - startTime;

  console.log('\n====================================================');
  console.log('FINAL CHALLENGER VERIFICATION SUMMARY');
  console.log('====================================================');
  console.log(`Themes Data Validation : ${themeResults.passed} passed, ${themeResults.failed} failed`);
  console.log(`Vite & Tailwind v4 Build: ${viteResults.passed} passed, ${viteResults.failed} failed`);
  console.log(`TOTAL                  : ${totalPassed} PASSED, ${totalFailed} FAILED in ${durationMs}ms`);
  console.log(`VERDICT                : ${totalFailed === 0 ? 'APPROVE' : 'REJECT'}`);
  console.log('====================================================');

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error in challenger runner:', err);
  process.exit(1);
});
