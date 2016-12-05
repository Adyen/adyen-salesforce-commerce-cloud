'use strict';

/**
 * Model for manaaging information about last visited items based on the current session. Currently only products are
 * supported.
 * @module models/RecentlyViewedItemsModel */

/* API Includes */
var ArrayList = require('dw/util/ArrayList');
var ProductMgr = require('dw/catalog/ProductMgr');

/* Constants */
var PRODUCT_ID_PARAMETER_NAME = 'pid';
var PRODUCT_PIPELINE_NAMES = new ArrayList(
    'Product-Show',
    'Product-ShowInCategory',
    'Link-Product',
    'Link-CategoryProduct');

/**
 * Model holding information about last visited items based on the current session. Currently only products are
 * supported.
 *
 * @class module:models/RecentlyViewedItemsModel~RecentlyViewedItemsModel
 */
var RecentlyViewedItemsModel = ({

    /**
     * Returns an array of products visited in the current session. The array is retrieved from the live click
     * stream recorded in the session. All clicks on a page rendered from a "Product-Show", "Link-Product", or "Link-CategoryProduct" URL
     * are interpreted as a product visit. Clicks on different variations of the same master product are merged and
     * treated as one click.
     *
     * @param maxSize {Number} The maximum number of visited products to include in the returned list.
     * @returns {dw.util.ArrayList} The list of last visited products. If no products have been visited, the returned list is empty.
     */
    getRecentlyViewedProducts: function (maxLength) {

        var numberOfProducts = maxLength || 5;

        // Gets the click stream.
        var clicks = session.getClickStream().getClicks();

        // build the last visted
        var products = new ArrayList();

        for (var i = clicks.size() - 1; i >= 0; i--) {
            var click = clicks[i];

            // Checks whether it was a product click.
            if (PRODUCT_PIPELINE_NAMES.contains(click.getPipelineName())) {

                var sku = click.getParameter(PRODUCT_ID_PARAMETER_NAME);

                if (sku && sku.length > 0) {
                    // Gets the product.
                    var product = ProductMgr.getProduct(sku);
                    if (product) {
                        // Checks for the product or a shared master.
                        var duplicate = false;
                        for (var j = 0; j < products.size(); j++) {
                            // Calculates a potential master.
                            var p1 = (product.isVariant() ? product.getVariationModel().getMaster() : product);
                            var p2 = (products[j].isVariant() ? products[j].getVariationModel().getMaster() : products[j]);

                            // Checks if it is the same product.
                            if (p1 === p2) {
                                duplicate = true;
                                break;
                            }
                        }

                        // Adds the product if it is not a duplicate.
                        if (!duplicate) {
                            products.add(product);
                        }
                    }
                }
            }

            // Checks whether the maximum is reached.
            if (products.size() >= numberOfProducts) {
                break;
            }
        }

        return products;

    }
});

/** The RecentlyViewedItems class */
module.exports = RecentlyViewedItemsModel;
