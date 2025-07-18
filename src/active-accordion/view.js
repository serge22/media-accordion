/**
 * Media Accordion Block - Frontend JavaScript
 * 
 * Handles accordion functionality including:
 * - Item switching with click events
 * - Automatic progression with timing
 * - Pause/resume functionality
 * - Media content display
 * - KeenSlider integration for mobile devices
 * 
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

import KeenSlider from 'keen-slider'
import 'keen-slider/keen-slider.min.css'

/**
 * Constants and configuration
 */
const CONFIG = {
	SELECTORS: {
		ACCORDION: '.wp-block-srg-media-accordion',
		ACCORDION_ITEM: '.wp-block-srg-media-accordion-item',
		ITEM_BUTTON: '.wp-block-srg-media-accordion-item_header-button',
		MEDIA_CONTAINER: '.wp-block-srg-media-accordion_media-wrap',
		MEDIA_TEMPLATE: '.media-template',
		PAUSE_BUTTON: '.wp-block-srg-media-accordion_pause-btn',
		CONTENT_CONTAINER: '.wp-block-srg-media-accordion_content-container',
		ACTIVE_CLASS: 'active',
		PAUSED_CLASS: 'wp-block-srg-media-accordion-item--paused'
	},
	DEFAULTS: {
		ANIMATION_DURATION: 5000, // 5 seconds fallback
		CSS_DURATION_VAR: '--animation-duration',
		SLIDER_SPACING: 20,
		RESIZE_DEBOUNCE: 500
	},
	ICONS: {
		PLAY: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M8 20L20 12L8 4L8 20Z" fill="#ffffffff"></path></svg>',
		PAUSE: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#ffffffff"></path></svg>'
	}
};

/**
 * Utility functions
 */
const Utils = {
	/**
	 * Check if screen has min-aspect-ratio: 1/1 (landscape or square)
	 * @returns {boolean} True if aspect ratio is 1/1 or wider
	 */
	isLandscapeOrSquare() {
		return window.matchMedia('(min-aspect-ratio: 1/1)').matches;
	},

	/**
	 * Debounce function execution
	 * @param {Function} func - Function to debounce
	 * @param {number} delay - Delay in milliseconds
	 * @returns {Function} Debounced function
	 */
	debounce(func, delay) {
		let timeoutId;
		return function(...args) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(this, args), delay);
		};
	},

	/**
	 * Check if element is currently visible in the viewport
	 * @param {HTMLElement} element - Element to check
	 * @returns {boolean} True if element is visible
	 */
	isElementVisible(element) {
		if (!element) return false;
		const rect = element.getBoundingClientRect();
		const style = getComputedStyle(element);
		return (
			rect.width > 0 &&
			rect.height > 0 &&
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0'
		);
	}
};

/**
 * KeenSlider navigation plugin
 * Adds dot navigation below the slider
 */
function createNavigationPlugin(slider) {
	let wrapper, dots;

	const createDiv = (className) => {
		const div = document.createElement('div');
		className.split(' ').forEach(name => div.classList.add(name));
		return div;
	};

	const removeElement = (element) => {
		if (element && element.parentNode) {
			element.parentNode.removeChild(element);
		}
	};

	const createWrapper = (remove = false) => {
		if (remove) {
			if (wrapper) {
				const parent = wrapper.parentNode;
				while (wrapper.firstChild) {
					parent.insertBefore(wrapper.firstChild, wrapper);
				}
				removeElement(wrapper);
			}
			return;
		}
		wrapper = createDiv('keen-slider_navigation-wrapper');
		slider.container.parentNode.appendChild(wrapper);
		wrapper.appendChild(slider.container);
	};

	const createDots = (remove = false) => {
		if (remove) {
			removeElement(dots);
			return;
		}
		dots = createDiv('dots');
		slider.track.details.slides.forEach((_, idx) => {
			const dot = createDiv('dot');
			dot.addEventListener('click', () => slider.moveToIdx(idx));
			dots.appendChild(dot);
		});
		wrapper.appendChild(dots);
	};

	const updateDots = () => {
		if (!dots) return;
		const activeSlide = slider.track.details.rel;
		Array.from(dots.children).forEach((dot, idx) => {
			dot.classList.toggle('dot--active', idx === activeSlide);
		});
	};

	const createMarkup = (remove = false) => {
		createWrapper(remove);
		createDots(remove);
	};

	// Event listeners
	slider.on('created', () => {
		createMarkup();
		updateDots();
	});

	slider.on('optionsChanged', () => {
		createMarkup(true);
		createMarkup();
		updateDots();
	});

	slider.on('slideChanged', updateDots);
	slider.on('destroyed', () => createMarkup(true));
}

