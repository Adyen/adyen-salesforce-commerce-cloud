'use strict';

/**
 * ValidateCartForCheckout
 *
 * This script implements a typical shopping cart checkout validation.
 * The script is provided with the Salesforce Commerce Cloud reference application. Some
 * parts of the validation script are specific to the reference application
 * logic and might not be applicable to our customer's storefront applications.
 * However, the shopping cart validation script can be customized to meet
 * specific needs and requirements.
 *
 * The script implements the validation of the shopping cart against specific
 * conditions. This includes the following steps:
 * - validate that total price is not N/A
 * - validate that all products in the basket are still in site catalog and online
 * - validate that all coupon codes in the basket are valid
 * - validate that the taxes can be calculated for all products in the basket (if ValidateTax in put paramter is true)
 *
 * @input Basket : dw.order.Basket
 * @input ValidateTax : Boolean
 * @output BasketStatus : dw.system.Status
 * @output EnableCheckout : Boolean
 */

function execute (pdict) {
    validate(pdict);

    return PIPELET_NEXT;
}

/**
 * Function: validate
 *
 * Main function of the validation script.
 *
 * @param {dw.system.PipelineDictionary} pdict
 * @param {dw.order.Basket} pdict.Basket
 * @param {Boolean} pdict.ValidateTax
 * @returns {dw.system.Status}
 */
function validate(pdict) {
    var Status = require('dw/system/Status');

    // ===================================================
    // =====     	PROCESS INPUT PARAMETERS 		 =====
    // ===================================================

    // type: dw.order.Basket
    var basket = pdict.Basket;
    // type: Boolean
    var validateTax = pdict.ValidateTax;

    // ===================================================
    // =====   VALIDATE PRODUCT EXISTENCE            =====
    // ===================================================
    // Check if all products in basket can still be resolved
    // and are online

    var productExistence = validateProductExistence(basket, pdict);

    // ===================================================
    // =====             VALIDATE CONTENT            =====
    // ===================================================
    // Check if basket contains products or gift certificates
    var hasContent = validateContent(basket);

    // ===================================================
    // =====    CHECK MERCHANDIZE TOTAL NET PRICE   ======
    // ===================================================

    // Checks the availability of the basket's merchandize
    // total price (net or gross depending on taxation policy)
    var pricesAvailable = basket.merchandizeTotalPrice.available;

    // ===================================================
    // =====             VALIDATE COUPONS           ======
    // ===================================================
    var allCouponsValid = validateCoupons(basket, pdict);

    // ===================================================
    // =====             VALIDATE TAXES             ======
    // ===================================================
    var hasTotalTax = true;
    if (validateTax !== null && validateTax === true) {
        hasTotalTax = basket.totalTax.available;
    }


    // ===================================================
    // =====           EVALUATE CONDITIONS           =====
    // ===================================================

    if (!pricesAvailable || !productExistence) {
        // there are either any product line items without existing
        // product or one or more line items has no price
        pdict.BasketStatus = new Status(Status.ERROR);
        return PIPELET_ERROR;
    } else if (!allCouponsValid) {
        // there are invalid coupon line items.
        // exit with an error.
        pdict.BasketStatus = new Status(Status.ERROR, 'CouponError');
        return PIPELET_ERROR;
    } else if (!hasContent) {
        // there are neither products nor gift certificates in the
        // basket; we exit with an error however the basket status is OK
        pdict.BasketStatus = new Status(Status.OK);
        return PIPELET_ERROR;
    } else if (!hasTotalTax) {
        pdict.BasketStatus = new Status(Status.ERROR, 'TaxError');
        return PIPELET_ERROR;
    }


    // ===================================================
    // =====            DONE                         =====
    // ===================================================

    return {
        BasketStatus: new Status(Status.OK),
        EnableCheckout: pdict.EnableCheckout
    };
}

/**
 * FUNCTION: validateProductExistence
 * @param {dw.order.Basket} basket
 * @param {dw.system.PipelineDictionary} pdict
 */
function validateProductExistence(basket, pdict) {
    var quantityOverflow = true;
    // type: Iterator
    var plis = basket.getProductLineItems().iterator();

    while (plis.hasNext()) {
        var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
        var StoreMgr = require('dw/catalog/StoreMgr');
        // type: dw.order.ProductLineItem
        var pli = plis.next();
        if (pli.product === null || !pli.product.online) {
            return false;
        }

        //RAP-2490 : if this pli is marked as an instore item use the store inventory instead of the default inventory when diabling the cart based on inventory levels
        if (pli.custom.hasOwnProperty('fromStoreId') && !empty(pli.custom.fromStoreId)) {
            // type: dw.catalog.Store
            var store = StoreMgr.getStore(pli.custom.fromStoreId);
            // type: dw.catalog.ProductInventoryList
            var storeinventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
            quantityOverflow = quantityOverflow && (!empty(storeinventory.getRecord(pli.productID)) && storeinventory.getRecord(pli.productID).ATS.value >= pli.quantityValue);
        } else {
        // RAP-116 : if atleast one of the products is out of stock, don't allow checkout
            // type: dw.catalog.ProductAvailabilityLevels
            var availabilityLevels = pli.product.getAvailabilityModel().getAvailabilityLevels(pli.quantityValue);
            quantityOverflow = quantityOverflow && (availabilityLevels.getNotAvailable().value === 0);
        }
    }
    pdict.EnableCheckout = quantityOverflow;

    return true;
}

/**
 * Validates basket content
 * @param {dw.order.Basket} basket
 *
 */
function validateContent(basket) {
    // type: dw.util.Collection
    var plis = basket.getProductLineItems();
    // type: dw.util.Collection
    var gclis = basket.getGiftCertificateLineItems();

    return (plis.size() === 0 && gclis.size() === 0) ? false : true;
}

/**
 * Validates coupons
 *
 * @param {dw.order.Basket} basket
 */
function validateCoupons(basket) {
    // type: Iterator
    var clis = basket.getCouponLineItems().iterator();

    while (clis.hasNext()) {
        // type: dw.order.CouponLineItem
        var cli = clis.next();
        if (!cli.isValid()) {
            return false;
        }
    }

    return true;
}

module.exports = {
    execute: execute,
    validate: validate
};
