'use strict';
/**
 * View to render product templates.
 * @module views/ProductView
 */
var View = require('./View');
/**
 * Helper function for rendering product functionality.
 * @class module:views/ProductView~ProductView
 * @extends module:views/View
 * @lends module:views/ProductView~ProductView.prototype
 */
var ProductView = View.extend(
    {
        /**
         * View for product functionality.
         * @constructs module:views/ProductView~ProductView
         * @param {Object} params The parameters to pass to the template.
         */
        init: function (params) {
            this._super(params);

            this.Product = params.product.object;

            return this;
        }

    });

module.exports = ProductView;
