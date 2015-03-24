import Block from './Block';
import { getState, setState } from './utils/state';
import { addClass } from './utils/class';
import {
	ROW,
	COLUMN,
	WIDTH,
	HEIGHT
} from './utils/constants';

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

	// Block ( boxxy, parent, parentNode, id, data, start, size, type, edges ) {

	this.root = new Block({
		boxxy: this,
		parent: this,
		parentNode: fragment,
		id: 'boxxy-0',
		data: { children: blocks },
		start: 0,
		size: 100,
		type: this.type,
		edges: { top: true, right: true, bottom: true, left: true }
	});

	addClass( this.root.node, 'boxxy-root' );
	this.el.appendChild( fragment );

	if ( options.shakeOnResize !== false ) {
		resizeHandler = function () {
			self._changedSinceLastResize = {};
			self.shake();
			self._fire( 'resize', self._changedSinceLastResize );
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
				this._fire( 'resize', changed );

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

export default Boxxy;
