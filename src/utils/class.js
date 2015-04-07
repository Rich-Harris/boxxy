let supportsClassList = document.body.classList && typeof document.body.classList.add === 'function';

let addClass, removeClass;

if ( supportsClassList ) {
	addClass = ( node, className ) => node.classList.add( className );
	removeClass = ( node, className ) => node.classList.remove( className );
}

else {
	let trim = str => {
		return ( str.trim && str.trim() ) || str.replace( /^\s*/, '' ).replace( /\s*$/, '' );
	};

	addClass = ( node, className ) => {
		let classNames = ( node.getAttribute( 'class' ) || '' ).split( ' ' ).map( trim ).filter( Boolean );

		if ( !~classNames.indexOf( className ) ) {
			node.setAttribute( 'class', classNames.concat( className ).join( ' ' ) );
		}
	};

	removeClass = ( node, className ) => {
		let classNames = ( node.getAttribute( 'class' ) || '' ).split( ' ' ).map( trim ).filter( Boolean );
		let index = classNames.indexOf( className );

		if ( ~index ) {
			classNames.splice( index, 1 );
			node.setAttribute( 'class', classNames.join( ' ' ) );
		}
	};
}

export { addClass, removeClass };
