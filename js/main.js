var divvy, init;

init = function () {

	'use strict';

	var id, colors, randomColor = function () {
		var red, green, blue;

		red = Math.floor( Math.random() * 256 );
		green = Math.floor( Math.random() * 256 );
		blue = Math.floor( Math.random() * 256 );

		return 'rgb(' + [ red, green, blue ].join( ',' ) + ')';
	};

	divvy = new Divvy({
		el: document.getElementById( 'inner' ),
		columns: [
			{
				id: "left",
				size: 50,
				min: 100,
				children: [
					'left-top',
					'left-middle',
					[ 'left-bottom-left', 'left-bottom-right' ]
				]
			},
			{
				'id': "right",
				'size': 50,
				'children': [
					'right-top', 'right-bottom'
				]
			}
		]
	});

	colors = {
		'left-top': 'rgb(220,240,220)',
		'right-bottom': 'rgb(230,210,240)'
	};

	for ( id in divvy.blocks ) {
		if ( divvy.blocks.hasOwnProperty( id ) ) {
			divvy.blocks[ id ].style.backgroundColor = colors[ id ] || randomColor();
		}
	}

};

if ( window.addEventListener ) {
	window.addEventListener( 'load', init );
} else {
	window.onload = init;
}