/**
 * Navigation Plugin for KeenSlider
 *
 * Creates a navigation plugin for a slider with dot indicators.
 * This plugin adds navigation dots below the slider that allow users to jump
 * directly to specific slides. The active dot is highlighted to indicate the
 * current slide position.
 *
 * @since 1.0.0
 */

/**
 * Creates a navigation plugin for a slider with dot indicators.
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
export function createNavigationPlugin( slider ) {
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
