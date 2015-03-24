import Control from './Control';
import { addClass } from './utils/class';

const ROW = 'row';
const COLUMN = 'column';
const LEFT = 'left';
const TOP = 'top';
const WIDTH = 'width';
const HEIGHT = 'height';
const VERTICAL = 'vertical';
const HORIZONTAL = 'horizontal';

function Block ( boxxy, parent, parentNode, id, data, start, size, type, edges ) {
	var totalSize, i, total, childData, childSize, node, before, after, childEdges;

	this.start = start;
	this.size = size;
	this.end = this.start + this.size;

	this.type = type;
	this.boxxy = boxxy;
	this.parent = parent;
	this.edges = edges;

	this.min = data.min || boxxy.min;
	this.max = data.max;

	// were we given an existing node?
	if ( data.nodeType === 1 ) { // duck typing, blech. But of course IE fucks up if you do data instanceof Element...
		data = { node: data };
	}

	// or an ID string?
	if ( typeof data === 'string' ) {
		data = { id: data };
	}

	// ...or an array of children?
	if ( Object.prototype.toString.call( data ) === '[object Array]' ) {
		data = { children: data };
	}

	this.id = data.id || id;


	if ( data.children && data.children.length ) {
		// Branch block
		this.node = document.createElement( 'div' );
		addClass( this.node, 'boxxy-block' );
		addClass( this.node, 'boxxy-branch' );

		this.node.id = this.id;
	}

	else {
		// Leaf block
		this.node = document.createElement( 'div' );
		addClass( this.node, 'boxxy-block' );
		addClass( this.node, 'boxxy-leaf' );

		// do we have an ID that references an existing node?
		if ( !data.node && data.id && ( node = document.getElementById( data.id ) ) ) {
			data.node = node;
		}

		if ( data.node ) {
			this.inner = data.node;
		} else {
			this.inner = document.createElement( 'div' );
		}

		addClass( this.inner, 'boxxy-inner' );
		this.node.appendChild( this.inner );

		boxxy.blocks[ this.id ] = this.inner;

		this.inner.id = this.id;
	}

	if ( edges.top ) { addClass( this.node, 'boxxy-top' ); }
	if ( edges.right ) { addClass( this.node, 'boxxy-right' ); }
	if ( edges.bottom ) { addClass( this.node, 'boxxy-bottom' ); }
	if ( edges.left ) { addClass( this.node, 'boxxy-left' ); }

	this.node.style[ type === COLUMN ? LEFT : TOP ] = start + '%';
	this.node.style[ type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

	if ( data.children ) {
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
			childSize = 100 * ( ( childData.size || 1 ) / totalSize );

			childEdges = {};
			if ( type === COLUMN ) {
				childEdges.top = edges.top && ( i === 0 );
				childEdges.bottom = edges.bottom && ( i === ( data.children.length - 1 ) );
				childEdges.left = edges.left;
				childEdges.right = edges.right;
			} else {
				childEdges.left = edges.left && ( i === 0 );
				childEdges.right = edges.right && ( i === ( data.children.length - 1 ) );
				childEdges.top = edges.top;
				childEdges.bottom = edges.bottom;
			}



			this.children[i] = new Block( boxxy, this, this.node, ( id + i ), childData, total, childSize, type === COLUMN ? ROW : COLUMN, childEdges );

			total += childSize;
		}

		for ( i=0; i<data.children.length - 1; i+=1 ) {
			before = this.children[i];
			after = this.children[ i + 1 ];
			this.controls[i] = new Control({
				boxxy,
				parent: this,
				parentNode: this.node,
				before,
				after,
				type: type === ROW ? VERTICAL : HORIZONTAL
			});
		}
	}

	parentNode.appendChild( this.node );
}

Block.prototype = {
	setStart: function ( start ) {
		var previousStart, previousSize, change, size;

		previousStart = this.start;
		previousSize = this.size;

		change = start - previousStart;
		size = previousSize - change;

		this.node.style[ this.type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ this.type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

		this.start = start;
		this.size = size;

		this.shake();
	},

	setEnd: function ( end ) {
		var previousEnd, previousSize, change, size;

		previousEnd = this.end;
		previousSize = this.size;

		change = end - previousEnd;
		size = previousSize + change;

		//this.node.style[ this.type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ this.type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

		this.end = end;
		this.size = size;

		this.shake();
	},

	shake: function () {
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
		this.boxxy._changed[ this.id ] = this.boxxy._changedSinceLastResize[ this.id ] = true;

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
				a.setEnd( a.start + size );
				b.setStart( a.start + size );
				control.setPosition( a.start + size );
			}

			size = a.maxPc();
			if ( a.size > size ) {
				a.setEnd( a.start + size );
				b.setStart( a.start + size );
				control.setPosition( a.start + size );
			}
		}

		// then backwards
		for ( i=len -1; i>0; i-=1 ) {
			a = this.children[ i-1 ];
			b = this.children[i];
			control = this.controls[ i-1 ];

			size = b.minPc();
			if ( b.size < size ) {
				a.setEnd( b.end - size );
				b.setStart( b.end - size );
				control.setPosition( b.end - size );
			}

			size = b.maxPc();
			if ( b.size > size ) {
				a.setEnd( b.end - size );
				b.setStart( b.end - size );
				control.setPosition( b.end - size );
			}
		}

		i = this.children.length;
		while ( i-- ) {
			this.children[i].shake();
		}
	},

	minPc: function () {
		var totalPixels;

		// calculate minimum % width from pixels
		totalPixels = this.parent.pixelSize;
		return ( this.min / totalPixels ) * 100;
	},

	maxPc: function () {
		var totalPixels;

		if ( !this.max ) {
			return 100;
		}

		// calculate minimum % width from pixels
		totalPixels = this.parent.pixelSize;
		return ( this.max / totalPixels ) * 100;
	}
};

export default Block;
