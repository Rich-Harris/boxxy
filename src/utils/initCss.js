import extend from './extend';

let styles = {
	controlSize: 2,
	controlZIndex: 2,
	controlColor: 'white',
	touchSize: 20
};

let inited, styleElement, styleSheet;

export default function initCss ( options ) {
	if ( options ) {
		styles = extend( styles, options );
	} else if ( inited ) {
		return;
	}

	let controlSize   = styles.controlSize;
	let controlZIndex = styles.controlZIndex;
	let controlColor  = styles.controlColor;
	let touchSize     = styles.touchSize;

	let css = `
		/* blocks */
		.boxxy-leaf {
			padding: ${controlSize}px;
		}


		/* control */
		.boxxy-vertical-control, .boxxy-horizontal-control {
			z-index: ${controlZIndex};
		}

		.boxxy-vertical-control:after {
			border-left: ${controlSize}px solid ${controlColor};
			border-right: ${controlSize}px solid ${controlColor};
			left: -${controlSize}px;
			top: 0;
		}

		.boxxy-horizontal-control:after {
			border-top: ${controlSize}px solid ${controlColor};
			border-bottom: ${controlSize}px solid ${controlColor};
			top: -${controlSize}px;
			left: 0;
		}

		.boxxy-vertical-control.boxxy-touch-control:before {
			border-left-width: ${touchSize}px;
			border-right-width: ${touchSize}px;
			left: -${touchSize}px;
			top: 0;
		}

		.boxxy-horizontal-control.boxxy-touch-control:before {
			border-top-width: ${touchSize}px;
			border-bottom-width: ${touchSize}px;
			top: -${touchSize}px;
			left: 0;
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

		.boxxy-touch-control:before {
			border-color: rgba(255,255,255,0.0001);
			border-style: solid;
		}
	`;

	if ( !inited ) {
		styleElement = document.createElement( 'style' );
		styleElement.type = 'text/css';

		// Internet Exploder won't let you use styleSheet.innerHTML - we have to
		// use styleSheet.cssText instead
		styleSheet = styleElement.styleSheet;

		let head = document.querySelector( 'head' );
		head.insertBefore( styleElement, head.firstChild );

		inited = true;
	}

	if ( styleSheet ) {
		styleSheet.cssText = css;
	} else {
		styleElement.innerHTML = css;
	}
}
