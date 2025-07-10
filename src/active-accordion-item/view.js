/**
 * Use this file for JavaScript code that you want to run in the front-end
 * on posts/pages that contain this block.
 *
 * When this file is defined as the value of the `viewScript` property
 * in `block.json` it will be enqueued on the front end of the site.
 *
 * Example:
 *
 * ```js
 * {
 *   "viewScript": "file:./view.js"
 * }
 * ```
 *
 * If you're not making any changes to this file because your project doesn't need any
 * JavaScript running in the front-end, then you should delete this file and remove
 * the `viewScript` property from `block.json`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

/* eslint-disable no-console */
document.addEventListener( 'DOMContentLoaded', function () {
	const accordions = document.querySelectorAll(
		'.wp-block-srg-media-accordion'
	);
	accordions.forEach( ( accordion ) => {
		const items = accordion.querySelectorAll(
			'.wp-block-srg-media-accordion-item'
		);
		if ( items.length > 0 ) {
			let currentIndex = 0;
			let timeoutId = null;

			function showItem( index ) {
				// Remove 'active' from all items
				items.forEach( ( item ) => item.classList.remove( 'active' ) );
				// Add 'active' to the selected item
				items[ index ].classList.add( 'active' );
				currentIndex = index;

				// Clear any existing timeout
				if ( timeoutId ) {
					clearTimeout( timeoutId );
				}

				// show media
				const media =
					items[ currentIndex ].querySelector( '.media-template' );
				if ( media ) {
					const mediaElement = media.content.cloneNode( true );
					accordion.querySelector( '.wp-block-srg-media-accordion_media-container' ).innerHTML =
						'';
					accordion
						.querySelector( '.wp-block-srg-media-accordion_media-container' )
						.appendChild( mediaElement );
				}

				// Get animation duration from CSS variable
				const duration = getComputedStyle(
					items[ currentIndex ]
				).getPropertyValue( '--animation-duration' );
				const ms = duration.includes( 'ms' )
					? parseFloat( duration )
					: parseFloat( duration ) * 1000;

				// Schedule next item
				timeoutId = setTimeout( () => {
					showItem( ( currentIndex + 1 ) % items.length );
				}, ms );
			}

			// Attach click event to each button
			items.forEach( ( item, idx ) => {
				const button = item.querySelector( '.wp-block-srg-media-accordion-item_header-button' );
				if ( button ) {
					button.addEventListener( 'click', function ( e ) {
						e.preventDefault();
						showItem( idx );
					} );
				}
			} );

			// Start with the first item
			showItem( 0 );
		}
	} );
} );
/* eslint-enable no-console */
