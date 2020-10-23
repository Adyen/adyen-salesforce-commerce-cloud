const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function get3DS2Response({ threeDS2, resultCode, action }) {
  return { threeDS2, resultCode, action };
}

function getRedirectResponse(result, orderNumber, paymentInstrument) {
  const createHash = (substr) =>
    AdyenHelper.getAdyenHash(
      result.redirectObject.url.substr(result.redirectObject.url.length - 25),
      substr,
    );

  // Signature for 3DS payments
  const getMDSignature = () =>
    createHash(result.redirectObject.data.MD.substr(1, 25));
  // Signature for redirect methods
  const getPaymentDataSignature = () =>
    createHash(result.paymentData.substr(1, 25));

  const hasMD = !!result.redirectObject?.data?.MD;
  // If the response has MD, then it is a 3DS transaction
  const signature = hasMD ? getMDSignature() : getPaymentDataSignature();

  return {
    authorized: true,
    authorized3d: hasMD,
    orderNo: orderNumber,
    paymentInstrument,
    redirectObject: result.redirectObject,
    signature,
  };
}

function paymentResponseHandler(paymentInstrument, result, orderNumber) {
  paymentInstrument.custom.adyenPaymentData = result.paymentData;
  Transaction.commit();

  return result.threeDS2
    ? get3DS2Response(result)
    : getRedirectResponse(result, orderNumber, paymentInstrument);
}

module.exports = paymentResponseHandler;
