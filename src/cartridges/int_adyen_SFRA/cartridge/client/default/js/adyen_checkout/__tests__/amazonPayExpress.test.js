/**
 * @jest-environment jsdom
 */


/*
let amazonPayExpress;
let shopperDetails;
let checkout;
let amazonConfig;
const { async } = require('regenerator-runtime');
const {
    mountAmazonPayComponent,
    saveShopperDetails,
  } = require('../../amazonPayExpressPart2');

  beforeEach(async () => {
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
          amount: jest.fn(),
          countryCode: 'mocked_countrycode',
        },
      }));

    window.basketAmount = '{currency: ${EUR}, value: 12595}';
    amazonPayExpress = await mountAmazonPayComponent();
    console.log('amazonPayExpress', amazonPayExpress);
  });


describe('AmazonPay Express Configuration', () => {
  describe('AmazonPay Express Success', () => {
    it('Mounting the button', async () => {
      document.body.innerHTML = `
        <div id="express-container">AmazonPay</div>
      `;
    var el = document.getElementById('express-container');
    //expect(el.innerText).toEqual('AmazonPay');
    });
  });
});

*/