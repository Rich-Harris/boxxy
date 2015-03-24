export default function getNode ( node ) {
	if ( node.nodeType === 1 ) {
		return node;
	}

	if ( typeof node === 'string' ) {
		node = document.getElementById( node ) || document.querySelector( node );

		if ( node ) {
			return node;
		}
	}

	return null;
}
