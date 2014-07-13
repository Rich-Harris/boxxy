module.exports = {
	css: {
		files: {
			'build/divvy.css': 'src/divvy.css'
		}
	},
	release: {
		files: {
			'release/<%= pkg.version %>/divvy.js': '<%= concat.build.dest %>',
			'release/<%= pkg.version %>/divvy.min.js': '<%= uglify.build.dest %>',
			'release/<%= pkg.version %>/divvy.css': 'src/divvy.css'
		}
	},
	shortcut: {
		files: {
			'divvy.js': '<%= concat.build.dest %>',
			'divvy.min.js': '<%= uglify.build.dest %>',
			'divvy.css': 'src/divvy.css'
		}
	}
};
