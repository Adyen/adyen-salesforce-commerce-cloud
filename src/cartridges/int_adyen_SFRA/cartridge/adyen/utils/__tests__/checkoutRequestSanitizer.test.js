const {
  sanitizeRequest,
  V72_FIELD_LIMITS,
} = require('../checkoutRequestSanitizer');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

const validRequest = () => ({
  merchantAccount: 'mocked_merchant_account',
  reference: '00001202',
  returnUrl:
    'https://example.com/on/demandware.store/Sites-Adyen-Site/en_US/Adyen-ShowConfirmation?merchantReference=00001202',
  shopperEmail: 'shopper@example.com',
  shopperIP: '127.0.0.1',
  shopperName: { firstName: 'Jane', lastName: 'Doe', gender: 'UNKNOWN' },
  telephoneNumber: '+31612345678',
  socialSecurityNumber: '12345678901',
  dateOfBirth: '1990-01-31',
  entityType: 'NaturalPerson',
  captureDelayHours: 24,
  metadata: { orderNo: '00001202' },
  billingAddress: {
    city: 'Amsterdam',
    country: 'NL',
    postalCode: '1011DJ',
    stateOrProvince: 'NH',
    street: 'Simon Carmiggeltstraat',
  },
  deliveryAddress: {
    city: 'Amsterdam',
    country: 'NL',
    postalCode: '1011DJ',
    stateOrProvince: 'NH',
    street: 'Simon Carmiggeltstraat',
  },
  amount: { currency: 'EUR', value: 1000 },
});

