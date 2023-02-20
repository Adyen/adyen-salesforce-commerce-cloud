/**
 * @jest-environment jsdom
 */

/*

const AdyenCheckout = jest.fn();
const mount = jest.fn();

let amazonPayExpress;
const { async } = require('regenerator-runtime');

const {
    mountAmazonPayComponent,
    saveShopperDetails,
  } = require('../../amazonPayExpressPart2');

  beforeEach(() => {
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
    window.Configuration = { amount: 0 };
    window.Configuration = { environment: 'TEST' };
    window.basketAmount = JSON.stringify({currency: `EUR`, value: 12595});
  });


describe('AmazonPay Express Configuration', () => {
  describe('AmazonPay Express Success', () => {
    it('Mounting the button', async () => {
      document.body.innerHTML = `
      <div id="amazon-container"></div>
    `;
      await mountAmazonPayComponent();
      console.log('amazonPayExpress', amazonPayExpress);
    //expect(el.innerText).toEqual('AmazonPay');
    });
  });
});

*/