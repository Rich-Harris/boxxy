var gobble = require( 'gobble' );

var lib = gobble( 'src' )
	.transform( 'babel', {
		whitelist: [
			'es6.arrowFunctions',
			'es6.blockScoping',
			'es6.classes',
			'es6.constants',
			'es6.destructuring',
			'es6.parameters.default',
			'es6.parameters.rest',
			'es6.properties.shorthand',
			'es6.spread',
			'es6.templateLiterals'
		]
	})
	.transform( 'esperanto-bundle', {
		entry: 'Boxxy',
		type: 'umd',
		name: 'Boxxy'
	})
	.transform( 'sorcery' );

var css = gobble( 'src/Boxxy.css' );

module.exports = gobble([ lib, css, 'demo' ]);
