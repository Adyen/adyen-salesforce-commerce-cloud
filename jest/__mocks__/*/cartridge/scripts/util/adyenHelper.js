export const savePaymentDetails = jest.fn();
export const getAdyenEnvironment = jest.fn(() => 'TEST');
export const getAdyenHash = jest.fn((str) => str);
export const getLoadingContext = jest.fn(() => 'mocked_loading_context');
export const getCreditCardInstallments = jest.fn(() => true);
export const getCurrencyValueForApi = jest.fn(() => 1000);
export const getPaypalMerchantID = jest.fn(() => 'mocked_payment_merchant_id');
export const getAdyenGivingEnabled = jest.fn(() => true);
export const isAdyenGivingAvailable = jest.fn(() => true);
export const getDonationAmounts = jest.fn(() => [10, 20, 30]);
export const getAdyenGivingCharityName = jest.fn(() => 'mocked_charity_name');
export const getAdyenGivingCharityWebsite = jest.fn(
  () => 'mocked_charity_website',
);
export const getAdyenGivingCharityDescription = jest.fn(
  () => 'mocked_charity_description',
);
export const getAdyenGivingBackgroundUrl = jest.fn(
  () => 'mocked_background_url',
);
export const getAdyenGivingLogoUrl = jest.fn(() => 'mocked_logo_url');
export const getAdyenSecuredFieldsEnabled = jest.fn(() => true);
export const getCardToken = jest.fn(() => 'mocked_token');
