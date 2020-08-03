export const placeOrder = jest.fn((order) => order);
export const sendConfirmationEmail = jest.fn();
export const createOrder = jest.fn(() => ({
  orderNo: 'mocked_orderNo',
  orderToken: 'mocked_orderToken',
}));
export const calculatePaymentTransaction = jest.fn(() => ({ error: false }));
