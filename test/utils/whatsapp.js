/**
 * WhatsApp conversion pipeline URL validator and decoder
 * Verifies compliance with PRD §5.3 and PROJECT.md § Interface Contracts
 */

export const OFFICIAL_PHONE = '6283847630740';

export function parseWhatsAppUrl(rawUrl, { requireText = false } = {}) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Empty or non-string URL' };
  }

  let url;
  try {
    url = new URL(rawUrl);
  } catch (err) {
    return { valid: false, error: `Invalid URL format: ${err.message}` };
  }

  // Check host
  const validHosts = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'];
  if (!validHosts.includes(url.hostname)) {
    return { valid: false, error: `Host "${url.hostname}" is not a recognized WhatsApp domain` };
  }

  // Extract phone
  let phone = '';
  if (url.hostname === 'wa.me') {
    phone = url.pathname.replace(/^\/+/, '').split('/')[0];
  } else {
    phone = url.searchParams.get('phone') || '';
  }

  // Normalize phone (strip +, -, spaces)
  const normalizedPhone = phone.replace(/[^0-9]/g, '');
  if (normalizedPhone !== OFFICIAL_PHONE) {
    return {
      valid: false,
      error: `Phone number mismatch: expected "${OFFICIAL_PHONE}", got "${normalizedPhone}"`
    };
  }

  // Extract message text (searchParams.get already decodes the value)
  const textParam = url.searchParams.get('text');
  if (requireText && textParam === null) {
    return { valid: false, error: 'Missing "?text=" query parameter' };
  }

  // Get raw encoded string if needed
  const rawSearch = url.search.slice(1);
  const rawTextMatch = rawSearch.match(/(?:^|&)text=([^&]*)/);
  const encodedText = rawTextMatch ? rawTextMatch[1] : '';

  return {
    valid: true,
    phone: normalizedPhone,
    text: textParam, // Decoded text (null if omitted and not required)
    encodedText,     // Raw encoded query parameter
    rawUrl
  };
}

export function validateWhatsAppCTA(elementNode, options = {}) {
  const href = elementNode.getAttribute('href');
  const target = elementNode.getAttribute('target');
  const rel = elementNode.getAttribute('rel') || '';

  const parsed = parseWhatsAppUrl(href, options);
  if (!parsed.valid) {
    return { valid: false, error: parsed.error };
  }

  if (target !== '_blank') {
    return { valid: false, error: `CTA link must specify target="_blank", got "${target}"` };
  }

  const relTokens = rel.toLowerCase().split(/\s+/);
  if (!relTokens.includes('noopener')) {
    return { valid: false, error: `CTA link rel must contain "noopener", got "${rel}"` };
  }

  return {
    valid: true,
    phone: parsed.phone,
    text: parsed.text,
    href
  };
}
