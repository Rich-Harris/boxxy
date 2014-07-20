module.exports = {
	options: {
		banner: '<%= intro %>',
		footer: '<%= outro %>'
	},
	build: {
		dest: 'build/divvy.js',
		src: [ 'src/divvy.js' ]
	}
};
