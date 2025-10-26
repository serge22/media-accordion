/**
 * Constants and configuration for Media Accordion Block
 *
 * @since 1.0.0
 */

export const CONFIG = {
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
