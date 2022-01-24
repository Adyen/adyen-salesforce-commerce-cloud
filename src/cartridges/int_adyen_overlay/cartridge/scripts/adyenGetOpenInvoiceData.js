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
require('dw/crypto');
require('dw/system');
require('dw/order');
require('dw/util');
require('dw/value');
require('dw/net');
require('dw/web');

// script include
const LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');

function getLineItems(args) {
  let orderOrBasket;
  if (args.Order) {
    orderOrBasket = args.Order;
  } else if (args.Basket) {
    orderOrBasket = args.Basket;
  } else {
    return null;
  }

  // Add all product and shipping line items to request
  const lineItems = [];
  const allLineItems = orderOrBasket.getAllLineItems();
  for (const item in allLineItems) {
    const lineItem = allLineItems[item];
    if (
        (lineItem instanceof dw.order.ProductLineItem &&
            !lineItem.bonusProductLineItem) ||
        lineItem instanceof dw.order.ShippingLineItem ||
        (lineItem instanceof dw.order.PriceAdjustment &&
            lineItem.promotion.promotionClass ===
            dw.campaign.Promotion.PROMOTION_CLASS_ORDER)
    ) {
      const lineItemObject = {};
      const description = LineItemHelper.getDescription(lineItem);
      const id = LineItemHelper.getId(lineItem);
      const quantity = LineItemHelper.getQuantity(lineItem);
      const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
      const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
      const vatPercentage = LineItemHelper.getVatPercentage(lineItem);

      lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
      lineItemObject.taxAmount = vatAmount.getValue().toFixed();
      lineItemObject.description = description;
      lineItemObject.id = id;
      lineItemObject.quantity = quantity;
      lineItemObject.taxCategory = 'None';
      lineItemObject.taxPercentage = args.addTaxPercentage ? (
          new Number(vatPercentage) * 10000
      ).toFixed() : 0;

      lineItems.push(lineItemObject);
    }
  }

  return lineItems;
}

module.exports = {
  getLineItems,
};
