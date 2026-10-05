#!/usr/bin/env node
/**
 * Bahagiakita E2E Test Runner
 * Opaque-box requirement-driven test runner across Tiers 1-4
 *
 * Usage:
 *   node test/e2e-runner.js                     # Run all test suites
 *   node test/e2e-runner.js --tier 1            # Run Tier 1 only
 *   node test/e2e-runner.js --milestone M1      # Run Milestone 1 tests only
 *   node test/e2e-runner.js --suite build-infra # Run specific suite
 *   node test/e2e-runner.js --json              # Output machine-readable JSON
 */

import { defaultRegistry } from './utils/test-context.js';
import { registerBuildInfraSuite } from './suites/tier1-features/build-infra.test.js';
import { registerHtmlStructureSuite } from './suites/tier1-features/html-structure.test.js';
import { registerThemesDataSuite } from './suites/tier1-features/themes-data.test.js';
import { registerNavigationDrawerSuite } from './suites/tier1-features/navigation-drawer.test.js';
import { registerThemeToggleSuite } from './suites/tier1-features/theme-toggle.test.js';
import { registerFaqAccordionSuite } from './suites/tier1-features/faq-accordion.test.js';
import { registerGallerySearchFilterSuite } from './suites/tier1-features/gallery-search-filter.test.js';
import { registerWhatsAppUrlsSuite } from './suites/tier1-features/whatsapp-urls.test.js';
import { registerResponsiveMetaSuite } from './suites/tier1-features/responsive-meta.test.js';
import { registerBoundaryCornerCasesSuite } from './suites/tier2-boundaries/boundary-corner-cases.test.js';
import { registerCrossFeatureCombinationsSuite } from './suites/tier3-combinations/cross-feature-combinations.test.js';
import { registerUserJourneysSuite } from './suites/tier4-journeys/user-journeys.test.js';

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tier: null,
    milestone: null,
    suite: null,
    featureId: null,
    json: false,
    verbose: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--tier' && args[i + 1]) {
      options.tier = args[++i];
    } else if (arg === '--milestone' && args[i + 1]) {
      options.milestone = args[++i];
    } else if (arg === '--suite' && args[i + 1]) {
      options.suite = args[++i];
    } else if (arg === '--featureId' && args[i + 1]) {
      options.featureId = args[++i];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }
  return options;
}

function printHelp() {
  console.log(`
${colors.bold}Bahagiakita E2E Test Suite Runner${colors.reset}

Options:
  --tier <1|2|3|4>        Run only tests in the specified tier
  --milestone <M1|M2|M3>  Run only tests mapped to the given milestone
  --suite <name>          Filter suites by name substring
  --featureId <id>        Filter by feature ID (e.g. F01, F25)
  --json                  Output raw JSON results for CI/agent aggregation
  --verbose               Show extra debug information
  --help, -h              Show this help message
`);
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Register all suites
  registerBuildInfraSuite();
  registerHtmlStructureSuite();
  registerThemesDataSuite();
  registerNavigationDrawerSuite();
  registerThemeToggleSuite();
  registerFaqAccordionSuite();
  registerGallerySearchFilterSuite();
  registerWhatsAppUrlsSuite();
  registerResponsiveMetaSuite();
  registerBoundaryCornerCasesSuite();
  registerCrossFeatureCombinationsSuite();
  registerUserJourneysSuite();

  if (!options.json) {
    console.log(`\n${colors.bold}${colors.cyan}=================================================================${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}  BAHAGIAKITA E2E TEST RUNNER — 4-TIER SPECIFICATION SUITE       ${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}=================================================================${colors.reset}\n`);
    if (options.tier) console.log(`${colors.dim}Filtering by Tier: ${options.tier}${colors.reset}`);
    if (options.milestone) console.log(`${colors.dim}Filtering by Milestone: ${options.milestone}${colors.reset}`);
    if (options.suite) console.log(`${colors.dim}Filtering by Suite: ${options.suite}${colors.reset}`);
  }

  const results = await defaultRegistry.run({
    tier: options.tier,
    milestone: options.milestone,
    suite: options.suite,
    featureId: options.featureId
  });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    process.exit(results.failed === 0 ? 0 : 1);
  }

  // Terminal reporting
  for (const suite of results.suites) {
    console.log(`\n${colors.bold}${suite.name}${colors.reset} ${colors.dim}(${suite.durationMs}ms)${colors.reset}`);
    for (const test of suite.tests) {
      if (test.status === 'passed') {
        console.log(`  ${colors.green}✔${colors.reset} ${test.name} ${colors.dim}[${test.durationMs}ms]${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✖${colors.reset} ${test.name} ${colors.dim}[${test.durationMs}ms]${colors.reset}`);
        if (test.error) {
          console.log(`    ${colors.red}Error: ${test.error.message}${colors.reset}`);
          if (test.error.expected !== undefined && test.error.actual !== undefined) {
            console.log(`    ${colors.dim}Expected: ${JSON.stringify(test.error.expected)}${colors.reset}`);
            console.log(`    ${colors.dim}Actual:   ${JSON.stringify(test.error.actual)}${colors.reset}`);
          }
          if (options.verbose && test.error.stack) {
            console.log(`    ${colors.dim}${test.error.stack}${colors.reset}`);
          }
        }
      }
    }
  }

  // Summary box
  console.log(`\n${colors.bold}${colors.cyan}-----------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total Tests Run: ${results.total}`);
  console.log(`  ${colors.green}Passed:${colors.reset}          ${results.passed}`);
  console.log(`  ${results.failed > 0 ? colors.red : colors.dim}Failed:${colors.reset}          ${results.failed}`);
  console.log(`  Duration:        ${results.durationMs}ms`);
  console.log(`${colors.bold}${colors.cyan}-----------------------------------------------------------------${colors.reset}\n`);

  if (results.failed === 0) {
    console.log(`${colors.green}${colors.bold}🎉 ALL EXECUTED TESTS PASSED CLEANLY.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ ${results.failed} TEST(S) FAILED.${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(`${colors.red}Fatal runner error:${colors.reset}`, err);
  process.exit(1);
});
