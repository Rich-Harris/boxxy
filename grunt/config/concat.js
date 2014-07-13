module.exports = {
	options: {
		banner: '// Divvy v<%= pkg.version %>\n// Copyright (2013) Rich Harris\n// Released under the MIT License\n\n// https://github.com/Rich-Harris/Divvy\n\n;(function ( global ) {\n\n\'use strict\';\n\n',
		footer: '\n\nif ( typeof module !== "undefined" && module.exports ) { module.exports = Divvy; }\n' +
			'else if ( typeof define !== "undefined" && define.amd ) { define( function () { return Divvy; }); }\n' +
			'else { global.Divvy = Divvy; }\n\n}( this ));'
	},
	build: {
		dest: 'build/divvy.js',
		src: [ 'src/divvy.js' ]
	}
};
