import { useSelect } from '@wordpress/data';

/**
 * Helper component to preview media from accordion items.
 *
 * This component displays a preview of the media from the selected accordion item,
 * or falls back to the first item with media if none is selected.
 *
 * @param {Object} props          - The component props
 * @param {string} props.clientId - The parent block's client ID
 *
 * @return {JSX.Element} The rendered preview component
 */
export default function MediaAccordionPreview( { clientId } ) {
	const { selectedBlockId, itemBlocks } = useSelect(
		( select ) => {
			const { getBlock, getSelectedBlockClientId } =
				select( 'core/block-editor' );
			const block = getBlock( clientId );
			const selectedId = getSelectedBlockClientId();

			return {
				selectedBlockId: selectedId,
				itemBlocks: block
					? block.innerBlocks.filter(
							( b ) => b.name === 'srg/media-accordion-item'
					  )
					: [],
			};
		},
		[ clientId ]
	);

	// Find the selected block first, or fall back to the first one with media
	let itemBlock = itemBlocks.find(
		( b ) => b.clientId === selectedBlockId && b.attributes.mediaUrl
	);

	if ( ! itemBlock ) {
		itemBlock = itemBlocks.find( ( b ) => b.attributes.mediaUrl );
	}

	if ( ! itemBlock ) {
		return <div style={ { color: '#888' } }>No media selected</div>;
	}
	if (
		itemBlock.attributes.mime &&
		itemBlock.attributes.mime.startsWith( 'video/' )
	) {
		return (
			<video
				key={ itemBlock.clientId }
				src={ itemBlock.attributes.mediaUrl }
				controls
				style={ { maxWidth: '100%', height: 'auto' } }
			/>
		);
	}
	if (
		itemBlock.attributes.mime &&
		itemBlock.attributes.mime.startsWith( 'image/' )
	) {
		return (
			<img
				key={ itemBlock.clientId }
				src={ itemBlock.attributes.mediaUrl }
				alt="Media preview"
				style={ { maxWidth: '100%', height: 'auto' } }
			/>
		);
	}
	return <div style={ { color: '#888' } }>Unsupported media type</div>;
}
