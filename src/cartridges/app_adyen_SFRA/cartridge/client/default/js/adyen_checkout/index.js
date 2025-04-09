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

let customerEmail = null;
let paymentMethodsResponse = null;

function checkForError() {
  const name = 'paymentError';
  const error = new RegExp(`[?&]${encodeURIComponent(name)}=([^&]*)`).exec(
    window.location.search,
  );
  if (error) {
    $('.error-message').show();
    $('.error-message-text').text(decodeURIComponent(error[1]));
  }
}

async function renderPaymentMethod() {
  paymentMethodsResponse = await getPaymentMethods();
  $('body').on('checkout:renderPaymentMethod', async (e, response) => {
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
    window.arePaymentMethodsRendering = false;
  });
}

$(document).ready(async () => {
  checkForError();
  await renderPaymentMethod();
  $('body').trigger('checkout:renderPaymentMethod', {
    email: customerEmail,
  });
});

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
async function overridePlaceOrderRequest(url) {
  try {
    $('body').trigger('checkout:disableButton', '.next-step-button button');
    const data = await httpClient({
      url,
      method: 'POST',
    });
    if (data.error) {
      if (data.cartError) {
        window.location.href = data.redirectUrl;
      } else {
        $('body').trigger(
          'checkout:enableButton',
          $('.next-step-button button'),
        );
      }
    } else if (data.adyenAction) {
      window.orderToken = data.orderToken;
      actionHandler(data.adyenAction);
    } else {
      const redirect = $('<form>').appendTo(document.body).attr({
        method: 'POST',
        action: data.continueUrl,
      });

      $('<input>').appendTo(redirect).attr({
        name: 'orderID',
        value: data.orderID,
      });

      $('<input>').appendTo(redirect).attr({
        name: 'orderToken',
        value: data.orderToken,
      });

      redirect.submit();
    }
  } catch (err) {
    $('body').trigger('checkout:enableButton', $('.next-step-button button'));
  }
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
  $(document).ajaxSend(async (event, xhr, settings) => {
    const isPlaceOrderUrl = settings.url === $('.place-order').data('action');
    let shouldResend = true;
    if (isPlaceOrderUrl && shouldResend) {
      xhr.abort();
      shouldResend = false;
      await overridePlaceOrderRequest(settings.url);
    }
  });
}

async function init() {
  $('body').on('checkout:updateCheckoutView', (event, data) => {
    customerEmail = data?.order?.orderEmail;
    const currentStage = window.location.search.substring(
      window.location.search.indexOf('=') + 1,
    );
    if (currentStage === 'shipping' || currentStage === 'payment') {
      $('body').trigger('checkout:renderPaymentMethod', {
        email: customerEmail,
      });
    }
    billing.methods.updatePaymentInformation(data.order, data.options);
  });

  $('input[id="email"]').on('change', (e) => {
    const emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    if (emailPattern.test(e.target.value)) {
      customerEmail = e.target.value?.trim();
      $('body').trigger('checkout:renderPaymentMethod', {
        email: customerEmail,
      });
    }
  });
}

module.exports = {
  submitPayment,
  handlePaymentAction,
  init,
};
