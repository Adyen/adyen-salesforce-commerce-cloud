/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const getCheckoutPaymentMethods = require('*/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
let req;
let res;
let next;

beforeEach(() => {
  req = {
    locale: {
      id: 'en_US',
    },
    body: JSON.stringify({ isExpressPdp: false }),
  };
  res = {
    json: jest.fn(),
  };
  next = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getCheckoutPaymentMethods', () => {
  it('returns AdyenPaymentMethods', () => {
    currentBasket = {
      getDefaultShipment: jest.fn(() => {
        return {
          shippingAddress: {
            getCountryCode: jest.fn(() => {
              return {
                value: 'NL',
              };
            }),
          },
        };
      }),
      getTotalGrossPrice: jest.fn(() => {
        return {
          currencyCode: 'EUR',
          value: '1000',
          isAvailable: jest.fn(() => true),
        };
      }),
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
    getCheckoutPaymentMethods(req, res, next);
    expect(res.json).toHaveBeenCalledWith({
      AdyenPaymentMethods: {
        paymentMethods: [
          {
            type: 'visa',
          },
        ],
        storedPaymentMethods: [],
      },
      amount: {
        currency: 'EUR',
        value: 1000,
      },
      adyenDescriptions: {
        ideal: 'Dutch payment method example description',
        paypal: 'PayPal example description',
      },
      showFastlane: false,
      adyenTranslations: expect.anything(),
      imagePath: 'mocked_loading_contextimages/logos/medium/',
      countryCode: 'NL',
      shopperEmail: "mocked_email",
      applicationInfo: {
        externalPlatform: {
          version: 'SFRA',
        },
      },
    });
    expect(next).toHaveBeenCalled();
  });

   it('does not return AdyenPaymentMethods', () => {
      getPaymentMethods.getMethods.mockImplementationOnce(() => {throw new Error('mock error')});
      getCheckoutPaymentMethods(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
         error: true,
       });
      expect(AdyenLogs.fatal_log).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
   });
});
