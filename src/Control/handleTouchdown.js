import { CONTROL, VERTICAL, CLIENTX, CLIENTY } from '../utils/constants';

export default function ( event ) {
	if ( event.touches.length !== 1 ) {
		return;
	}

	event.preventDefault();

	let touch = event.touches[0];
	let finger = touch.identifier;

	let control = this[ CONTROL ];
	control.activate();

	function move ( event ) {
		if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
			cancel();
		}

		control.setPixelPosition( touch[ control.type === VERTICAL ? CLIENTX : CLIENTY ] );
	}

	function up () {
		control.deactivate();
		cancel();
	}

	function cancel () {
		window.removeEventListener( 'touchmove', move );
		window.removeEventListener( 'touchend', up );
		window.removeEventListener( 'touchcancel', up );
	}

	window.addEventListener( 'touchmove', move );
	window.addEventListener( 'touchend', up );
	window.addEventListener( 'touchcancel', up );
}
