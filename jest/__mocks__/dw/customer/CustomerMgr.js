export const getCustomerByCustomerNumber = jest.fn(() => ({
  getProfile: jest.fn(() => ({
    getWallet: jest.fn(() => ({
      createPaymentInstrument: jest.fn(() => ({
        custom: {},
      })),
    })),
  })),
}));
