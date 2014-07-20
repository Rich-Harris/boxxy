// Divvy v0.1.6
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

		// touch support?
		touch = ( 'ontouchstart' in document ),

		// shims for shit browsers
		indexOf,
		addClass,
		removeClass,
		trim,

		// internal helper functions
		getState,
		setState,
		cursor,
		fire,
		throttle,

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
		var self = this, fragment, i, blocks, type, resizeHandler;

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
		addClass( this.root.node, 'divvy-root' );
		this.el.appendChild( fragment );

		if ( options.shakeOnResize !== false ) {
			resizeHandler = function () {
				self._changedSinceLastResize = {};
				self.shake();
				fire( self, 'resize', self._changedSinceLastResize );
			};

			if ( window.addEventListener ) {
				window.addEventListener( 'resize', resizeHandler );
			} else if ( window.attachEvent ) {
				window.attachEvent( 'onresize', resizeHandler );
			}
		}

		this._changed = {};
		this._changedSinceLastResize = {};
		this.shake();
	};

	Divvy.prototype = {
		shake: function () {
			var bcr = this.el.getBoundingClientRect();

			this.bcr = {
				left: bcr.left,
				right: bcr.right,
				top: bcr.top,
				bottom: bcr.bottom,
				width: bcr.right - bcr.left,
				height: bcr.bottom - bcr.top
			};

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

		//if ( !noShake ) {
			block.shake();
		//}
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
	Block = function ( divvy, parent, parentNode, id, data, start, size, type, edges ) {
		var totalSize, i, total, childData, childSize, node, before, after, childEdges;

		this.start = start;
		this.size = size;
		this.end = this.start + this.size;

		this.type = type;
		this.divvy = divvy;
		this.parent = parent;
		this.edges = edges;

		this.min = data.min || divvy.min;
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

			divvy.blocks[ this.id ] = this.inner;

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



				this.children[i] = new Block( divvy, this, this.node, ( id + i ), childData, total, childSize, type === COLUMN ? ROW : COLUMN, childEdges );

				total += childSize;
			}

			for ( i=0; i<data.children.length - 1; i+=1 ) {
				before = this.children[i];
				after = this.children[ i + 1 ];
				this.controls[i] = new Control( divvy, this, this.node, before, after, type === ROW ? VERTICAL : HORIZONTAL );
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
			this.divvy._changed[ this.id ] = this.divvy._changedSinceLastResize[ this.id ] = true;

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


	Control = function ( divvy, parent, parentNode, before, after, type ) {
		var self = this, mousedownHandler;

		this.divvy = divvy;
		this.parent = parent;
		this.before = before;
		this.after = after;
		this.type = type;

		this.parentNode = parentNode;

		this.node = document.createElement( 'div' );
		addClass( this.node, 'divvy-' + type + '-control' );

		if ( touch ) {
			addClass( this.node, 'divvy-touch-control' );
		}

		// initialise position to the start of the next block
		this.setPosition( after.start );

		mousedownHandler = function ( event ) {
			var start, min, max, afterEnd, move, up, cancel;

			if ( event.preventDefault ) {
				event.preventDefault();
			}

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

				fire( self.divvy, 'resize', self.divvy._changedSinceLastResize );
				self.divvy._changedSinceLastResize = {};
			};

			up = function ( event ) {
				self.setInactive();
				cancel();
			};

			cancel = function () {
				if ( document.removeEventListener ) {
					document.removeEventListener( 'mousemove', move );
					document.removeEventListener( 'mouseup', up );
				} else if ( document.detachEvent ) {
					document.detachEvent( 'onmousemove', move );
					document.detachEvent( 'onmouseup', up );
				}
			};

			if ( document.addEventListener ) {
				document.addEventListener( 'mousemove', move );
				document.addEventListener( 'mouseup', up );
			} else if ( document.attachEvent ) {
				document.attachEvent( 'onmousemove', move = throttle( move ) );
				document.attachEvent( 'onmouseup', up );
			}
		};

		if ( this.node.addEventListener ) {
			this.node.addEventListener( 'mousedown', mousedownHandler );
		} else if ( this.node.attachEvent ) {
			this.node.attachEvent( 'onmousedown', mousedownHandler );
		}

		if ( touch ) {
			this.node.addEventListener( 'touchstart', function ( event ) {
				var touch, pos, finger, start, min, max, afterEnd, move, up, cancel;

				if ( event.touches.length !== 1 ) {
					return;
				}

				event.preventDefault();

				touch = event.touches[0];
				finger = touch.identifier;

				self.setActive();

				// constraints
				min = Math.max( before.start + before.minPc(), after.end - after.maxPc() );
				max = Math.min( before.start + before.maxPc(), after.end - after.minPc() );

				move = function ( event ) {
					var position, touch;

					if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
						cancel();
					}

					touch = event.touches[0];

					position = self.getPosition( touch[ type === VERTICAL ? CLIENTX : CLIENTY ] );
					position = Math.max( min, Math.min( max, position ) );

					before.setEnd( position );
					after.setStart( position );

					self.setPosition( position );

					fire( self.divvy, 'resize', self.divvy._changedSinceLastResize );
					self.divvy._changedSinceLastResize = {};
				};

				up = function ( event ) {
					self.setInactive();
					cancel();
				};

				cancel = function () {
					window.removeEventListener( 'touchmove', move );
					window.removeEventListener( 'touchend', up );
					window.removeEventListener( 'touchcancel', up );
				};

				window.addEventListener( 'touchmove', move );
				window.addEventListener( 'touchend', up );
				window.addEventListener( 'touchcancel', up );
			});
		}

		parentNode.appendChild( this.node );
	};

	Control.prototype = {
		setActive: function ( pos ) {
			addClass( this.node, 'divvy-active' );
			cursor( this.divvy, this.type === VERTICAL ? 'ew' : 'ns' );
		},

		setInactive: function ( pos ) {
			removeClass( this.node, 'divvy-active' );
			cursor( this.divvy, false );
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
			this.pos = pos;
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

	trim = function ( str ) {
		return str.replace( /^\s*/, '' ).replace( /\s*$/, '' );
	};

	addClass = function ( node, className ) {
		if ( node.classList && node.classList.add ) {
			addClass = function ( node, className ) {
				node.classList.add( className );
			};
		}

		else {
			addClass = function ( node, className ) {
				var classNames, index, i;

				classNames = ( node.getAttribute( 'class' ) || '' ).split( ' ' );

				i = classNames.length;
				while ( i-- ) {
					classNames[i] = trim( classNames[i] );
				}

				if ( classNames.indexOf ) {
					index = classNames.indexOf( className );
				} else {
					index = indexOf( className, classNames );
				}

				if ( index === -1 ) {
					node.setAttribute( 'class', classNames.concat( className ).join( ' ' ) );
				}
			};
		}

		addClass( node, className );
	};

	removeClass = function ( node, className ) {
		if ( node.classList && node.classList.remove ) {
			removeClass = function ( node, className ) {
				node.classList.remove( className );
			};
		}

		else {
			removeClass = function ( node, className ) {
				var classNames, index, i;

				classNames = ( node.getAttribute( 'class' ) || '' ).split( ' ' );

				i = classNames.length;
				while ( i-- ) {
					classNames[i] = trim( classNames[i] );
				}

				if ( classNames.indexOf ) {
					index = classNames.indexOf( className );
				} else {
					index = indexOf( className, classNames );
				}

				if ( index !== -1 ) {
					classNames.splice( index, 1 );
					node.setAttribute( 'class', classNames.join( ' ' ) );
				}
			};
		}

		removeClass( node, className );
	};

	throttle = function ( fn, wait ) {
		var throttled, lastCalled;

		wait = wait || 500;

		throttled = function () {
			var timeNow;

			timeNow = new Date();

			if ( !lastCalled || ( timeNow - lastCalled ) > wait ) {
				return fn.apply( this, arguments );
				lastCalled = timeNow;
			}
		};

		return throttled;
	};

}());
	// export as AMD
	if ( typeof define === 'function' && define.amd ) {
		define( function () { return Divvy; });
	}

	// export as CJS
	else if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Divvy;
	}

	// export as browser global
	else {
		global.Divvy = Divvy;
	}

}( this ));
