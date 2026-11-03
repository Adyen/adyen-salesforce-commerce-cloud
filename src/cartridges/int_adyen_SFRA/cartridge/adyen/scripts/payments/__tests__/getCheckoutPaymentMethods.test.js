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
    const genericBundle = {
      'disclaimer.message.bnpl': 'Generic message. See %{link}',
      'disclaimer.linkText.bnpl': 'generic terms',
      'disclaimer.link.bnpl': 'https://www.example.com/bnpl-terms',
    };
    const mockBundle = (values) => {
      Resource.msg.mockImplementation((key) => values[key] || '');
    };
    const mockPaymentMethods = (types) => {
      getPaymentMethods.getMethods.mockReturnValueOnce({
        paymentMethods: types.map((type) => ({ type })),
        storedPaymentMethods: [],
      });
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
    const run = (country, types) => {
      mockPaymentMethods(types);
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo(country));
      getCheckoutPaymentMethods(req, res, next);
      return res.json.mock.calls[0][0];
    };
    const genericDisclaimer = {
      message: 'Generic message. See %{link}',
      linkText: 'generic terms',
      link: 'https://www.example.com/bnpl-terms',
    };

    it('maps the generic disclaimer to every BNPL method for EU countries', () => {
      mockBundle(genericBundle);
      const body = run('DE', ['klarna_account', 'riverty', 'scheme', 'paypal']);
      expect(body.disclaimerMessages).toEqual({
        klarna_account: genericDisclaimer,
        riverty: genericDisclaimer,
      });
    });

    it('includes disclaimers for GB', () => {
      mockBundle(genericBundle);
      const body = run('GB', ['clearpay']);
      expect(body.disclaimerMessages).toEqual({ clearpay: genericDisclaimer });
    });

    it('prefers the family entry over the generic one', () => {
      mockBundle({
        ...genericBundle,
        'disclaimer.message.klarna': 'Klarna message',
      });
      const body = run('NL', ['klarna', 'klarna_paynow', 'riverty']);
      expect(body.disclaimerMessages).toEqual({
        klarna: { message: 'Klarna message' },
        klarna_paynow: { message: 'Klarna message' },
        riverty: genericDisclaimer,
      });
    });

    it('prefers the exact txVariant entry over family and generic', () => {
      mockBundle({
        ...genericBundle,
        'disclaimer.message.facilypay': 'Facilypay message',
        'disclaimer.message.facilypay_3x': '3x message',
        'disclaimer.linkText.facilypay_3x': '3x terms',
        'disclaimer.link.facilypay_3x': 'https://www.example.com/3x',
      });
      const body = run('FR', ['facilypay_3x', 'facilypay_4x']);
      expect(body.disclaimerMessages).toEqual({
        facilypay_3x: {
          message: '3x message',
          linkText: '3x terms',
          link: 'https://www.example.com/3x',
        },
        facilypay_4x: { message: 'Facilypay message' },
      });
    });

    it('does not borrow the generic link for a more specific message', () => {
      mockBundle({
        ...genericBundle,
        'disclaimer.message.riverty': 'Riverty message',
      });
      const body = run('DE', ['riverty']);
      expect(body.disclaimerMessages).toEqual({
        riverty: { message: 'Riverty message' },
      });
    });

    it('only includes methods that resolve to a disclaimer', () => {
      mockBundle({ 'disclaimer.message.klarna': 'Klarna message' });
      const body = run('DE', ['klarna_account', 'riverty']);
      expect(body.disclaimerMessages).toEqual({
        klarna_account: { message: 'Klarna message' },
      });
    });

    it('matches BNPL families by prefix, including variants without an underscore', () => {
      mockBundle(genericBundle);
      const body = run('NL', ['afterpaytouch', 'afterpay_default', 'moneybookers']);
      expect(body.disclaimerMessages).toEqual({
        afterpaytouch: genericDisclaimer,
        afterpay_default: genericDisclaimer,
      });
    });

    it('skips payment methods without a type instead of failing', () => {
      mockBundle(genericBundle);
      getPaymentMethods.getMethods.mockReturnValueOnce({
        paymentMethods: [{}, { type: 'klarna' }],
        storedPaymentMethods: [],
      });
      BasketMgr.getCurrentBasket.mockReturnValueOnce(basketShippingTo('DE'));
      getCheckoutPaymentMethods(req, res, next);
      const body = res.json.mock.calls[0][0];
      expect(body.error).toBeUndefined();
      expect(body.disclaimerMessages).toEqual({ klarna: genericDisclaimer });
    });

    it('omits disclaimers outside EU/UK', () => {
      mockBundle(genericBundle);
      const body = run('US', ['klarna_account', 'affirm']);
      expect(body).not.toHaveProperty('disclaimerMessages');
    });

    it('omits disclaimers when the bundle is empty', () => {
      const body = run('DE', ['klarna_account', 'riverty']);
      expect(body).not.toHaveProperty('disclaimerMessages');
    });

    it('omits disclaimers when no BNPL method is offered', () => {
      mockBundle(genericBundle);
      const body = run('DE', ['scheme', 'ideal']);
      expect(body).not.toHaveProperty('disclaimerMessages');
    });

    it('omits the link when only one of linkText/link is set', () => {
      mockBundle({
        'disclaimer.message.bnpl': 'Generic message.',
        'disclaimer.linkText.bnpl': 'generic terms',
      });
      const body = run('FR', ['alma']);
      expect(body.disclaimerMessages).toEqual({
        alma: { message: 'Generic message.' },
      });
    });
  });
});
