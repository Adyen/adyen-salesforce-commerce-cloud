'use strict';

/**
 * @module calculate.js
 *
 * This javascript file implements methods (via Common.js exports) that are needed by
 * the new (smaller) CalculateCart.ds script file.  This allows OCAPI calls to reference
 * these tools via the OCAPI 'hook' mechanism
 *
 */
var HashMap = require('dw/util/HashMap');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var ShippingLocation = require('dw/order/ShippingLocation');
var TaxMgr = require('dw/order/TaxMgr');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

/**
 * @function calculate
 *
 * calculate is the arching logic for computing the value of a basket.  It makes
 * calls into cart/calculate.js and enables both SG and OCAPI applications to share
 * the same cart calculation logic.
 *
 * @param {object} basket The basket to be calculated
 */
exports.calculate = function (basket) {
    // ===================================================
    // =====   CALCULATE PRODUCT LINE ITEM PRICES    =====
    // ===================================================

    calculateProductPrices(basket);

    // ===================================================
    // =====    CALCULATE GIFT CERTIFICATE PRICES    =====
    // ===================================================

    calculateGiftCertificatePrices(basket);

    // ===================================================
    // =====   Note: Promotions must be applied      =====
    // =====   after the tax calculation for         =====
    // =====   storefronts based on GROSS prices     =====
    // ===================================================

    // ===================================================
    // =====   APPLY PROMOTION DISCOUNTS			 =====
    // =====   Apply product and order promotions.   =====
    // =====   Must be done before shipping 		 =====
    // =====   calculation. 					     =====
    // ===================================================

    PromotionMgr.applyDiscounts(basket);

    // ===================================================
    // =====        CALCULATE SHIPPING COSTS         =====
    // ===================================================

    // apply product specific shipping costs
    // and calculate total shipping costs
    ShippingMgr.applyShippingCost(basket);

    // ===================================================
    // =====   APPLY PROMOTION DISCOUNTS			 =====
    // =====   Apply product and order and 			 =====
    // =====   shipping promotions.                  =====
    // ===================================================

    PromotionMgr.applyDiscounts(basket);

    // since we might have bonus product line items, we need to
    // reset product prices
    calculateProductPrices(basket);

    // ===================================================
    // =====         CALCULATE TAX                   =====
    // ===================================================

    calculateTax(basket);

    // ===================================================
    // =====         CALCULATE BASKET TOTALS         =====
    // ===================================================

    basket.updateTotals();

    // ===================================================
    // =====            DONE                         =====
    // ===================================================

    return new Status(Status.OK);
};

/**
 * @function calculateProductPrices
 *
 * Calculates product prices based on line item quantities. Set calculates prices
 * on the product line items.  This updates the basket and returns nothing
 *
 * @param {object} basket The basket containing the elements to be computed
 */
function calculateProductPrices (basket) {
    // get total quantities for all products contained in the basket
    var productQuantities = basket.getProductQuantities();
    var productQuantitiesIt = productQuantities.keySet().iterator();

    // get product prices for the accumulated product quantities
    var productPrices = new HashMap();

    while (productQuantitiesIt.hasNext()) {
        var prod = productQuantitiesIt.next();
        var quantity = productQuantities.get(prod);
        productPrices.put(prod, prod.priceModel.getPrice(quantity));
    }

    // iterate all product line items of the basket and set prices
    var productLineItems = basket.getAllProductLineItems().iterator();
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();

        // handle non-catalog products
        if (!productLineItem.catalogProduct) {
            productLineItem.setPriceValue(productLineItem.basePrice.valueOrNull);
            continue;
        }

        var product = productLineItem.product;

        // handle option line items
        if (productLineItem.optionProductLineItem) {
            // for bonus option line items, we do not update the price
            // the price is set to 0.0 by the promotion engine
            if (!productLineItem.bonusProductLineItem) {
                productLineItem.updateOptionPrice();
            }
        // handle bundle line items, but only if they're not a bonus
        } else if (productLineItem.bundledProductLineItem) {
            // no price is set for bundled product line items
        // handle bonus line items
        // the promotion engine set the price of a bonus product to 0.0
        // we update this price here to the actual product price just to
        // provide the total customer savings in the storefront
        // we have to update the product price as well as the bonus adjustment
        } else if (productLineItem.bonusProductLineItem && product !== null) {
            var price = product.priceModel.price;
            var adjustedPrice = productLineItem.adjustedPrice;
            productLineItem.setPriceValue(price.valueOrNull);
            // get the product quantity
            var quantity2 = productLineItem.quantity;
            // we assume that a bonus line item has only one price adjustment
            var adjustments = productLineItem.priceAdjustments;
            if (!adjustments.isEmpty()) {
                var adjustment = adjustments.iterator().next();
                var adjustmentPrice = price.multiply(quantity2.value).multiply(-1.0).add(adjustedPrice);
                adjustment.setPriceValue(adjustmentPrice.valueOrNull);
            }


        // set the product price. Updates the 'basePrice' of the product line item,
        // and either the 'netPrice' or the 'grossPrice' based on the current taxation
        // policy

        // handle product line items unrelated to product
        } else if (product === null) {
            productLineItem.setPriceValue(null);
        // handle normal product line items
        } else {
            productLineItem.setPriceValue(productPrices.get(product).valueOrNull);
        }
    }
}

