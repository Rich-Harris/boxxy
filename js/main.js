var divvy;

window.addEventListener( 'load', function () {

	'use strict';

	divvy = new Divvy({
		el: document.getElementById( 'inner' ),
		columns: [
			{
				"id": "left",
				"size": 50,
				"min": 100,
				"max": 300,
				"children": [
					"copy",
					"console",
					[ 'left', 'right' ]
				]
			},
			{
				"id": "right",
				"size": 50,
				"children": [
					"top", "bottom"
				]
			}
		]
	});

});