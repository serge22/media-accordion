/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

const ALLOWED_BLOCKS = [ 'srg/media-accordion-item' ];
const TEMPLATE = [ [ 'srg/media-accordion-item' ] ];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes, clientId } ) {
	const { insertBlock } = useDispatch( 'core/block-editor' );

	// Generate unique ID if it doesn't exist
    useEffect(() => {
        if ( ! attributes.uid) {
            setAttributes({ 
                uid: `accordion-${clientId.substr(0, 8)}` 
            });
        }
    }, []);

	return (
		<div { ...useBlockProps() }>
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
	);
}
