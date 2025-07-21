/* global IntersectionObserver */

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

import KeenSlider from 'keen-slider';
import 'keen-slider/keen-slider.min.css';

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
		PAUSED_CLASS: 'wp-block-srg-media-accordion-item--paused',
	},
	DEFAULTS: {
		ANIMATION_DURATION: 5000, // 5 seconds fallback
		CSS_DURATION_VAR: '--animation-duration',
		SLIDER_SPACING: 20,
		RESIZE_DEBOUNCE: 500,
	},
	ICONS: {
		PLAY: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M8 20L20 12L8 4L8 20Z" fill="#ffffffff"></path></svg>',
		PAUSE: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill="#ffffffff"></path></svg>',
	},
};

/**
 * Utility functions
 */
const Utils = {
	/**
	 * Check if screen has min-aspect-ratio: 1/1 (landscape or square)
	 * @return {boolean} True if aspect ratio is 1/1 or wider
	 */
	isLandscapeOrSquare() {
		return window.matchMedia( '(min-aspect-ratio: 1/1)' ).matches;
	},

	/**
	 * Debounce function execution
	 * @param {Function} func  - Function to debounce
	 * @param {number}   delay - Delay in milliseconds
	 * @return {Function} Debounced function
	 */
	debounce( func, delay ) {
		let timeoutId;
		return function ( ...args ) {
			clearTimeout( timeoutId );
			timeoutId = setTimeout( () => func.apply( this, args ), delay );
		};
	},

	/**
	 * Check if element is currently visible in the viewport
	 * @param {HTMLElement} element - Element to check
	 * @return {boolean} True if element is visible
	 */
	isElementVisible( element ) {
		if ( ! element ) {
			return false;
		}
		const rect = element.getBoundingClientRect();
		const style = window.getComputedStyle( element );
		return (
			rect.width > 0 &&
			rect.height > 0 &&
			style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0'
		);
	},
};

/**
 * Creates a navigation plugin for a slider with dot indicators.
 *
 * This plugin adds navigation dots below the slider that allow users to jump
 * directly to specific slides. The active dot is highlighted to indicate the
 * current slide position.
 *
 * @param {Object}      slider                      - The slider instance to add navigation to
 * @param {HTMLElement} slider.container            - The main slider container element
 * @param {HTMLElement} slider.track                - The slider track element
 * @param {Object}      slider.track.details        - Track details object
 * @param {Array}       slider.track.details.slides - Array of slide objects
 * @param {number}      slider.track.details.rel    - Current active slide index
 * @param {Function}    slider.moveToIdx            - Function to move to a specific slide index
 * @param {Function}    slider.on                   - Function to register event listeners
 *
 * @example
 * // Initialize slider with navigation plugin
 * const slider = new KeenSlider('.slider');
 * createNavigationPlugin(slider);
 *
 * @since 1.0.0
 */
function createNavigationPlugin( slider ) {
	let wrapper, dots;

	const createDiv = ( className ) => {
		const div = document.createElement( 'div' );
		className.split( ' ' ).forEach( ( name ) => div.classList.add( name ) );
		return div;
	};

	const removeElement = ( element ) => {
		if ( element && element.parentNode ) {
			element.parentNode.removeChild( element );
		}
	};

	const createWrapper = ( remove = false ) => {
		if ( remove ) {
			if ( wrapper ) {
				const parent = wrapper.parentNode;
				while ( wrapper.firstChild ) {
					parent.insertBefore( wrapper.firstChild, wrapper );
				}
				removeElement( wrapper );
			}
			return;
		}
		wrapper = createDiv( 'keen-slider_navigation-wrapper' );
		slider.container.parentNode.appendChild( wrapper );
		wrapper.appendChild( slider.container );
	};

	const createDots = ( remove = false ) => {
		if ( remove ) {
			removeElement( dots );
			return;
		}
		dots = createDiv( 'dots' );
		slider.track.details.slides.forEach( ( _, idx ) => {
			const dot = createDiv( 'dot' );
			dot.addEventListener( 'click', () => slider.moveToIdx( idx ) );
			dots.appendChild( dot );
		} );
		wrapper.appendChild( dots );
	};

	const updateDots = () => {
		if ( ! dots ) {
			return;
		}
		const activeSlide = slider.track.details.rel;
		Array.from( dots.children ).forEach( ( dot, idx ) => {
			dot.classList.toggle( 'dot--active', idx === activeSlide );
		} );
	};

	const createMarkup = ( remove = false ) => {
		createWrapper( remove );
		createDots( remove );
	};

	// Event listeners
	slider.on( 'created', () => {
		createMarkup();
		updateDots();
	} );

	slider.on( 'optionsChanged', () => {
		createMarkup( true );
		createMarkup();
		updateDots();
	} );

	slider.on( 'slideChanged', updateDots );
	slider.on( 'destroyed', () => createMarkup( true ) );
}

