/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Save function for the active accordion block component.
 * Renders the saved block structure with content area, media container, and pause button.
 *
 * @param {Object} props            - The component props
 * @param {Object} props.attributes - Block attributes containing configuration data
 *
 * @return {JSX.Element} The saved block markup with nested content blocks and media controls
 */
export default function save( { attributes } ) {
	const blockProps = useBlockProps.save( {
		className: `${ attributes.uid } is-${
			attributes.layout || 'layout-1'
		}`,
		'data-autoplay': attributes.autoplay ? 'true' : 'false',
		style: attributes.activeItemBgColor
			? { '--active-item-bg-color': attributes.activeItemBgColor }
			: {},
	} );
	const baseClass = blockProps.className.split( ' ' )[ 0 ];
	return (
		<div { ...blockProps }>
			<div className={ `${ baseClass }_content` }>
				<div className={ `${ baseClass }_content-container` }>
					<InnerBlocks.Content />
				</div>
			</div>

			<div className={ `${ baseClass }_media-container` }>
				<div className={ `${ baseClass }_media-wrap` }></div>

				<div className={ `${ baseClass }_pause-btn-container` }>
					<button
						aria-label="Pause"
						aria-disabled="false"
						className={ `${ baseClass }_pause-btn` }
					>
						<span
							className={ `${ baseClass }_pause-btn-wrapper` }
							style="width:24px;height:24px"
						>
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								role="presentation"
								focusable="false"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fillRule="evenodd"
									clipRule="evenodd"
									d="M10 19H6L6 5L10 5L10 19ZM14 19L14 5L18 5V19H14Z"
									fill="#ffffffff"
								></path>
							</svg>
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
