	// export as AMD
	if ( typeof define === 'function' && define.amd ) {
		define( function () { return Divvy; });
	}

	// export as CJS
	else if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = Divvy;
	}

	// export as browser global
	else {
		global.Divvy = Divvy;
	}

}( this ));
