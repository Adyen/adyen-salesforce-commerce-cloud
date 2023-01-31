const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function formatCustomerObject(shopperDetails) {
  return {
    addressBook: {
      addresses: {},
      preferredAddress: {
        // for shipping address
        address1: shopperDetails.shippingAddress.addressLine1,
        address2: shopperDetails.shippingAddress.addressLine2,
        city: shopperDetails.shippingAddress.city,
        countryCode: {
          value: shopperDetails.shippingAddress.countryCode,
        },
        phone: shopperDetails.shippingAddress.phoneNumber,
        firstName: shopperDetails.shippingAddress.name.split(' ')[0],
        lastName: shopperDetails.shippingAddress.name.split(' ')[1],
        postalCode: shopperDetails.shippingAddress.postalCode,
        stateCode: shopperDetails.shippingAddress.stateOrRegion,
      },
    },
    billingAddressDetails: {
      address1: shopperDetails.billingAddress.addressLine1,
      address2: shopperDetails.billingAddress.addressLine2,
      city: shopperDetails.billingAddress.city,
      countryCode: {
        value: shopperDetails.billingAddress.countryCode,
      },
      phone: shopperDetails.billingAddress.phoneNumber,
      firstName: shopperDetails.billingAddress.name.split(' ')[0],
      lastName: shopperDetails.billingAddress.name.split(' ')[1],
      postalCode: shopperDetails.billingAddress.postalCode,
      stateCode: shopperDetails.billingAddress.stateOrRegion,
    },
    customer: {},
    profile: {
      firstName: shopperDetails.buyer.name,
      lastName: shopperDetails.buyer.name,
      email: shopperDetails.buyer.email,
      phone: shopperDetails.buyer.phoneNumber,
    },
  };
}

function saveExpressShopperDetails(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const shopperDetails = formatCustomerObject(
      JSON.parse(req.form.shopperDetails),
    );
    Transaction.wrap(() => {
      currentBasket.custom.amazonExpressShopperDetails = JSON.stringify(
        shopperDetails,
      );
    });
    res.json({ success: true });
    return next();
  } catch (e) {
    AdyenLogs.error_log('Could not save amazon express shopper details');
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveExpressShopperDetails;
