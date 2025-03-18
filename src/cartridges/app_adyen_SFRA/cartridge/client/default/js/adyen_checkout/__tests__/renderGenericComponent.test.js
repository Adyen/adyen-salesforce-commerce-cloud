/**
 * @jest-environment jsdom
 */
jest.mock('../../commons');
jest.mock('../../../../../store');

const { renderGenericComponent, setInstallments, renderPosTerminals } = require('../renderGenericComponent');
const { applyGiftCards, setGiftCardContainerVisibility, renderGiftCardLogo, isCartModified } = require('../giftcards/index');
const { getPaymentMethods } = require('../../commons');
const { fetchGiftCards } = require('../../commons');
const store = require('../../../../../store');
const giftCardHtml = `
      <div id="paymentMethodsList"></div>
      <input type="radio" name="brandCode" value="card" />
      <button value="submit-payment">Submit</button>
      <div id="component_card"></div>
      <div class="gift-card-selection"></div>
      <div class="gift-card-separator"></div>
      <div id="adyenPosTerminals">
        <span>Child #1</span>
      </div>
      <button id="giftCardAddButton"></button>
      <ul id="giftCardUl"></ul>
      <select id="giftCardSelect"></select>
      <div id="giftCardsInfoMessage"></div>
      <div id="giftCardsCancelContainer"></div>
      <div id="giftCardInformation"></div>
      <div class="card-body order-total-summary"></div>
      <ul id="giftCardsList"></ul>
      <div>
        <input type="text" id="shippingFirstNamedefault" value="test">
        <input type="text" id="shippingLastNamedefault" value="test">
        <input type="text" id="shippingAddressOnedefault" value="test">
        <input type="text" id="shippingAddressCitydefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">
        <input type="text" id="shippingCountrydefault" value="test">
        <input type="text" id="shippingPhoneNumberdefault" value="test">
        <input type="text" id="shippingZipCodedefault" value="test">
      </div>
    `;
const availableGiftCards = {
  giftCards: [
    {
      orderAmount: {
        currency: 'EUR',
        value: 15,
      },
      remainingAmount: {
        currency: 'EUR',
        value: 100,
      },
    },
  ],
}

