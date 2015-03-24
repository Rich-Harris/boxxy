import { addClass, removeClass } from './utils/class';
import throttle from './utils/throttle';
import cursor from './utils/cursor';

const touch = ( 'ontouchstart' in document );

const LEFT = 'left';
const TOP = 'top';
const WIDTH = 'width';
const HEIGHT = 'height';
const VERTICAL = 'vertical';
const CLIENTX = 'clientX';
const CLIENTY = 'clientY';

function Control ({ boxxy, parent, parentNode, before, after, type }) {
	var self = this, mousedownHandler;

	this.boxxy = boxxy;
	this.parent = parent;
	this.before = before;
	this.after = after;
	this.type = type;

	this.parentNode = parentNode;

	this.node = document.createElement( 'div' );
	addClass( this.node, 'boxxy-' + type + '-control' );

	if ( touch ) {
		addClass( this.node, 'boxxy-touch-control' );
	}

	// initialise position to the start of the next block
	this.setPosition( after.start );

	mousedownHandler = function ( event ) {
		var min, max, move, up, cancel;

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

			self.boxxy._fire( 'resize', self.boxxy._changedSinceLastResize );
			self.boxxy._changedSinceLastResize = {};
		};

		up = function () {
			self.deactivate();
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
			var touch, finger, min, max, move, up, cancel;

			if ( event.touches.length !== 1 ) {
				return;
			}

			event.preventDefault();

			touch = event.touches[0];
			finger = touch.identifier;

			self.activate();

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

				self.boxy._fire( 'resize', self.boxxy._changedSinceLastResize );
				self.boxxy._changedSinceLastResize = {};
			};

			up = function () {
				self.deactivate();
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
}

Control.prototype = {
	activate () {
		addClass( this.node, 'boxxy-active' );
		cursor( this.boxxy, this.type === VERTICAL ? 'ew' : 'ns' );
	},

	deactivate () {
		removeClass( this.node, 'boxxy-active' );
		cursor( this.boxxy, false );
	},

	getPosition ( px ) {
		var bcr, bcrStart, bcrSize, position;

		bcr = this.parent.bcr;
		bcrStart = bcr[ this.type === VERTICAL ? LEFT : TOP ];
		bcrSize = bcr[ this.type === VERTICAL ? WIDTH : HEIGHT ];

		position = 100 * ( px - bcrStart ) / bcrSize;

		return position;
	},

	setPosition ( pos ) {
		this.node.style[ this.type === VERTICAL ? LEFT : TOP ] = pos + '%';
		this.pos = pos;
	}
};

export default Control;
