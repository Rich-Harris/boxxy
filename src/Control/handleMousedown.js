import {
	CONTROL,
	VERTICAL,
	CLIENTX,
	CLIENTY
} from '../utils/constants';

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

	// constraints
	let min = Math.max( control.before.start + control.before.minPc(), control.after.end - control.after.maxPc() );
	let max = Math.min( control.before.start + control.before.maxPc(), control.after.end - control.after.minPc() );

	function move ( event ) {
		var position;

		position = control.getPosition( event[ control.type === VERTICAL ? CLIENTX : CLIENTY ] );
		position = Math.max( min, Math.min( max, position ) );

		control.setPosition( position );
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

