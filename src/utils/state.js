import {
	COLUMN,
	LEFT,
	TOP,
	WIDTH,
	HEIGHT
} from './constants';

export function getState ( block, state ) {
	var i;

	state[ block.id ] = [ block.start, block.size ];

	if ( !block.children ) {
		return;
	}

	i = block.children.length;
	while ( i-- ) {
		getState( block.children[i], state );
	}
}

export function setState ( boxxy, block, state, changed ) {
	var i, len, child, totalSize, blockState;

	blockState = state[ block.id ];

	if ( !blockState ) {
		return; // something went wrong...
	}

	if ( block.start !== blockState[0] || block.size !== blockState[1] ) {
		boxxy._changed[ block.id ] = changed[ block.id ] = true;
	}

	block.start = blockState[0];
	block.size = blockState[1];
	block.end = block.start + block.size;

	block.node.style[ block.type === COLUMN ? LEFT : TOP ] = block.start + '%';
	block.node.style[ block.type === COLUMN ? WIDTH : HEIGHT ] = block.size + '%';

	if ( block.children ) {
		totalSize = 0;
		len = block.children.length;

		for ( i=0; i<len; i+=1 ) {
			child = block.children[i];

			setState( boxxy, child, state, changed, true );
			totalSize += child.size;

			if ( block.controls[i] ) {
				block.controls[i].setPosition( totalSize );
			}
		}

		i = block.children.length;
		while ( i-- ) {
			setState( boxxy, block.children[i], state, changed, true );
		}
	}

	block.shake();
}
