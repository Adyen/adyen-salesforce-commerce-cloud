'use strict';

/**
 * This is a collection of decorators for functions which performs several security checks.
 * They can be combined with each other to configure the necessary constraints for a function that is exposed to the Internet.
 *
 * @module guard
 *
 * @example
 * <caption>Example of an Account controller</caption>
 * function show() {
 *     // shows account landing page
 * }
 *
 * // allow only GET requests via HTTPS for logged in users
 * exports.Show = require('~/guard').ensure(['get','https','loggedIn'],show);
 */
var CSRFProtection = require('dw/web/CSRFProtection');

var app = require('~/cartridge/scripts/app');
var browsing = require('~/cartridge/scripts/util/Browsing');
var LOGGER   = dw.system.Logger.getLogger('guard');

/**
 * This method contains the login to handle a not logged in customer
 *
 * @param {Object} params Parameters passed along by by ensure
 */
function requireLogin(params) {
    if (customer.authenticated) {
        return true;
    }
    var redirectUrl = dw.web.URLUtils.https('Login-Show','original', browsing.lastUrl());

    if (params && params.scope) {
        redirectUrl.append('scope', params.scope);
    }

    response.redirect(redirectUrl);
    return false;
}

/**
 * Performs a protocol switch for the URL of the current request to HTTPS. Responds with a redirect to the client.
 *
 * @return false, if switching is not possible (for example, because its a POST request)
 */
function switchToHttps() {
    if (request.httpMethod !== 'GET') {
        // switching is not possible, send error 403 (forbidden)
        response.sendError(403);
        return false;
    }

    var url = 'https://' + request.httpHost + request.httpPath;

    if (!empty(request.httpQueryString)) {
        url += '?' + request.httpQueryString;
    }

    response.redirect(url);
    return true;
}

function csrfValidationFailed() {

    if (request.httpParameterMap.format.stringValue === 'ajax') {
        app.getModel('Customer').logout();
        let r = require('~/cartridge/scripts/util/Response');
        r.renderJSON({
            error: 'CSRF Token Mismatch'
        });
    } else {
        app.getModel('Customer').logout();
        app.getView().render('csrf/csrffailed');
    }


    return false;
}

/**
 * The available filters for endpoints, the names of the methods can be used in {@link module:guard~ensure}
 * @namespace
 */
var Filters = {
    /** Action must be accessed via HTTPS */
    https: function () {return request.isHttpSecure();},
    /** Action must be accessed via HTTP */
    http: function () {return !this.https();},
    /** Action must be accessed via a GET request */
    get: function () {return request.httpMethod === 'GET';},
    /** Action must be accessed via a POST request */
    post: function () {return request.httpMethod === 'POST';},
    /** Action must only be accessed authenticated csutomers */
    loggedIn: function () {return customer.authenticated;},
    /** Action must only be used as remote include */
    include: function () {
        // the main request will be something like kjhNd1UlX_80AgAK-0-00, all includes
        // have incremented trailing counters
        return request.httpHeaders['x-is-requestid'].indexOf('-0-00') === -1;
    },
    csrf: function (){
        return CSRFProtection.validateRequest();
    }
};

/**
 * This function should be used to secure public endpoints by applying a set of predefined filters.
 *
 * @param  {string[]} filters The filters which need to be passed to access the page
 * @param  {function} action  The action which represents the resource to show
 * @param  {Object}   params  Additional parameters which are passed to all filters and the action
 * @see module:guard~Filters
 * @see module:guard
 */
function ensure (filters, action, params) {
    return expose(function (args) {
        var error;
        var filtersPassed = true;
        var errors = [];
        params = require('~/cartridge/scripts/object').extend(params,args);

        for (var i = 0; i < filters.length; i++) {
            LOGGER.debug('Ensuring guard "{0}"...',filters[i]);

            filtersPassed = Filters[filters[i]].apply(Filters);
            if (!filtersPassed) {
                errors.push(filters[i]);
                if (filters[i] === 'https') {
                    error = switchToHttps;
                } else if (filters[i] === 'loggedIn') {
                    error = requireLogin;
                } else if (filters[i] === 'csrf') {
                    error = csrfValidationFailed;
                }
                break;
            }
        }

        if (!error) {
            error = function () {
                throw new Error('Guard(s) ' + errors.join('|') + ' did not match the incoming request.');
            };
        }

        if (filtersPassed) {
            LOGGER.debug('...passed.');
            return action(params);
        } else {
            LOGGER.debug('...failed. {0}',error.name);
            return error(params);
        }
    });
}

/**
 * Exposes the given action to be accessible from the web. The action gets a property which marks it as exposed. This
 * property is checked by the platform.
 */
function expose(action) {
    action.public = true;
    return action;
}

/*
 * Module exports
 */
/** @see module:guard~expose */
exports.all = expose;

// often needed combinations
/**
 * @see module:guard~https
 * @see module:guard~get
 * @deprecated Use ensure(['https','get'], action) instead
 */
exports.httpsGet = function (action) {
    return ensure(['https','get'], action);
};

/**
 * @see module:guard~https
 * @see module:guard~post
 * @deprecated Use ensure(['https','post'], action) instead
 */
exports.httpsPost = function (action) {
    return ensure(['https','post'], action);
};

/**
 * Use this method to combine different filters, typically this is used to secure methods when exporting
 * them as publicly avaiblable endpoints in controllers.
 *
 * @example
 * // allow only GET requests for the Show endpoint
 * exports.Show = require('~/guard').ensure(['get'],show);
 *
 * // allow only POST requests via HTTPS for the Find endpoint
 * exports.Find = require('~/guard').ensure(['post','https'],find);
 *
 * // allow only logged in customer via HTTPS for the Profile endpoint
 * exports.Profile = require('~/guard').ensure(['https','loggedIn'],profile);
 */
exports.ensure = ensure;
