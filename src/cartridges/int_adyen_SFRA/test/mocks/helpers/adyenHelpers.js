const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const basketMgr = require('../dw/order/BasketMgr');

const server = {
  forms: {
    getForm: function (formName) {
      return {
        formName: formName,
        clear: function () {},
      };
    },
  },
};

const transaction = {
  wrap: function (callBack) {
    return callBack.call();
  },
  begin: function () {},
  commit: function () {},
};

const hookMgr = {
  callHook: function () {},
};

const resource = {
  msg: function (param1) {
    return param1;
  },
};

const status = {
  OK: 0,
  ERROR: 1,
};

const orderMgr = {
  createOrder: function () {
    return { order: 'new order' };
  },
  placeOrder: function () {
    return status.OK;
  },
  failOrder: function () {
    return { order: 'failed order' };
  },
};

const order = {
  CONFIRMATION_STATUS_NOTCONFIRMED: 'CONFIRMATION_STATUS_NOTCONFIRMED',
  CONFIRMATION_STATUS_CONFIRMED: 'CONFIRMATION_STATUS_CONFIRMED',
  EXPORT_STATUS_READY: 'order export status is ready',
};

const paymentInstrument = {
  METHOD_GIFT_CERTIFICATE: new String('METHOD_GIFT_CERTIFICATE'),
  METHOD_CREDIT_CARD: new String('CREDIT_CARD'),
};

function proxyModel() {
  return proxyquire('../../../cartridge/scripts/checkout/adyenHelpers', {
    server: server,
    'dw/order/BasketMgr': basketMgr,
    'dw/util/HashMap': {},
    'dw/system/HookMgr': hookMgr,
    'dw/net/Mail': {},
    'dw/order/OrderMgr': orderMgr,
    'dw/order/PaymentInstrument': paymentInstrument,
    'dw/order/PaymentMgr': {
      getApplicablePaymentMethods: function () {
        return [
          {
            ID: 'GIFT_CERTIFICATE',
            name: 'Gift Certificate',
          },
          {
            ID: 'CREDIT_CARD',
            name: 'Credit Card',
          },
        ];
      },
      getPaymentMethod: function () {
        return {
          getApplicablePaymentCards: function () {
            return [
              {
                cardType: 'Visa',
                name: 'Visa',
                UUID: 'some UUID',
              },
              {
                cardType: 'Amex',
                name: 'American Express',
                UUID: 'some UUID',
              },
              {
                cardType: 'Master Card',
                name: 'MasterCard',
              },
              {
                cardType: 'Discover',
                name: 'Discover',
              },
            ];
          },
        };
      },
      getApplicablePaymentCards: function () {
        return ['Visa'];
      },
      getPaymentCard: function () {
        return 'Visa';
      },
    },
    'dw/order/Order': order,
    'dw/system/Status': status,
    'dw/web/Resource': resource,
    'dw/system/Site': {},
    'dw/util/Template': {},
    'dw/system/Transaction': transaction,
  });
}

module.exports = proxyModel();
