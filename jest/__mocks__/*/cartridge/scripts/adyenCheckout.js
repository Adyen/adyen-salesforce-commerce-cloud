export const doPaymentDetailsCall = jest.fn(({ paymentData }) => ({
  resultCode: paymentData,
}));
export const createPaymentRequest = jest.fn(() => ({
  resultCode: 'Authorised',
}));