beforeEach(() => {
  window.AdyenWeb = {
    AdyenCheckout: jest.fn(async () => ({
      create: jest.fn(),
      paymentMethodsResponse: {
        storedPaymentMethods: [{ supportedShopperInteractions: ['Ecommerce'] }],
        paymentMethods: [{ type: 'amazonpay' }],
        adyenDescriptions: {
          amazonpay: 'testDescription'
        }
      },
    }))
  };
  window.installments = '[[0,2,["amex","hipercard"]]]';
  store.checkout = {
    options: {}
  };
  store.checkoutConfiguration = {
    amount: {value : 'mocked_amount', currency : 'mocked_currency'},
    countryCode: 'mocked_countrycode',
  };
  getPaymentMethods.mockReturnValue({
    imagePath: 'example.com',
    adyenDescriptions: {},
  });
});
describe('Render Generic Component', () => {
  it('should render', async () => {
    fetchGiftCards.mockReturnValue([]);
    document.body.innerHTML = giftCardHtml;
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    store.checkoutConfiguration = {
      amount: {
        currency: 'mocked_currency',
        value: 'mocked_amount'
      },
      countryCode: 'mocked_countrycode',
    }
    store.paymentMethodsConfiguration = {
      amazonpay: {}
    };
    await renderGenericComponent({
      amount: {
        currency: "mocked_currency",
        value: "mocked_amount",
      },
      countryCode: "mocked_countrycode",
      imagePath: 'example.com',
      adyenDescriptions: {
        amazonpay: 'testDescription'
      }
    });
    expect(store.checkoutConfiguration).toMatchSnapshot();
    expect(
      document.querySelector('input[type=radio][name=brandCode]').value,
    ).toBeTruthy();
  });

  it('should hide giftcard container', async () => {
    fetchGiftCards.mockReturnValue({ giftCards: [] });
    document.body.innerHTML = giftCardHtml;
    store.componentsObj = { foo: 'bar', bar: 'baz' };
    store.checkoutConfiguration = {
      amount: {
        currency: 'mocked_currency',
        value: 'mocked_amount'
      },
      countryCode: 'mocked_countrycode',
    }
    store.paymentMethodsConfiguration = {
      amazonpay: {}
    }
    await renderGenericComponent({
      amount: {
        currency: "mocked_currency",
        value: "mocked_amount",
      },
      countryCode: "mocked_countrycode",
      imagePath: 'example.com',
      adyenDescriptions: {
        amazonpay: 'testDescription'
      }
    });
    expect(store.checkoutConfiguration).toMatchSnapshot();
  });

  it('should set installment options correctly', () => {
    window.Configuration = { amount: 0, locale : 'pt_BR' };
    store.paymentMethodsConfiguration = {
      scheme: {
        installmentOptions: {},
      },
    };
    const amount = {
      currency: 'BRL',
      value: 150,
    };
    setInstallments(amount);
    expect(store.paymentMethodsConfiguration.scheme.installmentOptions).toEqual({
      amex: {
        values: [1, 2],
      },
      hipercard: {
        values: [1, 2],
      },
    });
    expect(store.paymentMethodsConfiguration.scheme.showInstallmentAmounts).toBe(true);
  });

  it('should not set installment options for US', () => {
    window.Configuration = { amount: 0, locale : 'en_US' };
    store.paymentMethodsConfiguration = {
      scheme: {
        installmentOptions: {},
      },
    };
    const amount = {
      currency: 'USD',
      value: 50,
    };
    setInstallments(amount);
    expect(store.paymentMethodsConfiguration.scheme.installmentOptions).toEqual({});
    expect(store.paymentMethodsConfiguration.scheme.showInstallmentAmounts).toBe(undefined);
  });

  it('should handle email change event',async () => {
    document.body.innerHTML = `
      <input type="text" id="email">
    `;
    store.paymentMethodsConfiguration = {
      scheme: {
        clickToPayConfiguration: {
          shopperEmail: 'initial@example.com',
        },
      },
    };
    const emailInput = document.getElementById('email');
    emailInput.value = 'new@example.com';
    emailInput.dispatchEvent(new Event('change'));
    setTimeout(() => {
      expect(store.paymentMethodsConfiguration.scheme.clickToPayConfiguration.shopperEmail).toBe('new@example.com');
      expect(document.dispatchEvent).toHaveBeenCalledWith(new Event('INIT_CHECKOUT_EVENT'));
      done();
    }); // Timeout needed for completition of the test
  });

  it('correctly sets Pos Terminals', () => {
    document.body.innerHTML = '<div id="adyenPosTerminals"></div>';
    const adyenConnectedTerminals = { uniqueTerminalIds: ['term1'] };
    renderPosTerminals(adyenConnectedTerminals);
    const posTerminals = document.getElementById('adyenPosTerminals');
    expect(posTerminals.childElementCount).toBe(1);
  });

  it('correctly checks if the cart is modified', () => {
    const amount = { currency: 'USD', value: 20 };
    const orderAmount = { currency: 'USD', value: 20 };
    expect(isCartModified(amount, orderAmount)).toBe(false);

    const modifiedAmount = { currency: 'USD', value: 30 };
    expect(isCartModified(modifiedAmount, orderAmount)).toBe(true);
  });

  it('correctly renders gift card logo', () => {
    document.body.innerHTML = '<img id="headingImg" />';
    renderGiftCardLogo('example.com/');
    const headingImg = document.getElementById('headingImg');
    expect(headingImg.src).toBe('http://localhost/example.com/genericgiftcard.png');
  });

  it('should call removeGiftCards with isPartialPaymentExpired', () => {
    const renderGiftCardComponent = require('*/cartridge/client/default/js/adyen_checkout/giftcards');
    const now = new Date().toISOString();
    store.checkoutConfiguration = {
      amount : { currency: 'USD', value: 50 }
    }
    store.partialPaymentsOrderObj = {
      orderAmount : { currency: 'USD', value: 100 }
    }
    store.addedGiftCards = [
      {
        orderAmount: { currency: 'USD', value: 30 },
        remainingAmount: { currency: 'USD', value: 10 },
        expiresAt: now,
      },
      {
        orderAmount: { currency: 'USD', value: 20 },
        remainingAmount: { currency: 'USD', value: 5 },
        expiresAt: new Date(now).toISOString(),
      },
    ];
    document.body.innerHTML = giftCardHtml;
    applyGiftCards();
    setTimeout(() => {
      expect(renderGiftCardComponent.removeGiftCards).toHaveBeenCalled();
      done();
    }); // Timeout needed for completition of the test
  });

  it('should call removeGiftCards with cartModified', () => {
    const renderGiftCardComponent = require('*/cartridge/client/default/js/adyen_checkout/giftcards');
    store.checkoutConfiguration = {
      amount : { currency: 'USD', value: 50 }
    }
    store.partialPaymentsOrderObj = {
      orderAmount : { currency: 'USD', value: 100 }
    }
    store.addedGiftCards = [
      {
        orderAmount: { currency: 'USD', value: 30 },
        remainingAmount: { currency: 'USD', value: 10 },
      },
      {
        orderAmount: { currency: 'USD', value: 20 },
        remainingAmount: { currency: 'USD', value: 5 },
      },
    ];
    document.body.innerHTML = giftCardHtml;
    applyGiftCards();
    setTimeout(() => {
      expect(renderGiftCardComponent.removeGiftCards).toHaveBeenCalled();
      expect(renderGiftCardComponent.showGiftCardWarningMessage).toHaveBeenCalled();
      done();
    }); // Timeout needed for completition of the test
  });

  it('should handle the else part correctly', () => {
    const renderGiftCardComponent = require('*/cartridge/client/default/js/adyen_checkout/giftcards');
    store.checkoutConfiguration = {
      amount: { currency: 'USD', value: 50 },
      paymentMethodsResponse: {
        imagePath: 'test_image_path',
      },
    };
    store.partialPaymentsOrderObj = {
      orderAmount : { currency: 'USD', value: 50 },
    }
    store.addedGiftCards = [
      {
        giftCard : {brand : 'givex'},
        orderAmount: { currency: 'USD', value: 30 },
        remainingAmount: { currency: 'USD', value: 10 },
      },
      {
        giftCard : {brand : 'givex'},
        orderAmount: { currency: 'USD', value: 20 },
        remainingAmount: { currency: 'USD', value: 5 },
      },
    ];
    document.body.innerHTML = giftCardHtml;
    applyGiftCards();
    setTimeout(() => {
      expect(renderGiftCardComponent.removeGiftCards).not.toHaveBeenCalled();
      expect(renderGiftCardComponent.showGiftCardWarningMessage).not.toHaveBeenCalled();
      done();
    }); // Timeout needed for completition of the test
  });
});
