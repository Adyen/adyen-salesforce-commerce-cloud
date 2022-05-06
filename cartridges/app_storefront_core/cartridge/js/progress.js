'use strict';

var $loader;

/**
 * @function
 * @description Shows an AJAX-loader on top of a given container
 * @param {Element} container The Element on top of which the AJAX-Loader will be shown
 */
var show = function (container) {
    var target = (!container || $(container).length === 0) ? $('body') : $(container);
    $loader = $loader || $('.loader');

    if ($loader.length === 0) {
        $loader = $('<div/>').addClass('loader')
            .append($('<div/>').addClass('loader-indicator'), $('<div/>').addClass('loader-bg'));
    }
    return $loader.appendTo(target).show();
};
/**
 * @function
 * @description Hides an AJAX-loader
 */
var hide = function () {
    if ($loader) {
        $loader.hide();
    }
};

exports.show = show;
exports.hide = hide;
