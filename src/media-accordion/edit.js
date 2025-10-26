/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { Button, PanelBody, ToggleControl, RadioControl } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';
import MediaAccordionPreview from './MediaAccordionPreview';

const ALLOWED_BLOCKS = [ 'srg/media-accordion-item' ];
const TEMPLATE = [ [ 'srg/media-accordion-item' ] ];

/**
 * Edit component for the media accordion block.
 *
 * This component renders the block editor interface for the media accordion,
 * including inner blocks for accordion items and a button to add new items.
 * It automatically generates a unique ID for the accordion if one doesn't exist.
 *
 * @param {Object}   props               - The component props
 * @param {Object}   props.attributes    - Block attributes containing block data
 * @param {Function} props.setAttributes - Function to update block attributes
 * @param {string}   props.clientId      - Unique client ID for the block instance
 *
 * @return {JSX.Element} The rendered edit component
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const { insertBlock, updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// Get inner blocks and selected block
    const { innerBlocks, selectedBlockClientId } = useSelect(
        ( select ) => {
			const blockEditor = select( 'core/block-editor' );
			const blocks = blockEditor.getBlocks( clientId );
			const selectedBlock = blockEditor.getSelectedBlock();
			
			// Check if selected block is one of our inner blocks or a descendant
			let selectedInnerBlockId = null;
			if ( selectedBlock ) {
				// Check if the selected block is directly an inner block
				const isDirectInnerBlock = blocks.some( block => block.clientId === selectedBlock.clientId );
				if ( isDirectInnerBlock ) {
					selectedInnerBlockId = selectedBlock.clientId;
				} else {
					// Check if the selected block is a descendant of any inner block
					blocks.forEach( block => {
						const parents = blockEditor.getBlockParents( selectedBlock.clientId );
						if ( parents.includes( block.clientId ) ) {
							selectedInnerBlockId = block.clientId;
						}
					} );
				}
			}

            return {
				innerBlocks: blocks,
				selectedBlockClientId: selectedInnerBlockId,
			};
        },
        [ clientId ]
    );

	// Set 'active' class to selected inner block and remove from others
	useEffect( () => {
		if ( innerBlocks.length > 0 ) {
			innerBlocks.forEach( ( block, index ) => {
				const shouldBeActive = selectedBlockClientId 
					? block.clientId === selectedBlockClientId 
					: index === 0; // Default to first block if none selected
				
				const currentClassName = block.attributes.className || '';
				const hasActive = currentClassName.includes( 'active' );
				
				if ( shouldBeActive && ! hasActive ) {
					// Add active class
					const newClassName = currentClassName ? `${ currentClassName } active`.trim() : 'active';
					updateBlockAttributes( block.clientId, {
						className: newClassName
					} );
				} else if ( ! shouldBeActive && hasActive ) {
					// Remove active class
					const newClassName = currentClassName.replace( /\s*active\s*/g, ' ' ).trim();
					updateBlockAttributes( block.clientId, {
						className: newClassName || undefined
					} );
				}
			} );
		}
	}, [ innerBlocks, selectedBlockClientId, updateBlockAttributes ] );

	// Generate unique ID if it doesn't exist
	useEffect( () => {
		if ( ! attributes.uid ) {
			setAttributes( {
				uid: `accordion-${ clientId.substring( 0, 8 ) }`,
			} );
		}
	}, [ attributes.uid, clientId, setAttributes ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Accordion Settings', 'media-accordion' ) }>
					<ToggleControl
						label={ __( 'Autoplay', 'media-accordion' ) }
						help={
							attributes.autoplay
								? __( 'Slides advance automatically', 'media-accordion' )
								: __( 'Manual play only', 'media-accordion' )
						}
						checked={ !! attributes.autoplay }
						onChange={ ( value ) => setAttributes( { autoplay: !! value } ) }
					/>

					<RadioControl
						label={ __( 'Layout', 'media-accordion' ) }
						selected={ attributes.layout || 'layout-1' }
						onChange={ ( value ) => setAttributes( { layout: value } ) }
						options={ [
							{ label: __( 'Accordion', 'media-accordion' ), value: 'layout-1' },
							{ label: __( 'List', 'media-accordion' ), value: 'layout-2' },
						] }
					/>
				</PanelBody>

				<PanelColorSettings
					title={ __( 'Color Settings', 'media-accordion' ) }
					colorSettings={ [
						{
							value: attributes.activeItemBgColor,
							onChange: ( value ) => setAttributes( { activeItemBgColor: value } ),
							label: __( 'Active Item Background Color', 'media-accordion' ),
						},
					] }
				/>
			</InspectorControls>

			<div
                { ...useBlockProps( {
                    className: `is-${ attributes.layout || 'layout-1' }`,
                    style: {
                        '--active-item-bg-color': attributes.activeItemBgColor,
                    },
                } ) }
            >
				<div style={ { display: 'flex', gap: '20px' } }>
					<div style={ { flex: '1' } }>
						<InnerBlocks
							allowedBlocks={ ALLOWED_BLOCKS }
							template={ TEMPLATE }
						/>

						<Button
							variant="primary"
							onClick={ () =>
								insertBlock(
									createBlock( 'srg/media-accordion-item' ),
									undefined,
									clientId
								)
							}
							style={ { marginTop: '1em' } }
						>
							{ __( 'Add Item', 'media-accordion' ) }
						</Button>
					</div>
					<div style={{ flex: 1, minWidth: '300px', maxWidth: '500px' }}>
						{/* Show media preview from first media-accordion-item */}
						<MediaAccordionPreview clientId={clientId} />
					</div>
				</div>
			</div>
		</>
	);
}
