// Divvy v0.1.3
// Copyright (2013) Rich Harris
// Released under the MIT License

// https://github.com/Rich-Harris/Divvy

;(function ( global ) {

'use strict';

var Divvy;

(function () {

	'use strict';

	var Block,
		Control,

		// shims for shit browsers
		indexOf,
		addClass,
		removeClass,

		// internal helper functions
		getState,
		setState,
		cursor,
		fire,

		// a few string constants
		ROW = 'row',
		COLUMN = 'column',
		LEFT = 'left',
		TOP = 'top',
		WIDTH = 'width',
		HEIGHT = 'height',
		VERTICAL = 'vertical',
		HORIZONTAL = 'horizontal',
		CLIENTX = 'clientX',
		CLIENTY = 'clientY';

	

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
		this.subs = {}; // events

		this.min = options.min || 10;

		this.root = new Block( this, this, fragment, 'divvy-0', { children: blocks }, 0, 100, this.type, { top: true, right: true, bottom: true, left: true });
		this.el.appendChild( fragment );

		if ( options.shakeOnResize !== false ) {
			window.addEventListener( 'resize', function () {
				self._changedSinceLastResize = {};
				self.shake();
				fire( self, 'resize', self._changedSinceLastResize );
			});
		}

		this._changed = {};
		this._changedSinceLastResize = {};
		this.shake();
	};

	Divvy.prototype = {
		shake: function () {
			this.bcr = this.el.getBoundingClientRect();

			if ( ( this.bcr.width === this.width ) && ( this.bcr.height === this.height ) ) {
				return; // nothing to do
			}

			this.width = this.bcr.width;
			this.height = this.bcr.height;

			this.pixelSize = this[ this.type === COLUMN ? HEIGHT : WIDTH ];

			this.root.shake();

			return this;
		},

		changed: function () {
			var changed = this._changed;
			this._changed = {};

			return changed;
		},

		getState: function () {
			var state = {};

			getState( this.root, state );
			return state;
		},

		setState: function ( state ) {
			var changed = {}, key;

			setState( this, this.root, state, changed );

			// if any of the sizes have changed, fire a resize event...
			for ( key in changed ) {
				if ( changed.hasOwnProperty( key ) ) {
					fire( this, 'resize', changed );
					
					// ...but only the one
					break;
				}
			}
			return this;
		},

		save: function ( id ) {
			var key, value;

			if ( !localStorage ) {
				return;
			}

			key = ( id ? 'divvy_' + id : 'divvy' );
			value = JSON.stringify( this.getState() );

			localStorage.setItem( key, value );

			return this;
		},

		restore: function ( id ) {
			var key, value;

			if ( !localStorage ) {
				return;
			}

			key = ( id ? 'divvy_' + id : 'divvy' );
			value = JSON.parse( localStorage.getItem( key ) );

			if ( value ) {
				this.setState( value );
			}

			return this;
		},

		on: function ( eventName, callback ) {
			var self = this, subs;

			if ( !( subs = this.subs[ eventName ] ) ) {
				this.subs[ eventName ] = [ callback ];
			} else {
				subs[ subs.length ] = callback;
			}

			return {
				cancel: function () {
					self.off( eventName, callback );
				}
			};
		},

		off: function ( eventName, callback ) {
			var index, subs;

			if ( !eventName ) {
				// remove all listeners
				this.subs = {};
				return this;
			}

			if ( !callback ) {
				// remove all listeners of eventName
				delete this.subs[ eventName ];
				return this;
			}

			if ( !( subs = this.subs[ eventName ] ) ) {
				return this;
			}

			index = subs.indexOf( callback );

			if ( index !== -1 ) {
				subs.splice( index, 1 );
				if ( !subs.length ) {
					delete this.subs[ eventName ];
				}
			}

			return this;
		}
	};


	// internal helpers
	fire = function ( divvy, eventName ) {
		var args, subs, i, len;

		subs = divvy.subs[ eventName ];

		if ( !subs ) {
			return;
		}

		args = Array.prototype.slice.call( arguments, 2 );

		// call is faster if we can use it instead of apply
		if ( !args.length ) {
			for ( i=0, len=subs.length; i<len; i+=1 ) {
				subs[i].call( divvy );
			}
			return;
		}

		for ( i=0, len=subs.length; i<len; i+=1 ) {
			subs[i].apply( divvy, args );
		}
		return divvy;
	};

	getState = function ( block, state ) {
		var i;

		state[ block.id ] = [ block.start, block.size ];

		if ( !block.children ) {
			return;
		}

		i = block.children.length;
		while ( i-- ) {
			getState( block.children[i], state );
		}
	};

	setState = function ( divvy, block, state, changed, noShake ) {
		var i, len, child, totalSize, blockState;

		blockState = state[ block.id ];

		if ( !blockState ) {
			return; // something went wrong...
		}

		if ( block.start !== blockState[0] || block.size !== blockState[1] ) {
			divvy._changed[ block.id ] = changed[ block.id ] = true;
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

				setState( divvy, child, state, changed, true );
				totalSize += child.size;

				if ( block.controls[i] ) {
					block.controls[i].setPosition( totalSize );
				}
			}

			i = block.children.length;
			while ( i-- ) {
				setState( divvy, block.children[i], state, changed, true );	
			}
		}

		if ( !noShake ) {
			block.shake();
		}
	};

	cursor = function ( divvy, direction ) {
		if ( !direction ) {
			divvy.el.style.cursor = divvy._cursor;
			return;
		}

		divvy._cursor = divvy.el.style.cursor;
		divvy.el.style.cursor = direction + '-resize';
	};


	// internal constructors
	Block = function ( root, parent, parentNode, id, data, start, size, type, edges ) {
		var totalSize, i, total, childData, childSize, node, before, after, childEdges;

		this.start = start;
		this.size = size;
		this.end = this.start + this.size;

		this.type = type;
		this.root = root;
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

			this.node.id = this.id;
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

			this.inner.id = this.id;
		}

		if ( edges.top ) { addClass( this.node, 'divvy-top' ); }
		if ( edges.right ) { addClass( this.node, 'divvy-right' ); }
		if ( edges.bottom ) { addClass( this.node, 'divvy-bottom' ); }
		if ( edges.left ) { addClass( this.node, 'divvy-left' ); }
		
		this.node.style[ type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

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
			var i, len, a, b, control, size;

			this.bcr = this.node.getBoundingClientRect();

			if ( ( this.bcr.width === this.width ) && ( this.bcr.height === this.height ) ) {
				return; // nothing to do, no need to shake children
			}

			this.width = this.bcr.width;
			this.height = this.bcr.height;
			this.root._changed[ this.id ] = this.root._changedSinceLastResize[ this.id ] = true;

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

				fire( self.root, 'resize', self.root._changedSinceLastResize );
				self.root._changedSinceLastResize = {};
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
			cursor( this.root, this.type === VERTICAL ? 'ew' : 'ns' );
		},

		setInactive: function () {
			removeClass( this.node, 'divvy-active' );
			cursor( this.root, false );
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


	// shims
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

}());

if ( typeof global.module !== "undefined" && global.module.exports ) { global.module.exports = Divvy; }
else if ( typeof global.define !== "undefined" && global.define.amd ) { global.define( function () { return Divvy; }); }
else { global.Divvy = Divvy; }

}( this ));