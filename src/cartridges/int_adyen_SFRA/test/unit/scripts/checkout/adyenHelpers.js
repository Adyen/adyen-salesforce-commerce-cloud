const { assert } = require("chai");

const adyenHelpers = require("../../../mocks/helpers/adyenHelpers");

describe("adyenHelpers", () => {
  describe("validatePayment", () => {
    it("should return an invalid payment", () => {
      const req = {
        geolocation: {
          countryCode: "NL",
        },
        currentCustomer: {
          raw: {},
        },
      };
      const basketMgr = require("../../../mocks/dw/order/BasketMgr");
      const currentBasket = basketMgr.getCurrentBasket();
      const result = adyenHelpers.validatePayment(req, currentBasket);
      assert.isTrue(result.error);
    });
  });
});