/**
 * MediaAccordion class handles all accordion functionality
 */
class MediaAccordion {
	/**
	 * Initialize the accordion
	 * @param {HTMLElement} element - The accordion container element
	 */
	constructor(element) {
		this.accordion = element;
		this.items = this.accordion.querySelectorAll(CONFIG.SELECTORS.ACCORDION_ITEM);
		this.mediaContainer = this.accordion.querySelector(CONFIG.SELECTORS.MEDIA_CONTAINER);
		this.pauseButton = this.accordion.querySelector(CONFIG.SELECTORS.PAUSE_BUTTON);
		this.contentContainer = this.accordion.querySelector(CONFIG.SELECTORS.CONTENT_CONTAINER);
		
		this.currentIndex = 0;
		this.timeoutId = null;
		this.isPaused = false;
		this.remainingTime = 0;
		this.startTime = 0;
		this.duration = 0;
		this.slider = null;
		this.intersectionObserver = null;
		this.resizeTimeout = null;
		
		// Bind methods
		this.handleClick = this.handleClick.bind(this);
		this.handleOrientationChange = Utils.debounce(this.handleOrientationChange.bind(this), CONFIG.DEFAULTS.RESIZE_DEBOUNCE);
		
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

		// Check if we need slider and if accordion is visible
		if (!Utils.isLandscapeOrSquare()) {
			if (Utils.isElementVisible(this.accordion)) {
				this.initSlider();
			} else {
				this.setupVisibilityObserver();
			}
		}
	}

	/**
	 * Setup intersection observer to detect when accordion becomes visible
	 */
	setupVisibilityObserver() {
		if (!this.intersectionObserver) {
			this.intersectionObserver = new IntersectionObserver((entries) => {
				entries.forEach(entry => {
					if (entry.isIntersecting && Utils.isElementVisible(this.accordion)) {
						this.initSlider();
						this.intersectionObserver.disconnect();
					}
				});
			}, {
				root: null,
				rootMargin: '0px',
				threshold: 0.1
			});
		}
		
		this.intersectionObserver.observe(this.accordion);
	}

	/**
	 * Initialize KeenSlider for mobile devices
	 */
	initSlider() {
		if (!this.contentContainer || this.slider) {
			return;
		}

		// Double-check visibility before initialization
		if (!Utils.isElementVisible(this.accordion)) {
			this.setupVisibilityObserver();
			return;
		}

		// Add slider classes
		this.contentContainer.classList.add('keen-slider');
		this.items.forEach(item => item.classList.add('keen-slider__slide'));

		// Initialize KeenSlider
		this.slider = new KeenSlider(this.contentContainer, {
			initial: this.currentIndex,
			slides: {
				perView: 1,
				spacing: CONFIG.DEFAULTS.SLIDER_SPACING,
			},
			slideChanged: (slider) => {
				this.showItem(slider.track.details.abs, false);
			},
		}, [createNavigationPlugin]);
	}

	destroySlider() {
		if (this.slider) {
			this.slider.destroy();
			this.slider = null;
			this.contentContainer.classList.remove('keen-slider');
			this.items.forEach(item => item.classList.remove('keen-slider__slide'));
		}
	}

	/**
	 * Refresh slider dimensions (useful when tab becomes visible)
	 */
	refreshSlider() {
		if (this.slider) {
			// Force slider to recalculate dimensions
			this.slider.update();
		}
	}

	/**
	 * Attach event listeners
	 */
	attachEventListeners() {
		this.accordion.addEventListener('click', this.handleClick);
		window.addEventListener('orientationchange', this.handleOrientationChange);
		window.addEventListener('resize', this.handleOrientationChange);
	}

	/**
	 * Handle click events using event delegation
	 * @param {Event} e - The click event
	 */
	handleClick(e) {
		e.preventDefault();
		
		// Handle accordion item button clicks
		const itemButton = e.target.closest(CONFIG.SELECTORS.ITEM_BUTTON);
		if (itemButton) {
			this.handleItemClick(itemButton);
			return;
		}
		
		// Handle pause/resume button clicks
		const pauseButton = e.target.closest(CONFIG.SELECTORS.PAUSE_BUTTON);
		if (pauseButton) {
			this.togglePause();
			return;
		}
	}

