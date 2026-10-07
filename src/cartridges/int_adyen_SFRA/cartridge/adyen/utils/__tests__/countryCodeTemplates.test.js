const fs = require('fs');
const path = require('path');

const templatesDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'app_adyen_SFRA',
  'cartridge',
  'templates',
  'default',
);

/*
 * Slicing the last two characters off a locale ID turns the 'default' locale
 * into 'lt', which components such as Apple Pay reject as a country code.
 */
const TEMPLATES_WITH_COUNTRY_CODE = [
  'adyen/adyenExpressMetadata.isml',
  'cart/checkoutButtons.isml',
  'checkout/billing/adyenComponentForm.isml',
  'checkout/billing/adyenGivingComponent.isml',
  'account/payment/paymentForm.isml',
];

describe.each(TEMPLATES_WITH_COUNTRY_CODE)('%s', (template) => {
  const contents = fs.readFileSync(
    path.join(templatesDir, ...template.split('/')),
    'utf8',
  );

  it('resolves the locale and country through localeHelper', () => {
    expect(contents).toContain('localeHelper.getShopperLocale(request.locale)');
    expect(contents).toContain('localeHelper.getCountryCode(request.locale)');
  });

  it('never derives the country from the last characters of the locale', () => {
    expect(contents).not.toContain('slice(-2)');
  });
});
