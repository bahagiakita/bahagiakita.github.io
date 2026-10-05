/**
 * Tier 1 Feature Test: Centralized Themes Data Layer
 * Feature: F03 (Centralized Themes Data Layer in src/js/themes-data.js)
 * Milestone: M1
 */

import { describe, it } from '../../utils/test-context.js';
import { assert, assertEqual, assertIncludes, assertMatches } from '../../utils/assertions.js';
import { fileExists, getProjectPath } from '../../utils/file-helpers.js';
import { pathToFileURL } from 'node:url';

export function registerThemesDataSuite() {
  describe('Tier 1: Themes Data Layer (F03)', () => {

    let themesModule = null;

    it('F03: src/js/themes-data.js exists and exports THEMES array', async () => {
      assert(fileExists('src/js/themes-data.js'), 'src/js/themes-data.js must exist', {
        featureId: 'F03', milestone: 'M1', tier: 1
      });

      const fileUrl = pathToFileURL(getProjectPath('src/js/themes-data.js')).href;
      themesModule = await import(fileUrl);
      assert(themesModule, 'themes-data.js module must be importable', { featureId: 'F03', milestone: 'M1' });

      const themes = themesModule.THEMES || themesModule.themesData || themesModule.default;
      assert(Array.isArray(themes), 'themes-data.js must export THEMES array', { featureId: 'F03', milestone: 'M1' });
      assert(themes.length >= 12, `THEMES catalog must contain at least 12 items, found ${themes.length}`, {
        featureId: 'F03', milestone: 'M1', tier: 1
      });
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

    it('F03: Every theme item adheres to strict data schema', async () => {
      const themes = themesModule?.THEMES || themesModule?.themesData || themesModule?.default || [];
      assert(themes.length > 0, 'THEMES data must be loaded', { featureId: 'F03', milestone: 'M1' });

      for (const item of themes) {
        assert(typeof item.id === 'string' && item.id.length > 0, `Theme missing valid string id: ${JSON.stringify(item)}`);
        assert(typeof item.name === 'string' && item.name.length > 0, `Theme ${item.id} missing valid name`);
        assert(typeof item.slug === 'string' && item.slug.length > 0, `Theme ${item.id} missing valid slug`);
        assert(typeof item.category === 'string' && item.category.length > 0, `Theme ${item.id} missing valid category`);
        assert(typeof item.isFeatured === 'boolean', `Theme ${item.id} isFeatured must be boolean`);
        assert(Array.isArray(item.palette) && item.palette.length >= 2, `Theme ${item.id} palette must have at least 2 colors`);
        assert(item.gradient && typeof item.gradient.from === 'string' && typeof item.gradient.to === 'string', `Theme ${item.id} missing gradient stops`);
        assert(item.monogram && typeof item.monogram.line1 === 'string', `Theme ${item.id} missing monogram`);
        assert(Array.isArray(item.features) && item.features.length >= 2, `Theme ${item.id} missing features array`);
        assert(typeof item.waMessage === 'string' && item.waMessage.length > 0, `Theme ${item.id} missing waMessage`);
      }
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

    it('F03: Theme categories match valid domain taxonomy', async () => {
      const themes = themesModule?.THEMES || themesModule?.themesData || themesModule?.default || [];
      const VALID_CATEGORIES = new Set(['Classic', 'Modern', 'Minimal', 'Floral', 'Rustic', 'Luxury']);

      for (const item of themes) {
        assert(
          VALID_CATEGORIES.has(item.category),
          `Theme ${item.name} has invalid category "${item.category}". Valid: ${[...VALID_CATEGORIES].join(', ')}`,
          { featureId: 'F03', milestone: 'M1', tier: 1 }
        );
      }
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

    it('F03: Palette colors and gradient stops are valid CSS colors / hex codes', async () => {
      const themes = themesModule?.THEMES || themesModule?.themesData || themesModule?.default || [];
      const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

      for (const item of themes) {
        for (const col of item.palette) {
          assert(
            hexColorRegex.test(col) || col.startsWith('rgb') || col.startsWith('hsl'),
            `Theme ${item.id} palette color "${col}" is not a valid CSS hex/rgb code`,
            { featureId: 'F03', milestone: 'M1', tier: 1 }
          );
        }
        assert(
          hexColorRegex.test(item.gradient.from) || item.gradient.from.startsWith('rgb'),
          `Theme ${item.id} gradient.from "${item.gradient.from}" is not a valid color`,
          { featureId: 'F03', milestone: 'M1', tier: 1 }
        );
        assert(
          hexColorRegex.test(item.gradient.to) || item.gradient.to.startsWith('rgb'),
          `Theme ${item.id} gradient.to "${item.gradient.to}" is not a valid color`,
          { featureId: 'F03', milestone: 'M1', tier: 1 }
        );
      }
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

    it('F03: waMessage property conforms to canonical WhatsApp message pattern', async () => {
      const themes = themesModule?.THEMES || themesModule?.themesData || themesModule?.default || [];

      for (const item of themes) {
        assert(
          item.waMessage.includes('Halo Bahagiakita'),
          `Theme ${item.id} waMessage must include "Halo Bahagiakita", got: "${item.waMessage}"`,
          { featureId: 'F03', milestone: 'M1', tier: 1 }
        );
        assert(
          item.waMessage.includes(item.name),
          `Theme ${item.id} waMessage must include template name "${item.name}"`,
          { featureId: 'F03', milestone: 'M1', tier: 1 }
        );
      }
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

    it('F03: Catalog designates featured themes for landing page showcase', async () => {
      const themes = themesModule?.THEMES || themesModule?.themesData || themesModule?.default || [];
      const featured = themes.filter(t => t.isFeatured === true);

      assert(
        featured.length >= 3,
        `Catalog must contain at least 3 featured items (isFeatured: true), found ${featured.length}`,
        { featureId: 'F03', milestone: 'M1', tier: 1 }
      );
    }, { featureId: 'F03', milestone: 'M1', tier: 1 });

  });
}