	/**
	 * Handle accordion item button click
	 * @param {HTMLElement} itemButton - The clicked item button
	 */
	handleItemClick(itemButton) {
		const item = itemButton.closest(CONFIG.SELECTORS.ACCORDION_ITEM);
		if (!item || !Utils.isLandscapeOrSquare()) {
			return;
		}

		const index = Array.from(this.items).indexOf(item);
		if (index !== -1 && index !== this.currentIndex) {
			this.showItem(index);
		}
	}

	/**
	 * Handle orientation/resize changes
	 */
	handleOrientationChange() {
		if (Utils.isLandscapeOrSquare()) {
			// Destroy slider if in landscape or square mode
			this.destroySlider();
		} else {
			// Initialize slider if not already done and accordion is visible
			if (!this.slider) {
				if (Utils.isElementVisible(this.accordion)) {
					this.initSlider();
				} else {
					this.setupVisibilityObserver();
				}
			} else {
				// Refresh existing slider
				this.refreshSlider();
			}
		}
	}

	/**
	 * Show a specific accordion item
	 * @param {number} index - The index of the item to show
	 */
	showItem(index, updateSlider = true) {
		if (index < 0 || index >= this.items.length) {
			return;
		}

		this.clearTimer();
		this.updateActiveItem(index, updateSlider);
		this.updateMediaContent();
		this.scheduleNextItem();
	}

	/**
	 * Update the active item class
	 * @param {number} index - The index of the item to activate
	 */
	updateActiveItem(index, updateSlider = true) {
		// Remove active and paused classes from all items
		this.items.forEach(item => {
			item.classList.remove(CONFIG.SELECTORS.ACTIVE_CLASS, CONFIG.SELECTORS.PAUSED_CLASS);
		});

		// Add active class to current item
		this.items[index].classList.add(CONFIG.SELECTORS.ACTIVE_CLASS);

		// Add paused class if needed
		if (this.isPaused) {
			this.items[index].classList.add(CONFIG.SELECTORS.PAUSED_CLASS);
		}

		// Update slider position if needed
		if (this.slider && updateSlider) {
			this.slider.moveToIdx(index);
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

		const mediaTemplate = this.items[this.currentIndex].querySelector(CONFIG.SELECTORS.MEDIA_TEMPLATE);
		if (!mediaTemplate || !mediaTemplate.content) {
			return;
		}

		const mediaElement = mediaTemplate.content.cloneNode(true);
		
		// Handle video autoplay based on pause state
		const video = mediaElement.querySelector('video');
		if (video) {
			video.autoplay = !this.isPaused;
		}

		this.mediaContainer.innerHTML = '';
		this.mediaContainer.appendChild(mediaElement);
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
		const duration = getComputedStyle(currentItem).getPropertyValue(CONFIG.DEFAULTS.CSS_DURATION_VAR);
		
		if (!duration) {
			return CONFIG.DEFAULTS.ANIMATION_DURATION;
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

		this.handleVideoPlayback();
	}

	/**
	 * Handle video playback based on pause state
	 */
	handleVideoPlayback() {
		if (!this.mediaContainer) return;

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
		this.items[this.currentIndex].classList.add(CONFIG.SELECTORS.PAUSED_CLASS);
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
		this.items[this.currentIndex].classList.remove(CONFIG.SELECTORS.PAUSED_CLASS);
	}

	/**
	 * Update pause button icon and state
	 */
	updatePauseButton() {
		if (!this.pauseButton) {
			return;
		}

		this.pauseButton.innerHTML = this.isPaused ? CONFIG.ICONS.PLAY : CONFIG.ICONS.PAUSE;
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
		
		// Remove event listeners
		if (this.accordion) {
			this.accordion.removeEventListener('click', this.handleClick);
		}
		
		window.removeEventListener('orientationchange', this.handleOrientationChange);
		window.removeEventListener('resize', this.handleOrientationChange);
		
		// Disconnect intersection observer
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}
		
		// Destroy slider
		if (this.slider) {
			this.slider.destroy();
			this.slider = null;
		}
		
		// Clear timeout
		if (this.resizeTimeout) {
			clearTimeout(this.resizeTimeout);
			this.resizeTimeout = null;
		}
	}
}


/**
 * Initialize all accordions on the page
 */
function initializeAccordions() {
	const accordions = document.querySelectorAll(CONFIG.SELECTORS.ACCORDION);
	accordions.forEach(accordion => {
		new MediaAccordion(accordion);
	});
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAccordions);
