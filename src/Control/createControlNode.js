import { addClass } from '../utils/class';
import { setStyles } from '../utils/style';
import hasTouch from '../utils/hasTouch';
import {
	VERTICAL,
	CONTROL
} from '../utils/constants';

export default function createControlNode ( control, type ) {
	var node = document.createElement( 'boxxy-control' );

	addClass( node, `boxxy-${type}-control` );

	setStyles( node, {
		position: 'absolute',
		userSelect: 'none'
	});

	if ( hasTouch ) {
		addClass( node, 'boxxy-touch-control' );
	}

	if ( type === VERTICAL ) {
		setStyles( node, {
			width: '0',
			height: '100%'
		});
	} else {
		setStyles( node, {
			width: '100%',
			height: '0'
		});
	}

	node[ CONTROL ] = control;

	return node;
}
