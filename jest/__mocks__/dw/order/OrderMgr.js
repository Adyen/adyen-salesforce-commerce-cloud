const paymentInstrument = () => [
  {
    custom: {
      adyenPaymentData: '{ "paymentMethod": { "type": "mocked_type" } }',
      adyenRedirectURL: 'https://some_mocked_url/signature',
      adyenMD: 'mocked_adyen_MD',
      adyenAction: 'mocked_adyen_action',
    },
    paymentTransaction: {
      custom: {
        Adyen_merchantSig: 'mocked_signature',
        Adyen_authResult: '{ "data": "mock"}',
      },
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
export const toArray = jest.fn(paymentInstrument);
export const getPaymentInstruments = jest.fn(() => ({
  iterator,
  toArray,
  0: toArray()[0],
}));

export const getOrder = jest.fn((statusValue = '4' /* orderNo */) => ({
  getPaymentInstruments,
  setPaymentStatus: jest.fn(),
  setExportStatus: jest.fn(),
  orderNo: 'mocked_orderNo',
  orderToken: 'mocked_orderToken',
  getUUID: jest.fn(),
  custom: { Adyen_pspReference: 'mocked_pspRef' },
  status: { value: statusValue },
}));

export const failOrder = jest.fn((orderNo, bool) => ({
  orderNo,
  bool,
}));

export const createOrderNo = jest.fn(() => 'mocked_orderNo');

export const createOrder = jest.fn(() => ({
  getPaymentInstruments,
  setPaymentStatus: jest.fn(),
  setExportStatus: jest.fn(),
  orderNo: 'mocked_orderNo',
  orderToken: 'mocked_orderToken',
  getUUID: jest.fn(),
  custom: { Adyen_pspReference: 'mocked_pspRef' },
  status: { value: 'Created' },
}));
