import {
	CONTROL,
	VERTICAL,
	CLIENTX,
	CLIENTY
} from '../utils/constants';

export default function ( event ) {
	if ( event.touches.length !== 1 ) {
		return;
	}

	event.preventDefault();

	let touch = event.touches[0];
	let finger = touch.identifier;

	let control = this[ CONTROL ];
	control.activate();

	// constraints
	let min = Math.max( control.before.start + control.before.minPc(), control.after.end - control.after.maxPc() );
	let max = Math.min( control.before.start + control.before.maxPc(), control.after.end - control.after.minPc() );

	function move ( event ) {
		var position, touch;

		if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
			cancel();
		}

		touch = event.touches[0];

		position = control.getPosition( touch[ control.type === VERTICAL ? CLIENTX : CLIENTY ] );
		position = Math.max( min, Math.min( max, position ) );

		control.setPosition( position );
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
