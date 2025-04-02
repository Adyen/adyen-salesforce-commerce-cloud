const store = require('../../../../store');
const {
  setCheckoutConfiguration,
  actionHandler,
} = require('./checkoutConfiguration');
const { renderGenericComponent } = require('./renderGenericComponent');
const {
  assignPaymentMethodValue,
  showValidation,
  paymentFromComponent,
} = require('./helpers');
const billing = require('../checkout/billing');
const { httpClient } = require('../commons/httpClient');
const { getPaymentMethods } = require('../commons');
const { GIFTCARD } = require('../constants');
const { renderGiftCards } = require('./giftcards');
const { addStores } = require('./pos');

function setAdyenInputValues() {
  const customMethods = {};

  if (store.selectedMethod in customMethods) {
    customMethods[store.selectedMethod]();
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(
    store.stateData,
  );
  if (store.partialPaymentsOrderObj) {
    document.querySelector('#adyenPartialPaymentsOrder').value = JSON.stringify(
      store.partialPaymentsOrderObj,
    );
  }
}

function renderPaymentMethod() {
  $('body').on('checkout:renderPaymentMethod', async (e, response) => {
    const paymentMethodsResponse = await getPaymentMethods();
    const { email } = response;
    setCheckoutConfiguration({
      email,
      paymentMethodsResponse,
    });
    await renderGenericComponent(paymentMethodsResponse);
    const areGiftCardsEnabled =
      paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods?.some(
        (pm) => pm.type === GIFTCARD,
      );
    if (areGiftCardsEnabled) {
      await renderGiftCards(paymentMethodsResponse);
    }
    if (window.activeTerminalApiStores) {
      addStores(window.activeTerminalApiStores);
    }
  });
}

function submitPayment() {
  $('#dwfrm_billing').submit(async function apiRequest(e) {
    e.preventDefault();

    const form = $(this);
    const formDataObject = form.serializeArray().reduce((obj, item) => {
      obj[item.name] = item.value;
      return obj;
    }, {});
    const url = form.attr('action');

    const data = await httpClient({
      method: 'POST',
      url,
      data: formDataObject,
    });

    store.formErrorsExist = 'fieldErrors' in data;
  });

  // Submit the payment
  $('button[value="submit-payment"]').on('click', () => {
    if (store.paypalTerminatedEarly) {
      paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
      });
      store.paypalTerminatedEarly = false;
    }
    const selectedPaymentOption = $('.payment-options .nav-item .active')
      .parent()
      .attr('data-method-id');
    if (selectedPaymentOption === 'AdyenPOS') {
      document.querySelector('#terminalId').value =
        document.querySelector('#terminalList').value;
    }
    if (
      selectedPaymentOption === 'AdyenComponent' ||
      selectedPaymentOption === 'CREDIT_CARD'
    ) {
      assignPaymentMethodValue();
      setAdyenInputValues();
      showValidation();
    }
    return true;
  });
}

function handlePaymentAction() {
  $(document).on('ajaxSuccess', (event, xhr, settings) => {
    if (settings.url === $('.place-order').data('action')) {
      xhr.done((data) => {
        if (data.adyenAction) {
          window.orderToken = data.orderToken;
          actionHandler(data.adyenAction);
        }
      });
    }
  });
}

async function init() {
  $(document).ready(() => {
    // TODO: render the error message box
    const name = 'paymentError';
    const error = new RegExp(`[?&]${encodeURIComponent(name)}=([^&]*)`).exec(
      window.location.search,
    );
    const paymentStage = /[?&]stage=payment([^&]*)/.exec(
      window.location.search,
    );
    if (error || paymentStage) {
      if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
      }
      $('body').trigger('checkout:renderPaymentMethod', {
        email: null,
      });
    }
  });

  $('body').on('checkout:updateCheckoutView', (event, data) => {
    const currentStage = window.location.search.substring(
      window.location.search.indexOf('=') + 1,
    );
    if (currentStage === 'shipping' || currentStage === 'payment') {
      $('body').trigger('checkout:renderPaymentMethod', {
        email: data?.order?.orderEmail,
      });
    }
    billing.methods.updatePaymentInformation(data.order, data.options);
  });

  $('input[id="email"]').on('change', (e) => {
    const emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    if (emailPattern.test(e.target.value)) {
      $('body').trigger('checkout:renderPaymentMethod', {
        email: e.target.value?.trim(),
      });
    }
  });
}

module.exports = {
  init,
  renderPaymentMethod,
  submitPayment,
  handlePaymentAction,
};
