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

function getLineItems({ Order: order, Basket: basket }) {
  if (!(order || basket)) return null;
  const orderOrBasket = order || basket;
  const allLineItems = orderOrBasket.getProductLineItems();
  const shopperReference = getShopperReference(orderOrBasket);

  return allLineItems.toArray().reduce(
    (acc, lineItem, index) => {
      const description = LineItemHelper.getDescription(lineItem);
      const id = LineItemHelper.getId(lineItem);
      const quantity = LineItemHelper.getQuantity(lineItem);
      const itemAmount =
        LineItemHelper.getItemAmount(lineItem).divide(quantity);
      const vatAmount = LineItemHelper.getVatAmount(lineItem).divide(quantity);
      const commodityCode = AdyenConfigs.getAdyenLevel23CommodityCode();
      const currentLineItem = {
        [`enhancedSchemeData.itemDetailLine${index + 1}.unitPrice`]:
          itemAmount.value.toFixed(),
        [`enhancedSchemeData.itemDetailLine${index + 1}.totalAmount`]:
          parseFloat(itemAmount.value.toFixed()) +
          parseFloat(vatAmount.value.toFixed()),
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
      };

      return {
        ...acc,
        ...currentLineItem,
        'enhancedSchemeData.totalTaxAmount':
          acc['enhancedSchemeData.totalTaxAmount'] +
          parseFloat(vatAmount.value.toFixed()),
      };
    },
    {
      'enhancedSchemeData.totalTaxAmount': 0.0,
      'enhancedSchemeData.customerReference': shopperReference.substring(0, 25),
    },
  );
}

module.exports.getLineItems = getLineItems;