/**
 * Global accordion visibility manager
 * Uses a single intersection observer to monitor all accordions
 */
const AccordionVisibilityManager = {
	observer: null,
	accordions: new Map(),

	/**
	 * Initialize the global observer
	 */
	init() {
		if ( ! this.observer ) {
			this.observer = new IntersectionObserver(
				( entries ) => {
					entries.forEach( ( entry ) => {
						const accordion = this.accordions.get( entry.target );
						if ( accordion ) {
							if (
								entry.isIntersecting &&
								Utils.isElementVisible( entry.target )
							) {
								accordion.onVisibilityChange( true );
							} else {
								accordion.onVisibilityChange( false );
							}
						}
					} );
				},
				{
					root: null,
					rootMargin: '0px',
					threshold: 0.1,
				}
			);
		}
	},

	/**
	 * Register an accordion for visibility monitoring
	 * @param {MediaAccordion} accordion - The accordion instance
	 */
	register( accordion ) {
		this.init();
		this.accordions.set( accordion.accordion, accordion );
		this.observer.observe( accordion.accordion );
	},

	/**
	 * Unregister an accordion from visibility monitoring
	 * @param {MediaAccordion} accordion - The accordion instance
	 */
	unregister( accordion ) {
		if ( this.observer && this.accordions.has( accordion.accordion ) ) {
			this.observer.unobserve( accordion.accordion );
			this.accordions.delete( accordion.accordion );
		}
	},

	/**
	 * Destroy the global observer
	 */
	destroy() {
		if ( this.observer ) {
			this.observer.disconnect();
			this.observer = null;
			this.accordions.clear();
		}
	},
};

/**
 * MediaAccordion class handles all accordion functionality
 */
class MediaAccordion {
	// State properties - initialize at class level
	currentIndex = 0;
	timeoutId = null;
	isPaused = false;
	remainingTime = 0;
	startTime = 0;
	duration = 0;
	slider = null;
	intersectionObserver = null;
	resizeTimeout = null;
	isVisible = false;
	wasUserPaused = false;

	/**
	 * Initialize the accordion
	 * @param {HTMLElement} element - The accordion container element
	 */
	constructor( element ) {
		// DOM references - keep in constructor since they depend on the element parameter
		this.accordion = element;
		this.items = this.accordion.querySelectorAll(
			CONFIG.SELECTORS.ACCORDION_ITEM
		);
		this.mediaContainer = this.accordion.querySelector(
			CONFIG.SELECTORS.MEDIA_CONTAINER
		);
		this.pauseButton = this.accordion.querySelector(
			CONFIG.SELECTORS.PAUSE_BUTTON
		);
		this.contentContainer = this.accordion.querySelector(
			CONFIG.SELECTORS.CONTENT_CONTAINER
		);

		// Bind methods
		this.handleClick = this.handleClick.bind( this );
		this.handleOrientationChange = Utils.debounce(
			this.handleOrientationChange.bind( this ),
			CONFIG.DEFAULTS.RESIZE_DEBOUNCE
		);

		this.init();
	}

	/**
	 * Initialize the accordion functionality
	 */
	init() {
		if ( this.items.length === 0 ) {
			return;
		}

		this.attachEventListeners();
		this.showItem( 0 );

		// Always register for visibility monitoring
		AccordionVisibilityManager.register( this );

		// Check if we need slider for portrait mode
		if (
			! Utils.isLandscapeOrSquare() &&
			Utils.isElementVisible( this.accordion )
		) {
			this.initSlider();
		}
	}

