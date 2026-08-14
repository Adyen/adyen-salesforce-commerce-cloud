const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

const PLACEHOLDER_VALUES = ['N/A', 'ZZ'];
const REQUIRED_BILLING_FIELDS = [
  'city',
  'country',
  'houseNumberOrName',
  'postalCode',
  'stateOrProvince',
  'street',
];

function hasValue(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    PLACEHOLDER_VALUES.indexOf(value.trim().toUpperCase()) === -1
  );
}

function isDcapEligible(paymentRequest) {
  return (
    paymentRequest.shopperInteraction ===
      constants.SHOPPER_INTERACTIONS.ECOMMERCE &&
    paymentRequest.paymentMethod?.type === constants.PAYMENTMETHODS.SCHEME &&
    paymentRequest.billingAddress?.country === 'US'
  );
}

function getMissingDcapFields(paymentRequest) {
  if (!isDcapEligible(paymentRequest)) {
    return [];
  }

  const missingFields = [];
  if (!hasValue(paymentRequest.shopperIP)) {
    missingFields.push('shopperIP');
  }
  if (!hasValue(paymentRequest.shopperEmail)) {
    missingFields.push('shopperEmail');
  }
  REQUIRED_BILLING_FIELDS.forEach((fieldName) => {
    if (!hasValue(paymentRequest.billingAddress[fieldName])) {
      missingFields.push(`billingAddress.${fieldName}`);
    }
  });
  if (!hasValue(paymentRequest.deviceFingerprint)) {
    missingFields.push('deviceFingerprint');
  }

  return missingFields;
}

function warnForMissingDcapFields(paymentRequest) {
  const missingFields = getMissingDcapFields(paymentRequest);
  if (missingFields.length) {
    AdyenLogs.warning_log(
      `DCAP data missing for US card payment: ${missingFields.join(', ')}`,
    );
  }
}

module.exports = {
  getMissingDcapFields,
  warnForMissingDcapFields,
};
