'use strict';
/**
 * @module object
 */

/**
 * Deep copies all all object properties from source to target
 *
 * @param {Object} target The target object which should be extended
 * @param {Object} source The object for extension
 * @return {Object}
 */
exports.extend = function (target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
            // recurse for non-API objects
            if (_source[prop] && 'object' === typeof _source[prop] && !_source[prop].class) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
};

/**
 * Access given properties of an object recursively
 *
 * @param {Object} object The object
 * @param {String} propertyString The property string, i.e. 'data.myValue.prop1'
 * @return {Object} The value of the given property or undefined
 * @example
 * var prop1 = require('~/object').resolve(obj, 'data.myValue.prop1')
 */
exports.resolve = function (object, propertyString) {
    var result = object;
    var propPath = propertyString.split('.');

    propPath.forEach(function (prop) {
        if (result && prop in result) {
            result = result[prop];
        } else {
            result = undefined;
        }
    });
    return result;
};

/**
 * Returns an array containing all object values
 *
 * @param {Object} object
 * @return {Array}
 */
exports.values = function (object) {
    return !object ? [] : Object.keys(object).map(function (key) {
        return object[key];
    });
};

/**
 * A shortcut for native static method "keys" of "Object" class
 *
 * @param {Object} object
 * @return {Array}
 */
exports.keys = function (object) {
    return object ? Object.keys(object) : [];
};

/**
 * Convert the given object to a HashMap object
 *
 * @param object {Object}
 * @return {dw.util.HashMap} all the data which will be used in mail template.
 */
exports.toHashMap = function (object) {
    var HashMap = require('dw/util/HashMap');
    var hashmap = new HashMap();

    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            hashmap.put(key, object[key]);
        }
    }

    return hashmap;
};

/**
 * Convert the given Map to a plain object
 *
 * @param object {dw.util.Map}
 * @return {Object} all the data which will be used in mail template.
 */
exports.fromHashMap = function (map) {
    var object = {};

    for (var entry in map.entrySet()) {
        object[entry.key] = entry.value;
    }

    return object;
};
