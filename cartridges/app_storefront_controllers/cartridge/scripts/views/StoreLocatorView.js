'use strict';
/**
 * View to render store location templates.
 * @module views/StoreLocatorView
 */
var Resource = require('dw/web/Resource');
var View = require('./View');
/**
 * Helper function for rendering store locator functionality.
 * @class module:views/StoreLocatorView~StoreLocatorView
 * @extends module:views/View
 * @lends module:views/StoreLocatorView~StoreLocatorView.prototype
*/
var StoreLocatorView = View.extend({
    /**
     * Generates the view consumed by template storelocator/storelocatorresults
     *
     * @param {object} params - The following properties are supported: stores (Search result for stores), type (Supported values are findbyzip, findbystate and findbycountry)
     * searchKey (The value used to find Stores).
     *
     * @constructs module:views/StoreLocatorView~StoreLocatorView
     * @extends module:views/View~View
     */
    init: function (params) {
        /** backward compatibility to URLUtils.continueURL() methods in old templates **/
        this.ContinueURL = dw.web.URLUtils.abs('Stores-FindStores');
        this.isSearched = params.isSearched;
        
        /** Search result for stores */
        this.Stores = params.stores || [];
        /**  Number of found Stores */
        this.StoresCount = 0;
        if (params && params.type) {
            /** variables consumed by template storelocator/storelocatorresults */

            // determine number of found stores
            if (!empty(params.stores)) {
                if ('length' in params.stores) {
                    this.StoresCount = params.stores.length;
                } else {
                    this.StoresCount = params.stores.getCount();
                }
            }

            /**  Initial search criteria. Supported values are findbyzip, findbystate and findbycountry */
            this.Type = params.type;
            var searchTerm = params.searchKey;

            // @TODO also have a mapping with state codes
            if (params.type === 'findbycountry') {
                searchTerm = Resource.msg('country.codes.' + params.searchKey,'forms',null);
            }

            /**  Print out on what has been searched for */
            this.SearchString = Resource.msgf('storelocator.storelocatorresults.' + params.type, 'storelocator', null, searchTerm);
        }

        return this;
    }
});

module.exports = StoreLocatorView;
