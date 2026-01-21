function modifyGETResponse(paymentMethodsResult) {
  if (request.clientId === 'dw.csc') {
    paymentMethodsResult.applicablePaymentMethods =
      paymentMethodsResult.applicablePaymentMethods
        .toArray()
        .filter((paymentMethod) => paymentMethod.id === 'AdyenComponent');
  }
}

exports.modifyGETResponse = modifyGETResponse;
