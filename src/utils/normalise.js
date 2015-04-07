import { ROW, COLUMN } from './constants';
import getNode from './getNode';
import { setStyles } from './style';

export default function normalise ( block, options ) {
	let id, node;

	// expand short-form blocks
	if ( Object.prototype.toString.call( block ) === '[object Array]' ) {
		block = { children: block };
	}

	// TODO deprecate this behaviour?
	if ( typeof block === 'string' ) {
		block = {
			node: getNode( block ) || document.createElement( 'boxxy-block' ),
			id: block
		};
		block.node.id = block.id;
	}

	let children;

	if ( block.children ) {
		let totalSize = 0;
		block.children.forEach( child => {
			totalSize += ( child.size || 1 );
		});

		children = block.children.map( function ( child, i ) {
			return normalise( child, {
				type: options.type === COLUMN ? ROW : COLUMN,
				totalSize: totalSize,
				lineage: options.lineage.concat( i )
			});
		});
	}

	node = block.node ? getNode( block.node ) : getNode( block.id ) || document.createElement( 'boxxy-block' );
	id = block.id || options.lineage.join( '-' );

	setStyles( node, {
		position: 'absolute',
		width: '100%',
		height: '100%'
	});

	return {
		id, node, children,
		type: options.type,
		size: ( 'size' in block ? block.size : 1 ) / options.totalSize,
		min:  block.min || 0,
		max:  block.max
	};
}