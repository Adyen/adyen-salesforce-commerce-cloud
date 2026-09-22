const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '..');
const templatesDir = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'app_adyen_SFRA',
  'cartridge',
  'templates',
  'default',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/*
 * Product-Show and Product-ShowInCategory are cached, so session specific data
 * such as the CSRF token must never be rendered into those pages.
 */
describe('PDP express payments CSRF token', () => {
  const adyenController = read(path.join(controllersDir, 'Adyen.js'));

  it('renders the PDP express section through a remote include', () => {
    const pdpExtension = read(
      path.join(
        templatesDir,
        'product',
        'components',
        'addToCartButtonExtension.isml',
      ),
    );

    expect(pdpExtension).toMatch(
      /<isinclude\s+url="\$\{URLUtils\.https\('Adyen-PdpExpress'\)\}"\s*\/?>/,
    );
    expect(pdpExtension).not.toContain('pdict.csrf');
  });

  it('generates the token in the uncached Adyen-PdpExpress include', () => {
    const routeStart = adyenController.indexOf("'PdpExpress'");
    expect(routeStart).toBeGreaterThan(-1);
    const route = adyenController.substring(
      routeStart,
      adyenController.indexOf('res.render', routeStart),
    );

    expect(route).toContain('server.middleware.include');
    expect(route).toContain('csrf.generateToken');
    expect(route).not.toContain('cache.');

    const pdpExpressTemplate = read(
      path.join(templatesDir, 'adyen', 'pdpExpress.isml'),
    );
    expect(pdpExpressTemplate).toContain('pdict.csrf.token');
    expect(pdpExpressTemplate).toContain('id="express-payment-buttons"');
  });

  it('validates the token on Adyen-GetExpressPaymentMethods', () => {
    const routeStart = adyenController.indexOf("'GetExpressPaymentMethods'");
    const route = adyenController.substring(
      routeStart,
      adyenController.indexOf(');', routeStart),
    );

    expect(route).toContain('csrf.validateRequest');
    expect(route).not.toContain('csrf.generateToken');
  });

  it('does not generate a token on the cached Product routes', () => {
    const productController = path.join(controllersDir, 'Product.js');
    if (!fs.existsSync(productController)) {
      return;
    }

    expect(read(productController)).not.toContain('csrf.generateToken');
  });
});
