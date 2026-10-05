/**
 * Lightweight, zero-dependency HTML parser & DOM inspector
 * For opaque-box test verification of HTML structure, attributes, and hierarchy
 */

const VOID_ELEMENTS = new Set([
  'AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT',
  'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
]);

export class DOMNode {
  constructor(tagName = '', attributes = {}, parent = null) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.parent = parent;
    this.children = [];
    this.rawText = '';
  }

  getAttribute(name) {
    const key = Object.keys(this.attributes).find(
      k => k.toLowerCase() === name.toLowerCase()
    );
    return key !== undefined ? this.attributes[key] : null;
  }

  hasAttribute(name) {
    return Object.keys(this.attributes).some(
      k => k.toLowerCase() === name.toLowerCase()
    );
  }

  get id() {
    return this.getAttribute('id') || '';
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  get classList() {
    const classes = this.className.split(/\s+/).filter(Boolean);
    return {
      contains: (cls) => classes.includes(cls),
      toArray: () => [...classes],
      length: classes.length
    };
  }

  get textContent() {
    let text = this.rawText;
    for (const child of this.children) {
      text += ' ' + child.textContent;
    }
    return text.replace(/\s+/g, ' ').trim();
  }

  querySelector(selector) {
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+(?![^\[]*\])/);
    if (parts.length === 1) {
      return this._matchDescendants(parts[0]);
    }

    // Support ancestor-descendant combinator (e.g. "header nav a")
    let currentMatches = this._matchDescendants(parts[0]);
    for (let i = 1; i < parts.length; i++) {
      const nextSelector = parts[i];
      const nextMatches = [];
      for (const node of currentMatches) {
        const subMatches = node._matchDescendants(nextSelector);
        for (const sm of subMatches) {
          if (!nextMatches.includes(sm)) {
            nextMatches.push(sm);
          }
        }
      }
      currentMatches = nextMatches;
    }
    return currentMatches;
  }

  _matchDescendants(simpleSelector) {
    const matches = [];
    const traverse = (node) => {
      for (const child of node.children) {
        if (child._matchesSimple(simpleSelector)) {
          matches.push(child);
        }
        traverse(child);
      }
    };
    traverse(this);
    return matches;
  }

  _matchesSimple(sel) {
    let s = sel.trim();
    if (!s) return false;

    // Extract attributes: [attr...]
    const attrRegex = /\[([^\]]+)\]/g;
    const attrMatches = [];
    let m;
    while ((m = attrRegex.exec(s)) !== null) {
      attrMatches.push(m[1]);
    }
    const base = s.replace(attrRegex, '');

    // Extract ID
    let id = null;
    let withoutId = base;
    let classes = [];

    if (base.includes('#')) {
      const parts = base.split('#');
      withoutId = parts[0];
      const afterId = parts[1];
      if (afterId.includes('.')) {
        const idParts = afterId.split('.');
        id = idParts[0];
        classes.push(...idParts.slice(1));
      } else {
        id = afterId;
      }
    }

    // Extract tag and classes from remaining base
    let tag = withoutId;
    if (withoutId.includes('.')) {
      const dotParts = withoutId.split('.');
      tag = dotParts[0];
      classes.push(...dotParts.slice(1));
    }

    // Check tag
    if (tag && tag !== '*' && this.tagName !== tag.toUpperCase()) {
      return false;
    }

    // Check ID
    if (id && this.id !== id) {
      return false;
    }

    // Check classes
    for (const cls of classes) {
      if (!cls) continue;
      if (!this.classList.contains(cls)) {
        return false;
      }
    }

    // Check attributes
    for (const inner of attrMatches) {
      let rawInner = inner.trim();
      let caseInsensitive = false;
      if (/\s+i$/i.test(rawInner)) {
        caseInsensitive = true;
        rawInner = rawInner.replace(/\s+i$/i, '').trim();
      }

      if (rawInner.includes('=')) {
        const eqIdx = rawInner.indexOf('=');
        let op = '=';
        let attrName = rawInner.slice(0, eqIdx).trim();
        let expected = rawInner.slice(eqIdx + 1).trim();

        if (attrName.endsWith('*')) {
          op = '*=';
          attrName = attrName.slice(0, -1).trim();
        } else if (attrName.endsWith('^')) {
          op = '^=';
          attrName = attrName.slice(0, -1).trim();
        } else if (attrName.endsWith('$')) {
          op = '$=';
          attrName = attrName.slice(0, -1).trim();
        }

        if ((expected.startsWith('"') && expected.endsWith('"')) ||
            (expected.startsWith("'") && expected.endsWith("'"))) {
          expected = expected.slice(1, -1);
        }

        const val = this.getAttribute(attrName);
        if (val === null) return false;

        let compareVal = val;
        let compareExp = expected;
        if (caseInsensitive) {
          compareVal = compareVal.toLowerCase();
          compareExp = compareExp.toLowerCase();
        }

        if (op === '=' && compareVal !== compareExp) return false;
        if (op === '*=' && !compareVal.includes(compareExp)) return false;
        if (op === '^=' && !compareVal.startsWith(compareExp)) return false;
        if (op === '$=' && !compareVal.endsWith(compareExp)) return false;
      } else {
        if (!this.hasAttribute(rawInner)) return false;
      }
    }

    return true;
  }

  getElementById(id) {
    return this.querySelector(`#${id}`);
  }

  getElementsByTagName(tagName) {
    const upper = tagName.toUpperCase();
    const results = [];
    const traverse = (node) => {
      for (const child of node.children) {
        if (upper === '*' || child.tagName === upper) {
          results.push(child);
        }
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  getElementsByClassName(className) {
    return this.querySelectorAll(`.${className}`);
  }
}

/**
 * Parse HTML string into DOMNode tree
 */
export function parseHTML(htmlString) {
  const root = new DOMNode('ROOT');
  let currentParent = root;

  // Clean comments and doctype
  const cleanHtml = htmlString
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');

  const tagRegex = /<(\/)?([a-zA-Z0-9\-]+)([^>]*)>|([^<]+)/g;
  let match;

  while ((match = tagRegex.exec(cleanHtml)) !== null) {
    const isClosing = Boolean(match[1]);
    const tagName = match[2];
    const rawAttrs = match[3];
    const textChunk = match[4];

    if (textChunk) {
      if (textChunk.trim()) {
        currentParent.rawText += (currentParent.rawText ? ' ' : '') + textChunk.trim();
      }
      continue;
    }

    if (!tagName) continue;
    const tagUpper = tagName.toUpperCase();

    // Ignore script / style tag content to avoid false matches
    if (tagUpper === 'SCRIPT' || tagUpper === 'STYLE') {
      if (!isClosing) {
        // Skip till closing script/style
        const closeRegex = new RegExp(`</${tagName}>`, 'i');
        const searchStart = tagRegex.lastIndex;
        const rest = cleanHtml.slice(searchStart);
        const closeMatch = rest.match(closeRegex);
        if (closeMatch) {
          tagRegex.lastIndex = searchStart + closeMatch.index + closeMatch[0].length;
        }
      }
      continue;
    }

    if (isClosing) {
      if (currentParent && currentParent.parent && currentParent.tagName === tagUpper) {
        currentParent = currentParent.parent;
      }
    } else {
      const attributes = parseAttributes(rawAttrs);
      const isSelfClosing = rawAttrs.trim().endsWith('/') || VOID_ELEMENTS.has(tagUpper);
      const node = new DOMNode(tagUpper, attributes, currentParent);
      currentParent.children.push(node);

      if (!isSelfClosing) {
        currentParent = node;
      }
    }
  }

  return root;
}

function parseAttributes(rawAttrs) {
  const attrs = {};
  if (!rawAttrs) return attrs;

  const attrRegex = /([a-zA-Z0-9\-:_]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = attrRegex.exec(rawAttrs)) !== null) {
    const key = m[1];
    if (key === '/') continue;
    const val = m[2] !== undefined ? m[2] : (m[3] !== undefined ? m[3] : (m[4] !== undefined ? m[4] : ''));
    attrs[key] = val;
  }
  return attrs;
}
