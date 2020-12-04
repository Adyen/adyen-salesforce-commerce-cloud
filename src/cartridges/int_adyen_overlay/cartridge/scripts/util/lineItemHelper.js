/**
 *
 */

require('dw/order');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const lineItemHelperObj = {
  getDescription: function (lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return lineItem.getID();
    } if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.product.name;
    } if (lineItem instanceof dw.order.PriceAdjustment) {
      return 'Discount';
    }

    return null;
  },

  getId: function (lineItem) {
    if (
      lineItem instanceof dw.order.ShippingLineItem
      || lineItem instanceof dw.order.PriceAdjustment
    ) {
      return lineItem.UUID;
    } if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.product.ID;
    }

    return null;
  },

  getQuantity: function (lineItem) {
    if (lineItem instanceof dw.order.ShippingLineItem) {
      return '1';
    } if (lineItem instanceof dw.order.ProductLineItem) {
      return lineItem.quantityValue.toFixed();
    } if (lineItem instanceof dw.order.PriceAdjustment) {
      return lineItem.quantity.toFixed();
    }

    return null;
  },

  getVatPercentage: function (lineItem) {
    let vatPercentage = 0;
    if (lineItemHelperObj.getVatAmount(lineItem) !== 0) {
      vatPercentage = lineItem.getTaxRate();
    }
    return vatPercentage;
  },

  getVatAmount: function (lineItem) {
    if (
      lineItem instanceof dw.order.ProductLineItem
      || lineItem instanceof dw.order.ShippingLineItem
    ) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.getAdjustedTax());
    } if (lineItem instanceof dw.order.PriceAdjustment && lineItem.getPromotion().getPromotionClass() !== 'ORDER') {
      return AdyenHelper.getCurrencyValueForApi(lineItem.tax);
    }
    return null;
  },

  getItemAmount: function (lineItem) {
    if (
      lineItem instanceof dw.order.ProductLineItem
      || lineItem instanceof dw.order.ShippingLineItem
    ) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.adjustedNetPrice);
    } if (lineItem instanceof dw.order.PriceAdjustment) {
      return AdyenHelper.getCurrencyValueForApi(lineItem.netPrice);
    }
    return null;
  },
};

module.exports = lineItemHelperObj;
