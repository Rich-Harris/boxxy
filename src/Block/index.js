import Control from '../Control';
import { addClass } from '../utils/class';
import createBlockNode from './createBlockNode';
import { ROW, COLUMN, WIDTH, HEIGHT, LEFT, TOP } from '../utils/constants';

function Block ({ boxxy, parent, data, edges }) {
	var totalSize, i, total, childData, childSize, node, before, after, childEdges;

	this.start = this.size = this.end = null;

	this.type = parent.type === ROW ? COLUMN : ROW;
	this.boxxy = boxxy;
	this.parent = parent;

	this.id = data.id;
	this.min = data.min || boxxy.min;
	this.max = data.max;

	this.node = createBlockNode( edges );

	if ( !data.children ) {
		// Leaf block
		this.isLeaf = true;

		addClass( this.node, 'boxxy-leaf' );

		// do we have an ID that references an existing node?
		if ( !data.node && data.id && ( node = document.getElementById( data.id ) ) ) {
			data.node = node;
		}

		// use existing node if it exists, otherwise create one
		this.inner = data.node || document.createElement( 'div' );

		addClass( this.inner, 'boxxy-inner' );
		this.node.appendChild( this.inner );

		boxxy.blocks[ this.id ] = this.inner;

		this.inner.id = this.id;
	}

	else if ( data.children ) {
		// find total size of children
		totalSize = 0;

		i = data.children.length;
		while ( i-- ) {
			totalSize += data.children[i].size || 1;
		}

		this.children = [];
		this.controls = [];

		total = 0;
		for ( i=0; i<data.children.length; i+=1 ) {
			childData = data.children[i];
			childSize = ( childData.size || 1 ) / totalSize;

			if ( this.type === COLUMN ) {
				childEdges = {
					top: edges.top && ( i === 0 ),
					bottom: edges.bottom && ( i === ( data.children.length - 1 ) ),
					left: edges.left,
					right: edges.right
				};
			} else {
				childEdges = {
					left: edges.left && ( i === 0 ),
					right: edges.right && ( i === ( data.children.length - 1 ) ),
					top: edges.top,
					bottom: edges.bottom
				};
			}

			this.children[i] = new Block({
				boxxy,
				parent: this,
				data: childData,
				edges: childEdges
			});

			total += childSize;
		}

		for ( i=0; i<data.children.length - 1; i+=1 ) {
			before = this.children[i];
			after = this.children[ i + 1 ];

			this.controls[i] = new Control({
				boxxy,
				parent: this,
				before,
				after
			});
		}
	}

	parent.node.appendChild( this.node );
}

Block.prototype = {
	getState ( state ) {
		var i;

		state[ this.id ] = { start: this.start, size: this.size };

		if ( !this.children ) {
			return;
		}

		i = this.children.length;
		while ( i-- ) {
			this.children[i].getState( state );
		}
	},

	setState ( state, changed ) {
		var i, len, child, totalSize, blockState;

		blockState = state[ this.id ];

		if ( !blockState ) {
			// this should never happen...
			throw new Error( 'Could not set state' );
		}

		if ( ( this.start !== blockState.start || this.size !== blockState.size ) && this.isLeaf ) {
			this.boxxy._changed[ this.id ] = changed[ this.id ] = true;
		}

		this.update( blockState.start, blockState.size, blockState.start + blockState.size );

		if ( this.children ) {
			totalSize = 0;
			len = this.children.length;

			for ( i=0; i<len; i+=1 ) {
				child = this.children[i];

				child.setState( state, changed );
				totalSize += child.size;

				if ( this.controls[i] ) {
					this.controls[i].setPercentOffset( totalSize );
				}
			}
		}
	},

	setStart ( start ) {
		var previousStart, previousSize, change, size;

		previousStart = this.start;
		previousSize = this.size;

		change = start - previousStart;
		size = previousSize - change;

		this.update( start, size, this.end );
	},

	setEnd ( end ) {
		var previousEnd, previousSize, change, size;

		previousEnd = this.end;
		previousSize = this.size;

		change = end - previousEnd;
		size = previousSize + change;

		this.update( this.start, size, end );
	},

	update ( start, size, end ) {
		this.node.style[ this.type === COLUMN ? LEFT  : TOP    ] = ( 100 * start ) + '%';
		this.node.style[ this.type === COLUMN ? WIDTH : HEIGHT ] = ( 100 * size ) + '%';

		this.start = start;
		this.size = size;
		this.end = end;

		this.shake();
	},

	shake () {
		var i, len, a, b, control, size, bcr;

		bcr = this.node.getBoundingClientRect();

		this.bcr = {
			left: bcr.left,
			right: bcr.right,
			top: bcr.top,
			bottom: bcr.bottom,
			width: bcr.right - bcr.left,
			height: bcr.bottom - bcr.top
		};

		if ( ( this.bcr.width === this.width ) && ( this.bcr.height === this.height ) ) {
			return; // nothing to do, no need to shake children
		}

		this.width = this.bcr.width;
		this.height = this.bcr.height;

		if ( this.isLeaf ) {
			this.boxxy._changed[ this.id ] = this.boxxy._changedSinceLastResize[ this.id ] = true;
		}

		// if we don't have any children, we don't need to go any further
		if ( !this.children ) {
			return;
		}

		this.pixelSize = this.bcr[ this.type === COLUMN ? HEIGHT : WIDTH ];

		// enforce minima and maxima - first go forwards
		len = this.children.length;
		for ( i=0; i<len - 1; i+=1 ) {
			a = this.children[i];
			b = this.children[ i+1 ];
			control = this.controls[i];

			size = a.minPc();
			if ( a.size < size ) {
				control.setPercentOffset( a.start + size );
			}

			size = a.maxPc();
			if ( a.size > size ) {
				control.setPercentOffset( a.start + size );
			}
		}

		// then backwards
		for ( i=len -1; i>0; i-=1 ) {
			a = this.children[ i-1 ];
			b = this.children[i];
			control = this.controls[ i-1 ];

			size = b.minPc();
			if ( b.size < size ) {
				control.setPercentOffset( b.end - size );
			}

			size = b.maxPc();
			if ( b.size > size ) {
				control.setPercentOffset( b.end - size );
			}
		}

		i = this.children.length;
		while ( i-- ) {
			this.children[i].shake();
		}
	},

	minPc () {
		var totalPixels;

		// calculate minimum % width from pixels
		totalPixels = this.parent.pixelSize;
		return ( this.min / totalPixels );
	},

	maxPc () {
		var totalPixels;

		if ( !this.max ) {
			return 1;
		}

		// calculate minimum % width from pixels
		totalPixels = this.parent.pixelSize;
		return ( this.max / totalPixels );
	}
};

export default Block;
