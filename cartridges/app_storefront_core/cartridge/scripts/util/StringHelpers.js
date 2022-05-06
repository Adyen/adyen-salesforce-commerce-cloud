'use strict';

/**
 * Sanitize a string by removing the whitespaces
 *
 * @param inS String to sanitize
 *
 **/
function sanitize(inS) {
    return inS.replace(/\W/g, '');
}

/**
 * unsanitizeOR a string by replaced %7c with '|' pipes
 *
 * @param anURL URL String to sanitize
 *
 **/
function unsanitizeOR(anURL) {
    return anURL.toString().replace('%7c', '|', 'g');
}

/**
 * cleanupID cleans a product id
 *
 * @param a a String to cleanup
 *
 **/
function cleanupID(s) {
    return (s === null) ? s : s.replace(new RegExp('[^a-z0-9_\-]', 'gi'), '_').toLowerCase();
}

module.exports.sanitize = sanitize;
module.exports.unsanitizeOR = unsanitizeOR;
module.exports.cleanupID = cleanupID;
