/**
 * Utility functions for Media Accordion Block
 *
 * @since 1.0.0
 */

export const Utils = {
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
