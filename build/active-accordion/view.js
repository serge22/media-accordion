/******/ (() => { // webpackBootstrap
/*!**************************************!*\
  !*** ./src/active-accordion/view.js ***!
  \**************************************/
/**
 * Media Accordion Block - Frontend JavaScript
 * 
 * Handles accordion functionality including:
 * - Item switching with click events
 * - Automatic progression with timing
 * - Pause/resume functionality
 * - Media content display
 * 
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

/**
 * MediaAccordion class handles all accordion functionality
 */
class MediaAccordion {
  /**
   * CSS selectors used throughout the application
   */
  static SELECTORS = {
    ACCORDION: '.wp-block-srg-media-accordion',
    ACCORDION_ITEM: '.wp-block-srg-media-accordion-item',
    ITEM_BUTTON: '.wp-block-srg-media-accordion-item_header-button',
    MEDIA_CONTAINER: '.wp-block-srg-media-accordion_media-container',
    MEDIA_TEMPLATE: '.media-template',
    PAUSE_BUTTON: '.wp-block-srg-media-accordion_pause-btn',
    ACTIVE_CLASS: 'active',
    PAUSED_CLASS: 'wp-block-srg-media-accordion-item--paused'
  };

  /**
   * Default configuration
   */
  static DEFAULTS = {
    ANIMATION_DURATION: 5000,
    // 5 seconds fallback
    CSS_DURATION_VAR: '--animation-duration'
  };

  /**
   * SVG icons for pause/play buttons
   */
  static ICONS = {
    PLAY: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M8 20L20 12L8 4L8 20Z" fill="#ffffffff"></path></svg>',
    PAUSE: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#ffffffff"></path></svg>'
  };
  /**
   * Initialize the accordion
   * @param {HTMLElement} element - The accordion container element
   */
  constructor(element) {
    this.accordion = element;
    this.items = this.accordion.querySelectorAll(MediaAccordion.SELECTORS.ACCORDION_ITEM);
    this.mediaContainer = this.accordion.querySelector(MediaAccordion.SELECTORS.MEDIA_CONTAINER);
    this.pauseButton = this.accordion.querySelector(MediaAccordion.SELECTORS.PAUSE_BUTTON);
    this.currentIndex = 0;
    this.timeoutId = null;
    this.isPaused = false;
    this.remainingTime = 0;
    this.startTime = 0;
    this.duration = 0;
    this.init();
  }

  /**
   * Initialize the accordion functionality
   */
  init() {
    if (this.items.length === 0) {
      return;
    }
    this.attachEventListeners();
    this.showItem(0);
  }

  /**
   * Attach event listeners using event delegation
   */
  attachEventListeners() {
    // Use event delegation for all clicks within the accordion
    this.accordion.addEventListener('click', e => {
      e.preventDefault();

      // Handle accordion item button clicks
      const itemButton = e.target.closest(MediaAccordion.SELECTORS.ITEM_BUTTON);
      if (itemButton) {
        const item = itemButton.closest(MediaAccordion.SELECTORS.ACCORDION_ITEM);
        if (item) {
          const index = Array.from(this.items).indexOf(item);
          if (index !== -1) {
            this.showItem(index);
          }
        }
        return;
      }

      // Handle pause/resume button clicks
      const pauseButton = e.target.closest(MediaAccordion.SELECTORS.PAUSE_BUTTON);
      if (pauseButton) {
        this.togglePause();
        return;
      }
    });
  }

  /**
   * Show a specific accordion item
   * @param {number} index - The index of the item to show
   */
  showItem(index) {
    if (index < 0 || index >= this.items.length) {
      return;
    }
    this.clearTimer();
    this.updateActiveItem(index);
    this.updateMediaContent();
    this.scheduleNextItem();
  }

  /**
   * Update the active item class
   * @param {number} index - The index of the item to activate
   */
  updateActiveItem(index) {
    this.items.forEach(item => item.classList.remove(MediaAccordion.SELECTORS.ACTIVE_CLASS, MediaAccordion.SELECTORS.PAUSED_CLASS));
    this.items[index].classList.add(MediaAccordion.SELECTORS.ACTIVE_CLASS);
    if (this.isPaused) {
      this.items[index].classList.add(MediaAccordion.SELECTORS.PAUSED_CLASS);
    }
    this.currentIndex = index;
  }

  /**
   * Update media content in the media container
   */
  updateMediaContent() {
    if (!this.mediaContainer) {
      return;
    }
    const mediaTemplate = this.items[this.currentIndex].querySelector(MediaAccordion.SELECTORS.MEDIA_TEMPLATE);
    if (mediaTemplate && mediaTemplate.content) {
      const mediaElement = mediaTemplate.content.cloneNode(true);

      // Handle video autoplay based on pause state
      const video = mediaElement.querySelector('video');
      if (video) {
        video.autoplay = !this.isPaused;
      }
      this.mediaContainer.innerHTML = '';
      this.mediaContainer.appendChild(mediaElement);
    }
  }

  /**
   * Schedule the next item to be shown
   */
  scheduleNextItem() {
    if (this.isPaused) {
      return;
    }
    this.duration = this.getAnimationDuration();
    this.startTime = Date.now();
    this.remainingTime = this.duration;
    this.timeoutId = setTimeout(() => {
      this.showItem((this.currentIndex + 1) % this.items.length);
    }, this.duration);
  }

  /**
   * Get animation duration from CSS variable
   * @returns {number} Duration in milliseconds
   */
  getAnimationDuration() {
    const currentItem = this.items[this.currentIndex];
    const duration = getComputedStyle(currentItem).getPropertyValue(MediaAccordion.DEFAULTS.CSS_DURATION_VAR);
    if (!duration) {
      return MediaAccordion.DEFAULTS.ANIMATION_DURATION;
    }
    return duration.includes('ms') ? parseFloat(duration) : parseFloat(duration) * 1000;
  }

  /**
   * Toggle pause/resume state
   */
  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }

    // Handle video autoplay based on pause state
    const video = this.mediaContainer.querySelector('video');
    if (video) {
      this.isPaused ? video.pause() : video.play();
    }
  }

  /**
   * Pause the accordion
   */
  pause() {
    if (this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.clearTimer();

    // Calculate remaining time
    const elapsed = Date.now() - this.startTime;
    this.remainingTime = Math.max(0, this.duration - elapsed);

    // Update UI
    this.updatePauseButton();
    this.items[this.currentIndex].classList.add(MediaAccordion.SELECTORS.PAUSED_CLASS);
  }

  /**
   * Resume the accordion
   */
  resume() {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.startTime = Date.now();

    // Schedule next item with remaining time
    this.timeoutId = setTimeout(() => {
      this.showItem((this.currentIndex + 1) % this.items.length);
    }, this.remainingTime);

    // Update UI
    this.updatePauseButton();
    this.items[this.currentIndex].classList.remove(MediaAccordion.SELECTORS.PAUSED_CLASS);
  }

  /**
   * Update pause button icon and state
   */
  updatePauseButton() {
    if (!this.pauseButton) {
      return;
    }
    this.pauseButton.innerHTML = this.isPaused ? MediaAccordion.ICONS.PLAY : MediaAccordion.ICONS.PAUSE;
    this.pauseButton.setAttribute('aria-label', this.isPaused ? 'Resume' : 'Pause');
  }

  /**
   * Clear the current timer
   */
  clearTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Destroy the accordion instance
   */
  destroy() {
    this.clearTimer();
    // Remove event listeners would go here if needed
  }
}

/**
 * Initialize all accordions on the page
 */
function initializeAccordions() {
  const accordions = document.querySelectorAll(MediaAccordion.SELECTORS.ACCORDION);
  accordions.forEach(accordion => {
    new MediaAccordion(accordion);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAccordions);
/******/ })()
;
//# sourceMappingURL=view.js.map