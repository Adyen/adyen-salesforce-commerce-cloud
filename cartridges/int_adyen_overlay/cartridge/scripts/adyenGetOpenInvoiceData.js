"use strict";

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Generate the parameters needed for the redirect to the Adyen Hosted Payment Page.
 * A signature is calculated based on the configured HMAC code
 */

// script include
var LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');
function getLineItems(_ref) {
  var order = _ref.Order,
    basket = _ref.Basket,
    addTaxPercentage = _ref.addTaxPercentage;
  if (!(order || basket)) return null;
  var orderOrBasket = order || basket;
  var allLineItems = orderOrBasket.getProductLineItems();

  // Add all product and shipping line items to request
  var lineItems = [];
  for (var item in allLineItems) {
    var lineItem = allLineItems[item];
    if (lineItem instanceof dw.order.ProductLineItem && !lineItem.bonusProductLineItem || lineItem instanceof dw.order.ShippingLineItem || lineItem instanceof dw.order.PriceAdjustment && lineItem.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER) {
      var lineItemObject = {};
      var description = LineItemHelper.getDescription(lineItem);
      var id = LineItemHelper.getId(lineItem);
      var quantity = LineItemHelper.getQuantity(lineItem);
      var itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
      var vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
      var vatPercentage = LineItemHelper.getVatPercentage(lineItem);
      lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
      lineItemObject.taxAmount = vatAmount.getValue().toFixed();
      lineItemObject.description = description;
      lineItemObject.id = id;
      lineItemObject.quantity = quantity;
      lineItemObject.taxCategory = 'None';
      lineItemObject.taxPercentage = addTaxPercentage ? (new Number(vatPercentage) * 10000).toFixed() : 0;
      lineItems.push(lineItemObject);
    }
  }
  return lineItems;
}
module.exports = {
  getLineItems: getLineItems
};