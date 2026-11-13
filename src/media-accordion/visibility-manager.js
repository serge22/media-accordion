/* global IntersectionObserver */

/**
 * @typedef {import('./media-accordion').MediaAccordion} MediaAccordion
 */

/**
 * Accordion Visibility Manager
 *
 * Global accordion visibility manager that uses a single intersection observer
 * to monitor all accordions efficiently.
 *
 * @since 1.0.0
 */

import { Utils } from './utils';

export const AccordionVisibilityManager = {
	observer: null,
	loadObserver: null,
	accordions: new Map(),

	/**
	 * Initialize the global observers
	 */
	init() {
		if ( ! this.observer ) {
			this.observer = new IntersectionObserver(
				( entries ) => {
					entries.forEach( ( entry ) => {
						const accordion = this.accordions.get( entry.target );
						if ( ! accordion ) {
							return;
						}
						accordion.isIntersecting = entry.isIntersecting;
						if ( entry.isIntersecting ) {
							// Loading depends on intersection only, not opacity.
							accordion.onNearViewport();
						}
						if (
							entry.isIntersecting &&
							Utils.isElementVisible( entry.target )
						) {
							accordion.onVisibilityChange( true );
						} else {
							accordion.onVisibilityChange( false );
							if ( entry.isIntersecting ) {
								// e.g. ancestor still fading in from opacity 0
								accordion.scheduleVisibilityRecheck();
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

		// Separate observer: start loading media shortly before scrolling in.
		if ( ! this.loadObserver ) {
			this.loadObserver = new IntersectionObserver(
				( entries ) => {
					entries.forEach( ( entry ) => {
						const accordion = this.accordions.get( entry.target );
						if ( accordion && entry.isIntersecting ) {
							accordion.onNearViewport();
							this.loadObserver.unobserve( entry.target );
						}
					} );
				},
				{ root: null, rootMargin: '300px 0px', threshold: 0 }
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
		this.loadObserver.observe( accordion.accordion );
	},

	/**
	 * Unregister an accordion from visibility monitoring
	 * @param {MediaAccordion} accordion - The accordion instance
	 */
	unregister( accordion ) {
		if ( this.observer && this.accordions.has( accordion.accordion ) ) {
			this.observer.unobserve( accordion.accordion );
			this.loadObserver?.unobserve( accordion.accordion );
			this.accordions.delete( accordion.accordion );
		}
	},

	/**
	 * Destroy the global observer
	 */
	destroy() {
		if ( this.observer ) {
			this.observer.disconnect();
			this.loadObserver?.disconnect();
			this.observer = null;
			this.loadObserver = null;
			this.accordions.clear();
		}
	},
};
