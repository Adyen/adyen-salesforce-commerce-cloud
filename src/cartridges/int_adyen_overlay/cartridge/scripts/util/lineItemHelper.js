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
 */

const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const __LineItemHelper = {
  getDescription(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return lineItem.getID();
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productName;
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return 'Discount';
    }

    return null;
  },

  getId(lineItem) {
    if (
      lineItem instanceof dw.order.ShippingLineItem ||
      lineItem instanceof dw.order.PriceAdjustment
    ) {
      return lineItem.UUID;
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.productID;
    }

    return null;
  },

  getQuantity(lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return '1';
    }
    if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.quantityValue.toFixed();
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.quantity.toFixed();
    }

    return null;
  },

  getVatPercentage(lineItem) {
    let vatPercentage = 0;
    if (__LineItemHelper.getVatAmount(lineItem).value !== 0) {
      vatPercentage = lineItem.getTaxRate();
    }
    return vatPercentage;
  },

  getVatAmount(lineItem) {
    if (
      lineItem instanceof dw.order.ProductLineItem ||
      lineItem instanceof dw.order.ShippingLineItem
    ) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.getAdjustedTax());
    }
    if (lineItem instanceof dw.order.PriceAdjustment && lineItem.getPromotion().getPromotionClass() !== 'ORDER') {
      return AdyenHelper.getCurrencyValueForApi(lineItem.tax);
    }
    return new dw.value.Money(0, lineItem.getTax().getCurrencyCode());
  },

  getItemAmount(lineItem) {
    if (
      lineItem instanceof dw.order.ProductLineItem ||
      lineItem instanceof dw.order.ShippingLineItem
    ) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.adjustedNetPrice);
    }
    if (lineItem instanceof dw.order.PriceAdjustment) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.netPrice);
    }
    return new dw.value.Money(0, lineItem.getPrice().getCurrencyCode());
  },
};

module.exports = __LineItemHelper;
