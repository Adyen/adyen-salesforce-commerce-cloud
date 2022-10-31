"use strict";

var _require = require("chai"),
  assert = _require.assert;
var adyenHelpers = require("../../../mocks/helpers/adyenHelpers");
describe("adyenHelpers", function () {
  describe("validatePayment", function () {
    it("should return an invalid payment", function () {
      var req = {
        geolocation: {
          countryCode: "NL"
        },
        currentCustomer: {
          raw: {}
        }
      };
      var basketMgr = require("../../../mocks/dw/order/BasketMgr");
      var currentBasket = basketMgr.getCurrentBasket();
      var result = adyenHelpers.validatePayment(req, currentBasket);
      assert.isTrue(result.error);
    });
  });
});