	/**
	 * Initialize KeenSlider for mobile devices
	 */
	initSlider() {
		if ( ! this.contentContainer || this.slider ) {
			return;
		}

		// Double-check visibility before initialization
		if ( ! Utils.isElementVisible( this.accordion ) ) {
			AccordionVisibilityManager.register( this );
			return;
		}

		// Add slider classes
		this.contentContainer.classList.add( 'keen-slider' );
		this.items.forEach( ( item ) =>
			item.classList.add( 'keen-slider__slide' )
		);

		// Initialize KeenSlider
		this.slider = new KeenSlider(
			this.contentContainer,
			{
				initial: this.currentIndex,
				slides: {
					perView: 1,
					spacing: CONFIG.DEFAULTS.SLIDER_SPACING,
				},
				slideChanged: ( slider ) => {
					this.showItem( slider.track.details.abs, false );
				},
			},
			[ createNavigationPlugin ]
		);
	}

	destroySlider() {
		if ( this.slider ) {
			this.slider.destroy();
			this.slider = null;
			this.contentContainer.classList.remove( 'keen-slider' );
			this.items.forEach( ( item ) =>
				item.classList.remove( 'keen-slider__slide' )
			);
		}
	}

	/**
	 * Refresh slider dimensions (useful when tab becomes visible)
	 */
	refreshSlider() {
		if ( this.slider ) {
			// Force slider to recalculate dimensions
			this.slider.update();
		}
	}

	/**
	 * Attach event listeners
	 */
	attachEventListeners() {
		this.accordion.addEventListener( 'click', this.handleClick );
		window.addEventListener(
			'orientationchange',
			this.handleOrientationChange
		);
		window.addEventListener( 'resize', this.handleOrientationChange );
	}

	/**
	 * Handle click events using event delegation
	 * @param {Event} e - The click event
	 */
	handleClick( e ) {
		e.preventDefault();

		// Handle accordion item button clicks
		const itemButton = e.target.closest( CONFIG.SELECTORS.ITEM_BUTTON );
		if ( itemButton ) {
			this.handleItemClick( itemButton );
			return;
		}

		// Handle pause/resume button clicks
		const pauseButton = e.target.closest( CONFIG.SELECTORS.PAUSE_BUTTON );
		if ( pauseButton ) {
			this.togglePause();
		}
	}

	/**
	 * Handle accordion item button click
	 * @param {HTMLElement} itemButton - The clicked item button
	 */
	handleItemClick( itemButton ) {
		const item = itemButton.closest( CONFIG.SELECTORS.ACCORDION_ITEM );
		if ( ! item || ! Utils.isLandscapeOrSquare() ) {
			return;
		}

		const index = Array.from( this.items ).indexOf( item );
		if ( index !== -1 && index !== this.currentIndex ) {
			this.showItem( index );
		}
	}

	/**
	 * Handle visibility changes from intersection observer
	 * @param {boolean} isVisible - Whether the accordion is visible
	 */
	onVisibilityChange( isVisible ) {
		this.isVisible = isVisible;

		if ( isVisible ) {
			// Initialize slider if needed and in portrait mode
			if ( ! Utils.isLandscapeOrSquare() && ! this.slider ) {
				this.initSlider();
			}
			// Resume animation if not manually paused by user
			if ( ! this.wasUserPaused ) {
				this.resumeAnimation();
			}
		} else {
			// Pause animation when not visible
			this.pauseAnimation();
		}
	}

	/**
	 * Pause animation due to visibility (not user action)
	 */
	pauseAnimation() {
		if ( ! this.isPaused ) {
			this.isPaused = true;
			this.clearTimer();

			// Calculate remaining time
			const elapsed = Date.now() - this.startTime;
			this.remainingTime = Math.max( 0, this.duration - elapsed );

			// Update video playback
			this.handleVideoPlayback();

			// Add paused class for CSS animations
			if ( this.items[ this.currentIndex ] ) {
				this.items[ this.currentIndex ].classList.add(
					CONFIG.SELECTORS.PAUSED_CLASS
				);
			}
		}
	}

