'use strict';

/**
 * Controller that renders the store finder and store detail pages.
 *
 * @module controllers/Stores
 */

/* API Includes */
var StoreMgr = require('dw/catalog/StoreMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

var isSearched;
/**
 * Provides a form to locate stores by geographical information.
 *
 * Clears the storelocator form. Gets a ContentModel that wraps the store-locator content asset.
 * Updates the page metadata and renders the store locator page (storelocator/storelocator template).
 */
function find() {
    isSearched = false;
    var storeLocatorForm = app.getForm('storelocator');
    storeLocatorForm.clear();

    var Content = app.getModel('Content');
    var storeLocatorAsset = Content.get('store-locator');

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(storeLocatorAsset);

    app.getView('StoreLocator', {isSearched: isSearched}).render('storelocator/storelocator');
}

/**
 * The storelocator form handler. This form is submitted with GET.
 * Handles the following actions:
 * - findbycountry
 * - findbystate
 * - findbyzip
 * In all cases, gets the search criteria from the form (formgroup) passed in by
 * the handleAction method and queries the platform for stores matching that criteria. Returns null if no stores are found,
 * otherwise returns a JSON object store, search key, and search criteria information. If there are search results, renders
 * the store results page (storelocator/storelocatorresults template), otherwise renders the store locator page
 * (storelocator/storelocator template).
 */
function findStores() {
    isSearched = true;
    var Content = app.getModel('Content');
    var storeLocatorAsset = Content.get('store-locator');

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(storeLocatorAsset);

    var storeLocatorForm = app.getForm('storelocator');
    var searchResult = storeLocatorForm.handleAction({
        findbycountry: function (formgroup) {
            var searchKey = formgroup.country.htmlValue;
            var stores = SystemObjectMgr.querySystemObjects('Store', 'countryCode = {0}', 'countryCode desc', searchKey);
            if (empty(stores)) {
                return null;
            } else {
                return {'stores': stores, 'searchKey': searchKey, 'type': 'findbycountry'};
            }
        },
        findbystate: function (formgroup) {
            var searchKey = formgroup.state.htmlValue;
            var stores = null;

            if (!empty(searchKey)) {
                stores = SystemObjectMgr.querySystemObjects('Store', 'stateCode = {0}', 'stateCode desc', searchKey);
            }

            if (empty(stores)) {
                return null;
            } else {
                return {'stores': stores, 'searchKey': searchKey, 'type': 'findbystate'};
            }
        },
        findbyzip: function (formgroup) {
            var searchKey = formgroup.postalCode.value;
            var storesMgrResult = StoreMgr.searchStoresByPostalCode(formgroup.countryCode.value, searchKey, formgroup.distanceUnit.value, formgroup.maxdistance.value);
            var stores = storesMgrResult.keySet();
            if (empty(stores)) {
                return null;
            } else {
                return {'stores': stores, 'searchKey': searchKey, 'type': 'findbyzip'};
            }
        }
    });

    if (searchResult) {
        app.getView('StoreLocator', searchResult)
            .render('storelocator/storelocatorresults');
    } else {
        app.getView('StoreLocator', {isSearched: isSearched})
            .render('storelocator/storelocator');
    }

}

/**
 * Renders the details of a store.
 *
 * Gets the store ID from the httpParameterMap. Updates the page metadata.
 * Renders the store details page (storelocator/storedetails template).
 */
function details() {

    var storeID = request.httpParameterMap.StoreID.value;
    var store = dw.catalog.StoreMgr.getStore(storeID);

    var pageMeta = require('~/cartridge/scripts/meta');
    pageMeta.update(store);

    app.getView({Store: store})
        .render('storelocator/storedetails');

}

/*
 * Exposed web methods
 */
/** Renders form to locate stores by geographical information.
 * @see module:controllers/Stores~find */
exports.Find = guard.ensure(['get'], find);
/** The storelocator form handler.
 * @see module:controllers/Stores~findStores */
exports.FindStores = guard.ensure(['post'], findStores);
/** Renders the details of a store.
 * @see module:controllers/Stores~details */
exports.Details = guard.ensure(['get'], details);
