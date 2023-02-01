const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const Logger = require('dw/system/Logger');
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

function setBillingAndShippingAddress(currentBasket) {
  let { billingAddress } = currentBasket;
  let { shippingAddress } = currentBasket.getDefaultShipment();
  Transaction.wrap(() => {
    if (!shippingAddress) {
      shippingAddress = currentBasket
        .getDefaultShipment()
        .createShippingAddress();
    }
    if (!billingAddress) {
      billingAddress = currentBasket.createBillingAddress();
    }
  });

  const shopperDetails =
    JSON.parse(currentBasket.custom.amazonExpressShopperDetails); // apple pay or amazon pay

  Transaction.wrap(() => {
    billingAddress.setFirstName(shopperDetails.billingAddressDetails.firstName);
    billingAddress.setLastName(shopperDetails.billingAddressDetails.lastName);
    billingAddress.setPhone(shopperDetails.billingAddressDetails.phone);
    billingAddress.setAddress1(shopperDetails.billingAddressDetails.address1);
    billingAddress.setCity(shopperDetails.billingAddressDetails.city);
    billingAddress.setPostalCode(shopperDetails.billingAddressDetails.postalCode);
    billingAddress.setStateCode(shopperDetails.billingAddressDetails.stateCode);
    billingAddress.setCountryCode(
      shopperDetails.billingAddressDetails.countryCode.value,
    );
    if (shopperDetails.billingAddressDetails.address2) {
      billingAddress.setAddress2(shopperDetails.billingAddressDetails.address2);
    }

    currentBasket.setCustomerEmail(shopperDetails.profile.email);

    shippingAddress.setFirstName(shopperDetails.addressBook.preferredAddress.firstName);
    shippingAddress.setLastName(shopperDetails.addressBook.preferredAddress.lastName);
    shippingAddress.setPhone(shopperDetails.addressBook.preferredAddress.phone);
    shippingAddress.setAddress1(
      shopperDetails.addressBook.preferredAddress.address1,
    );
    shippingAddress.setCity(shopperDetails.addressBook.preferredAddress.city);
    shippingAddress.setPostalCode(shopperDetails.addressBook.preferredAddress.postalCode);
    shippingAddress.setStateCode(shopperDetails.addressBook.preferredAddress.stateCode);
    shippingAddress.setCountryCode(
      shopperDetails.addressBook.preferredAddress.countryCode.value,
    );
    if (shopperDetails.addressBook.preferredAddress.address2) {
      shippingAddress.setAddress2(
        shopperDetails.addressBook.preferredAddress.address2,
      );
    }
  });

  Logger.getLogger('Adyen').error('shippingAddress.setAddress1 ' + shippingAddress.getAddress1());
  Logger.getLogger('Adyen').error('billingAddress.setAddress1 ' + billingAddress.getCity());
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
    setBillingAndShippingAddress(currentBasket);
    Logger.getLogger('Adyen').error(' after setBillingAndShippingAddress');

    res.redirect(URLUtils.url('Cart-Show'));
//    res.json({ success: true });
    return next();
  } catch (e) {
    AdyenLogs.error_log('Could not save amazon express shopper details');
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveExpressShopperDetails;
