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

const PAYPAL_ITEM_CATEGORY = ["PHYSICAL_GOODS","DIGITAL_GOODS","DONATION"]
function getLineItems({ Order: order, Basket: basket }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const allLineItems = LineItemHelper.getAllLineItems(orderOrBasket.getAllLineItems());
  return allLineItems.map((lineItem) => {
    const description = LineItemHelper.getDescription(lineItem);
    const id = LineItemHelper.getId(lineItem);
    const quantity = LineItemHelper.getQuantity(lineItem);
    const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    let category = PAYPAL_ITEM_CATEGORY[0];
    if (lineItem.hasOwnProperty('category')) {
      category = PAYPAL_ITEM_CATEGORY.indexOf(lineItem.category) > -1 ? lineItem.category : PAYPAL_ITEM_CATEGORY[0]
    }
    return {
      quantity: quantity,
      description: description,
      itemCategory: category,
      sku: id,
      amountExcludingTax: itemAmount.getValue().toFixed(),
      taxAmount: vatAmount.getValue().toFixed()
    }
  });
}

module.exports.getLineItems = getLineItems;
