module.exports = function ( grunt ) {

	'use strict';

	grunt.initConfig({

		pkg: grunt.file.readJSON( 'package.json' ),

		watch: {
			main: {
				files: 'src/**/*.js',
				tasks: 'default'
			}
		},

		jshint: {
			jshintrc: '.jshintrc'
		},

		concat: {
			options: {
				banner: '// Divvy v<%= pkg.version %>\n// Copyright (2013) Rich Harris\n// Released under the MIT License\n\n// https://github.com/Rich-Harris/Divvy\n\n;(function ( global ) {\n\n\'use strict\';\n\n',
				footer: '\n\nif ( typeof global.module !== "undefined" && global.module.exports ) { global.module.exports = Divvy; }\n' +
					'else if ( typeof global.define !== "undefined" && global.define.amd ) { global.define( function () { return Divvy; }); }\n' +
					'else { global.Divvy = Divvy; }\n\n}( this ));'
			},
			build: {
				dest: 'build/Divvy.js',
				src: [ 'src/Divvy.js' ]
			}
		},

		uglify: {
			build: {
				src: '<%= concat.build.dest %>',
				dest: 'build/Divvy.min.js'
			}
		},

		copy: {
			css: {
				files: {
					'build/Divvy.css': 'src/Divvy.css'
				}
			},
			release: {
				files: {
					'release/<%= pkg.version %>/Divvy.js': '<%= concat.build.dest %>',
					'release/<%= pkg.version %>/Divvy.min.js': '<%= uglify.build.dest %>',
					'release/<%= pkg.version %>/Divvy.css': 'src/Divvy.css'
				}
			},
			shortcut: {
				files: {
					'Divvy.js': '<%= concat.build.dest %>',
					'Divvy.min.js': '<%= uglify.build.dest %>',
					'Divvy.css': 'src/Divvy.css'
				}
			}
		}

	});

	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.registerTask( 'default', [ 'jshint', 'concat', 'uglify', 'copy:css' ] );
	grunt.registerTask( 'build', [ 'default', 'copy:release', 'copy:shortcut' ] );
};