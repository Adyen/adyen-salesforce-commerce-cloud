export const isActive = jest.fn(() => true);
export const getPaymentMethod = jest.fn(() => ({
  isActive,
}));
