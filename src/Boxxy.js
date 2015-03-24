import Block from './Block';
import { addClass } from './utils/class';

let getState;
let setState;
let fire;
let ROW = 'row';
let COLUMN = 'column';
let LEFT = 'left';
let TOP = 'top';
let WIDTH = 'width';
let HEIGHT = 'height';

function Boxxy ( options ) {
	var self = this, fragment, blocks, resizeHandler;

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
	this._callbacks = {}; // events

	this.min = options.min || 10;

	this.root = new Block( this, this, fragment, 'boxxy-0', { children: blocks }, 0, 100, this.type, { top: true, right: true, bottom: true, left: true });
	addClass( this.root.node, 'boxxy-root' );
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
}

Boxxy.prototype = {
	_fire ( eventName, data ) {
		let callbacks = this._callbacks[ eventName ];

		if ( !callbacks ) return;

		for ( let i = 0, len = callbacks.length; i < len; i += 1 ) {
			callbacks[i].call( this, data );
		}
	},

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

		key = ( id ? 'boxxy_' + id : 'boxxy' );
		value = JSON.stringify( this.getState() );

		localStorage.setItem( key, value );

		return this;
	},

	restore: function ( id ) {
		var key, value;

		if ( !localStorage ) {
			return;
		}

		key = ( id ? 'boxxy_' + id : 'boxxy' );
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

setState = function ( boxxy, block, state, changed ) {
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
};

export default Boxxy;
