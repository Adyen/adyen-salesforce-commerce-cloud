export const savePaymentDetails = jest.fn();
export const getAdyenEnvironment = jest.fn(() => 'TEST');
export const getAdyenHash = jest.fn((str) => str);
export const getLoadingContext = jest.fn(() => 'mocked_loading_context');
export const getCreditCardInstallments = jest.fn(() => true);
export const getCurrencyValueForApi = jest.fn(() => 1000);
export const getAdyenSecuredFieldsEnabled = jest.fn(() => true);
