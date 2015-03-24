const vendors = [ 'webkit', 'moz', 'ms', 'o' ];
let prefixCache = {};

function prefix ( node, prop ) {
	if ( !( prop in prefixCache ) ) {
		let Prop = prop[0].toUpperCase() + prop.slice( 1 );

		let i = vendors.length;
		while ( i-- ) {
			let prefixed = `${vendors[i]}${Prop}`;
			if ( prefixed in node.style ) {
				prefixCache[ prop ] = prefixed;
			}
		}
	}

	return prefixCache[ prop ];
}

export function setStyle ( node, prop, value ) {
	if ( !( prop in node.style ) ) {
		prop = prefix( node, prop );
	}

	node.style[ prop ] = value;
}

export function setStyles ( node, styles ) {
	let prop;

	for ( prop in styles ) {
		if ( styles.hasOwnProperty( prop ) ) {
			setStyle( node, prop, styles[ prop ] );
		}
	}
}
