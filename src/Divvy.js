var Divvy = (function () {

	'use strict';

	var Block, Control, indexOf, addClass, removeClass, ROW, COLUMN, LEFT, TOP, WIDTH, HEIGHT, VERTICAL, HORIZONTAL, CLIENTX, CLIENTY;

	ROW = 'row';
	COLUMN = 'column';
	LEFT = 'left';
	TOP = 'top';
	WIDTH = 'width';
	HEIGHT = 'height';
	VERTICAL = 'vertical';
	HORIZONTAL = 'horizontal';
	CLIENTX = 'clientX';
	CLIENTY = 'clientY';

	// helpers
	indexOf = function ( needle, haystack ) {
		var i, len;

		for ( i=0, len=haystack.length; i<len; i+=1 ) {
			if ( haystack[i] === needle ) {
				return needle;
			}
		}

		return -1;
	};

	addClass = function ( node, className ) {
		var trim;

		if ( node.classList && node.classList.add ) {
			addClass = function ( node, className ) {
				node.classList.add( className );
			};
		}

		else {
			trim = function ( str ) {
				return str.replace( /^\s*/, '' ).replace( /\s*$/ );
			};

			addClass = function ( node, className ) {
				var classNames, index;

				classNames = node.className.split( ' ' ).map( trim );

				if ( classNames.indexOf ) {
					index = classNames.indexOf( className );
				} else {
					index = indexOf( className, classNames );
				}

				if ( index === -1 ) {
					node.className = classNames.concat( className ).join( ' ' );
				}
			};
		}

		addClass( node, className );
	};

	removeClass = function ( node, className ) {
		var trim;

		if ( node.classList && node.classList.remove ) {
			removeClass = function ( node, className ) {
				node.classList.remove( className );
			};
		}

		else {
			trim = function ( str ) {
				return str.replace( /^\s*/, '' ).replace( /\s*$/ );
			};

			removeClass = function ( node, className ) {
				var classNames, index;

				classNames = node.className.split( ' ' ).map( trim );

				if ( classNames.indexOf ) {
					index = classNames.indexOf( className );
				} else {
					index = indexOf( className, classNames );
				}

				if ( index !== -1 ) {
					classNames.splice( index, 1 );
					node.className = classNames.join( ' ' );
				}
			};
		}

		removeClass( node, className );
	};

	Block = function ( root, parent, parentNode, id, data, start, size, type, edges ) {
		var totalSize, i, total, childData, childSize, node, before, after, childEdges;

		this.start = start;
		this.size = size;
		this.end = this.start + this.size;

		this.type = type;
		this.parent = parent;
		this.edges = edges;

		this.min = data.min || root.min;
		this.max = data.max;

		// were we given an existing node?
		if ( data instanceof Element ) {
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
			addClass( this.node, 'divvy-block' );
			addClass( this.node, 'divvy-branch' );
		}

		else {
			// Leaf block
			this.node = document.createElement( 'div' );
			addClass( this.node, 'divvy-block' );
			addClass( this.node, 'divvy-leaf' );

			// do we have an ID that references an existing node?
			if ( !data.node && data.id && ( node = document.getElementById( data.id ) ) ) {
				data.node = node;
			}

			if ( data.node ) {
				this.inner = data.node;
			} else {
				this.inner = document.createElement( 'div' );
			}

			addClass( this.inner, 'divvy-inner' );
			this.node.appendChild( this.inner );

			root.blocks[ this.id ] = this.inner;
		}

		if ( edges.top ) { addClass( this.node, 'divvy-top' ); }
		if ( edges.right ) { addClass( this.node, 'divvy-right' ); }
		if ( edges.bottom ) { addClass( this.node, 'divvy-bottom' ); }
		if ( edges.left ) { addClass( this.node, 'divvy-left' ); }
		
		this.node.style[ type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

		this.node.id = this.id;

		if ( data.children ) {
			// find total size of children
			totalSize = data.children.reduce( function ( prev, curr ) {
				return prev + ( curr.size || 1 );
			}, 0 );

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



				this.children[i] = new Block( root, this, this.node, ( id + i ), childData, total, childSize, type === COLUMN ? ROW : COLUMN, childEdges );
				
				total += childSize;
			}

			for ( i=0; i<data.children.length - 1; i+=1 ) {
				before = this.children[i];
				after = this.children[ i + 1 ];
				this.controls[i] = new Control( root, this, this.node, before, after, type === ROW ? VERTICAL : HORIZONTAL );
			}
		}

		parentNode.appendChild( this.node );
	};

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
		},

		shake: function () {
			var i, len, a, b, control, size;

			if ( !this.children ) {
				return;
			}

			this.bcr = this.node.getBoundingClientRect();
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


	Control = function ( root, parent, parentNode, before, after, type ) {
		var self = this;

		this.root = root;
		this.parent = parent;
		this.before = before;
		this.after = after;
		this.type = type;

		this.parentNode = parentNode;

		this.node = document.createElement( 'div' );
		addClass( this.node, 'divvy-' + type + '-control' );

		this.setPosition( after.start );

		this.node.addEventListener( 'mousedown', function ( event ) {
			var start, min, max, afterEnd, move, up, cancel;

			self.setActive();

			event.preventDefault();

			// constraints
			min = Math.max( before.start + before.minPc(), after.end - after.maxPc() );
			max = Math.min( before.start + before.maxPc(), after.end - after.minPc() );

			move = function ( event ) {
				var position;

				position = self.getPosition( event[ type === VERTICAL ? CLIENTX : CLIENTY ] );
				position = Math.max( min, Math.min( max, position ) );

				before.setEnd( position );
				after.setStart( position );

				self.setPosition( position );
			};

			up = function ( event ) {
				self.setInactive();
				cancel();
			};

			cancel = function () {
				window.removeEventListener( 'mousemove', move );
				window.removeEventListener( 'mouseup', up );
			};

			window.addEventListener( 'mousemove', move );
			window.addEventListener( 'mouseup', up );
		});

		parentNode.appendChild( this.node );
	};

	Control.prototype = {
		setActive: function () {
			addClass( this.node, 'divvy-active' );
			this.root.cursor( this.type === VERTICAL ? 'ew' : 'ns' );
		},

		setInactive: function () {
			removeClass( this.node, 'divvy-active' );
			this.root.cursor( false );
		},

		getPosition: function ( px ) {
			var bcr, bcrStart, bcrSize, position;

			bcr = this.parent.bcr;
			bcrStart = bcr[ this.type === VERTICAL ? LEFT : TOP ];
			bcrSize = bcr[ this.type === VERTICAL ? WIDTH : HEIGHT ];

			position = 100 * ( px - bcrStart ) / bcrSize;

			return position;
		},

		setPosition: function ( pos ) {
			this.node.style[ this.type === VERTICAL ? LEFT : TOP ] = pos + '%';
		}
	};



	Divvy = function ( options ) {
		var self = this, fragment, i, blocks, type;

		this.el = options.el;
		fragment = document.createDocumentFragment();

		if ( options.columns && options.rows ) {
			throw new Error( 'You can\'t have top level rows and top level columns - one or the other' );
		}

		if ( options.columns ) {
			this.type = ROW;
			blocks = options.columns;
		} else if ( options.rows ) {
			this.type = COLUMN;
			blocks = options.rows;
		}

		this.blocks = {};

		this.min = options.min || 10;

		this.root = new Block( this, this, fragment, 'divvy-0', { children: blocks }, 0, 100, this.type, { top: true, right: true, bottom: true, left: true });
		this.el.appendChild( fragment );

		if ( options.shakeOnResize !== false ) {
			window.addEventListener( 'resize', function () {
				self.shake();
			});
		}

		this.shake();
	};

	Divvy.prototype = {
		shake: function () {
			this.bcr = this.el.getBoundingClientRect();
			this.pixelSize = this.bcr[ this.type === COLUMN ? HEIGHT : WIDTH ];

			this.root.shake();
		},

		cursor: function ( direction ) {
			if ( !direction ) {
				this.el.style.cursor = this._cursor;
				return;
			}

			this._cursor = this.el.style.cursor;
			this.el.style.cursor = direction + '-resize';
		}
	};


	return Divvy;

}());