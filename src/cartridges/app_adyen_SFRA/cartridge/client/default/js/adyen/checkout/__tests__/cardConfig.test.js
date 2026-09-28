/**
 * @jest-environment jsdom
 */

const CardConfig = require('../paymentMethodsConfiguration/card/cardConfig');

const store = { fastlane: {} };
const amount = { value: 15750, currency: 'BRL' };

function createConfig() {
  return new CardConfig(store, {}, 'shopper@example.com', amount);
}

// Mirrors the checkout page: the ISML template HTML-escapes the double quotes
// of the AdyenCreditCardInstallments site preference value.
const INSTALLMENTS_PREFERENCE =
  '[[0,2,[&quot;mc&quot;,&quot;visa&quot;]],[0,4,[&quot;mc&quot;,&quot;visa&quot;]]]';

beforeEach(() => {
  window.Configuration = { locale: 'pt-BR' };
  window.installments = INSTALLMENTS_PREFERENCE;
});

afterEach(() => {
  delete window.Configuration;
  delete window.installments;
});

describe('setInstallments', () => {
  it('configures installments for a BCP-47 locale id', () => {
    const config = createConfig().getConfig();

    expect(config.installmentOptions).toEqual({
      mc: { values: [1, 2, 4] },
      visa: { values: [1, 2, 4] },
    });
    expect(config.showInstallmentAmounts).toBe(true);
  });

  it('configures installments for a legacy underscore locale id', () => {
    window.Configuration.locale = 'pt_BR';

    const config = createConfig().getConfig();

    expect(config.installmentOptions).toEqual({
      mc: { values: [1, 2, 4] },
      visa: { values: [1, 2, 4] },
    });
  });

  it('skips installments for locales without installments support', () => {
    window.Configuration.locale = 'en-US';

    const config = createConfig().getConfig();

    expect(config.installmentOptions).toBeUndefined();
    expect(config.showInstallmentAmounts).toBeUndefined();
  });

  it('skips installments when the preference is empty', () => {
    window.installments = '';

    const config = createConfig().getConfig();

    expect(config.installmentOptions).toBeUndefined();
    expect(config.showInstallmentAmounts).toBeUndefined();
  });

  it('filters out options whose minimum amount exceeds the order amount', () => {
    window.installments = '[[50000,4,[&quot;visa&quot;]]]';

    const config = createConfig().getConfig();

    expect(config.installmentOptions.visa).toBeUndefined();
  });
});