/**
 * @function calculateGiftCertificates
 *
 * Function sets either the net or gross price attribute of all gift certificate
 * line items of the basket by using the gift certificate base price. It updates the basket in place.
 *
 * @param {object} basket The basket containing the gift certificates
 */
function calculateGiftCertificatePrices (basket) {
    var giftCertificates = basket.getGiftCertificateLineItems().iterator();
    while (giftCertificates.hasNext()) {
        var giftCertificate = giftCertificates.next();
        giftCertificate.setPriceValue(giftCertificate.basePrice.valueOrNull);
    }
}

/**
 * @function calculateTax <p>
 *
 * Determines tax rates for all line items of the basket. Uses the shipping addresses
 * associated with the basket shipments to determine the appropriate tax jurisdiction.
 * Uses the tax class assigned to products and shipping methods to lookup tax rates. <p>
 *
 * Sets the tax-related fields of the line items. <p>
 *
 * Handles gift certificates, which aren't taxable. <p>
 *
 * Note that the function implements a fallback to the default tax jurisdiction
 * if no other jurisdiction matches the specified shipping location/shipping address.<p>
 *
 * Note that the function implements a fallback to the default tax class if a
 * product or a shipping method does explicitly define a tax class.
 *
 * @param {object} basket The basket containing the elements for which taxes need to be calculated
 */
function calculateTax (basket) {
    var shipments = basket.getShipments().iterator();
    while (shipments.hasNext()) {
        var shipment = shipments.next();

        // first we reset all tax fields of all the line items
        // of the shipment
        var shipmentLineItems = shipment.getAllLineItems().iterator();
        while (shipmentLineItems.hasNext()) {
            var _lineItem = shipmentLineItems.next();
            // do not touch tax rate for fix rate items
            if (_lineItem.taxClassID === TaxMgr.customRateTaxClassID) {
                _lineItem.updateTax(_lineItem.taxRate);
            } else {
                _lineItem.updateTax(null);
            }
        }

        // identify the appropriate tax jurisdiction
        var taxJurisdictionID = null;

        // if we have a shipping address, we can determine a tax jurisdiction for it
        if (shipment.shippingAddress !== null) {
            var location = new ShippingLocation(shipment.shippingAddress);
            taxJurisdictionID = TaxMgr.getTaxJurisdictionID(location);
        }

        if (taxJurisdictionID === null) {
            taxJurisdictionID = TaxMgr.defaultTaxJurisdictionID;
        }

        // if we have no tax jurisdiction, we cannot calculate tax
        if (taxJurisdictionID === null) {
            continue;
        }

        // shipping address and tax juridisction are available
        var shipmentLineItems2 = shipment.getAllLineItems().iterator();
        while (shipmentLineItems2.hasNext()) {
            var lineItem = shipmentLineItems2.next();
            var taxClassID = lineItem.taxClassID;

            Logger.debug('1. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);

            // do not touch line items with fix tax rate
            if (taxClassID === TaxMgr.customRateTaxClassID) {
                continue;
            }

            // line item does not define a valid tax class; let's fall back to default tax class
            if (taxClassID === null) {
                taxClassID = TaxMgr.defaultTaxClassID;
            }

            // if we have no tax class, we cannot calculate tax
            if (taxClassID === null) {
                Logger.debug('Line Item {0} has invalid Tax Class {1}', lineItem.lineItemText, lineItem.taxClassID);
                continue;
            }

            // get the tax rate
            var taxRate = TaxMgr.getTaxRate(taxClassID, taxJurisdictionID);
            // w/o a valid tax rate, we cannot calculate tax for the line item
            if (taxRate === null) {
                continue;
            }

            // calculate the tax of the line item
            lineItem.updateTax(taxRate);
            Logger.debug('2. Line Item {0} with Tax Class {1} and Tax Rate {2}', lineItem.lineItemText, lineItem.taxClassID, lineItem.taxRate);
        }
    }

    // besides shipment line items, we need to calculate tax for possible order-level price adjustments
    // this includes order-level shipping price adjustments
    if (!basket.getPriceAdjustments().empty || !basket.getShippingPriceAdjustments().empty) {
    // calculate a mix tax rate from
    var basketPriceAdjustmentsTaxRate = (basket.getMerchandizeTotalGrossPrice().value / basket.getMerchandizeTotalNetPrice().value) - 1;

        var basketPriceAdjustments = basket.getPriceAdjustments().iterator();
        while (basketPriceAdjustments.hasNext()) {
            var basketPriceAdjustment = basketPriceAdjustments.next();
            basketPriceAdjustment.updateTax(basketPriceAdjustmentsTaxRate);
        }

        var basketShippingPriceAdjustments = basket.getShippingPriceAdjustments().iterator();
        while (basketShippingPriceAdjustments.hasNext()) {
            var basketShippingPriceAdjustment = basketShippingPriceAdjustments.next();
            basketShippingPriceAdjustment.updateTax(basketPriceAdjustmentsTaxRate);
        }
    }
}
