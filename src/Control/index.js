import { WIDTH, HEIGHT, LEFT, TOP, ROW, HORIZONTAL, VERTICAL } from '../utils/constants';
import { addClass, removeClass } from '../utils/class';
import hasTouch from './hasTouch';
import clamp from './clamp';
import createControlNode from './createControlNode';
import handleMousedown from './handleMousedown';
import handleTouchdown from './handleTouchdown';


function Control ({ boxxy, parent, before, after }) {
	this.boxxy = boxxy;
	this.parent = parent;
	this.before = before;
	this.after = after;
	this.type = parent.type === ROW ? VERTICAL : HORIZONTAL;

	this.node = createControlNode( this );

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

	setPixelPosition ( px ) {
		let bcr = this.parent.bcr;
		let bcrStart = bcr[ this.type === VERTICAL ? LEFT : TOP ];
		let bcrSize = bcr[ this.type === VERTICAL ? WIDTH : HEIGHT ];

		let percentOffset = ( px - bcrStart ) / bcrSize;

		// constrain
		let min = Math.max( this.before.start + this.before.minPc(), this.after.end - this.after.maxPc() );
		let max = Math.min( this.before.start + this.before.maxPc(), this.after.end - this.after.minPc() );

		percentOffset = clamp( percentOffset, min, max );

		this.setPercentOffset( percentOffset );
	},

	setPercentOffset( percentOffset ) {
		this.node.style[ this.type === VERTICAL ? LEFT : TOP ] = ( 100 * percentOffset ) + '%';
		this.pos = percentOffset;

		this.before.setEnd( percentOffset );
		this.after.setStart( percentOffset );

		this.boxxy._fire( 'resize', this.boxxy._changedSinceLastResize );
		this.boxxy._changedSinceLastResize = {};
	}
};

export default Control;
