/**
 * @jest-environment jsdom
 */
let amazonPayExpress;
let shopperDetails;
const {
    mountAmazonPayComponent,
    saveShopperDetails,
  } = require('../../amazonPayExpressPart2');

  beforeEach(() => {
    document.body.innerHTML = `
        <div id="amazon-container"></div>
      `;
    window.Configuration = { environment: 'TEST' };
    window.AdyenCheckout = jest.fn(async () => ({
        create: jest.fn(),
        paymentMethodsResponse: {
          storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
          paymentMethods: [{ type: 'amazonpay' }],
        },
        options: {
          amount: 'mocked_amount',
          countryCode: 'mocked_countrycode',
        },
      }));
    amazonPayExpress = mountAmazonPayComponent();
    console.log('amazonPayExpress', amazonPayExpress);
  });


describe('AmazonPay Express Configuration', () => {
  describe('AmazonPay Express Success', () => {
    it('Mounting the button', () => {
      document.body.innerHTML = `
        <div id="express-container">AmazonPay</div>
      `;
    var el = document.getElementById('express-container');
    //expect(el.innerText).toEqual('AmazonPay');
    });
  });
});