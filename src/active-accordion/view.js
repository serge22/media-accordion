/**
 * Media Accordion Block - Frontend JavaScript
 *
 * Main entry point for accordion functionality including:
 * - Item switching with click events
 * - Automatic progression with timing
 * - Pause/resume functionality
 * - Media content display
 * - KeenSlider integration for mobile devices
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

import 'keen-slider/keen-slider.min.css';
import { CONFIG } from './constants';
import { MediaAccordion } from './media-accordion';
import { AccordionVisibilityManager } from './visibility-manager';

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
