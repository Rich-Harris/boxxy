export default function throttle ( fn, wait ) {
	var throttled, lastCalled;

	wait = wait || 500;

	throttled = function () {
		var timeNow;

		timeNow = new Date();

		if ( !lastCalled || ( timeNow - lastCalled ) > wait ) {
			lastCalled = timeNow;
			return fn.apply( this, arguments );
		}
	};

	return throttled;
}
