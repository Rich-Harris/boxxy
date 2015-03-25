import { setStyle, setStyles } from '../utils/style';
import { addClass } from '../utils/class';

const EDGES = [
	{ l: 'left',  u: 'Left'  },
	{ l: 'right', u: 'Right' },
	{ l: 'top',   u: 'Top'   },
	{ l: 'right', u: 'Right' }
];

export default function createBlockNode ( edges ) {
	let node = document.createElement( 'boxxy-block' );

	setStyles( node, {
		position: 'absolute',
		display: 'block',
		width: '100%',
		height: '100%',
		boxSizing: 'border-box',
		overflow: 'hidden'
	});

	EDGES.forEach( edge => {
		if ( edges[ edge.l ] ) {
			addClass( node, `boxxy-${edge.l}` );
			setStyle( node, `padding${edge.u}`, '0' );
		}
	});

	return node;
}
