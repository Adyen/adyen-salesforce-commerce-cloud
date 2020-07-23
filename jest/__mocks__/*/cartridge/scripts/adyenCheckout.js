export const doPaymentDetailsCall = jest.fn(({ paymentData }) => ({
  resultCode: paymentData,
}));

export default {
  doPaymentDetailsCall,
};
