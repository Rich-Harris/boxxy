export default function clamp ( value, min, max ) {
	return Math.max( min, Math.min( max, value ) );
}