describe('sanitizeRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leaves a fully valid payload unchanged', () => {
    const request = validRequest();
    expect(sanitizeRequest(request)).toEqual(request);
    expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    expect(AdyenLogs.error_log).not.toHaveBeenCalled();
  });

  it('never mutates the caller object', () => {
    const request = validRequest();
    request.shopperIP = 'x'.repeat(80);
    const snapshot = JSON.stringify(request);

    sanitizeRequest(request);

    expect(JSON.stringify(request)).toBe(snapshot);
  });

  it('leaves fields the v72 table does not cover byte-identical', () => {
    const request = {
      ...validRequest(),
      paymentMethod: {
        type: 'scheme',
        encryptedCardNumber: 'adyenjs_0_1_25$aBcDeF==',
        holderName: 'A'.repeat(200),
      },
      riskData: { clientData: 'x'.repeat(300) },
      lineItems: [
        { id: 'x'.repeat(50), amountExcludingTax: 1000, taxAmount: 210 },
      ],
      additionalData: {
        'openinvoicedata.merchantData': 'y'.repeat(400),
      },
      enhancedSchemeData: {
        levelTwoThree: {
          customerReferenceNumber: 'cust-1',
          totalTaxAmount: 210,
          itemDetailLines: [
            {
              unitPrice: 500,
              totalAmount: 1000,
              quantity: 2,
              unitOfMeasure: 'EAC',
            },
          ],
        },
      },
    };

    const sanitized = sanitizeRequest(request);

    expect(JSON.stringify(sanitized.paymentMethod)).toBe(
      JSON.stringify(request.paymentMethod),
    );
    expect(JSON.stringify(sanitized.riskData)).toBe(
      JSON.stringify(request.riskData),
    );
    expect(JSON.stringify(sanitized.lineItems)).toBe(
      JSON.stringify(request.lineItems),
    );
    expect(JSON.stringify(sanitized.additionalData)).toBe(
      JSON.stringify(request.additionalData),
    );
    expect(JSON.stringify(sanitized.enhancedSchemeData)).toBe(
      JSON.stringify(request.enhancedSchemeData),
    );
  });

  describe('truncation', () => {
    it('truncates the over-long length-capped fields', () => {
      const request = {
        ...validRequest(),
        shopperIP: 'i'.repeat(80),
        shopperName: { firstName: 'f'.repeat(120), lastName: 'l'.repeat(120) },
        telephoneNumber: 't'.repeat(70),
        socialSecurityNumber: 's'.repeat(60),
        billingAddress: { postalCode: 'p'.repeat(20) },
        deliveryAddress: { postalCode: 'p'.repeat(20) },
      };

      const sanitized = sanitizeRequest(request);

      expect(sanitized.shopperIP).toBe('i'.repeat(V72_FIELD_LIMITS.SHOPPER_IP));
      expect(sanitized.shopperName.firstName).toBe(
        'f'.repeat(V72_FIELD_LIMITS.SHOPPER_NAME),
      );
      expect(sanitized.shopperName.lastName).toBe(
        'l'.repeat(V72_FIELD_LIMITS.SHOPPER_NAME),
      );
      expect(sanitized.telephoneNumber).toBe(
        't'.repeat(V72_FIELD_LIMITS.TELEPHONE_NUMBER),
      );
      expect(sanitized.socialSecurityNumber).toBe(
        's'.repeat(V72_FIELD_LIMITS.SOCIAL_SECURITY_NUMBER),
      );
      expect(sanitized.billingAddress.postalCode).toBe(
        'p'.repeat(V72_FIELD_LIMITS.POSTAL_CODE),
      );
      expect(sanitized.deliveryAddress.postalCode).toBe(
        'p'.repeat(V72_FIELD_LIMITS.POSTAL_CODE),
      );
      expect(AdyenLogs.info_log).toHaveBeenCalledTimes(7);
    });

    it('does not split a surrogate pair when cutting', () => {
      const sanitized = sanitizeRequest({
        telephoneNumber: `${'t'.repeat(63)}\u{1F600}`,
      });

      expect(sanitized.telephoneNumber).toBe('t'.repeat(63));
    });

    it('never logs the value of a PII field', () => {
      sanitizeRequest({ telephoneNumber: '+31612345678901234567890'.repeat(4) });

      const loggedMessages = AdyenLogs.info_log.mock.calls.join(' ');
      expect(loggedMessages).toContain('telephoneNumber');
      expect(loggedMessages).not.toContain('31612345678');
    });

    it('sends an over-long reference unmodified because webhooks match on it', () => {
      const reference = 'r'.repeat(100);

      expect(sanitizeRequest({ reference }).reference).toBe(reference);
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it('truncates metadata keys and values', () => {
      const sanitized = sanitizeRequest({
        metadata: { ['k'.repeat(30)]: 'v'.repeat(100), short: 'value' },
      });

      expect(sanitized.metadata).toEqual({
        ['k'.repeat(V72_FIELD_LIMITS.METADATA_KEY)]: 'v'.repeat(
          V72_FIELD_LIMITS.METADATA_VALUE,
        ),
        short: 'value',
      });
    });

    it('leaves a non-string metadata value untouched', () => {
      const metadata = { count: 5, flag: true, nothing: null };

      expect(sanitizeRequest({ metadata }).metadata).toEqual(metadata);
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('drops a metadata entry whose key collides once truncated', () => {
      const sanitized = sanitizeRequest({
        metadata: {
          [`${'k'.repeat(20)}first`]: 'kept',
          [`${'k'.repeat(20)}second`]: 'dropped',
        },
      });

      expect(sanitized.metadata).toEqual({ ['k'.repeat(20)]: 'kept' });
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it('emits a __proto__ metadata key as a plain entry', () => {
      const sanitized = sanitizeRequest({
        metadata: JSON.parse('{"__proto__":"polluted","orderNo":"00001202"}'),
      });

      expect(JSON.stringify(sanitized.metadata)).toContain(
        '"__proto__":"polluted"',
      );
      expect({}.polluted).toBeUndefined();
    });
  });

  describe('reformatting', () => {
    it('encodes unsafe characters in returnUrl without breaking its structure', () => {
      const sanitized = sanitizeRequest({
        returnUrl: 'https://example.com/confirm?ref=order 1&token=a',
      });

      expect(sanitized.returnUrl).toBe(
        'https://example.com/confirm?ref=order%201&token=a',
      );
    });

    it('does not re-encode an already encoded returnUrl', () => {
      const returnUrl = 'https://example.com/confirm?ref=order%201&token=a%2Bb';

      expect(sanitizeRequest({ returnUrl }).returnUrl).toBe(returnUrl);
      expect(AdyenLogs.info_log).not.toHaveBeenCalled();
    });

    it('logs and leaves an over-long returnUrl unmodified', () => {
      const returnUrl = `https://example.com/confirm?ref=${'r'.repeat(1024)}`;

      expect(sanitizeRequest({ returnUrl }).returnUrl).toBe(returnUrl);
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it('reformats a parseable dateOfBirth to YYYY-MM-DD', () => {
      expect(
        sanitizeRequest({ dateOfBirth: '1990-01-31T00:00:00.000Z' })
          .dateOfBirth,
      ).toBe('1990-01-31');
    });

    it('reformats a dateOfBirth without shifting the day across timezones', () => {
      expect(sanitizeRequest({ dateOfBirth: '1990-1-3' }).dateOfBirth).toBe(
        '1990-01-03',
      );
      expect(
        sanitizeRequest({ dateOfBirth: '1990-01-31T23:30:00.000Z' })
          .dateOfBirth,
      ).toBe('1990-01-31');
    });

    it('uppercases a lowercase delivery state code', () => {
      expect(
        sanitizeRequest({ deliveryAddress: { stateOrProvince: 'ny' } })
          .deliveryAddress.stateOrProvince,
      ).toBe('NY');
    });
  });

  describe('dropping', () => {
    it.each([
      ['no at sign', 'shopperexample.com'],
      ['empty local part', '@example.com'],
      ['empty domain', 'shopper@'],
      ['a space', 'shop per@example.com'],
      ['a leading dot in the domain', 'shopper@.example.com'],
      ['an unquoted quote in the local part', 'sho"pper@example.com'],
      ['over 256 characters', `${'a'.repeat(250)}@example.com`],
    ])('drops a shopperEmail with %s', (_description, shopperEmail) => {
      expect(sanitizeRequest({ shopperEmail }).shopperEmail).toBeUndefined();
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it.each([
      ['a quoted local part containing an at sign', '"a@b"@example.com'],
      ['multiple at signs outside a quoted part', 'a@b@example.com'],
    ])('keeps a shopperEmail with %s', (_description, shopperEmail) => {
      expect(sanitizeRequest({ shopperEmail }).shopperEmail).toBe(shopperEmail);
    });

    it('trims a padded shopperEmail instead of dropping it', () => {
      expect(
        sanitizeRequest({ shopperEmail: '  shopper@example.com ' })
          .shopperEmail,
      ).toBe('shopper@example.com');
      expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    });

    it('drops an unparseable dateOfBirth', () => {
      expect(
        sanitizeRequest({ dateOfBirth: 'not-a-date' }).dateOfBirth,
      ).toBeUndefined();
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it('drops an entityType outside the allowed values', () => {
      expect(
        sanitizeRequest({ entityType: 'Partnership' }).entityType,
      ).toBeUndefined();
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });

    it('drops a delivery stateOrProvince that is not an alpha-2 code', () => {
      expect(
        sanitizeRequest({ deliveryAddress: { stateOrProvince: 'Queensland' } })
          .deliveryAddress.stateOrProvince,
      ).toBeUndefined();
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });
  });

  describe('billing versus delivery stateOrProvince', () => {
    it('drops an over-long code on both rather than truncating it', () => {
      const sanitized = sanitizeRequest({
        billingAddress: { stateOrProvince: 'Queensland' },
        deliveryAddress: { stateOrProvince: 'Queensland' },
      });

      expect(sanitized.billingAddress.stateOrProvince).toBeUndefined();
      expect(sanitized.deliveryAddress.stateOrProvince).toBeUndefined();
    });

    it('keeps a three-character billing code that the delivery rule rejects', () => {
      const sanitized = sanitizeRequest({
        billingAddress: { stateOrProvince: 'SAO' },
        deliveryAddress: { stateOrProvince: 'SAO' },
      });

      expect(sanitized.billingAddress.stateOrProvince).toBe('SAO');
      expect(sanitized.deliveryAddress.stateOrProvince).toBeUndefined();
    });
  });

  describe('clamping', () => {
    it('clamps captureDelayHours to the maximum', () => {
      expect(sanitizeRequest({ captureDelayHours: 1000 }).captureDelayHours).toBe(
        672,
      );
    });

    it('leaves captureDelayHours within the maximum alone', () => {
      expect(sanitizeRequest({ captureDelayHours: 672 }).captureDelayHours).toBe(
        672,
      );
    });
  });

  describe('absent and non-string values', () => {
    it('handles a request without any validated field', () => {
      const request = { merchantAccount: 'mocked_merchant_account' };

      expect(sanitizeRequest(request)).toEqual(request);
    });

    it('leaves null and non-string values untouched', () => {
      const request = {
        reference: null,
        returnUrl: null,
        shopperEmail: null,
        shopperIP: 12345,
        telephoneNumber: 31612345678,
        socialSecurityNumber: null,
        dateOfBirth: null,
        entityType: null,
        captureDelayHours: 'many',
        shopperName: null,
        billingAddress: null,
        deliveryAddress: { stateOrProvince: null },
        metadata: null,
      };

      expect(sanitizeRequest(request)).toEqual(request);
      expect(AdyenLogs.error_log).not.toHaveBeenCalled();
    });

    it('returns the original request when it cannot be copied', () => {
      const request = { reference: '00001202' };
      request.self = request;

      expect(sanitizeRequest(request)).toBe(request);
      expect(AdyenLogs.error_log).toHaveBeenCalled();
    });
  });
});
