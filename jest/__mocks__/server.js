export const forms = {
  getForm: jest.fn(() => ({
    adyenStateData: { value: 'mocked_value' },
    adyenPaymentFields: {
      terminalId: {value: "mockedTerminalID"}
    }
  })),
};
