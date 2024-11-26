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
 * *
 */

// script include
const LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');

function getLineItems({ Order: order, Basket: basket, addTaxPercentage }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const allLineItems = LineItemHelper.getAllLineItems(
    orderOrBasket.getAllLineItems(),
  );

  // Add all product and shipping line items to request
  return allLineItems.map((lineItem) => {
    const lineItemObject = {};
    const description = LineItemHelper.getDescription(lineItem);
    const id = LineItemHelper.getId(lineItem);
    const quantity = LineItemHelper.getQuantity(lineItem);
    const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
    const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
    const vatPercentage = LineItemHelper.getVatPercentage(lineItem);

    lineItemObject.amountExcludingTax = itemAmount.getValue().toFixed();
    lineItemObject.taxAmount = vatAmount.getValue().toFixed();
    lineItemObject.amountIncludingTax =
      itemAmount.getValue() + vatAmount.getValue();
    lineItemObject.description = description;
    lineItemObject.id = id;
    lineItemObject.quantity = quantity;
    lineItemObject.taxPercentage = addTaxPercentage
      ? (Number(vatPercentage) * 10000).toFixed()
      : 0;
    return lineItemObject;
  });
}

module.exports = {
  getLineItems,
};
