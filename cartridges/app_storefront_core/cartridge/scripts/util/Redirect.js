'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * @input CurrentHttpParamMap : dw.web.HttpParameterMap
 * @input CurrentRequest : dw.system.Request
 * @output Location : String
 */
function execute(args) {
	args.Location = validateURL(args.CurrentHttpParameterMap.Location.stringValue);
	return PIPELET_NEXT;
}

/**
 * @description validate whether the url is valid for redirect (not allow redirect to a third-party site
 * @param {String} url
 * @returns {String} the validated url (default to Home-Show if url is invalid)
 */
function validateURL(url) {
	// match hostname, only if followed by / or ends
	var hostRegExp = new RegExp('^https?://' + request.getHttpHost() + '(?=/|$)');
	var location;
	if (!url || !hostRegExp.test(url)) {
		location = URLUtils.httpHome().toString();
	} else {
		location = url;
	}
	return location;
}

module.exports = {
	validateURL: validateURL
};
