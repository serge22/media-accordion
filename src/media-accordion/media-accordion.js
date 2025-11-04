/* global requestAnimationFrame */

/**
 * MediaAccordion Class
 *
 * Handles all accordion functionality including:
 * - Item switching with click events
 * - Automatic progression with timing
 * - Pause/resume functionality
 * - Media content display
 * - KeenSlider integration for mobile devices
 *
 * @since 1.0.0
 */

import KeenSlider from 'keen-slider';
import { CONFIG } from './constants';
import { Utils } from './utils';
import { createNavigationPlugin } from './navigation-plugin';
import { AccordionVisibilityManager } from './visibility-manager';

export class MediaAccordion {
	// State properties - initialize at class level
	currentIndex = 0;
	timeoutId = null;
	isPaused = true; // Will be updated based on autoplay setting
	remainingTime = 0;
	startTime = 0;
	duration = 0;
	slider = null;
	intersectionObserver = null;
	resizeTimeout = null;
	isVisible = false;
	wasUserPaused = false;
	hasStartedAnimation = false; // Track if animation has ever started

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

		// Read autoplay setting from dataset (default: true)
		const ds = this.accordion?.dataset || {};
		this.autoplayEnabled = ds.autoplay !== 'false';

		// If autoplay is disabled, start paused and treat as user-paused to prevent auto-resume on visibility
		if ( this.autoplayEnabled ) {
			this.isPaused = true; // will auto-resume on visibility
			this.wasUserPaused = false;
		} else {
			this.isPaused = true;
			this.wasUserPaused = true;
		}

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

		// Set initial item but don't start animation yet
		this.updateActiveItem( 0, false );
		this.updateMediaContent();
		this.updatePauseButton();

		// Always register for visibility monitoring first
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

	/**
	 * Destroy the slider instance
	 */
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

		if ( this.accordion.classList.contains( 'is-layout-2' ) ) {
			this.items.forEach( ( item ) =>
				item.addEventListener(
					'mouseenter',
					this.handleMouseEnterItem.bind( this )
				)
			);
		}

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

	handleMouseEnterItem( e ) {
		const itemButton = e.target.closest( CONFIG.SELECTORS.ITEM_BUTTON );
		if ( itemButton ) {
			this.handleItemClick( itemButton );
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
			// Start/resume animation if not manually paused by user
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

			// If animation hasn't started yet, start fresh
			if ( ! this.hasStartedAnimation ) {
				this.hasStartedAnimation = true;
				this.scheduleNextItem();
			} else {
				// Resume with remaining time
				this.startTime = Date.now();
				this.timeoutId = setTimeout( () => {
					this.showItem(
						( this.currentIndex + 1 ) % this.items.length
					);
				}, this.remainingTime );
			}

			// Update video playback
			this.handleVideoPlayback();

			// Remove paused class
			if ( this.items[ this.currentIndex ] ) {
				this.items[ this.currentIndex ].classList.remove(
					CONFIG.SELECTORS.PAUSED_CLASS
				);
			}
		} else if (
			! this.isPaused &&
			! this.wasUserPaused &&
			this.remainingTime === 0
		) {
			// Start animation for the first time when becoming visible
			this.scheduleNextItem();
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
			video.autoplay = ! this.isPaused || ! this.autoplayEnabled;
		}

		this.mediaContainer.innerHTML = '';
		this.mediaContainer.appendChild( mediaElement );

		// Force reflow before fading - use double rAF to ensure browser has painted initial state
		requestAnimationFrame( () => {
			requestAnimationFrame( () => {
				const elements = this.mediaContainer.children;
				for ( let i = 0; i < elements.length; i++ ) {
					if ( elements[ i ] && elements[ i ].classList ) {
						elements[ i ].classList.add( 'active' );
					}
				}
			} );
		} );
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

		// Calculate remaining time only if animation has started
		if ( this.hasStartedAnimation ) {
			const elapsed = Date.now() - this.startTime;
			this.remainingTime = Math.max( 0, this.duration - elapsed );
		}

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

		// Only schedule next item if accordion is visible
		if ( this.isVisible ) {
			if ( ! this.hasStartedAnimation ) {
				this.hasStartedAnimation = true;
				this.scheduleNextItem();
			} else {
				this.startTime = Date.now();
				this.timeoutId = setTimeout( () => {
					this.showItem(
						( this.currentIndex + 1 ) % this.items.length
					);
				}, this.remainingTime );
			}
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

		this.items.forEach( ( item ) =>
			item.removeEventListener(
				'mouseenter',
				this.handleMouseEnterItem.bind( this )
			)
		);

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
