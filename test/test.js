/*global require, describe, before, beforeEach, afterEach, it, __dirname, console */
var path = require( 'path' );
var fs = require( 'fs' );
var jsdom = require( 'jsdom' );
var assert = require( 'assert' );

describe( 'boxxy', function () {
	var boxxySrc, global, document, Boxxy, main;

	before( function () {
		return require( '../gobblefile' ).build({
			dest: path.resolve( __dirname, '../.tmp' ),
			env: 'production',
			force: true
		}).then( function () {
			boxxySrc = fs.readFileSync( path.resolve( __dirname, '../dist/boxxy.js' ), 'utf-8' );
		});
	});

	beforeEach( function () {
		return new Promise( function ( fulfil, reject ) {
			jsdom.env({
				html: '<!DOCTYPE html><html><head></head><body><main></main></body></html>',
				src: [ boxxySrc ],
				done: function ( err, w ) {
					if ( err ) {
						reject( err );
					} else {
						global = w;
						document = global.document;
						Boxxy = global.Boxxy;

						global.main = main = document.querySelector( 'main' );

						global.console = console;
						fulfil( global );
					}
				}
			});
		});
	});

	afterEach( function () {
		global.close();
	});

	it( 'exists', function () {
		assert.equal( typeof Boxxy, 'function' );
	});

	it( 'creates a <boxxy> element which is a child of the container', function () {
		var boxxy = new Boxxy( main, {
			columns: []
		});

		assert.ok( boxxy.node.localName === 'boxxy' );
		assert.ok( boxxy.node.parentNode === main );

		console.log( 'document.body.innerHTML', document.body.innerHTML );
	});
});