var Divvy = (function () {

	'use strict';

	var Block, Control, ROW, COLUMN, LEFT, TOP, WIDTH, HEIGHT, VERTICAL, HORIZONTAL, CLIENTX, CLIENTY, randomColor;

	// TEMP
	randomColor = function () {
		var red, green, blue;

		red = Math.floor( Math.random() * 256 );
		green = Math.floor( Math.random() * 256 );
		blue = Math.floor( Math.random() * 256 );

		return 'rgb(' + [ red, green, blue ].join( ',' ) + ')';
	};

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

	Block = function ( root, parent, parentNode, data, start, size, type ) {
		var totalSize, i, total, childData, childSize, before, after;

		this.start = start;
		this.size = size;
		this.end = this.start + this.size;

		this.type = type;
		this.parent = parent;

		this.min = data.min || root.min;
		this.max = data.max;

		this.node = document.createElement( 'div' );
		this.node.className = 'divvy-block';
		
		this.node.style[ type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

		// allow data to be an ID string...
		if ( typeof data === 'string' ) {
			data = { id: data };
		}

		// ...or an array of children
		if ( Object.prototype.toString.call( data ) === '[object Array]' ) {
			data = { children: data };
		}

		if ( data.id ) {
			this.node.id = data.id;

			if ( !data.children ) {
				root.blocks[ data.id ] = this.node;
			}
		}

		// TEMP
		if ( !data.children ) {
			this.node.style.backgroundColor = randomColor();
		}

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

				this.children[i] = new Block( root, this, this.node, childData, total, childSize, type === COLUMN ? ROW : COLUMN );

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
		this.node.className = 'divvy-' + type + '-control';

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
			this.node.classList.add( 'active' );
			this.root.cursor( this.type === VERTICAL ? 'ew' : 'ns' );
		},

		setInactive: function () {
			this.node.classList.remove( 'active' );
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

		this.root = new Block( this, this, fragment, { children: blocks }, 0, 100, this.type );
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