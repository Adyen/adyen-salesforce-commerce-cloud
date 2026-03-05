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
  if (LineItemHelper.isProductLineItem(lineItem)) {
    const { basePrice } = lineItem;
    const { adjustedPrice } = lineItem;
    if (basePrice && adjustedPrice && basePrice.value > adjustedPrice.value) {
      const discountPerUnit = AdyenHelper.getCurrencyValueForApi(
        basePrice.subtract(adjustedPrice),
      ).divide(quantity);
      return discountPerUnit.value.toFixed();
    }
  }
  return null;
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

function buildEnhancedSchemeDataFields(
  index,
  itemAmount,
  quantity,
  totalAmount,
  commodityCode,
  description,
  id,
  discountAmount,
) {
  return {
    [`enhancedSchemeData.itemDetailLine${index + 1}.unitPrice`]:
      itemAmount.value.toFixed(),
    [`enhancedSchemeData.itemDetailLine${index + 1}.totalAmount`]: totalAmount,
    [`enhancedSchemeData.itemDetailLine${index + 1}.quantity`]: quantity,
    [`enhancedSchemeData.itemDetailLine${index + 1}.unitOfMeasure`]: 'EAC',
    ...(commodityCode && {
      [`enhancedSchemeData.itemDetailLine${index + 1}.commodityCode`]:
        commodityCode,
    }),
    ...(description && {
      [`enhancedSchemeData.itemDetailLine${index + 1}.description`]:
        // eslint-disable-next-line no-control-regex
        description.substring(0, 26).replace(/[^\x00-\x7F]/g, ''),
    }),
    ...(id && {
      [`enhancedSchemeData.itemDetailLine${index + 1}.productCode`]:
        id.substring(0, 12),
    }),
    ...(discountAmount && {
      [`enhancedSchemeData.itemDetailLine${index + 1}.discountAmount`]:
        discountAmount,
    }),
  };
}

function processLineItem(acc, lineItem, index) {
  const description = LineItemHelper.getDescription(lineItem);
  const id = LineItemHelper.getId(lineItem);
  const quantity = LineItemHelper.getQuantity(lineItem);
  const itemAmount = LineItemHelper.getItemAmount(lineItem).divide(quantity);
  const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
  const discountAmount = getDiscountAmount(lineItem, quantity);
  const commodityCode = AdyenConfigs.getAdyenLevel23CommodityCode();
  const unitPrice = parseFloat(itemAmount.value.toFixed());
  const quantityNum = parseFloat(quantity);
  const discount = discountAmount ? parseFloat(discountAmount) : 0;
  const totalAmount = quantityNum * unitPrice - discount;
  const currentLineItem = buildEnhancedSchemeDataFields(
    index,
    itemAmount,
    quantity,
    totalAmount,
    commodityCode,
    description,
    id,
    discountAmount,
  );

  return {
    ...acc,
    ...currentLineItem,
    'enhancedSchemeData.totalTaxAmount':
      acc['enhancedSchemeData.totalTaxAmount'] +
      parseFloat(vatAmount.value.toFixed()),
  };
}

function getLineItems({ Order: order, Basket: basket }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const productLineItems = orderOrBasket.getProductLineItems().toArray();
  const shipments = orderOrBasket.getShipments().toArray();
  const shippingLineItems = collectShippingLineItems(shipments);
  const allLineItems = productLineItems.concat(shippingLineItems);
  const shopperReference = getShopperReference(orderOrBasket);

  return allLineItems.reduce(
    (acc, lineItem, index) => processLineItem(acc, lineItem, index),
    {
      'enhancedSchemeData.totalTaxAmount': 0.0,
      'enhancedSchemeData.customerReference': shopperReference.substring(0, 25),
    },
  );
}

module.exports.getLineItems = getLineItems;
