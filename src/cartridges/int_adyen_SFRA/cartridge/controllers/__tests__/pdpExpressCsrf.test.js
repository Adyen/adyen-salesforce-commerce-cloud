const fs = require('fs');
const path = require('path');

const mockRoutes = [];

jest.mock(
  'server',
  () => {
    const record = (method) => (name, ...middlewares) => {
      mockRoutes.push({ method, name, middlewares });
    };
    return {
      get: record('get'),
      post: record('post'),
      middleware: {
        https: jest.fn(),
        include: jest.fn(),
      },
      exports: () => ({}),
    };
  },
  { virtual: true },
);

jest.mock(
  '*/cartridge/scripts/middleware/csrf',
  () => ({
    generateToken: jest.fn(),
    validateRequest: jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/controllers/middlewares/index',
  () => ({ adyen: new Proxy({}, { get: () => jest.fn() }) }),
  { virtual: true },
);

jest.mock(
  '*/cartridge/adyen/scripts/donations/adyenGiving',
  () => ({ donation: jest.fn() }),
  { virtual: true },
);

const server = require('server');
const csrf = require('*/cartridge/scripts/middleware/csrf');

require('../Adyen');

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

function getRoute(name) {
  return mockRoutes.find((route) => route.name === name);
}

/*
 * Product-Show and Product-ShowInCategory are cached, so session specific data
 * such as the CSRF token must never be rendered into those pages.
 */
describe('PDP express payments CSRF token', () => {
  describe('Adyen-PdpExpress', () => {
    const route = getRoute('PdpExpress');

    it('is an include-only GET route that generates a token', () => {
      expect(route).toBeDefined();
      expect(route.method).toBe('get');
      expect(route.middlewares).toContain(server.middleware.include);
      expect(route.middlewares).toContain(csrf.generateToken);
    });

    it('applies no further middleware, so the fragment stays uncached', () => {
      const [include, generateToken, handler] = route.middlewares;

      expect(include).toBe(server.middleware.include);
      expect(generateToken).toBe(csrf.generateToken);
      expect(typeof handler).toBe('function');
      expect(route.middlewares).toHaveLength(3);
    });

    it('renders a fragment holding the token and the button container', () => {
      const template = read(path.join(templatesDir, 'adyen', 'pdpExpress.isml'));

      expect(template).toContain('pdict.csrf.token');
      expect(template).toContain('id="express-payment-buttons"');
    });
  });

  describe('Adyen-GetExpressPaymentMethods', () => {
    const route = getRoute('GetExpressPaymentMethods');

    it('validates the token instead of generating one', () => {
      expect(route).toBeDefined();
      expect(route.method).toBe('post');
      expect(route.middlewares).toContain(csrf.validateRequest);
      expect(route.middlewares).not.toContain(csrf.generateToken);
    });
  });

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

  it('has no controller generating a token on a cached Product route', () => {
    const cachedProductRoutes = ["'Show'", "'ShowInCategory'"];
    const offenders = fs
      .readdirSync(controllersDir)
      .filter((entry) => entry.endsWith('.js'))
      .filter((entry) => {
        const source = read(path.join(controllersDir, entry));
        return (
          source.includes('generateToken') &&
          cachedProductRoutes.some((route) => source.includes(route))
        );
      });

    expect(offenders).toEqual([]);
  });
});
