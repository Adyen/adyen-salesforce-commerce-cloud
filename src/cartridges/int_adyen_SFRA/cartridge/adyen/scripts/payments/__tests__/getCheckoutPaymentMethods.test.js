/* eslint-disable global-require */
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
         adyenConnectedTerminals: {
            "foo": "bar",
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
