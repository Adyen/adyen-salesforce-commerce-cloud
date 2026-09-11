/* eslint-disable global-require */
jest.mock('dw/util/Locale', () => ({ getLocale: jest.fn() }), {
  virtual: true,
});

const KNOWN_COUNTRIES = {
  en_US: 'US',
  nl_NL: 'NL',
  fr_FR: 'FR',
};

let localeHelper;
let Locale;
let AdyenConfigs;

beforeEach(() => {
  jest.clearAllMocks();
  localeHelper = require('../localeHelper');
  Locale = require('dw/util/Locale');
  AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
  Locale.getLocale.mockImplementation((localeId) =>
    KNOWN_COUNTRIES[localeId] ? { country: KNOWN_COUNTRIES[localeId] } : null,
  );
  AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('nl_NL');
});

afterEach(() => {
  jest.resetModules();
});

describe('isUsableLocaleId', () => {
  it('accepts a locale ID that resolves to a locale with a country', () => {
    expect(localeHelper.isUsableLocaleId('fr_FR')).toBe(true);
  });
  it('rejects the default locale ID', () => {
    expect(localeHelper.isUsableLocaleId('default')).toBe(false);
  });
  it('rejects a missing locale ID', () => {
    expect(localeHelper.isUsableLocaleId('')).toBe(false);
    expect(localeHelper.isUsableLocaleId(null)).toBe(false);
    expect(localeHelper.isUsableLocaleId(undefined)).toBe(false);
  });
  it('rejects a locale ID that cannot be resolved', () => {
    expect(localeHelper.isUsableLocaleId('mocked_locale')).toBe(false);
  });
  it('rejects a locale without a country', () => {
    Locale.getLocale.mockReturnValue({ country: null });
    expect(localeHelper.isUsableLocaleId('en')).toBe(false);
  });
});

describe('resolveLocaleId', () => {
  it('keeps a usable locale ID', () => {
    expect(localeHelper.resolveLocaleId('fr_FR')).toBe('fr_FR');
  });
  it('falls back to the configured locale for the default locale ID', () => {
    expect(localeHelper.resolveLocaleId('default')).toBe('nl_NL');
  });
  it('falls back to the configured locale for a missing locale ID', () => {
    expect(localeHelper.resolveLocaleId('')).toBe('nl_NL');
  });
  it('falls back to the configured locale for an unresolvable locale ID', () => {
    expect(localeHelper.resolveLocaleId('mocked_locale')).toBe('nl_NL');
  });
  it('falls back to en_US when the configured locale is not usable', () => {
    AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('mocked_locale');
    expect(localeHelper.resolveLocaleId('default')).toBe('en_US');
  });
  it('falls back to en_US when no locale is configured', () => {
    AdyenConfigs.getAdyenDefaultLocale.mockReturnValue(null);
    expect(localeHelper.resolveLocaleId('default')).toBe('en_US');
  });
});

describe('getFallbackLocaleId', () => {
  it('returns the configured locale when it is usable', () => {
    expect(localeHelper.getFallbackLocaleId()).toBe('nl_NL');
  });
  it('returns en_US when the configured locale is not usable', () => {
    AdyenConfigs.getAdyenDefaultLocale.mockReturnValue('default');
    expect(localeHelper.getFallbackLocaleId()).toBe('en_US');
  });
});

describe('getShopperLocale', () => {
  it('normalises the separator of the order locale for the Adyen API', () => {
    expect(localeHelper.getShopperLocale('fr_FR')).toBe('fr-FR');
  });
  it('normalises the separator of the fallback locale', () => {
    expect(localeHelper.getShopperLocale('default')).toBe('nl-NL');
  });
});
