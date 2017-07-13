'use strict';

/**
 * Controller that handles site map requests.
 *
 * @module controllers/SiteMap
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Serves requests for search provider (Google, Yahoo) XML site maps. Reads a
 * given site map and copies it into the request output stream. If this is successful,
 * renders an http_200 template. If it fails, renders the http_404 template.
 * SiteMap Rule:
 * # process sitemaps
 * RewriteRule ^/(sitemap([^/]*))$ /on/demandware.store/%{HTTP_HOST}/-/SiteMap-Google?name=$1 [PT,L]
 */
function google() {

    var SendGoogleSiteMapResult = new dw.system.Pipelet('SendGoogleSiteMap').execute({
        FileName: request.httpParameterMap.name.stringValue
    });
    if (SendGoogleSiteMapResult.result === PIPELET_ERROR) {
        app.getView().render('sitemap/http_404');
    } else {
        app.getView().render('sitemap/http_200');
    }
}

/**
 * Renders the sitemap template (sitemap/sitemap template).
 */
function start() {

    app.getView().render('sitemap/sitemap');

}


/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/SiteMap~google */
exports.Google = guard.ensure(['get'], google);
/** Renders the sitemap template
 *  Serves requests for search provider (Google, Yahoo) XML site maps.
 *  @see module:controllers/SiteMap~start */
exports.Start = guard.ensure(['get'], start);
