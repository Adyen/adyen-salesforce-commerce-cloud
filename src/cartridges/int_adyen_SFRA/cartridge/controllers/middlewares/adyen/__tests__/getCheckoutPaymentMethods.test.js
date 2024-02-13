/* eslint-disable global-require */
const getCheckoutPaymentMethods = require('*/cartridge/controllers/middlewares/adyen/getCheckoutPaymentMethods');
const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
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
      });
      expect(next).toHaveBeenCalled();
   });

   it('does not return AdyenPaymentMethods', () => {
      var Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
      getPaymentMethods.getMethods = jest.fn(
         new Logger.error('error'),
      );
      getCheckoutPaymentMethods(req, res, next);
      expect(res.json).not.toHaveBeenCalled();
      expect(Logger.fatal.mock.calls.length).toBe(1);
   });
});
