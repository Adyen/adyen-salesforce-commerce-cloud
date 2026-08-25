/* eslint-disable global-require */
let handle;
let paymentInformation;
let currentBasket;

beforeEach(() => {
  handle = require('../handle');
  jest.clearAllMocks();
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  paymentInformation = {
    isCreditCard: true,
    cardType: 'mockedType',
    cardNumber: 'mockedCardNumber',
    adyenPaymentMethod: 'Credit Card',
    adyenIssuerName: null,
    stateData: '{"paymentMethod": {"type":"scheme"}}',
    creditCardToken: 'mockedStoredCardToken',
    expirationMonth: { value: 'mockedMonth' },
    expirationYear: { value: 'mockedYear' },
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Handle', () => {
  it('should create payment instrument', () => {
    handle(currentBasket, paymentInformation);
    expect(currentBasket.createPaymentInstrument).toBeCalledTimes(1);
  });

  it('should set card details to payment instrument when payment method is credit card', () => {
    const { setCreditCardToken } = require('dw/order/BasketMgr');
    handle(currentBasket, paymentInformation);
    expect(setCreditCardToken).toBeCalledTimes(1);
  });
});

describe('Handle card brands', () => {
  const OMS_PAYMENT_METHOD_FIELD = 'adyen_payment__Adyen_Payment_Method';

  let AdyenHelper;

  const createdPaymentInstrument = () =>
    currentBasket.createPaymentInstrument.mock.results[0].value;

  beforeEach(() => {
    AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
    AdyenHelper.getSfccCardType.mockImplementation((brand) =>
      brand === 'visa' ? 'Visa' : '',
    );
    delete paymentInformation.creditCardToken;
  });

  it('sets the mapped card type on the payment instrument', () => {
    const { setCreditCardType } = require('dw/order/BasketMgr');
    paymentInformation.cardType = 'visa';

    handle(currentBasket, paymentInformation);

    const { custom } = createdPaymentInstrument();
    expect(setCreditCardType).toHaveBeenCalledWith('Visa');
    expect(custom.adyenPaymentMethod).toBe('Visa');
    expect(custom[OMS_PAYMENT_METHOD_FIELD]).toBe('Visa');
  });

  it('keeps the raw brand for a co-branded card that has no mapping', () => {
    const { setCreditCardType } = require('dw/order/BasketMgr');
    paymentInformation.cardType = 'maestro_usa';

    handle(currentBasket, paymentInformation);

    const { custom } = createdPaymentInstrument();
    expect(setCreditCardType).not.toHaveBeenCalled();
    expect(custom.adyenPaymentMethod).toBe('maestro_usa');
    expect(custom[OMS_PAYMENT_METHOD_FIELD]).toBe('maestro_usa');
  });

  it('falls back to the brand in the state data when the component sent none', () => {
    paymentInformation.cardType = null;
    paymentInformation.stateData =
      '{"paymentMethod": {"type":"scheme","brand":"pulse"}}';

    handle(currentBasket, paymentInformation);

    const { custom } = createdPaymentInstrument();
    expect(AdyenHelper.getSfccCardType).toHaveBeenCalledWith('pulse');
    expect(custom.adyenPaymentMethod).toBe('pulse');
    expect(custom[OMS_PAYMENT_METHOD_FIELD]).toBe('pulse');
  });

  it('falls back to the Click to Pay scheme', () => {
    paymentInformation.cardType = null;
    paymentInformation.stateData =
      '{"paymentMethod": {"type":"scheme","srcScheme":"visa"}}';

    handle(currentBasket, paymentInformation);

    const { custom } = createdPaymentInstrument();
    expect(custom.adyenPaymentMethod).toBe('Visa');
    expect(custom[OMS_PAYMENT_METHOD_FIELD]).toBe('Visa');
  });

  it('keeps the payment method from the form when no brand was detected', () => {
    paymentInformation.cardType = null;

    handle(currentBasket, paymentInformation);

    const { custom } = createdPaymentInstrument();
    expect(AdyenHelper.getSfccCardType).not.toHaveBeenCalled();
    expect(custom.adyenPaymentMethod).toBe('Credit Card');
    expect(custom[OMS_PAYMENT_METHOD_FIELD]).toBe('Credit Card');
  });
});
