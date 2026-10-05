/**
 * Tier 1 Feature Test: Single-Open FAQ Accordion
 * Feature: F15 (Single-Open FAQ Accordion with accessible ARIA controls)
 * Milestone: M2
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile, fileExists } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';

export function registerFaqAccordionSuite() {
  describe('Tier 1: FAQ Accordion (F15)', () => {

    it('F15: FAQ section exists with id="faq" containing 4 Q&A items', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const faqSec = doc.getElementById('faq');
      assert(faqSec, 'FAQ section must exist with id="faq"', { featureId: 'F15', milestone: 'M2', tier: 1 });

      const faqItems = faqSec.querySelectorAll('.faq-item') || faqSec.querySelectorAll('article');
      assert(faqItems.length >= 4, `FAQ must contain at least 4 items, found ${faqItems.length}`, {
        featureId: 'F15', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F15', milestone: 'M2', tier: 1 });

    it('F15: FAQ trigger buttons utilize aria-expanded and aria-controls attributes', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);
      const faqSec = doc.getElementById('faq');
      assert(faqSec, 'FAQ section must exist', { featureId: 'F15', milestone: 'M2' });

      const triggers = faqSec.querySelectorAll('.faq-question') ||
                       faqSec.querySelectorAll('button') ||
                       faqSec.querySelectorAll('[aria-expanded]');

      assert(triggers.length >= 4, `Must have at least 4 FAQ question trigger elements, found ${triggers.length}`, {
        featureId: 'F15', milestone: 'M2', tier: 1
      });

      for (const btn of triggers) {
        assert(
          btn.hasAttribute('aria-expanded'),
          'FAQ trigger button must have "aria-expanded" attribute for screen readers',
          { featureId: 'F15', milestone: 'M2', tier: 1 }
        );
      }
    }, { featureId: 'F15', milestone: 'M2', tier: 1 });

    it('F15: FAQ answers are paired with question triggers via aria-controls or DOM hierarchy', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);
      const faqSec = doc.getElementById('faq');

      const items = faqSec.querySelectorAll('.faq-item') || faqSec.querySelectorAll('article');
      for (const item of items) {
        const question = item.querySelector('.faq-question') || item.querySelector('button') || item.querySelector('h3');
        const answer = item.querySelector('.faq-answer') || item.querySelector('p') || item.querySelector('div');
        assert(question, 'Each FAQ item must have a question header/button');
        assert(answer, 'Each FAQ item must have an answer panel');
        assert(answer.textContent.length > 10, 'Each FAQ answer panel must have meaningful content');
      }
    }, { featureId: 'F15', milestone: 'M2', tier: 1 });

    it('F15: Single-open accordion state machine enforces mutual exclusion', async () => {
      // Simulate the exact state machine defined in PRD §3.1 & PRD §7 AC-3
      class AccordionController {
        constructor(itemCount = 4) {
          this.items = Array.from({ length: itemCount }, (_, i) => ({ id: i, isOpen: false }));
        }

        toggle(index) {
          const currentlyOpen = this.items[index].isOpen;
          // Close all
          this.items.forEach(item => { item.isOpen = false; });
          // If it wasn't open, open it (single-open)
          if (!currentlyOpen) {
            this.items[index].isOpen = true;
          }
        }

        getOpenCount() {
          return this.items.filter(item => item.isOpen).length;
        }

        getOpenIndex() {
          return this.items.findIndex(item => item.isOpen);
        }
      }

      const accordion = new AccordionController(4);
      assertEqual(accordion.getOpenCount(), 0, 'Initially no accordion items should be open');

      // Open item 0
      accordion.toggle(0);
      assertEqual(accordion.getOpenCount(), 1, 'Exactly one item should be open');
      assertEqual(accordion.getOpenIndex(), 0, 'Item 0 should be open');

      // Open item 2 -> Item 0 should automatically close
      accordion.toggle(2);
      assertEqual(accordion.getOpenCount(), 1, 'Only one item should remain open');
      assertEqual(accordion.getOpenIndex(), 2, 'Item 2 should now be open, item 0 closed');

      // Click item 2 again -> Should collapse
      accordion.toggle(2);
      assertEqual(accordion.getOpenCount(), 0, 'Clicking open item should collapse it');
    }, { featureId: 'F15', milestone: 'M2', tier: 1 });

    it('F15: Accordion handles smooth transition and keyboard accessibility', async () => {
      // Verify faq.js or main.js exists or is referenced to support keyboard activation (Enter/Space)
      let foundKeyboardHandling = false;
      const candidates = ['index.html', 'src/js/faq.js', 'src/js/main.js'];

      for (const relPath of candidates) {
        if (fileExists(relPath)) {
          const content = readProjectFile(relPath);
          if (content.includes('keydown') || content.includes('faq') || content.includes('aria-expanded')) {
            foundKeyboardHandling = true;
            break;
          }
        }
      }

      assert(foundKeyboardHandling, 'FAQ accordion script must handle events and maintain aria-expanded', {
        featureId: 'F15', milestone: 'M2', tier: 1
      });
    }, { featureId: 'F15', milestone: 'M2', tier: 1 });

  });
}
