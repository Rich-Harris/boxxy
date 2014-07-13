module.exports = function ( grunt ) {

	'use strict';

	grunt.registerTask( 'default', [
		'jshint',
		'concat',
		'uglify',
		'copy:css'
	]);

};