	/**
	 * Resume animation due to visibility (not user action)
	 */
	resumeAnimation() {
		if ( this.isPaused && ! this.wasUserPaused ) {
			this.isPaused = false;
			this.startTime = Date.now();

			// Schedule next item with remaining time
			this.timeoutId = setTimeout( () => {
				this.showItem( ( this.currentIndex + 1 ) % this.items.length );
			}, this.remainingTime );

			// Update video playback
			this.handleVideoPlayback();

			// Remove paused class
			if ( this.items[ this.currentIndex ] ) {
				this.items[ this.currentIndex ].classList.remove(
					CONFIG.SELECTORS.PAUSED_CLASS
				);
			}
		}
	}

	/**
	 * Handle orientation/resize changes
	 */
	handleOrientationChange() {
		if ( Utils.isLandscapeOrSquare() ) {
			// Destroy slider if in landscape or square mode
			this.destroySlider();
		} else if ( ! this.slider && this.isVisible ) {
			// Initialize slider if not already done and accordion is visible
			this.initSlider();
		} else if ( this.slider ) {
			// Refresh existing slider
			this.refreshSlider();
		}
	}

	/**
	 * Shows the accordion item at the specified index and manages the display cycle.
	 *
	 * @param {number}  index               - The zero-based index of the item to show
	 * @param {boolean} [updateSlider=true] - Whether to update the slider component
	 * @return {void}
	 */
	showItem( index, updateSlider = true ) {
		if ( index < 0 || index >= this.items.length ) {
			return;
		}

		this.clearTimer();
		this.updateActiveItem( index, updateSlider );
		this.updateMediaContent();
		this.scheduleNextItem();
	}

	/**
	 * Updates the active item in the accordion by managing CSS classes and slider position.
	 *
	 * @param {number}  index               - The index of the item to make active
	 * @param {boolean} [updateSlider=true] - Whether to update the slider position to match the active item
	 * @description Removes active and paused classes from all items, adds active class to the specified item,
	 * applies paused class if the accordion is paused, optionally updates slider position, and sets the current index.
	 */
	updateActiveItem( index, updateSlider = true ) {
		// Remove active and paused classes from all items
		this.items.forEach( ( item ) => {
			item.classList.remove(
				CONFIG.SELECTORS.ACTIVE_CLASS,
				CONFIG.SELECTORS.PAUSED_CLASS
			);
		} );

		// Add active class to current item
		this.items[ index ].classList.add( CONFIG.SELECTORS.ACTIVE_CLASS );

		// Add paused class if needed
		if ( this.isPaused ) {
			this.items[ index ].classList.add( CONFIG.SELECTORS.PAUSED_CLASS );
		}

		// Update slider position if needed
		if ( this.slider && updateSlider ) {
			this.slider.moveToIdx( index );
		}

		this.currentIndex = index;
	}

	/**
	 * Update media content in the media container
	 */
	updateMediaContent() {
		if ( ! this.mediaContainer ) {
			return;
		}

		const mediaTemplate = this.items[ this.currentIndex ].querySelector(
			CONFIG.SELECTORS.MEDIA_TEMPLATE
		);
		if ( ! mediaTemplate || ! mediaTemplate.content ) {
			return;
		}

		const mediaElement = mediaTemplate.content.cloneNode( true );

		// Handle video autoplay based on pause state
		const video = mediaElement.querySelector( 'video' );
		if ( video ) {
			video.autoplay = ! this.isPaused;
		}

		this.mediaContainer.innerHTML = '';
		this.mediaContainer.appendChild( mediaElement );
	}

	/**
	 * Schedule the next item to be shown
	 */
	scheduleNextItem() {
		// Don't schedule if paused or not visible
		if ( this.isPaused || ! this.isVisible ) {
			return;
		}

		this.duration = this.getAnimationDuration();
		this.startTime = Date.now();
		this.remainingTime = this.duration;

		this.timeoutId = setTimeout( () => {
			this.showItem( ( this.currentIndex + 1 ) % this.items.length );
		}, this.duration );
	}

