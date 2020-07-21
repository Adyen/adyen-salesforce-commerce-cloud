const paymentInstrument = {
  custom: {
    adyenPaymentData: "mocked_adyen_payment_data",
  },
};
export const getOrder = jest.fn((/* orderNo */) => ({
  getPaymentInstruments: jest.fn(() => [paymentInstrument]),
  setPaymentStatus: jest.fn(),
  setExportStatus: jest.fn(),
}));

export const failOrder = jest.fn((/* orderNo, bool */) => null);
