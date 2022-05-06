'use strict';

// inspired by https://github.com/Raynos/xtend/blob/master/mutable.js

function extend(target) {
	for (var i = 1; i < arguments.length; i++) {
		var source = arguments[i];
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		}
	}
	return target;
}

function immutableExtend() {
	var target = {};
	for (var i = 0; i < arguments.length; i++) {
		var source = arguments[i];
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				target[key] = source[key];
			}
		}
	}
	return target;
}

module.exports = extend;
module.exports.immutable = immutableExtend;
