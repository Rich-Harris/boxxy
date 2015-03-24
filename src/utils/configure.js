import extend from './extend';

const DEFAULTS = {

};

export default function configure ( options ) {
	options = extend( DEFAULTS, options );

	let css = `
		.boxxy-leaf {
			padding: 2px;
		}

		.boxxy-leaf.boxxy-top {
			padding-top: 0;
		}

		.boxxy-leaf.boxxy-right {
			padding-right: 0;
		}

		.boxxy-leaf.boxxy-bottom {
			padding-bottom: 0;
		}

		.boxxy-leaf.boxxy-left {
			padding-left: 0;
		}

		.boxxy-inner {
			width: 100%;
			height: 100%;
			overflow: auto;
			-webkit-box-sizing: border-box;
			-moz-box-sizing: border-box;
			box-sizing: border-box;
		}

		.boxxy-vertical-control, .boxxy-horizontal-control {
			z-index: 2;
		}

		.boxxy-touch-control:before {
			position: absolute;
			content: ' ';
			display: block;
			width: 100%;
			height: 100%;
		}

		.boxxy-vertical-control:after, .boxxy-horizontal-control:after {
			position: absolute;
			content: ' ';
			display: block;
			width: 100%;
			height: 100%;
		}

		.boxxy-vertical-control {
			cursor: ew-resize;
		}

		.boxxy-horizontal-control {
			cursor: ns-resize;
		}

		.boxxy-vertical-control:after {
			border-left: 2px solid white;
			border-right: 2px solid white;
			left: -2px;
			top: 0;
		}

		.boxxy-vertical-control.boxxy-touch-control:before {
			border-left: 20px solid rgba(255,255,255,0.0001);
			border-right: 20px solid rgba(255,255,255,0.0001);
			left: -20px;
			top: 0;
		}

		.boxxy-horizontal-control:after {
			border-top: 2px solid white;
			border-bottom: 2px solid white;
			top: -2px;
			left: 0;
		}

		.boxxy-horizontal-control.boxxy-touch-control:before {
			border-top: 20px solid rgba(255,255,255,0.0001);
			border-bottom: 20px solid rgba(255,255,255,0.0001);
			top: -20px;
			left: 0;
		}
	`;
}
