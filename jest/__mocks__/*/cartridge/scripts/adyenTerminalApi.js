export const getTerminals = jest.fn(() => ({
  response: JSON.stringify({ foo: 'bar' }),
}));

export const createTerminalPayment = jest.fn(() => ({
  response: 'mockedSuccessResponse'
}));
