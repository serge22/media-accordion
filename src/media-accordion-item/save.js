/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * Save function for the active accordion item block.
 *
 * Renders the final markup for an accordion item with optional media content,
 * a collapsible header button, and inner blocks content. The component supports
 * both video and image media types and applies custom animation duration styling.
 *
 * @param {Object} root0            - The component props
 * @param {Object} root0.attributes - Block attributes containing configuration data
 *
 * @return {JSX.Element} The accordion item markup with media template, header button, and content area
 *
 * @see {@link https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save}
 */
export default function save( { attributes } ) {
	const blockProps = useBlockProps.save( {
		style: { '--animation-duration': `${ attributes.duration }ms` },
	} );
	const baseClass = blockProps.className;
	return (
		<div { ...blockProps }>
			<template className="media-template">
				{ attributes.mediaUrl &&
					attributes.mime.startsWith( 'video/' ) && (
						<video
							src={ attributes.mediaUrl }
							className={ `${ baseClass }_media-item skip-lazy` }
							muted
							playsInline
							loop
						/>
					) }

				{ attributes.mediaUrl &&
					attributes.mime.startsWith( 'image/' ) && (
						<img
							src={ attributes.mediaUrl }
							className={ `${ baseClass }_media-item skip-lazy` }
							style={ { maxWidth: '100%', height: 'auto' } }
							alt=""
						/>
					) }
			</template>
			<div className={ `${ baseClass }_header` }>
				<button className={ `${ baseClass }_header-button` }>
					{ attributes.title }
				</button>
			</div>
			<div className={ `${ baseClass }_content` }>
				<div className={ `${ baseClass }_content-wrap` }>
					<InnerBlocks.Content />
				</div>
			</div>
		</div>
	);
}
