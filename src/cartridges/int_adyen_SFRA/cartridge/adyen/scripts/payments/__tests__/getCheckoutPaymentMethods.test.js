/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
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
  Resource.msg.mockImplementation(() => '');
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
      adyenPaymentMethodTitles: expect.anything(),
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

  it('uses the remaining amount cached on the basket', () => {
    global.dw.value = {
      Money: jest.fn().mockImplementation((value, currency) => ({
        value,
        currency,
      })),
    };
    currentBasket = {
      getDefaultShipment: jest.fn(() => ({ shippingAddress: null })),
      getTotalGrossPrice: jest.fn(() => ({
        currencyCode: 'EUR',
        value: '25000',
        isAvailable: jest.fn(() => true),
      })),
      custom: {
        partialPaymentOrderData: JSON.stringify({
          order: { orderData: 'Ab02b4c0!BQABAgB' },
          remainingAmount: { currency: 'EUR', value: 20000 },
          amount: { currency: 'EUR', value: 25000 },
        }),
      },
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);

    getCheckoutPaymentMethods(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: { currency: 'EUR', value: 20000 },
      }),
    );
  });

  it('falls back to the basket total when no gift card was applied', () => {
    currentBasket = {
      getDefaultShipment: jest.fn(() => ({ shippingAddress: null })),
      getTotalGrossPrice: jest.fn(() => ({
        currencyCode: 'EUR',
        value: '25000',
        isAvailable: jest.fn(() => true),
      })),
      custom: { partialPaymentOrderData: null },
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);

    getCheckoutPaymentMethods(req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: { currency: 'EUR', value: 1000 },
      }),
    );
  });

   it('does not return AdyenPaymentMethods', () => {
      BasketMgr.getCurrentBasket.mockReturnValueOnce({
        getDefaultShipment: jest.fn(() => ({ shippingAddress: null })),
        getTotalGrossPrice: jest.fn(() => ({
          currencyCode: 'EUR',
          isAvailable: jest.fn(() => true),
        })),
      });
      getPaymentMethods.getMethods.mockImplementationOnce(() => {throw new Error('mock error')});
      getCheckoutPaymentMethods(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
         error: true,
       });
      expect(AdyenLogs.fatal_log).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
   });

  describe('BNPL disclaimer', () => {
    const bundle = {
      'disclaimer.message.bnpl': 'Borrowing money costs money. See %{link}',
      'disclaimer.linkText.bnpl': 'more information',
      'disclaimer.link.bnpl': 'https://www.example.com/bnpl-terms',
    };
    const mockBundle = (values) => {
      Resource.msg.mockImplementation((key) => values[key] || '');
    };
    const basketShippingTo = (country) => ({
      getDefaultShipment: jest.fn(() => ({
        shippingAddress: {
          getCountryCode: jest.fn(() => ({ value: country })),
        },
      })),
      getTotalGrossPrice: jest.fn(() => ({
        currencyCode: 'EUR',
        value: '1000',
        isAvailable: jest.fn(() => true),
      })),
    });
    const responseBody = () => res.json.mock.calls[0][0];

    it('includes the disclaimer for EU shipping countries when the bundle is populated', () => {
      mockBundle(bundle);
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('DE'));
      getCheckoutPaymentMethods(req, res, next);
      expect(responseBody().disclaimerMessage).toEqual({
        message: 'Borrowing money costs money. See %{link}',
        linkText: 'more information',
        link: 'https://www.example.com/bnpl-terms',
      });
    });

    it('includes the disclaimer for GB', () => {
      mockBundle(bundle);
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('GB'));
      getCheckoutPaymentMethods(req, res, next);
      expect(responseBody().disclaimerMessage).toBeDefined();
    });

    it('omits the disclaimer outside EU/UK', () => {
      mockBundle(bundle);
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('US'));
      getCheckoutPaymentMethods(req, res, next);
      expect(responseBody()).not.toHaveProperty('disclaimerMessage');
    });

    it('omits the disclaimer when the bundle is empty', () => {
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('DE'));
      getCheckoutPaymentMethods(req, res, next);
      expect(responseBody()).not.toHaveProperty('disclaimerMessage');
    });

    it('omits the link when only one of linkText/link is set', () => {
      mockBundle({
        'disclaimer.message.bnpl': 'Borrowing money costs money.',
        'disclaimer.linkText.bnpl': 'more information',
      });
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('FR'));
      getCheckoutPaymentMethods(req, res, next);
      expect(responseBody().disclaimerMessage).toEqual({
        message: 'Borrowing money costs money.',
      });
    });
  });
});
