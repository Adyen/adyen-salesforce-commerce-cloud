'use strict';

/**
 * Controller that renders the home page.
 *
 * @module controllers/Home
 */

var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Renders the home page.
 */
function show() {
    var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
    require('~/cartridge/scripts/meta').update(rootFolder);

    app.getView().render('content/home/homepage');
}

/**
 * Remote include for the header.
 * This is designed as a remote include to achieve optimal caching results for the header.
 */
function includeHeader() {
    app.getView().render('components/header/header');
}

/**
 * Renders the category navigation and the menu to use as a remote include.
 * It is cached.
 *
 * @deprecated Converted into a template include.
 */
function includeHeaderMenu() {
    app.getView().render('components/header/headermenu');
}

/**
 * Renders customer information.
 *
 * This is designed as a remote include as it represents dynamic session information and must not be
 * cached.
 */
function includeHeaderCustomerInfo() {
    app.getView().render('components/header/headercustomerinfo');
}

/**
 * Sets a 410 HTTP response code for the response and renders an error page (error/notfound template).
 */
function errorNotFound() {
    // @FIXME Correct would be to set a 404 status code but that breaks the page as it utilizes
    // remote includes which the WA won't resolve
    response.setStatus(410);
    app.getView().render('error/notfound');
}

/**
 * Used in the setlayout.isml and htmlhead.isml templates to control device-aware display.
 * Sets the session custom property 'device' to mobile. Renders the changelayout.isml template.
 * TODO As we want to have a responsive layout, do we really need the below?
 */
function mobileSite() {
    session.custom.device = 'mobile';
    app.getView().render('components/changelayout');
}

/**
 * Sets the session custom property 'device' to mobile.  Renders the setlayout.isml template.
 * @FIXME remove - not responsive - maybe replace with a CSS class forcing the layout.
 */
function fullSite() {
    session.custom.device = 'fullsite';
    app.getView().render('components/changelayout');
}

/**
 * Renders the setlayout.isml template.
 * @FIXME remove - not responsive
 */
function setLayout() {
    app.getView().render('components/setlayout');
}

/**
 * Renders the devicelayouts.isml template.
 * @FIXME remove - not responsive
 */
function deviceLayouts() {
    app.getView().render('util/devicelayouts');
}

/*
 * Export the publicly available controller methods
 */
/** Renders the home page.
 * @see module:controllers/Home~show */
exports.Show = guard.ensure(['get'], show);
/** Remote include for the header.
 * @see module:controllers/Home~includeHeader */
exports.IncludeHeader = guard.ensure(['include'], includeHeader);
/** Renders the category navigation and the menu to use as a remote include.
 * @see module:controllers/Home~includeHeaderMenu */
exports.IncludeHeaderMenu = guard.ensure(['include'],includeHeaderMenu);
/** This is designed as a remote include as it represents dynamic session information and must not be cached.
 * @see module:controllers/Home~includeHeaderCustomerInfo */
exports.IncludeHeaderCustomerInfo = guard.ensure(['include'], includeHeaderCustomerInfo);
/** Sets a 410 HTTP response code for the response and renders an error page
 * @see module:controllers/Home~errorNotFound */
exports.ErrorNotFound = guard.ensure(['get'], errorNotFound);
/** Used to control device-aware display.
 * @see module:controllers/Home~mobileSite */
exports.MobileSite = guard.ensure(['get'], mobileSite);
/** Sets the session custom property 'device' to mobile. Renders the setlayout.isml template.
 * @see module:controllers/Home~fullSite */
exports.FullSite = guard.ensure(['get'], fullSite);
/** Renders the setlayout.isml template.
 * @see module:controllers/Home~setLayout */
exports.SetLayout = guard.ensure(['get'], setLayout);
/** Renders the devicelayouts.isml template.
 * @see module:controllers/Home~deviceLayouts */
exports.DeviceLayouts = guard.ensure(['get'], deviceLayouts);
