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
export default function save({attributes}) {
	const blockProps = useBlockProps.save({
        className: attributes.uid
    });
	const baseClass = blockProps.className.split(' ')[0];;
	return (
		<div { ...blockProps }>
			<div className={`${baseClass}_content`}>
				<div className={`${baseClass}_content-container`}>
					<InnerBlocks.Content />
				</div>
			</div>
			<div className={`${baseClass}_media-container`}></div>

			<div className={`${baseClass}_pause-btn-container`}>
				<button aria-label="Pause" aria-disabled="false" className={`${baseClass}_pause-btn`}>
					<span className={`${baseClass}_pause-btn-wrapper`} style="width:24px;height:24px">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="presentation" focusable="false" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 19H6L6 5L10 5L10 19ZM14 19L14 5L18 5V19H14Z" fill="#ffffffff"></path></svg>
					</span>
				</button>
			</div>
		</div>
	);
}
