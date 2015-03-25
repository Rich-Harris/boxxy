(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.Boxxy = factory()
}(this, function () { 'use strict';

	var COLUMN = "column";
	var ROW = "row";
	var LEFT = "left";
	var TOP = "top";
	var WIDTH = "width";
	var HEIGHT = "height";
	var VERTICAL = "vertical";
	var HORIZONTAL = "horizontal";
	var CLIENTX = "clientX";
	var CLIENTY = "clientY";
	var CONTROL = "__control";

	var supportsClassList = document.body.classList && typeof document.body.classList.add === "function";

	var addClass = undefined,
	    removeClass = undefined;

	if (supportsClassList) {
		addClass = function (node, className) {
			return node.classList.add(className);
		};
		removeClass = function (node, className) {
			return node.classList.remove(className);
		};
	} else {
		(function () {
			var trim = function (str) {
				return str.trim && str.trim() || str.replace(/^\s*/, "").replace(/\s*$/, "");
			};

			addClass = function (node, className) {
				var classNames = node.getAttribute("class").split(" ").map(trim).filter(Boolean);

				if (! ~classNames.indexOf(className)) {
					node.setAttribute("class", classNames.concat(className).join(" "));
				}
			};

			removeClass = function (node, className) {
				var classNames = node.getAttribute("class").split(" ").map(trim).filter(Boolean);
				var index = classNames.indexOf(className);

				if (~index) {
					classNames.splice(index, 1);
					node.setAttribute("class", classNames.join(" "));
				}
			};
		})();
	}

	var hasTouch = "ontouchstart" in document;
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/hasTouch.js.01-babel.map

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/clamp.js.01-babel.map

	var vendors = ["webkit", "moz", "ms", "o"];
	var prefixCache = {};

	function prefix(node, prop) {
		if (!(prop in prefixCache)) {
			var Prop = prop[0].toUpperCase() + prop.slice(1);

			var i = vendors.length;
			while (i--) {
				var prefixed = "" + vendors[i] + "" + Prop;
				if (prefixed in node.style) {
					prefixCache[prop] = prefixed;
				}
			}
		}

		return prefixCache[prop];
	}
	function setStyle(node, prop, value) {
		if (!(prop in node.style)) {
			prop = prefix(node, prop);
		}

		node.style[prop] = value;
	}

	function setStyles(node, styles) {
		var prop = undefined;

		for (prop in styles) {
			if (styles.hasOwnProperty(prop)) {
				setStyle(node, prop, styles[prop]);
			}
		}
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/utils/style.js.01-babel.map

	function createControlNode(control) {
		var node = document.createElement("boxxy-control");

		addClass(node, "boxxy-" + control.type + "-control");

		setStyles(node, {
			position: "absolute",
			userSelect: "none",
			cursor: control.type === VERTICAL ? "ew-resize" : "ns-resize"
		});

		if (hasTouch) {
			addClass(node, "boxxy-touch-control");
		}

		if (control.type === VERTICAL) {
			setStyles(node, {
				width: "0",
				height: "100%"
			});
		} else {
			setStyles(node, {
				width: "100%",
				height: "0"
			});
		}

		node[CONTROL] = control;

		return node;
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/createControlNode.js.01-babel.map

	function which(event) {
		event = event || window.event;
		return event.which === null ? event.button : event.which;
	}
	function handleMousedown(event) {
		if (which(event) !== 1) {
			return; // not interested in right/middle clicks
		}

		var control = this[CONTROL];
		control.activate();

		if (event.preventDefault) {
			event.preventDefault();
		}

		function move(event) {
			control.setPixelPosition(event[control.type === VERTICAL ? CLIENTX : CLIENTY]);
		}

		function up() {
			control.deactivate();
			cancel();
		}

		function cancel() {
			document.removeEventListener("mousemove", move);
			document.removeEventListener("mouseup", up);
		}

		document.addEventListener("mousemove", move);
		document.addEventListener("mouseup", up);
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/handleMousedown.js.01-babel.map

	var handleTouchdown = function (event) {
		if (event.touches.length !== 1) {
			return;
		}

		event.preventDefault();

		var touch = event.touches[0];
		var finger = touch.identifier;

		var control = this[CONTROL];
		control.activate();

		function move(event) {
			if (event.touches.length !== 1 || event.touches[0].identifier !== finger) {
				cancel();
			}

			control.setPixelPosition(touch[control.type === VERTICAL ? CLIENTX : CLIENTY]);
		}

		function up() {
			control.deactivate();
			cancel();
		}

		function cancel() {
			window.removeEventListener("touchmove", move);
			window.removeEventListener("touchend", up);
			window.removeEventListener("touchcancel", up);
		}

		window.addEventListener("touchmove", move);
		window.addEventListener("touchend", up);
		window.addEventListener("touchcancel", up);
	};
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/handleTouchdown.js.01-babel.map

	function Control(_ref) {
		var boxxy = _ref.boxxy;
		var parent = _ref.parent;
		var before = _ref.before;
		var after = _ref.after;

		this.boxxy = boxxy;
		this.parent = parent;
		this.before = before;
		this.after = after;
		this.type = parent.type === ROW ? VERTICAL : HORIZONTAL;

		this.node = createControlNode(this);

		this.node.addEventListener("mousedown", handleMousedown);

		if (hasTouch) {
			this.node.addEventListener("touchstart", handleTouchdown);
		}

		parent.node.appendChild(this.node);
	}

	Control.prototype = {
		activate: function () {
			addClass(this.node, "boxxy-active");
			this.boxxy._setCursor(this.type === VERTICAL ? "ew" : "ns");
		},

		deactivate: function () {
			removeClass(this.node, "boxxy-active");
			this.boxxy._setCursor(false);
		},

		setPixelPosition: function (px) {
			var bcr = this.parent.bcr;
			var bcrStart = bcr[this.type === VERTICAL ? LEFT : TOP];
			var bcrSize = bcr[this.type === VERTICAL ? WIDTH : HEIGHT];

			var percentOffset = (px - bcrStart) / bcrSize;

			// constrain
			var min = Math.max(this.before.start + this.before.minPc(), this.after.end - this.after.maxPc());
			var max = Math.min(this.before.start + this.before.maxPc(), this.after.end - this.after.minPc());

			percentOffset = clamp(percentOffset, min, max);

			this.setPercentOffset(percentOffset);
		},

		setPercentOffset: function (percentOffset) {
			this.node.style[this.type === VERTICAL ? LEFT : TOP] = 100 * percentOffset + "%";
			this.pos = percentOffset;

			this.before.setEnd(percentOffset);
			this.after.setStart(percentOffset);

			this.boxxy._fire("resize", this.boxxy._changedSinceLastResize);
			this.boxxy._changedSinceLastResize = {};
		}
	};


	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Control/index.js.01-babel.map

	var EDGES = [{ l: "left", u: "Left" }, { l: "right", u: "Right" }, { l: "top", u: "Top" }, { l: "right", u: "Right" }];
	function createBlockNode(edges) {
		var node = document.createElement("boxxy-block");

		setStyles(node, {
			position: "absolute",
			display: "block",
			width: "100%",
			height: "100%",
			boxSizing: "border-box",
			overflow: "hidden"
		});

		EDGES.forEach(function (edge) {
			if (edges[edge.l]) {
				addClass(node, "boxxy-" + edge.l);
				setStyle(node, "padding" + edge.u, "0");
			}
		});

		return node;
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Block/createBlockNode.js.01-babel.map

	function Block(_ref) {
		var boxxy = _ref.boxxy;
		var parent = _ref.parent;
		var data = _ref.data;
		var edges = _ref.edges;

		this.start = this.size = this.end = null;

		this.type = parent.type === ROW ? COLUMN : ROW;
		this.boxxy = boxxy;
		this.parent = parent;

		this.id = data.id;
		this.min = data.min || boxxy.min;
		this.max = data.max;

		this.node = createBlockNode(edges);

		if (!data.children) {
			this.initLeaf(data);
		} else if (data.children) {
			this.initBranch(data, edges);
		}

		parent.node.appendChild(this.node);
	}

	Block.prototype = {
		initLeaf: function (data) {
			var node = undefined;

			// Leaf block
			this.isLeaf = true;

			addClass(this.node, "boxxy-leaf");

			// do we have an ID that references an existing node?
			if (!data.node && data.id && (node = document.getElementById(data.id))) {
				data.node = node;
			}

			// use existing node if it exists, otherwise create one
			this.inner = data.node || document.createElement("boxxy-inner");

			addClass(this.inner, "boxxy-inner");
			this.node.appendChild(this.inner);

			setStyles(this.inner, {
				position: "relative",
				display: "block",
				width: "100%",
				height: "100%",
				boxSizing: "border-box",
				overflow: "auto"
			});

			this.boxxy.blocks[this.id] = this.inner;
		},

		initBranch: function (data, edges) {
			var i = undefined;

			i = data.children.length;

			this.children = [];
			this.controls = [];

			for (i = 0; i < data.children.length; i += 1) {
				var childEdges = undefined;
				var isFirst = i === 0;
				var isLast = i === data.children.length - 1;

				if (this.type === COLUMN) {
					childEdges = {
						top: edges.top && isFirst,
						bottom: edges.bottom && isLast,
						left: edges.left,
						right: edges.right
					};
				} else {
					childEdges = {
						left: edges.left && isFirst,
						right: edges.right && isLast,
						top: edges.top,
						bottom: edges.bottom
					};
				}

				this.children[i] = new Block({
					boxxy: this.boxxy,
					parent: this,
					data: data.children[i],
					edges: childEdges
				});
			}

			for (i = 0; i < data.children.length - 1; i += 1) {
				this.controls[i] = new Control({
					boxxy: this.boxxy,
					parent: this,
					before: this.children[i],
					after: this.children[i + 1]
				});
			}
		},

		getState: function (state) {
			var i;

			state[this.id] = { start: this.start, size: this.size };

			if (!this.children) {
				return;
			}

			i = this.children.length;
			while (i--) {
				this.children[i].getState(state);
			}
		},

		setState: function (state, changed) {
			var i, len, child, totalSize, blockState;

			blockState = state[this.id];

			if (!blockState) {
				// this should never happen...
				throw new Error("Could not set state");
			}

			if ((this.start !== blockState.start || this.size !== blockState.size) && this.isLeaf) {
				this.boxxy._changed[this.id] = changed[this.id] = true;
			}

			this.update(blockState.start, blockState.size, blockState.start + blockState.size);

			if (this.children) {
				totalSize = 0;
				len = this.children.length;

				for (i = 0; i < len; i += 1) {
					child = this.children[i];

					child.setState(state, changed);
					totalSize += child.size;

					if (this.controls[i]) {
						this.controls[i].setPercentOffset(totalSize);
					}
				}
			}
		},

		setStart: function (start) {
			var previousStart, previousSize, change, size;

			previousStart = this.start;
			previousSize = this.size;

			change = start - previousStart;
			size = previousSize - change;

			this.update(start, size, this.end);
		},

		setEnd: function (end) {
			var previousEnd, previousSize, change, size;

			previousEnd = this.end;
			previousSize = this.size;

			change = end - previousEnd;
			size = previousSize + change;

			this.update(this.start, size, end);
		},

		update: function (start, size, end) {
			this.node.style[this.type === COLUMN ? LEFT : TOP] = 100 * start + "%";
			this.node.style[this.type === COLUMN ? WIDTH : HEIGHT] = 100 * size + "%";

			this.start = start;
			this.size = size;
			this.end = end;

			this.shake();
		},

		shake: function () {
			var i, len, a, b, control, size, bcr;

			bcr = this.node.getBoundingClientRect();

			this.bcr = {
				left: bcr.left,
				right: bcr.right,
				top: bcr.top,
				bottom: bcr.bottom,
				width: bcr.right - bcr.left,
				height: bcr.bottom - bcr.top
			};

			if (this.bcr.width === this.width && this.bcr.height === this.height) {
				return; // nothing to do, no need to shake children
			}

			this.width = this.bcr.width;
			this.height = this.bcr.height;

			if (this.isLeaf) {
				this.boxxy._changed[this.id] = this.boxxy._changedSinceLastResize[this.id] = true;
			}

			// if we don't have any children, we don't need to go any further
			if (!this.children) {
				return;
			}

			this.pixelSize = this.bcr[this.type === COLUMN ? HEIGHT : WIDTH];

			// enforce minima and maxima - first go forwards
			len = this.children.length;
			for (i = 0; i < len - 1; i += 1) {
				a = this.children[i];
				b = this.children[i + 1];
				control = this.controls[i];

				size = a.minPc();
				if (a.size < size) {
					control.setPercentOffset(a.start + size);
				}

				size = a.maxPc();
				if (a.size > size) {
					control.setPercentOffset(a.start + size);
				}
			}

			// then backwards
			for (i = len - 1; i > 0; i -= 1) {
				a = this.children[i - 1];
				b = this.children[i];
				control = this.controls[i - 1];

				size = b.minPc();
				if (b.size < size) {
					control.setPercentOffset(b.end - size);
				}

				size = b.maxPc();
				if (b.size > size) {
					control.setPercentOffset(b.end - size);
				}
			}

			i = this.children.length;
			while (i--) {
				this.children[i].shake();
			}
		},

		minPc: function () {
			var totalPixels;

			// calculate minimum % width from pixels
			totalPixels = this.parent.pixelSize;
			return this.min / totalPixels;
		},

		maxPc: function () {
			var totalPixels;

			if (!this.max) {
				return 1;
			}

			// calculate minimum % width from pixels
			totalPixels = this.parent.pixelSize;
			return this.max / totalPixels;
		}
	};


	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Block/index.js.01-babel.map

	function getNode(node) {
		if (!node) return null;

		if (node.nodeType === 1) {
			return node;
		}

		if (typeof node === "string") {
			node = document.getElementById(node) || document.querySelector(node);

			if (node) {
				return node;
			}
		}

		return null;
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/utils/getNode.js.01-babel.map

	function extend(target) {
		for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			sources[_key - 1] = arguments[_key];
		}

		sources.forEach(function (source) {
			Object.keys(source).forEach(function (prop) {
				target[prop] = source[prop];
			});
		});

		return target;
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/utils/extend.js.01-babel.map

	var styles = {
		controlSize: 2,
		controlZIndex: 2,
		controlColor: "white",
		touchSize: 20
	};

	var inited = undefined,
	    styleElement = undefined,
	    styleSheet = undefined;
	function initCss(options) {
		if (options) {
			styles = extend(styles, options);
		} else if (inited) {
			return;
		}

		var controlSize = styles.controlSize;
		var controlZIndex = styles.controlZIndex;
		var controlColor = styles.controlColor;
		var touchSize = styles.touchSize;

		var css = "\n\t\t/* blocks */\n\t\t.boxxy-leaf {\n\t\t\tpadding: " + controlSize + "px;\n\t\t}\n\n\n\t\t/* control */\n\t\t.boxxy-vertical-control, .boxxy-horizontal-control {\n\t\t\tz-index: " + controlZIndex + ";\n\t\t}\n\n\t\t.boxxy-vertical-control:after {\n\t\t\tborder-left: " + controlSize + "px solid " + controlColor + ";\n\t\t\tborder-right: " + controlSize + "px solid " + controlColor + ";\n\t\t\tleft: -" + controlSize + "px;\n\t\t\ttop: 0;\n\t\t}\n\n\t\t.boxxy-horizontal-control:after {\n\t\t\tborder-top: " + controlSize + "px solid " + controlColor + ";\n\t\t\tborder-bottom: " + controlSize + "px solid " + controlColor + ";\n\t\t\ttop: -" + controlSize + "px;\n\t\t\tleft: 0;\n\t\t}\n\n\t\t.boxxy-vertical-control.boxxy-touch-control:before {\n\t\t\tborder-left-width: " + touchSize + "px;\n\t\t\tborder-right-width: " + touchSize + "px;\n\t\t\tleft: -" + touchSize + "px;\n\t\t\ttop: 0;\n\t\t}\n\n\t\t.boxxy-horizontal-control.boxxy-touch-control:before {\n\t\t\tborder-top-width: " + touchSize + "px;\n\t\t\tborder-bottom-width: " + touchSize + "px;\n\t\t\ttop: -" + touchSize + "px;\n\t\t\tleft: 0;\n\t\t}\n\n\t\t.boxxy-touch-control:before {\n\t\t\tposition: absolute;\n\t\t\tcontent: ' ';\n\t\t\tdisplay: block;\n\t\t\twidth: 100%;\n\t\t\theight: 100%;\n\t\t}\n\n\t\t.boxxy-vertical-control:after, .boxxy-horizontal-control:after {\n\t\t\tposition: absolute;\n\t\t\tcontent: ' ';\n\t\t\tdisplay: block;\n\t\t\twidth: 100%;\n\t\t\theight: 100%;\n\t\t}\n\n\t\t.boxxy-touch-control:before {\n\t\t\tborder-color: rgba(255,255,255,0.0001);\n\t\t\tborder-style: solid;\n\t\t}\n\t";

		if (!inited) {
			styleElement = document.createElement("style");
			styleElement.type = "text/css";

			// Internet Exploder won't let you use styleSheet.innerHTML - we have to
			// use styleSheet.cssText instead
			styleSheet = styleElement.styleSheet;

			var head = document.querySelector("head");
			head.insertBefore(styleElement, head.firstChild);

			inited = true;
		}

		if (styleSheet) {
			styleSheet.cssText = css;
		} else {
			styleElement.innerHTML = css;
		}
	}
	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/utils/initCss.js.01-babel.map

	function normalise(block, options) {
		var id = undefined,
		    node = undefined;

		// expand short-form blocks
		if (Object.prototype.toString.call(block) === "[object Array]") {
			block = { children: block };
		}

		// TODO deprecate this behaviour?
		if (typeof block === "string") {
			block = {
				node: getNode(block) || document.createElement("boxxy-block"),
				id: block
			};
			block.node.id = block.id;
		}

		var children = undefined;

		if (block.children) {
			(function () {
				var totalSize = 0;
				block.children.forEach(function (child) {
					totalSize += child.size || 1;
				});

				children = block.children.map(function (child, i) {
					return normalise(child, {
						type: options.type === COLUMN ? ROW : COLUMN,
						totalSize: totalSize,
						lineage: options.lineage.concat(i)
					});
				});
			})();
		}

		node = block.node ? getNode(block.node) : getNode(block.id) || document.createElement("boxxy-block");
		id = block.id || options.lineage.join("-");

		setStyles(node, {
			position: "absolute",
			width: "100%",
			height: "100%"
		});

		return {
			id: id, node: node, children: children,
			type: options.type,
			size: ("size" in block ? block.size : 1) / options.totalSize,
			min: block.min || 0,
			max: block.max
		};
	}

	function getInitialState(blocks, state) {
		var acc = 0;

		blocks.forEach(function (block) {
			if (block.children) {
				getInitialState(block.children, state);
			}

			state[block.id] = { start: acc, size: block.size };
			acc += block.size;
		});
	}

	function Boxxy(node, options) {
		var _this = this;

		var blocks, resizeHandler;

		this.container = getNode(node);
		if (!this.container) {
			throw new Error("`node` must be a DOM node, an ID, or a CSS selector");
		}

		this.node = document.createElement("boxxy");

		this._defaultCursor = this.node.style.cursor;

		if (options.columns && options.rows) {
			throw new Error("You can't have top level rows and top level columns - one or the other");
		}

		if (options.columns) {
			this.type = COLUMN;
			blocks = options.columns;
		} else if (options.rows) {
			this.type = ROW;
			blocks = options.rows;
		}

		var normalised = normalise({
			node: this.node,
			children: blocks
		}, {
			type: this.type,
			totalSize: 1,
			lineage: [0]
		});

		this.blocks = {};
		this._callbacks = {}; // events

		this.min = options.min || 10;

		this.root = new Block({
			boxxy: this,
			parent: this,
			data: normalised,
			edges: { top: true, right: true, bottom: true, left: true }
		});

		addClass(this.root.node, "boxxy-root");

		resizeHandler = function () {
			_this._changedSinceLastResize = {};
			_this.shake();
			_this._fire("resize", _this._changedSinceLastResize);
		};

		window.addEventListener("resize", resizeHandler);

		initCss();
		this.container.appendChild(this.node);

		this._changed = {};
		this._changedSinceLastResize = {};

		var initialState = {};
		initialState[this.root.id] = { start: 0, size: 1 };
		getInitialState(normalised.children, initialState);

		this.setState(initialState);
		this.shake();
	}

	Boxxy.prototype = {
		_fire: function (eventName, data) {
			var callbacks = this._callbacks[eventName];

			if (!callbacks) return;

			for (var i = 0, len = callbacks.length; i < len; i += 1) {
				callbacks[i].call(this, data);
			}
		},

		_setCursor: function (direction) {
			if (!direction) {
				this.node.style.cursor = this._defaultCursor;
				return;
			}

			this.node.style.cursor = "" + direction + "-resize";
		},

		shake: function () {
			var _node$getBoundingClientRect = this.node.getBoundingClientRect();

			var left = _node$getBoundingClientRect.left;
			var right = _node$getBoundingClientRect.right;
			var top = _node$getBoundingClientRect.top;
			var bottom = _node$getBoundingClientRect.bottom;

			this.bcr = {
				left: left, right: right, top: top, bottom: bottom,
				width: right - left,
				height: bottom - top
			};

			if (this.bcr.width === this.width && this.bcr.height === this.height) {
				return; // nothing to do
			}

			this.width = this.bcr.width;
			this.height = this.bcr.height;

			this.pixelSize = this[this.type === COLUMN ? HEIGHT : WIDTH];

			this.root.shake();

			return this;
		},

		changed: function () {
			var changed = this._changed;
			this._changed = {};

			return changed;
		},

		getState: function () {
			var state = {};

			this.root.getState(state);
			return state;
		},

		setState: function (state) {
			var changed = {},
			    key;

			this.root.setState(state, changed);

			// if any of the sizes have changed, fire a resize event...
			for (key in changed) {
				if (changed.hasOwnProperty(key)) {
					this._fire("resize", changed);

					// ...but only the one
					break;
				}
			}
			return this;
		},

		save: function (id) {
			var key, value;

			if (!localStorage) {
				return;
			}

			key = id ? "boxxy_" + id : "boxxy";
			value = JSON.stringify(this.getState());

			localStorage.setItem(key, value);

			return this;
		},

		restore: function (id) {
			var key, value;

			if (!localStorage) {
				return;
			}

			key = id ? "boxxy_" + id : "boxxy";
			value = JSON.parse(localStorage.getItem(key));

			if (value) {
				this.setState(value);
			}

			return this;
		},

		on: function (eventName, callback) {
			var _this = this;

			if (!this._callbacks.hasOwnProperty(eventName)) {
				this._callbacks[eventName] = [];
			}

			this._callbacks[eventName].push(callback);

			return {
				cancel: function () {
					return _this.off(eventName, callback);
				}
			};
		},

		off: function (eventName, callback) {
			var index, callbacks;

			if (!eventName) {
				// remove all listeners
				this._callbacks = {};
				return this;
			}

			if (!callback) {
				// remove all listeners of eventName
				delete this._callbacks[eventName];
				return this;
			}

			if (!(callbacks = this._callbacks[eventName])) {
				return this;
			}

			index = callbacks.indexOf(callback);

			if (index !== -1) {
				callbacks.splice(index, 1);
				if (!callbacks.length) {
					delete this._callbacks[eventName];
				}
			}

			return this;
		}
	};

	Boxxy.initCss = initCss;


	//# sourceMappingURL=/www/boxxy/.gobble-build/01-babel/1/Boxxy.js.01-babel.map

	return Boxxy;

}));
//# sourceMappingURL=boxxy.js.map