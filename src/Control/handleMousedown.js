import { CONTROL, VERTICAL, CLIENTX, CLIENTY } from '../utils/constants';

function which ( event ) {
	event = event || window.event;
	return event.which === null ? event.button : event.which;
}

export default function handleMousedown ( event ) {
	if ( which( event ) !== 1 ) {
		return; // not interested in right/middle clicks
	}

	let control = this[ CONTROL ];
	control.activate();

	if ( event.preventDefault ) {
		event.preventDefault();
	}

	function move ( event ) {
		control.setPixelPosition( event[ control.type === VERTICAL ? CLIENTX : CLIENTY ] );
	}

	function up () {
		control.deactivate();
		cancel();
	}

	function cancel () {
		document.removeEventListener( 'mousemove', move );
		document.removeEventListener( 'mouseup', up );
	}

	document.addEventListener( 'mousemove', move );
	document.addEventListener( 'mouseup', up );
}

