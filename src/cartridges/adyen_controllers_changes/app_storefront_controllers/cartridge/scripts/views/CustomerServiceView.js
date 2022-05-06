'use strict';

/**
 * This view updates the customer navigation before rendering the template.
 * @module views/CustomerServiceView
 */

var View = require('./View');

/* API Includes */
var ContentMgr = require('dw/content/ContentMgr');
var LinkedHashMap = require('dw/util/LinkedHashMap');
/**
 * Updates the customer navigation information.
 *
 * @class views/CustomerServiceView~CustomerServiceView
 * @extends module:views/View
 * @lends module:views/CustomerServiceView~CustomerServiceView.prototype
 * @returns {module:views/CustomerServiceView~CustomerServiceView} A view with updated information.
 */
var CustomerServiceView = View.extend({

    /**
     * Determines the customer navigation from the folder structure in the content library. Returns the list of
     * customer service folders. The root folder for customer service content is the folder having the ID
     * 'customer-service'.
     *
     * @returns {LinkedHashMap} List of customer service folders.
     */
    getCustomerServiceLinks: function () {
        // get the customer service folder
        var content = ContentMgr.getFolder('customer-service');

        if (content) {
            var customerServiceLinks = new LinkedHashMap();

            var customerServiceFolders = content.getOnlineSubFolders();

            for (var i = 0; i < customerServiceFolders.size(); i++) {
                var folder = customerServiceFolders[i];

                // Gets the content assets for the folder.
                var onlineContent = folder.getOnlineContent();
                //TODO : look at logic of this line - original line -> onlineContent && customerServiceLinks.put(folder.getDisplayName(), onlineContent);
                customerServiceLinks.put(folder.getDisplayName(), onlineContent);
            }

            // Outputs the target address.
            return customerServiceLinks;
        }
    },

    /**
     * Adds customer, session, request, and customer service link information to the view.
     * @constructs CustomerServiceView~CustomerServiceView
     * @extends module:views/View~View
     * @param {Object} params The parameters to pass to the template for rendering.
     * @returns {module:views/CartView~CartView} A CustomerService view.
     */
    init: function (params) {
        this._super(params);
        this.CustomerServiceLinks = this.getCustomerServiceLinks();
        this.ContinueURL = dw.web.URLUtils.https('CustomerService-Submit');

        return this;
    }

});

module.exports = CustomerServiceView;
