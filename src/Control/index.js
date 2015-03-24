import {
	WIDTH,
	HEIGHT,
	LEFT,
	TOP,
	VERTICAL
} from '../utils/constants';
import { addClass, removeClass } from '../utils/class';
import hasTouch from '../utils/hasTouch';
import createControlNode from './createControlNode';
import handleMousedown from './handleMousedown';
import handleTouchdown from './handleTouchdown';


function Control ({ boxxy, parent, before, after, type }) {
	this.boxxy = boxxy;
	this.parent = parent;
	this.before = before;
	this.after = after;
	this.type = type;

	this.node = createControlNode( this, type );

	this.node.addEventListener( 'mousedown', handleMousedown );

	if ( hasTouch ) {
		this.node.addEventListener( 'touchstart', handleTouchdown );
	}

	parent.node.appendChild( this.node );
}

Control.prototype = {
	activate () {
		addClass( this.node, 'boxxy-active' );
		this.boxxy._setCursor( this.type === VERTICAL ? 'ew' : 'ns' );
	},

	deactivate () {
		removeClass( this.node, 'boxxy-active' );
		this.boxxy._setCursor( false );
	},

	getPosition ( px ) {
		var bcr, bcrStart, bcrSize, position;

		bcr = this.parent.bcr;
		bcrStart = bcr[ this.type === VERTICAL ? LEFT : TOP ];
		bcrSize = bcr[ this.type === VERTICAL ? WIDTH : HEIGHT ];

		position = ( px - bcrStart ) / bcrSize;

		return position;
	},

	setPosition ( pos ) {
		this.node.style[ this.type === VERTICAL ? LEFT : TOP ] = ( 100 * pos ) + '%';
		this.pos = pos;

		this.before.setEnd( pos );
		this.after.setStart( pos );

		this.boxxy._fire( 'resize', this.boxxy._changedSinceLastResize );
		this.boxxy._changedSinceLastResize = {};
	}
};

export default Control;
