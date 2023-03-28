"use strict";

/**
 * @jest-environment jsdom
 */
var _require = require('../billing'),
  methods = _require.methods;
describe('Billing', function () {
  it('should append html to payment details', function () {
    document.body.innerHTML = "\n      <div class=\"payment-details\">\n        <span>some_child</span>\n      </div>\n    ";
    var selectedPaymentInstruments = [{
      selectedAdyenPM: 'mocked_pm',
      selectedIssuerName: 'mocked_issuer_name',
      maskedCreditCardNumber: 'mocked_masked_cc',
      expirationMonth: 'mocked_expiration_moth',
      expirationYear: 'mocked_expiration_year'
    }];
    var order = {
      resources: {
        cardEnding: 'mocked_card_ending'
      },
      billing: {
        payment: {
          selectedPaymentInstruments: selectedPaymentInstruments
        }
      }
    };
    methods.updatePaymentInformation(order);
    expect(document.querySelector('.payment-details')).toMatchSnapshot();
  });
});