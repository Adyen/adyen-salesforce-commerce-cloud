'use strict';

var ajax = require('../../ajax'),
    util = require('../../util');

/**
 * @description loads product's navigation
 **/
module.exports = function () {
    var $pidInput = $('.pdpForm input[name="pid"]').last(),
        $navContainer = $('#product-nav-container');
    // if no hash exists, or no pid exists, or nav container does not exist, return
    if (window.location.hash.length <= 1 || $pidInput.length === 0 || $navContainer.length === 0) {
        return;
    }

    var pid = $pidInput.val(),
        hash = window.location.hash.substr(1),
        url = util.appendParamToURL(Urls.productNav + '?' + hash, 'pid', pid);

    ajax.load({
        url: url,
        target: $navContainer
    });
};
