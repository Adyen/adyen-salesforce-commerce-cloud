const Status = require('dw/system/Status');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');

function getBillingAddressDetails(billingAddress) {
  let billingStreet = '';
  let billingHouseNumberOrName = '';
  const billingCountry = billingAddress.countryCode
    ? billingAddress.countryCode.value.toUpperCase()
    : 'ZZ';

  if (billingAddress.address1) {
    billingStreet = billingAddress.address1;
    if (billingAddress.address2) {
      billingHouseNumberOrName = billingAddress.address2;
    }
  } else {
    billingStreet = 'N/A';
  }

  return {
    billingStreet,
    billingHouseNumberOrName,
    billingCountry,
  };
}

function buildPaymentLinkRequest(
  order,
  pt,
  billingAddress,
  billingCountry,
  billingStreet,
  billingHouseNumberOrName,
) {
  const paymentLinkRequest = {
    reference: order.orderNo,
    amount: {
      value: AdyenHelper.getCurrencyValueForApi(pt?.amount).getValueOrNull(),
      currency: pt.amount.currencyCode,
    },
    countryCode: billingCountry,
    merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
    shopperInteraction: 'Ecommerce',
    shopperReference: order.getCustomerNo(),
    shopperEmail: order.getCustomerEmail(),
    shopperLocale:
      order.customerLocaleID === 'default' ? 'en-US' : order.customerLocaleID,
  };

  paymentLinkRequest.billingAddress = {
    city: billingAddress.city ? billingAddress.city : 'N/A',
    country: billingCountry,
    houseNumberOrName: billingHouseNumberOrName,
    postalCode: billingAddress.postalCode ? billingAddress.postalCode : 'N/A',
    stateOrProvince: billingAddress.stateCode
      ? billingAddress.stateCode
      : 'N/A',
    street: billingStreet,
  };

  return paymentLinkRequest;
}

function createAdyenPaymentLink(paymentLinkRequest) {
  try {
    return AdyenHelper.executeCall(
      constants.SERVICE.PAYMENT_LINKS,
      paymentLinkRequest,
    );
  } catch (e) {
    AdyenLogs.error_log(
      `Failed to create Adyen payment link for order ${
        paymentLinkRequest.reference
      }`,
      e,
    );
    return null;
  }
}

function addPaymentLinkNote(order, paymentLinkUrl) {
  order.addNote('Adyen Payment Link', paymentLinkUrl);
}

function authorizeAdyenPayment(order, pt) {
  try {
    const billingAddress = order.getBillingAddress();

    const { billingStreet, billingHouseNumberOrName, billingCountry } =
      getBillingAddressDetails(billingAddress);
    const paymentLinkRequest = buildPaymentLinkRequest(
      order,
      pt,
      billingAddress,
      billingCountry,
      billingStreet,
      billingHouseNumberOrName,
    );
    const response = createAdyenPaymentLink(paymentLinkRequest);

    if (response && response.url) {
      addPaymentLinkNote(order, response.url);
    }
  } catch (e) {
    AdyenLogs.error_log(
      `Error during Adyen Payment Link authorization for order ${
        order.orderNo
      }`,
      e,
    );
  }
}

function authorizeCSC(order, opi) {
  try {
    if (request.clientId === 'dw.csc') {
      const pt = opi.getPaymentTransaction();
      if (pt?.getPaymentProcessor().getID() === 'Adyen_Component') {
        authorizeAdyenPayment(order, pt);
        // Intercept the flow with throwing an error.
        // If not intercepted order will be placed and should be kept in CREATED state.
        return new Status(
          Status.ERROR,
          null,
          `Pending payment for order ${order.orderNo}.`,
        );
      }
    }
  } catch (e) {
    AdyenLogs.error_log(
      `Failed to authorize Adyen CSC payment for order ${order.orderNo}`,
      e,
    );
  }
  return new Status(Status.OK);
}

exports.authorize = authorizeCSC;
