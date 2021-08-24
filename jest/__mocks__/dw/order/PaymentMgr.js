export const isActive = jest.fn(() => true);
export const getPaymentMethod = jest.fn(() => ({
  isActive,
  paymentProcessor: {ID: "mockedPaymentProcessor"},
  getApplicablePaymentCards: jest.fn(() => ({
    contains: jest.fn(() => true)
  })),
  getPaymentProcessor: jest.fn(() => ({
    getID: jest.fn(() => 'Adyen_Component')
  }))
}));
export const getApplicablePaymentMethods = jest.fn(() => ({
  contains: jest.fn(() => true)
}));
export const getPaymentCard = jest.fn(() => 'mockedCard');
