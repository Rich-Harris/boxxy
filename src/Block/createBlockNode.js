import { setStyles } from '../utils/style';
import { addClass } from '../utils/class';

export default function createBlockNode ( edges ) {
	let node = document.createElement( 'boxxy-block' );

	setStyles( node, {
		position: 'absolute',
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
		overflow: 'hidden'
	});

	addClass( node, 'boxxy-block' );

	if ( edges.top )    { addClass( node, 'boxxy-top'    ); }
	if ( edges.right )  { addClass( node, 'boxxy-right'  ); }
	if ( edges.bottom ) { addClass( node, 'boxxy-bottom' ); }
	if ( edges.left )   { addClass( node, 'boxxy-left'   ); }

	return node;
}
