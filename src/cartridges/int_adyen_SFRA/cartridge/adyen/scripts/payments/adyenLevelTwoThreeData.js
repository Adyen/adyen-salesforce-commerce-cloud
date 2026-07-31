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

const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');

// eslint-disable-next-line complexity
function getShopperReference(orderOrBasket) {
  const customer = orderOrBasket.getCustomer();
  const isRegistered = customer && customer.registered;
  const profile = isRegistered && customer.getProfile();
  const profileCustomerNo = profile && profile.getCustomerNo();
  const orderNo = profileCustomerNo || orderOrBasket.getCustomerNo();
  return orderNo || customer.getID() || 'no-unique-ref';
}

function getDiscountAmount(lineItem, quantity) {
  if (!LineItemHelper.isProductLineItem(lineItem)) return null;
  const { basePrice, adjustedPrice } = lineItem;
  if (!basePrice || !adjustedPrice) return null;
  // Total line discount = (per-unit basePrice * quantity) - adjustedPrice line total.
  const baseTotal = basePrice.multiply(quantity);
  if (baseTotal.value <= adjustedPrice.value) return null;
  return parseFloat(
    AdyenHelper.getCurrencyValueForApi(
      baseTotal.subtract(adjustedPrice),
    ).value.toFixed(),
  );
}

function collectShippingLineItems(shipments) {
  const shippingLineItems = [];
  for (let i = 0; i < shipments.length; i++) {
    const shipmentLineItems = shipments[i].getShippingLineItems().toArray();
    for (let j = 0; j < shipmentLineItems.length; j++) {
      shippingLineItems.push(shipmentLineItems[j]);
    }
  }
  return shippingLineItems;
}

function buildItemDetailLine(
  unitPrice,
  quantity,
  totalAmount,
  commodityCode,
  description,
  id,
  discountAmount,
) {
  return {
    unitPrice,
    totalAmount,
    quantity,
    unitOfMeasure: 'EAC',
    ...(commodityCode && { commodityCode }),
    ...(description && {
      // eslint-disable-next-line no-control-regex
      description: description.substring(0, 26).replace(/[^\x00-\x7F]/g, ''),
    }),
    ...(id && { productCode: id.substring(0, 12) }),
    ...(discountAmount && { discountAmount }),
  };
}

function processLineItem(acc, lineItem) {
  const description = LineItemHelper.getDescription(lineItem);
  const id = LineItemHelper.getId(lineItem);
  const quantity = parseFloat(LineItemHelper.getQuantity(lineItem)) || 1;
  const lineAmount = LineItemHelper.getItemAmount(lineItem);
  const vatAmount = LineItemHelper.getVatAmount(lineItem);
  const discountAmount = getDiscountAmount(lineItem, quantity);
  const commodityCode = AdyenConfigs.getAdyenLevel23CommodityCode();
  // Derive unitPrice from totalAmount = quantity * unitPrice - discountAmount.
  const totalAmount = parseFloat(lineAmount.value.toFixed());
  const unitPrice = parseFloat(
    ((totalAmount + (discountAmount || 0)) / quantity).toFixed(),
  );

  acc.itemDetailLines.push(
    buildItemDetailLine(
      unitPrice,
      quantity,
      totalAmount,
      commodityCode,
      description,
      id,
      discountAmount,
    ),
  );
  acc.totalTaxAmount += parseFloat(vatAmount.value.toFixed());
  return acc;
}

function getLineItems({ Order: order, Basket: basket }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const productLineItems = orderOrBasket.getProductLineItems().toArray();
  const shipments = orderOrBasket.getShipments().toArray();
  const shippingLineItems = collectShippingLineItems(shipments);
  const allLineItems = productLineItems.concat(shippingLineItems);
  const shopperReference = getShopperReference(orderOrBasket);

  return {
    levelTwoThree: allLineItems.reduce(processLineItem, {
      customerReferenceNumber: shopperReference.substring(0, 25),
      totalTaxAmount: 0.0,
      itemDetailLines: [],
    }),
  };
}

module.exports.getLineItems = getLineItems;
