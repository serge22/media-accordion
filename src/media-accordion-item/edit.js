/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	RichText,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

import { PanelBody, TextControl, Button } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

const TEMPLATE = [
	[
		'core/paragraph',
		{ placeholder: 'type content of press / to add block' },
	],
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @param {Object}   props               - Block edit function props
 * @param {Object}   props.attributes    - Block attributes object
 * @param {Function} props.setAttributes - Function to set block attributes
 * @param {string}   props.clientId      - Unique client ID for this block instance
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {JSX.Element} Element to render.
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const isActive = useSelect(
		( select ) => {
			const blockEditor = select( 'core/block-editor' );
			const parentAccordionClientId =
				blockEditor.getBlockRootClientId( clientId );
			if ( ! parentAccordionClientId ) {
				return false;
			}

			const accordionItems = blockEditor.getBlocks(
				parentAccordionClientId
			);
			if ( accordionItems.length === 0 ) {
				return false;
			}

			const selectedClientId = blockEditor.getSelectedBlockClientId();

			if ( ! selectedClientId ) {
				return accordionItems[ 0 ]?.clientId === clientId;
			}

			// Expand the item that is selected or contains the selected descendant block.
			const selectedParents =
				blockEditor.getBlockParents( selectedClientId );
			const activeItem = accordionItems.find(
				( item ) =>
					item.clientId === selectedClientId ||
					selectedParents.includes( item.clientId )
			);

			return (
				activeItem?.clientId === clientId ||
				( ! activeItem && accordionItems[ 0 ]?.clientId === clientId )
			);
		},
		[ clientId ]
	);
	const handleDurationChange = ( value ) => {
		setAttributes( { duration: parseInt( value, 10 ) || 0 } );
	};

	const handleMediaSelect = ( media ) => {
		setAttributes( {
			mediaId: media.id,
			mediaUrl: media.url,
			mime: media.mime,
		} );

		// If the media is a video, we can set the duration based on its length
		if ( media.fileLength ) {
			const timeParts = media.fileLength.split( ':' );
			const minutes = parseInt( timeParts[ 0 ], 10 ) || 0;
			const seconds = parseInt( timeParts[ 1 ], 10 ) || 0;
			const duration = ( minutes * 60 + seconds ) * 1000;
			setAttributes( { duration } );
		}
	};

	const handleMediaRemove = () => {
		setAttributes( {
			mediaId: null,
			mediaUrl: '',
			mime: '',
		} );
	};

	let mediaButtonContent;

	if ( ! attributes.mediaUrl ) {
		mediaButtonContent = __(
			'Select Image or Video',
			'media-accordion-item'
		);
	} else if ( attributes.mime.startsWith( 'video/' ) ) {
		mediaButtonContent = (
			<video
				src={ attributes.mediaUrl }
				controls
				style={ { maxWidth: '100%', height: 'auto' } }
			/>
		);
	} else {
		mediaButtonContent = (
			<img
				src={ attributes.mediaUrl }
				alt={ __( 'Media selected', 'media-accordion-item' ) }
				style={ { maxWidth: '100%', height: 'auto' } }
			/>
		);
	}

	const blockProps = useBlockProps( {
		className: isActive ? 'active' : undefined,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ __(
						'Accordion Item Settings',
						'media-accordion-item'
					) }
				>
					<TextControl
						label={ __(
							'Animation Duration (ms)',
							'media-accordion-item'
						) }
						type="number"
						value={ attributes.duration }
						min={ 0 }
						onChange={ handleDurationChange }
					/>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ handleMediaSelect }
							allowedTypes={ [ 'image', 'video' ] }
							value={ attributes.mediaId }
							render={ ( { open } ) => (
								<div style={ { marginTop: '1em' } }>
									<Button
										onClick={ open }
										variant={
											attributes.mediaUrl
												? 'link'
												: 'secondary'
										}
									>
										{ mediaButtonContent }
									</Button>
									{ attributes.mediaUrl && (
										<Button
											onClick={ handleMediaRemove }
											variant="link"
											isDestructive
											style={ { marginLeft: '1em' } }
										>
											{ __(
												'Remove',
												'media-accordion-item'
											) }
										</Button>
									) }
								</div>
							) }
						/>
					</MediaUploadCheck>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="header">
					<RichText
						className="title"
						value={ attributes.title }
						placeholder={ __( 'heading…', 'media-accordion-item' ) }
						onChange={ ( value ) =>
							setAttributes( { title: value } )
						}
					/>
				</div>
				<div className="wp-block-srg-media-accordion-item_content">
					<div className="wp-block-srg-media-accordion-item_content-wrap">
						<InnerBlocks template={ TEMPLATE } />
					</div>
				</div>
			</div>
		</>
	);
}
