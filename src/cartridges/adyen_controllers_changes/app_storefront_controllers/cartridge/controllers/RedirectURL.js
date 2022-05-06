'use strict';

/**
 * Controller that handles URL redirects.
 *
 * It is called by the system to handle URL mappings (static mappings and mapping rules).
 * The mappings are configured in Business Manager. This controller is highly performance critical,
 * because it is frequently called in case of exploit scans.
 *
 * Please follow these rules:
 * - no or only a few database calls
 * - simple (static) template response
 * - caching the result page is a must
 *
 * @module controllers/RedirectURL
 */

/* API Includes */
var URLRedirectMgr = require('dw/web/URLRedirectMgr');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Gets the redirect. Renders the template for a redirect (util/redirectpermanent template). If no redirect can be found,
 * renders an error page (util/redirecterrorutil/redirecterror template).
 */
function start() {
    var redirect = URLRedirectMgr.getRedirect(),
        location = redirect ? redirect.getLocation() : null;

    if (!location) {
        response.setStatus(410);
        app.getView().render('util/redirecterrorutil/redirecterror');
    } else {
        app.getView({
            Location: location
        }).render('util/redirectpermanent');
    }
}

/**
 * Hostname-only URLs (http://sitegenesis.com/) cannot be redirected using the URL mapping framework.
 * Instead, specify this controller in your site's hostname alias in Business Manager.
 *
 * However, a redirect to the homepage is performed by the
 * Default controller Start function.
 * The hostname in the URL is the site's HTTP Hostname, if one is configured in Business Manager.
 * Also, you can provide a URL to redirect to an optional parameter, Location.
 *
 * @example
 * Redirect http[s]://sitegenesis.com/ to http://www.sitegenesis.com/:
 * sitegenesis.com,,RedirectURL-Hostname,Location,http://www.sitegenesis.com/
 */
function hostName() {
    var Redirect = require('app_storefront_core/cartridge/scripts/util/Redirect');
    app.getView({
        Location: Redirect.validateURL(request.httpParameterMap.Location.stringValue)
    }).render('util/redirectpermanent');
}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** Gets a redirect and renders it.
 * @see module:controllers/RedirectURL~start */
exports.Start = guard.ensure([], start);
/** Used by the platform for URL redirects.
 * @see module:controllers/RedirectURL~hostName */
exports.Hostname = guard.ensure([], hostName);
