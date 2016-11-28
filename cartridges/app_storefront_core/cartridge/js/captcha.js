'use strict';

var dialog = require('./dialog');
var util = require('./util');
var SessionAttributes = window.SessionAttributes;

/**
 * @function captcha    Used to display/control the scrim containing the simulated captcha code
 **/
module.exports = function () {
    /**
     * if the session.privacy.ratelimited element is present then show the notification
     * NOTE: You will probably want to replace this with a call to an actual CAPTCHA system to replace the simple one here
     */
    if (SessionAttributes.SHOW_CAPTCHA) {
        dialog.open({
            html: '<h1>' + Resources.ARE_YOU_HUMAN + '</h1>',
            options: {
                closeOnEscape: false,
                dialogClass: 'no-close',
                buttons: [{
                    text: Resources.OK,
                    click: function () {
                        var url = util.appendParamsToUrl(Urls.rateLimiterReset, {format: 'ajax'});
                        $.ajax({
                            url: url
                        });
                        $(this).dialog('close');
                    }
                }]
            }
        });
    }
};
