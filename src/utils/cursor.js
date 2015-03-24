export default function cursor ( boxxy, direction ) {
	if ( !direction ) {
		boxxy.el.style.cursor = boxxy._cursor;
		return;
	}

	boxxy._cursor = boxxy.el.style.cursor;
	boxxy.el.style.cursor = direction + '-resize';
}
