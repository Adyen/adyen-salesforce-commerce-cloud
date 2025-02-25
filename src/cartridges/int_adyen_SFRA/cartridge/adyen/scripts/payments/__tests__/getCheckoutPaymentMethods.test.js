/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const getCheckoutPaymentMethods = require('*/cartridge/adyen/scripts/payments/getCheckoutPaymentMethods');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');
let req;
let res;
let next;
let Logger;
beforeEach(() => {
   req = {
      locale: {
         id: 'en_US',
      },
      body: JSON.stringify({isExpressPdp: false})
   };
   res = {
      json: jest.fn(),
   };
   next = jest.fn();
   Logger = require('dw/system/Logger');
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
                        value: "NL"
                     }
                  })
               }}
         }),
         getTotalGrossPrice: jest.fn(() => {
            return {
               currencyCode: 'EUR',
               value: '1000',
               isAvailable: jest.fn(() => true)
            }
         })
      };
      BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
      getCheckoutPaymentMethods(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
         AdyenPaymentMethods:  {
            paymentMethods: [
               {
                  "type": "visa",
               },
            ],
         },
         amount: {
            currency: "EUR",
            value: 1000,
         },
          adyenDescriptions: {
            "ideal": "Dutch payment method example description",
            "paypal": "PayPal example description",
          },
          imagePath: "mocked_loading_contextimages/logos/medium/",
          countryCode: "NL",
		  applicationInfo: {
			externalPlatform: {
				"version" : "SFRA",
			}
		  }
      });
      expect(next).toHaveBeenCalled();
   });

   it('does not return AdyenPaymentMethods', () => {
      getPaymentMethods.getMethods = jest.fn(
         new Logger.error('error'),
      );
      getCheckoutPaymentMethods(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
         error: true,
       });
      expect(Logger.fatal.mock.calls.length).toBe(1);
      expect(next).toHaveBeenCalled();
   });
});
