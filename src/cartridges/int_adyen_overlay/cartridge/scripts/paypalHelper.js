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
 * Add all product and shipping line items to request
 */

const LineItemHelper = require('*/cartridge/scripts/util/lineItemHelper');

const PAYPAL_ITEM_CATEGORY = {
  DIGITAL_GOODS: "DIGITAL_GOODS",
  PHYSICAL_GOODS: "PHYSICAL_GOODS",
  DONATION: "DONATION"
}
function getLineItems({ Order: order, Basket: basket }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const allLineItems = orderOrBasket.getProductLineItems();
  return allLineItems.toArray().map((lineItem) => {
    const description = LineItemHelper.getDescription(lineItem);
    const id = LineItemHelper.getId(lineItem);
    const quantity = LineItemHelper.getQuantity(lineItem);
    const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    return {
      quantity: quantity,
      description: description,
      itemCategory: Object.values(PAYPAL_ITEM_CATEGORY).indexOf(lineItem.category) > -1 ? lineItem.category : PAYPAL_ITEM_CATEGORY.PHYSICAL_GOODS,
      sku: id,
      amountExcludingTax: itemAmount.getValue().toFixed(),
      taxAmount: vatAmount.getValue().toFixed()
    }
  });
}

module.exports.getLineItems = getLineItems;
