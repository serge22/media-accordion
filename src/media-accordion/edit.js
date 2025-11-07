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
	MediaUpload,
	MediaUploadCheck,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	Button,
	PanelBody,
	ToggleControl,
	RadioControl,
	SelectControl,
} from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

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
	const { insertBlock } = useDispatch( 'core/block-editor' );
	const lastActiveBlockRef = useRef( null );
	const [ currentMedia, setCurrentMedia ] = useState( null );

	// Get inner blocks and selected block
	const { innerBlocks, selectedBlockClientId, imageSizes } = useSelect(
		( select ) => {
			const blockEditor = select( 'core/block-editor' );
			const blocks = blockEditor.getBlocks( clientId );
			const selectedBlock = blockEditor.getSelectedBlock();
			const settings = select( blockEditorStore ).getSettings();

			// Check if selected block is one of our inner blocks or a descendant
			let selectedInnerBlockId = null;
			if ( selectedBlock ) {
				// Check if the selected block is directly an inner block
				const isDirectInnerBlock = blocks.some(
					( block ) => block.clientId === selectedBlock.clientId
				);
				if ( isDirectInnerBlock ) {
					selectedInnerBlockId = selectedBlock.clientId;
				} else {
					// Check if the selected block is a descendant of any inner block
					blocks.forEach( ( block ) => {
						const parents = blockEditor.getBlockParents(
							selectedBlock.clientId
						);
						if ( parents.includes( block.clientId ) ) {
							selectedInnerBlockId = block.clientId;
						}
					} );
				}
			}

			return {
				innerBlocks: blocks,
				selectedBlockClientId: selectedInnerBlockId,
				imageSizes: settings?.imageSizes || [],
			};
		},
		[ clientId ]
	);

	// Apply 'active' class to DOM elements directly (editor only, not saved)
	useEffect( () => {
		if ( innerBlocks.length === 0 ) {
			return;
		}

		// Determine which block should be active
		let activeBlockId;
		if ( selectedBlockClientId ) {
			// An inner block is selected, make it active
			activeBlockId = selectedBlockClientId;
			lastActiveBlockRef.current = selectedBlockClientId;
		} else if ( lastActiveBlockRef.current ) {
			// No selection, keep the last active block
			activeBlockId = lastActiveBlockRef.current;
		} else {
			// Default to first block
			activeBlockId = innerBlocks[ 0 ].clientId;
			lastActiveBlockRef.current = activeBlockId;
		}

		// Apply/remove active class to DOM elements
		innerBlocks.forEach( ( block ) => {
			const blockElement = document.querySelector(
				`[data-block="${ block.clientId }"]`
			);

			if ( blockElement ) {
				if ( block.clientId === activeBlockId ) {
					blockElement.classList.add( 'active' );
				} else {
					blockElement.classList.remove( 'active' );
				}
			}
		} );
	}, [ innerBlocks, selectedBlockClientId ] );

	// Generate unique ID if it doesn't exist
	useEffect( () => {
		if ( ! attributes.uid ) {
			setAttributes( {
				uid: `accordion-${ clientId.substring( 0, 8 ) }`,
			} );
		}
	}, [ attributes.uid, clientId, setAttributes ] );

	// Fetch media details when defaultMediaId changes
	useEffect( () => {
		if (
			attributes.defaultMediaId &&
			attributes.defaultMediaType === 'image'
		) {
			apiFetch( {
				path: `/wp/v2/media/${ attributes.defaultMediaId }`,
			} )
				.then( ( media ) => {
					setCurrentMedia( media );
				} )
				.catch( ( error ) => {
					// eslint-disable-next-line no-console
					console.error( 'Error fetching media details:', error );
				} );
		} else {
			setCurrentMedia( null );
		}
	}, [ attributes.defaultMediaId, attributes.defaultMediaType ] );

	// Get available image size options for the current image
	const getAvailableImageSizes = () => {
		if ( ! currentMedia || ! currentMedia.media_details?.sizes ) {
			return [];
		}

		const availableSizes = currentMedia.media_details.sizes;

		// Filter imageSizes to only include those available in the current media
		const filteredSizes = imageSizes
			.filter(
				( size ) => availableSizes[ size.slug ] || size.slug === 'full'
			)
			.map( ( size ) => ( {
				label: size.name,
				value: size.slug,
			} ) );

		// Fallback: if no sizes match, ensure at least "Full" is available
		if ( filteredSizes.length === 0 ) {
			return [
				{ label: __( 'Full Size', 'media-accordion' ), value: 'full' },
			];
		}

		return filteredSizes;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __( 'Accordion Settings', 'media-accordion' ) }
				>
					<ToggleControl
						label={ __( 'Autoplay', 'media-accordion' ) }
						help={
							attributes.autoplay
								? __(
										'Slides advance automatically',
										'media-accordion'
								  )
								: __( 'Manual play only', 'media-accordion' )
						}
						checked={ !! attributes.autoplay }
						onChange={ ( value ) =>
							setAttributes( { autoplay: !! value } )
						}
					/>

					<RadioControl
						label={ __( 'Layout', 'media-accordion' ) }
						selected={ attributes.layout || 'layout-1' }
						onChange={ ( value ) =>
							setAttributes( { layout: value } )
						}
						options={ [
							{
								label: __( 'Accordion', 'media-accordion' ),
								value: 'layout-1',
							},
							{
								label: __( 'List', 'media-accordion' ),
								value: 'layout-2',
							},
						] }
					/>
				</PanelBody>

				<PanelBody
					title={ __( 'Default Media', 'media-accordion' ) }
					initialOpen={ false }
				>
					<p
						style={ {
							marginTop: 0,
							fontSize: '12px',
							color: '#757575',
						} }
					>
						{ __(
							'Set a default media to display when no accordion item is active. When autoplay is disabled and default media is set, the first item will not be active by default.',
							'media-accordion'
						) }
					</p>

					<div style={ { display: 'flex', gap: '10px' } }>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ ( media ) => {
									const isImage = media.type === 'image';
									let sizeSlug;

									if ( isImage ) {
										sizeSlug = media.sizes?.large
											? 'large'
											: 'full';
									}

									// Get the correct URL based on the size
									let mediaUrl = media.url;
									if (
										isImage &&
										sizeSlug !== 'full' &&
										media.sizes?.[ sizeSlug ]
									) {
										mediaUrl = media.sizes[ sizeSlug ].url;
									}

									setAttributes( {
										defaultMediaId: media.id,
										defaultMediaUrl: mediaUrl,
										defaultMediaType: media.type,
										defaultMediaSizeSlug: sizeSlug,
									} );

									// Store the full media object for size filtering
									if ( isImage ) {
										setCurrentMedia( media );
									}
								} }
								allowedTypes={ [ 'image', 'video' ] }
								value={ attributes.defaultMediaId }
								render={ ( { open } ) => (
									<Button
										variant="secondary"
										onClick={ open }
										style={ { marginTop: '10px' } }
									>
										{ attributes.defaultMediaId
											? __(
													'Replace Media',
													'media-accordion'
											  )
											: __(
													'Select Media',
													'media-accordion'
											  ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>

						{ attributes.defaultMediaId && (
							<Button
								variant="secondary"
								isDestructive
								onClick={ () => {
									setAttributes( {
										defaultMediaId: undefined,
										defaultMediaUrl: undefined,
										defaultMediaType: undefined,
										defaultMediaSizeSlug: undefined,
									} );
									setCurrentMedia( null );
								} }
								style={ { marginTop: '10px' } }
							>
								{ __( 'Remove Media', 'media-accordion' ) }
							</Button>
						) }
					</div>

					{ attributes.defaultMediaId &&
						attributes.defaultMediaUrl && (
							<div
								style={ {
									marginTop: '15px',
									marginBottom: '15px',
								} }
							>
								<p
									style={ {
										margin: '0 0 8px 0',
										fontWeight: '500',
									} }
								>
									{ __( 'Preview:', 'media-accordion' ) }
								</p>
								<div
									style={ {
										position: 'relative',
										maxWidth: '100%',
									} }
								>
									{ attributes.defaultMediaType ===
									'video' ? (
										<video
											src={ attributes.defaultMediaUrl }
											style={ {
												maxWidth: '100%',
												height: 'auto',
												display: 'block',
											} }
											controls
										/>
									) : (
										<img
											src={ attributes.defaultMediaUrl }
											alt={ __(
												'Default media',
												'media-accordion'
											) }
											style={ {
												maxWidth: '100%',
												height: 'auto',
												display: 'block',
											} }
										/>
									) }
								</div>
							</div>
						) }

					{ attributes.defaultMediaId &&
						attributes.defaultMediaType === 'image' && (
							<SelectControl
								label={ __(
									'Image Resolution',
									'media-accordion'
								) }
								value={
									attributes.defaultMediaSizeSlug || 'large'
								}
								options={ getAvailableImageSizes() }
								onChange={ async ( value ) => {
									setAttributes( {
										defaultMediaSizeSlug: value,
									} );

									// Get the URL for the selected size
									if ( currentMedia ) {
										let newUrl = currentMedia.source_url; // Default to full size

										if (
											value !== 'full' &&
											currentMedia.media_details?.sizes?.[
												value
											]
										) {
											newUrl =
												currentMedia.media_details
													.sizes[ value ].source_url;
										}

										setAttributes( {
											defaultMediaUrl: newUrl,
										} );
									}
								} }
							/>
						) }
				</PanelBody>

				<PanelColorSettings
					title={ __( 'Color Settings', 'media-accordion' ) }
					colorSettings={ [
						{
							value: attributes.activeItemBgColor,
							onChange: ( value ) =>
								setAttributes( { activeItemBgColor: value } ),
							label: __(
								'Active Item Background Color',
								'media-accordion'
							),
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
					<div
						style={ {
							flex: 1,
							minWidth: '300px',
							maxWidth: '500px',
						} }
					>
						{ /* Show media preview from first media-accordion-item */ }
						<MediaAccordionPreview clientId={ clientId } />
					</div>
				</div>
			</div>
		</>
	);
}
