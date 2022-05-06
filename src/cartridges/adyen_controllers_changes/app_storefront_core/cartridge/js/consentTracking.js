'use strict';

var dialog = require('./dialog');
var util = require('./util');
/**
 * @function getConsent Used to display/control of the modal containing the consent management message
 **/

function getConsent() {
    dialog.open({
        url: Urls.consentTracking,
        options: {
            closeOnEscape: false,
            dialogClass: 'no-close',
            buttons: [{
                text: Resources.TRACKING_CONSENT,
                click: function () {
                    $(this).dialog('close');
                    $.ajax({
                        type: 'GET',
                        url: util.appendParamToURL(Urls.consentTrackingSetSession, 'consentTracking', true),
                        success: function () {
                            showPrivacyDialog();
                        },
                        error: function () {
                            showPrivacyDialog();
                        }
                    })
                }
            }, {
                text: Resources.TRACKING_NO_CONSENT,
                click: function () {
                    $(this).dialog('close');
                    $.ajax({
                        type: 'GET',
                        url: util.appendParamToURL(Urls.consentTrackingSetSession, 'consentTracking', false),
                        success: function () {
                            showPrivacyDialog();
                        },
                        error: function () {
                            showPrivacyDialog();
                        }
                    })
                }
            }]
        }
    });
}

function enablePrivacyCookies() {
    if (document.cookie.indexOf('dw=1') < 0) {
        document.cookie = 'dw=1; path=/';
    }
    if (document.cookie.indexOf('dw_cookies_accepted') < 0) {
        document.cookie = 'dw_cookies_accepted=1; path=/';
    }
}
function showPrivacyDialog(){

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
                            enablePrivacyCookies();
                        }
                    }]
                }
            });
        }
    } else {
        // Otherwise, we don't need to show the asset, just enable the cookies
        enablePrivacyCookies();
    }
}
var consentTracking = {
    init: function () {
        if (consent == null && SitePreferences.CONSENT_TRACKING_HINT) { // eslint-disable-line no-undef
            getConsent();
        }
        
        if (consent != null && SitePreferences.CONSENT_TRACKING_HINT){ // eslint-disable-line no-undef
            showPrivacyDialog();
        }
        
    },
    show: function () {
        getConsent();
    }
};
module.exports = consentTracking;
