const assert = require('chai').assert;

const adyenHelpers = require('../../../mocks/helpers/adyenHelpers');

describe('adyenHelpers', function () {
  describe('validatePayment', function () {
    it('should return an invalid payment', function () {
      const req = {
        geolocation: {
          countryCode: 'NL',
        },
        currentCustomer: {
          raw: {},
        },
      };
      const basketMgr = require('../../../mocks/dw/order/BasketMgr');
      const currentBasket = basketMgr.getCurrentBasket();
      const result = adyenHelpers.validatePayment(req, currentBasket);
      assert.isTrue(result.error);
    });
  });
});
