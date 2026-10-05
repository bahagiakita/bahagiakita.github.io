/**
 * src/js/faq.js
 * Bahagiakita Accessible Single-Open FAQ Accordion Engine
 * Conforms to W3C WAI-ARIA Accordion Design Pattern
 */

export class FaqAccordion {
  /**
   * @param {HTMLElement|string} rootContainer - Selector or DOM element of FAQ section
   */
  constructor(rootContainer = '#faq') {
    this.container = typeof rootContainer === 'string'
      ? document.querySelector(rootContainer)
      : rootContainer;

    if (!this.container) return;

    // Idempotency: return cached instance if already initialized on this container
    if (this.container._faqInstance) {
      return this.container._faqInstance;
    }

    this.items = Array.from(this.container.querySelectorAll('.faq-item'));
    this.buttons = this.items.map(item => item.querySelector('.faq-question')).filter(Boolean);
    this.answers = this.items.map(item => item.querySelector('.faq-answer')).filter(Boolean);

    this.init();
    this.container._faqInstance = this;
  }

  init() {
    if (!this.container || this.items.length === 0) return;

    // Container-level idempotency guard: prevent duplicate initialization
    if (
      this.container._faqInitialized ||
      (this.container.dataset && this.container.dataset.faqInitialized === 'true') ||
      (this.container.hasAttribute && this.container.hasAttribute('data-faq-init'))
    ) {
      return;
    }
    this.container._faqInitialized = true;
    if (this.container.dataset) {
      this.container.dataset.faqInitialized = 'true';
    }
    if (this.container.setAttribute) {
      this.container.setAttribute('data-faq-init', 'true');
    }

    this.items.forEach((item, index) => {
      const button = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!button || !answer) return;

      // Ensure bidirectional ARIA attributes and IDs
      if (!button.id) {
        button.id = `faq-btn-${index + 1}`;
      }
      if (!button.hasAttribute('aria-expanded')) {
        button.setAttribute('aria-expanded', 'false');
      }
      if (!button.getAttribute('aria-controls') && answer.id) {
        button.setAttribute('aria-controls', answer.id);
      }
      if (!answer.getAttribute('aria-labelledby') && button.id) {
        answer.setAttribute('aria-labelledby', button.id);
      }
      answer.setAttribute('role', 'region');

      // Button-level idempotency guard: prevent duplicate event listener bindings
      if ((button.dataset && button.dataset.faqBound === 'true') || button._faqBound) {
        return;
      }
      if (button.dataset) {
        button.dataset.faqBound = 'true';
      }
      button._faqBound = true;
      if (button.setAttribute) {
        button.setAttribute('data-faq-bound', 'true');
      }

      // Click event
      button.addEventListener('click', () => {
        this.toggleItem(index);
      });

      // Keyboard navigation (Enter, Space, ArrowDown, ArrowUp, Home, End)
      button.addEventListener('keydown', (e) => {
        this.handleKeydown(e, index);
      });
    });

    // Recalculate max-height on window resize for active item (bound once per container)
    if (typeof window !== 'undefined' && !this.container._faqResizeBound) {
      this.container._faqResizeBound = true;
      window.addEventListener('resize', () => {
        const activeItem = this.container.querySelector('.faq-item.is-open');
        if (activeItem) {
          const activeAnswer = activeItem.querySelector('.faq-answer');
          if (activeAnswer) {
            activeAnswer.style.maxHeight = `${activeAnswer.scrollHeight}px`;
          }
        }
      }, { passive: true });
    }
  }

  /**
   * Toggles an accordion item while strictly closing all other items.
   * @param {number} targetIndex - Index of the item to toggle
   */
  toggleItem(targetIndex) {
    const targetItem = this.items[targetIndex];
    if (!targetItem) return;

    const isCurrentlyOpen = targetItem.classList.contains('is-open') ||
      targetItem.querySelector('.faq-question')?.getAttribute('aria-expanded') === 'true';

    // Strict single-open invariant: close all items first
    this.closeAll();

    // If target was not already open, open it
    if (!isCurrentlyOpen) {
      this.openItem(targetItem);
    }
  }

  /**
   * Closes all accordion items.
   */
  closeAll() {
    this.items.forEach(item => {
      item.classList.remove('is-open');

      const button = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const icon = item.querySelector('.faq-icon');

      if (button) button.setAttribute('aria-expanded', 'false');
      if (icon) icon.style.transform = 'rotate(0deg)';
      if (answer) {
        answer.style.maxHeight = null;
        answer.classList.remove('opacity-100');
        answer.classList.add('opacity-0');
      }
    });
  }

  /**
   * Opens a single accordion item.
   * @param {HTMLElement} item
   */
  openItem(item) {
    item.classList.add('is-open');

    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (button) button.setAttribute('aria-expanded', 'true');
    if (icon) icon.style.transform = 'rotate(180deg)';
    if (answer) {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
      answer.classList.remove('opacity-0');
      answer.classList.add('opacity-100');
    }
  }

  /**
   * Handles keyboard navigation according to WAI-ARIA APG pattern.
   * @param {KeyboardEvent} e
   * @param {number} currentIndex
   */
  handleKeydown(e, currentIndex) {
    const count = this.buttons.length;
    let nextIndex = null;

    switch (e.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % count;
        break;
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + count) % count;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = count - 1;
        break;
      default:
        return; // Native Enter and Space activate the button click
    }

    if (nextIndex !== null) {
      e.preventDefault();
      this.buttons[nextIndex]?.focus();
    }
  }
}

/**
 * Convenience initializer for FAQ accordion.
 * @param {string|HTMLElement} selector - Container selector or element (default: '#faq')
 * @returns {FaqAccordion|null}
 */
export function initFaqAccordion(selector = '#faq') {
  if (typeof document === 'undefined') return null;
  const container = typeof selector === 'string'
    ? document.querySelector(selector)
    : selector;
  if (!container) return null;

  if (container._faqInstance) return container._faqInstance;
  if (
    container._faqInitialized ||
    (container.dataset && container.dataset.faqInitialized === 'true') ||
    (container.hasAttribute && container.hasAttribute('data-faq-init'))
  ) {
    return container._faqInstance || null;
  }

  return new FaqAccordion(container);
}

export const initFaq = initFaqAccordion;

export default initFaqAccordion;
