/**
 * @jest-environment jsdom
 */
const { methods } = require('../billing');

describe('Billing', () => {
  it('should append html to payment details', () => {
    document.body.innerHTML = `
      <div class="payment-details">
        <span>some_child</span>
      </div>
    `;

    const selectedPaymentInstruments = [
      {
        selectedAdyenPM: 'mocked_pm',
        selectedIssuerName: 'mocked_issuer_name',
        maskedCreditCardNumber: 'mocked_masked_cc',
        expirationMonth: 'mocked_expiration_moth',
        expirationYear: 'mocked_expiration_year',
      },
    ];
    const order = {
      resources: {
        cardEnding: 'mocked_card_ending',
      },
      billing: {
        payment: {
          selectedPaymentInstruments,
        },
      },
    };
    methods.updatePaymentInformation(order);
    expect(document.querySelector('.payment-details')).toMatchSnapshot();
  });
});
