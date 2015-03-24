export default function extend ( target, ...sources ) {
	sources.forEach( source => {
		Object.keys( source ).forEach( prop => {
			target[ prop ] = source[ prop ];
		});
	});

	return target;
}
