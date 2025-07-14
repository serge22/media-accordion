/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 *
 * @return {Element} Element to render.
 */
export default function save( { attributes  } ) {
	const blockProps = useBlockProps.save({
        style: { '--animation-duration': `${ attributes.duration }ms` }
    });
	const baseClass = blockProps.className;
	return (
		<div { ...blockProps }>
			<template className="media-template">
				{ attributes.mediaUrl &&
					attributes.mime.startsWith( 'video/' ) && (
						<video
							src={ attributes.mediaUrl }
							muted
							playsInline
							loop
						/>
					) }

				{ attributes.mediaUrl &&
					attributes.mime.startsWith( 'image/' ) && (
						<img
							src={ attributes.mediaUrl }
							style={ { maxWidth: '100%', height: 'auto' } }
						/>
					) }
			</template>
			<h3 className={`${baseClass}_header`}>
				<button className={`${baseClass}_header-button`}>{ attributes.title }</button>
			</h3>
			<div className={`${baseClass}_content`}>
				<div className={`${baseClass}_content-wrap`}>
					<InnerBlocks.Content />
				</div>
			</div>
		</div>
	);
}
