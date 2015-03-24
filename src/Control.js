import { addClass, removeClass } from './utils/class';
import cursor from './utils/cursor';
import {
	WIDTH,
	HEIGHT,
	LEFT,
	TOP,
	VERTICAL,
	CLIENTX,
	CLIENTY
} from './utils/constants';

const touch = ( 'ontouchstart' in document );

function createControlNode ( type ) {
	var node = document.createElement( 'boxxy-control' );

	addClass( node, `boxxy-${type}-control` );

	if ( touch ) {
		addClass( node, 'boxxy-touch-control' );
	}

	return node;
}

function Control ({ boxxy, parent, parentNode, before, after, type }) {
	var mousedownHandler;

	this.boxxy = boxxy;
	this.parent = parent;
	this.before = before;
	this.after = after;
	this.type = type;

	this.parentNode = parentNode;

	this.node = createControlNode( type );

	// initialise position to the start of the next block
	this.setPosition( after.start );

	mousedownHandler = event => {
		var min, max, move, up, cancel;

		if ( event.preventDefault ) {
			event.preventDefault();
		}

		// constraints
		min = Math.max( before.start + before.minPc(), after.end - after.maxPc() );
		max = Math.min( before.start + before.maxPc(), after.end - after.minPc() );

		move = event => {
			var position;

			position = this.getPosition( event[ type === VERTICAL ? CLIENTX : CLIENTY ] );
			position = Math.max( min, Math.min( max, position ) );

			before.setEnd( position );
			after.setStart( position );

			this.setPosition( position );

			this.boxxy._fire( 'resize', this.boxxy._changedSinceLastResize );
			this.boxxy._changedSinceLastResize = {};
		};

		up = () => {
			this.deactivate();
			cancel();
		};

		cancel = () => {
			document.removeEventListener( 'mousemove', move );
			document.removeEventListener( 'mouseup', up );
		};

		document.addEventListener( 'mousemove', move );
		document.addEventListener( 'mouseup', up );
	};

	this.node.addEventListener( 'mousedown', mousedownHandler );

	if ( touch ) {
		this.node.addEventListener( 'touchstart', event => {
			var touch, finger, min, max, move, up, cancel;

			if ( event.touches.length !== 1 ) {
				return;
			}

			event.preventDefault();

			touch = event.touches[0];
			finger = touch.identifier;

			this.activate();

			// constraints
			min = Math.max( before.start + before.minPc(), after.end - after.maxPc() );
			max = Math.min( before.start + before.maxPc(), after.end - after.minPc() );

			move = event => {
				var position, touch;

				if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
					cancel();
				}

				touch = event.touches[0];

				position = this.getPosition( touch[ type === VERTICAL ? CLIENTX : CLIENTY ] );
				position = Math.max( min, Math.min( max, position ) );

				before.setEnd( position );
				after.setStart( position );

				this.setPosition( position );

				this.boxy._fire( 'resize', this.boxxy._changedSinceLastResize );
				this.boxxy._changedSinceLastResize = {};
			};

			up = () => {
				this.deactivate();
				cancel();
			};

			cancel = () => {
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
