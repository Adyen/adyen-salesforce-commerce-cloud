import { toArray } from '../../../../dw/order/OrderMgr';

const paymentInstrument = () => [
  {
    custom: {
      adyenPaymentData: 'mocked_adyen_payment_data',
      adyenMD: 'mocked_adyen_MD',
    },
  },
];

// eslint-disable-next-line no-extend-native
function iterator() {
  return {
    val: paymentInstrument(),
    next() {
      const prev = this.val[0];
      this.val = null;
      return prev;
    },
    hasNext() {
      return !!this.val;
    },
  };
}

export const getPaymentInstruments = jest.fn(() => ({
  iterator,
  toArray,
  0: toArray()[0],
}));

export const placeOrder = jest.fn((order) => order);
export const sendConfirmationEmail = jest.fn();
export const createOrder = jest.fn(() => ({
  orderNo: 'mocked_orderNo',
  orderToken: 'mocked_orderToken',
  getPaymentInstruments,
}));
export const calculatePaymentTransaction = jest.fn(() => ({ error: false }));
export const validateCreditCard = jest.fn(() => ({
  creditCardErrors: 'mockedCreditCardErrors',
}));
export const savePaymentInstrumentToWallet = jest.fn(() => ({
  creditCardHolder: 'mockedCardHolder',
  maskedCreditCardNumber: 'mockedCardNumber',
  creditCardType: 'mockedCardType',
  creditCardExpirationMonth: 'mockedExpirationMonth',
  creditCardExpirationYear: 'mockedExpirationYear',
  UUID: 'mockedUUID',
  creditCardNumber: 'mockedCardNumber',
}));
