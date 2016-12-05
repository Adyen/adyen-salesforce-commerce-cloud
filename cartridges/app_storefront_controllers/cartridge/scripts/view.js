'use strict';
/**
 * @module view
 */

/**
 * Get the decorator templates which is typically the passed template but in case of an AJAX request it is
 * an empty decorator
 *
 * @param decoratorName {String} the name of the decorator template to use
 * @param  customValues {Array} Array of parameter values for 'format' which indicate an AJAX response
 * @return {String} The name of the decorator template to be used
 *
 * @example
 * <isdecorate template="${require('~/view').decorate('path/to/decorator')}">
 */
exports.decorate = function (decoratorName, customValues) {
    // get the value of the 'format' HTTP parameter
    var pageFormat = request.httpParameters.format && request.httpParameters.format.length && request.httpParameters.format[0];

    // standard set of values that indicate an AJAX response.
    var noDecoration = ['ajax'];

    // if pageFormat is within the standard OR the custom set of values, use the blank decorator
    if (noDecoration.indexOf(pageFormat) > -1 || (customValues && customValues.indexOf(pageFormat) > -1)) {
        decoratorName = 'util/pt_empty';
    }
    return decoratorName;
};
