const paymentInstrument = () => ({
  custom: {
    adyenPaymentData: "mocked_adyen_payment_data",
  },
});
export const getPaymentInstruments = jest.fn(() => [paymentInstrument()]);
export const getOrder = jest.fn((/* orderNo */) => ({
  getPaymentInstruments,
  setPaymentStatus: jest.fn(),
  setExportStatus: jest.fn(),
  orderNo: "mocked_orderNo",
  orderToken: "mocked_orderToken",
}));

export const failOrder = jest.fn((orderNo, bool) => ({
  orderNo,
  bool,
}));
