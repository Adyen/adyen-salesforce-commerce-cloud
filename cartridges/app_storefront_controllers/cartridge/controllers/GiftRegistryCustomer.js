'use strict';
/**
 * Controller that renders a public gift registry, which can be accessed by people other than the owner.
 *
 * @module controllers/GiftRegistryCustomer
 * @todo  Requires cleanup
 */

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');

/**
 * Updates the giftregistry form and renders the product list template.
 *
 * Clears the giftregistry form and gets the product list using the ProductListID from the httpParameterMap.
 * If the product list is public, it copies item and event information to the gift registry form from the product list.
 * If the product list is private, sets the system status to ERROR.

 * @FIXME Why does this not use a view to render the template.
 */
function Show() {
    var Status = require('dw/system/Status');
    var ProductListMgr = require('dw/customer/ProductListMgr');

    var registryForm = app.getForm('giftregistry');
    var productList;
    var productListID = request.httpParameterMap.ID.stringValue;
    var productListStatus;

    registryForm.clearFormElement();

    if (productListID) {

        productList = ProductListMgr.getProductList(productListID);

        if (!productList) {
            productListStatus = new Status(Status.ERROR, 'notfound');
        } else {

            if (productList.public) {
                registryForm.get('items').copyFrom(productList.publicItems);
                registryForm.get('event').copyFrom(productList);
            }  else {
                productListStatus = new Status(Status.ERROR, 'private');
                productList = null;
            }
        }

    } else {
        productListStatus = new Status(Status.ERROR, 'notfound');
    }

    app.getView({
        Status: productListStatus,
        ProductList: productList
    }).render('account/giftregistry/registrycustomer');

}
/**
 * Gift registry customer event handler. Handles the last triggered action based in the formId.
 *
 * If the formId is:
 * - __search__ - calls the {@link module:controllers/GiftRegistry~search|GiftRegistry controller search function} to render the gift registry search page.
 */
function ShowInteraction() {
    app.getForm('giftregistry').handleAction({
        search: function () {
            var GiftRegistryController = require('./GiftRegistry');
            GiftRegistryController.Search();
            return;
        }
    });
}

/*
 * Web exposed methods
 */
exports.Show = guard.ensure(['get', 'https'], Show);
exports.ShowInteraction = guard.ensure(['post', 'https'], ShowInteraction);
