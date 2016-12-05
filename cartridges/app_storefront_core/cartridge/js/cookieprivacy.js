'use strict';

var dialog = require('./dialog');

/**
 * @function cookieprivacy    Used to display/control the scrim containing the cookie privacy code
 **/
module.exports = function () {
    /**
     * If we have not accepted cookies AND we're not on the Privacy Policy page, then show the notification
     * NOTE: You will probably want to adjust the Privacy Page test to match your site's specific privacy / cookie page
     */
    if (SitePreferences.COOKIE_HINT === true && document.cookie.indexOf('dw_cookies_accepted') < 0) {
        // check for privacy policy page
        if ($('.privacy-policy').length === 0) {
            dialog.open({
                url: Urls.cookieHint,
                options: {
                    closeOnEscape: false,
                    dialogClass: 'no-close',
                    buttons: [{
                        text: Resources.I_AGREE,
                        click: function () {
                            $(this).dialog('close');
                            enableCookies();
                        }
                    }]
                }
            });
        }
    } else {
        // Otherwise, we don't need to show the asset, just enable the cookies
        enableCookies();
    }

    function enableCookies() {
        if (document.cookie.indexOf('dw=1') < 0) {
            document.cookie = 'dw=1; path=/';
        }
        if (document.cookie.indexOf('dw_cookies_accepted') < 0) {
            document.cookie = 'dw_cookies_accepted=1; path=/';
        }
    }
};
