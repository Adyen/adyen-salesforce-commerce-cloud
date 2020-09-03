const paymentInstrument = () => [
  {
    custom: {
      adyenPaymentData: 'mocked_adyen_payment_data',
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
export const toArray = jest.fn(() => paymentInstrument);
export const getPaymentInstruments = jest.fn(() => ({
  iterator,
  toArray,
}));
export const getOrder = jest.fn((/* orderNo */) => ({
  getPaymentInstruments,
  setPaymentStatus: jest.fn(),
  setExportStatus: jest.fn(),
  orderNo: 'mocked_orderNo',
  orderToken: 'mocked_orderToken',
  custom: { Adyen_pspReference: 'mocked_pspRef' },
}));

export const failOrder = jest.fn((orderNo, bool) => ({
  orderNo,
  bool,
}));
