/**
 * Tier 1 Feature Test: WhatsApp Conversion Pipeline & Link Integrity
 * Feature: F25 (WhatsApp Conversion Pipeline with Canonical Number 6283847630740)
 * Milestone: M2, M3
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes } from '../../utils/assertions.js';
import { readProjectFile } from '../../utils/file-helpers.js';
import { parseHTML } from '../../utils/dom-parser.js';
import { parseWhatsAppUrl, validateWhatsAppCTA, OFFICIAL_PHONE } from '../../utils/whatsapp.js';

export function registerWhatsAppUrlsSuite() {
  describe('Tier 1: WhatsApp Conversion Pipeline (F25)', () => {

    it('F25: All WhatsApp links in index.html use official phone number 6283847630740', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const waLinks = doc.querySelectorAll('a[href*="wa.me"]')
        .concat(doc.querySelectorAll('a[href*="whatsapp.com"]'));

      assert(waLinks.length >= 2, `index.html must have at least 2 WhatsApp CTA links, found ${waLinks.length}`, {
        featureId: 'F25', milestone: 'M2', tier: 1
      });

      for (const link of waLinks) {
        const parsed = parseWhatsAppUrl(link.getAttribute('href'));
        assert(parsed.valid, `WhatsApp URL validation failed: ${parsed.error} on href: ${link.getAttribute('href')}`, {
          featureId: 'F25', milestone: 'M2', tier: 1
        });
        assertEqual(parsed.phone, OFFICIAL_PHONE, `WhatsApp phone number must be ${OFFICIAL_PHONE}`, {
          featureId: 'F25', milestone: 'M2', tier: 1
        });
      }
    }, { featureId: 'F25', milestone: 'M2', tier: 1 });

    it('F25: All WhatsApp links in template.html use official phone number 6283847630740', async () => {
      const html = readProjectFile('template.html');
      const doc = parseHTML(html);

      const waLinks = doc.querySelectorAll('a[href*="wa.me"]')
        .concat(doc.querySelectorAll('a[href*="whatsapp.com"]'));

      // May have static CTA links or consultation box
      for (const link of waLinks) {
        const parsed = parseWhatsAppUrl(link.getAttribute('href'));
        assert(parsed.valid, `WhatsApp URL validation failed: ${parsed.error} on href: ${link.getAttribute('href')}`, {
          featureId: 'F25', milestone: 'M3', tier: 1
        });
        assertEqual(parsed.phone, OFFICIAL_PHONE, `WhatsApp phone number must be ${OFFICIAL_PHONE}`, {
          featureId: 'F25', milestone: 'M3', tier: 1
        });
      }
    }, { featureId: 'F25', milestone: 'M3', tier: 1 });

    it('F25: WhatsApp CTA links enforce security attributes (target="_blank" and rel="noopener")', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const waLinks = doc.querySelectorAll('a[href*="wa.me"]')
        .concat(doc.querySelectorAll('a[href*="whatsapp.com"]'));

      for (const link of waLinks) {
        const validation = validateWhatsAppCTA(link);
        assert(
          validation.valid,
          `Security attribute check failed: ${validation.error} for link href="${link.getAttribute('href')}"`,
          { featureId: 'F25', milestone: 'M2', tier: 1 }
        );
      }
    }, { featureId: 'F25', milestone: 'M2', tier: 1 });

    it('F25: WhatsApp message text parameter is properly URL-encoded without raw spaces', async () => {
      const html = readProjectFile('index.html');
      const doc = parseHTML(html);

      const waLinks = doc.querySelectorAll('a[href*="wa.me"]')
        .concat(doc.querySelectorAll('a[href*="whatsapp.com"]'));

      for (const link of waLinks) {
        const href = link.getAttribute('href');
        assert(!href.includes(' '), `WhatsApp URL must not contain raw whitespace: "${href}"`, {
          featureId: 'F25', milestone: 'M2', tier: 1
        });

        if (href.includes('text=')) {
          const parsed = parseWhatsAppUrl(href, { requireText: true });
          assert(parsed.text && parsed.text.length > 5, `WhatsApp text message must not be empty on href: ${href}`, {
            featureId: 'F25', milestone: 'M2', tier: 1
          });
        }
      }
    }, { featureId: 'F25', milestone: 'M2', tier: 1 });

    it('F25: Theme card order message format matches PRD direct template pattern', async () => {
      // Direct template message pattern:
      // "Halo Bahagiakita, saya tertarik dan ingin memesan template: [Nama Tema]."
      const templateName = 'Rustic Vintage Kraft';
      const expectedMsg = `Halo Bahagiakita, saya tertarik dan ingin memesan template: ${templateName}.`;
      const encodedMsg = encodeURIComponent(expectedMsg);
      const generatedUrl = `https://wa.me/6283847630740?text=${encodedMsg}`;

      const parsed = parseWhatsAppUrl(generatedUrl);
      assert(parsed.valid, 'Generated WhatsApp URL must be valid');
      assertEqual(parsed.phone, OFFICIAL_PHONE, 'Phone must match canonical phone');
      assertEqual(parsed.text, expectedMsg, 'Decoded message must match expected template message');
    }, { featureId: 'F25', milestone: 'M2', tier: 1 });

    it('F25: Consultation message format matches PRD consultation pattern', async () => {
      // Consultation message pattern:
      // "Halo Bahagiakita, saya ingin konsultasi gratis mengenai undangan pernikahan digital."
      const expectedMsg = 'Halo Bahagiakita, saya ingin konsultasi gratis mengenai undangan pernikahan digital.';
      const encodedMsg = encodeURIComponent(expectedMsg);
      const consultationUrl = `https://wa.me/6283847630740?text=${encodedMsg}`;

      const parsed = parseWhatsAppUrl(consultationUrl);
      assert(parsed.valid, 'Generated consultation URL must be valid');
      assertEqual(parsed.phone, OFFICIAL_PHONE, 'Phone must match canonical phone');
      assertEqual(parsed.text, expectedMsg, 'Decoded message must match consultation inquiry');
    }, { featureId: 'F25', milestone: 'M3', tier: 1 });

  });
}