	/**
	 * Get animation duration from CSS variable
	 * @return {number} Duration in milliseconds
	 */
	getAnimationDuration() {
		const currentItem = this.items[ this.currentIndex ];
		const duration = window
			.getComputedStyle( currentItem )
			.getPropertyValue( CONFIG.DEFAULTS.CSS_DURATION_VAR );

		if ( ! duration ) {
			return CONFIG.DEFAULTS.ANIMATION_DURATION;
		}

		return duration.includes( 'ms' )
			? parseFloat( duration )
			: parseFloat( duration ) * 1000;
	}

	/**
	 * Toggle pause/resume state
	 */
	togglePause() {
		if ( this.isPaused ) {
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
		if ( ! this.mediaContainer ) {
			return;
		}

		const video = this.mediaContainer.querySelector( 'video' );
		if ( video ) {
			if ( this.isPaused ) {
				video.pause();
			} else {
				video.play();
			}
		}
	}

	/**
	 * Pause the accordion (user action)
	 */
	pause() {
		if ( this.isPaused ) {
			return;
		}

		this.wasUserPaused = true;
		this.isPaused = true;
		this.clearTimer();

		// Calculate remaining time
		const elapsed = Date.now() - this.startTime;
		this.remainingTime = Math.max( 0, this.duration - elapsed );

		// Update UI
		this.updatePauseButton();
		this.items[ this.currentIndex ].classList.add(
			CONFIG.SELECTORS.PAUSED_CLASS
		);
		this.handleVideoPlayback();
	}

	/**
	 * Resume the accordion (user action)
	 */
	resume() {
		if ( ! this.isPaused ) {
			return;
		}

		this.wasUserPaused = false;
		this.isPaused = false;
		this.startTime = Date.now();

		// Only schedule next item if accordion is visible
		if ( this.isVisible ) {
			this.timeoutId = setTimeout( () => {
				this.showItem( ( this.currentIndex + 1 ) % this.items.length );
			}, this.remainingTime );
		}

		// Update UI
		this.updatePauseButton();
		this.items[ this.currentIndex ].classList.remove(
			CONFIG.SELECTORS.PAUSED_CLASS
		);
		this.handleVideoPlayback();
	}

	/**
	 * Update pause button icon and state
	 */
	updatePauseButton() {
		if ( ! this.pauseButton ) {
			return;
		}

		this.pauseButton.innerHTML = this.isPaused
			? CONFIG.ICONS.PLAY
			: CONFIG.ICONS.PAUSE;
		this.pauseButton.setAttribute(
			'aria-label',
			this.isPaused ? 'Resume' : 'Pause'
		);
	}

	/**
	 * Clear the current timer
	 */
	clearTimer() {
		if ( this.timeoutId ) {
			clearTimeout( this.timeoutId );
			this.timeoutId = null;
		}
	}

	/**
	 * Destroy the accordion instance
	 */
	destroy() {
		this.clearTimer();

		// Remove event listeners
		if ( this.accordion ) {
			this.accordion.removeEventListener( 'click', this.handleClick );
		}

		window.removeEventListener(
			'orientationchange',
			this.handleOrientationChange
		);
		window.removeEventListener( 'resize', this.handleOrientationChange );

		// Unregister from global visibility manager
		AccordionVisibilityManager.unregister( this );

		// Destroy slider
		if ( this.slider ) {
			this.slider.destroy();
			this.slider = null;
		}

		// Clear timeout
		if ( this.resizeTimeout ) {
			clearTimeout( this.resizeTimeout );
			this.resizeTimeout = null;
		}
	}
}

/**
 * Initialize all accordions on the page
 */
function initializeAccordions() {
	const accordions = document.querySelectorAll( CONFIG.SELECTORS.ACCORDION );
	accordions.forEach( ( accordion ) => {
		new MediaAccordion( accordion );
	} );
}

// Initialize when DOM is ready
document.addEventListener( 'DOMContentLoaded', initializeAccordions );

// Clean up global observer when page unloads
window.addEventListener( 'beforeunload', () => {
	AccordionVisibilityManager.destroy();
} );
