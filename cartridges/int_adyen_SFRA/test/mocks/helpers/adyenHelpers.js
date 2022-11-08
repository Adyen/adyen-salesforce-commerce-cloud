"use strict";

var proxyquire = require("proxyquire").noCallThru().noPreserveCache();
var basketMgr = require("../dw/order/BasketMgr");
var server = {
  forms: {
    getForm: function getForm(formName) {
      return {
        formName: formName,
        clear: function clear() {}
      };
    }
  }
};
var transaction = {
  wrap: function wrap(callBack) {
    return callBack.call();
  },
  begin: function begin() {},
  commit: function commit() {}
};
var hookMgr = {
  callHook: function callHook() {}
};
var resource = {
  msg: function msg(param1) {
    return param1;
  }
};
var status = {
  OK: 0,
  ERROR: 1
};
var orderMgr = {
  createOrder: function createOrder() {
    return {
      order: "new order"
    };
  },
  placeOrder: function placeOrder() {
    return status.OK;
  },
  failOrder: function failOrder() {
    return {
      order: "failed order"
    };
  }
};
var order = {
  CONFIRMATION_STATUS_NOTCONFIRMED: "CONFIRMATION_STATUS_NOTCONFIRMED",
  CONFIRMATION_STATUS_CONFIRMED: "CONFIRMATION_STATUS_CONFIRMED",
  EXPORT_STATUS_READY: "order export status is ready"
};
var paymentInstrument = {
  METHOD_GIFT_CERTIFICATE: new String("METHOD_GIFT_CERTIFICATE"),
  METHOD_CREDIT_CARD: new String("CREDIT_CARD")
};
function proxyModel() {
  return proxyquire("../../../cartridge/scripts/checkout/adyenHelpers", {
    server: server,
    "dw/order/BasketMgr": basketMgr,
    "dw/util/HashMap": {},
    "dw/system/HookMgr": hookMgr,
    "dw/net/Mail": {},
    "dw/order/OrderMgr": orderMgr,
    "dw/order/PaymentInstrument": paymentInstrument,
    "dw/order/PaymentMgr": {
      getApplicablePaymentMethods: function getApplicablePaymentMethods() {
        return [{
          ID: "GIFT_CERTIFICATE",
          name: "Gift Certificate"
        }, {
          ID: "CREDIT_CARD",
          name: "Credit Card"
        }];
      },
      getPaymentMethod: function getPaymentMethod() {
        return {
          getApplicablePaymentCards: function getApplicablePaymentCards() {
            return [{
              cardType: "Visa",
              name: "Visa",
              UUID: "some UUID"
            }, {
              cardType: "Amex",
              name: "American Express",
              UUID: "some UUID"
            }, {
              cardType: "Master Card",
              name: "MasterCard"
            }, {
              cardType: "Discover",
              name: "Discover"
            }];
          }
        };
      },
      getApplicablePaymentCards: function getApplicablePaymentCards() {
        return ["Visa"];
      },
      getPaymentCard: function getPaymentCard() {
        return "Visa";
      }
    },
    "dw/order/Order": order,
    "dw/system/Status": status,
    "dw/web/Resource": resource,
    "dw/system/Site": {},
    "dw/util/Template": {},
    "dw/system/Transaction": transaction
  });
}
module.exports = proxyModel();