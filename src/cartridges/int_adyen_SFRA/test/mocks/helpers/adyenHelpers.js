const proxyquire = require("proxyquire").noCallThru().noPreserveCache();
const basketMgr = require("../dw/order/BasketMgr");

const server = {
  forms: {
    getForm(formName) {
      return {
        formName,
        clear() {},
      };
    },
  },
};

const transaction = {
  wrap(callBack) {
    return callBack.call();
  },
  begin() {},
  commit() {},
};

const hookMgr = {
  callHook() {},
};

const resource = {
  msg(param1) {
    return param1;
  },
};

const status = {
  OK: 0,
  ERROR: 1,
};

const orderMgr = {
  createOrder() {
    return { order: "new order" };
  },
  placeOrder() {
    return status.OK;
  },
  failOrder() {
    return { order: "failed order" };
  },
};

const order = {
  CONFIRMATION_STATUS_NOTCONFIRMED: "CONFIRMATION_STATUS_NOTCONFIRMED",
  CONFIRMATION_STATUS_CONFIRMED: "CONFIRMATION_STATUS_CONFIRMED",
  EXPORT_STATUS_READY: "order export status is ready",
};

const paymentInstrument = {
  METHOD_GIFT_CERTIFICATE: new String("METHOD_GIFT_CERTIFICATE"),
  METHOD_CREDIT_CARD: new String("CREDIT_CARD"),
};

function proxyModel() {
  return proxyquire("../../../cartridge/scripts/checkout/adyenHelpers", {
    server,
    "dw/order/BasketMgr": basketMgr,
    "dw/util/HashMap": {},
    "dw/system/HookMgr": hookMgr,
    "dw/net/Mail": {},
    "dw/order/OrderMgr": orderMgr,
    "dw/order/PaymentInstrument": paymentInstrument,
    "dw/order/PaymentMgr": {
      getApplicablePaymentMethods() {
        return [
          {
            ID: "GIFT_CERTIFICATE",
            name: "Gift Certificate",
          },
          {
            ID: "CREDIT_CARD",
            name: "Credit Card",
          },
        ];
      },
      getPaymentMethod() {
        return {
          getApplicablePaymentCards() {
            return [
              {
                cardType: "Visa",
                name: "Visa",
                UUID: "some UUID",
              },
              {
                cardType: "Amex",
                name: "American Express",
                UUID: "some UUID",
              },
              {
                cardType: "Master Card",
                name: "MasterCard",
              },
              {
                cardType: "Discover",
                name: "Discover",
              },
            ];
          },
        };
      },
      getApplicablePaymentCards() {
        return ["Visa"];
      },
      getPaymentCard() {
        return "Visa";
      },
    },
    "dw/order/Order": order,
    "dw/system/Status": status,
    "dw/web/Resource": resource,
    "dw/system/Site": {},
    "dw/util/Template": {},
    "dw/system/Transaction": transaction,
  });
}

module.exports = proxyModel();
