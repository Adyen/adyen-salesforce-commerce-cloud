const store = require('../../../../../config/store');
const {
  setCheckoutConfiguration,
  actionHandler,
} = require('./checkoutConfiguration');
const { renderCheckout } = require('./renderPaymentMethod');
const {
  assignPaymentMethodValue,
  showValidation,
  paymentFromComponent,
} = require('./helpers');
const billing = require('../../checkout/billing');
const { httpClient } = require('../commons/httpClient');
const { getPaymentMethods } = require('../commons');
const { GIFTCARD } = require('../../../../../config/constants');
const { renderGiftCards } = require('./giftcards');
const { addStores } = require('./pos');
const helpers = require('./helpers');
const {
  mountFastlaneWatermark,
  fastlaneAuthenticate,
  initFastlane,
  getFastlaneShopperDetails,
} = require('./fastlane');

let paymentMethodsResponse = null;
let isFastlaneRendering = false;

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

$(document).ready(() => {
  checkForError();
});

async function renderFastlane(shopperEmail) {
  if (isFastlaneRendering) {
    return;
  }
  isFastlaneRendering = true;
  try {
    await fastlaneAuthenticate(shopperEmail);
  } catch (error) {
    // Error is currently swallowed. Consider logging for easier debugging.
  } finally {
    isFastlaneRendering = false;
  }
}

async function renderGiftCardsIfEnabled() {
  const areGiftCardsEnabled =
    paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods?.some(
      (pm) => pm.type === GIFTCARD,
    );
  if (areGiftCardsEnabled) {
    document.querySelector('#adyenGiftCards').style.display = 'block';
    await renderGiftCards(paymentMethodsResponse);
  }
}

async function registerRenderPaymentMethodListener() {
  $('body').on('checkout:renderPaymentMethod', async (e, response) => {
    const { email } = response;
    const { showFastlane, fastlaneShopperEmail } = paymentMethodsResponse;
    const { fastlane } = store;

    if (fastlane.component && showFastlane && fastlaneShopperEmail) {
      await renderFastlane(fastlaneShopperEmail);
    }

    await setCheckoutConfiguration({
      email,
      paymentMethodsResponse,
    });
    await renderCheckout(paymentMethodsResponse);
    await renderGiftCardsIfEnabled();
    if (window.activeTerminalApiStores) {
      addStores(window.activeTerminalApiStores);
    }
    $('body').trigger('checkout:selectFirstPaymentMethod');
    window.arePaymentMethodsRendering = false;
  });
}

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

function handleSfraRedirect(data) {
  if (window.sfra6Compatibility) {
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
  } else {
    let { continueUrl } = data;
    const urlParams = {
      ID: data.orderID,
      token: data.orderToken,
    };

    continueUrl +=
      (continueUrl.indexOf('?') !== -1 ? '&' : '?') +
      Object.keys(urlParams)
        .map((key) => `${key}=${encodeURIComponent(urlParams[key])}`)
        .join('&');

    window.location.href = continueUrl;
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
        $('body').trigger('checkout:enableButton', '.next-step-button button');
        $('.error-message').show();
        $('.error-message-text').text(data.errorMessage);
      }
    } else if (data.adyenAction) {
      window.orderToken = data.orderToken;
      actionHandler(data.adyenAction);
    } else {
      handleSfraRedirect(data);
    }
  } catch (err) {
    $('body').trigger('checkout:enableButton', '.next-step-button button');
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
      return showValidation();
    }
    return true;
  });
}

function handleSubmitCustomerResponse(response) {
  if (response.redirectUrl || response.fastlaneReturnUrl) {
    window.location.href = response.redirectUrl || response.fastlaneReturnUrl;
  } else {
    $('body').trigger('checkout:updateCheckoutView', {
      order: response.order,
      customer: response.customer,
      csrfToken: response.csrfToken,
    });
  }
}

async function submitCustomer(url, shopperEmail) {
  const { authenticationState, profileData } = store.fastlane.authResult;
  const shopperDetails = getFastlaneShopperDetails(
    shopperEmail,
    authenticationState,
    profileData,
  );

  const requestData = {
    dwfrm_coCustomer_email: shopperEmail,
  };

  if (shopperDetails) {
    requestData.fastlaneShopperDetails = JSON.stringify(shopperDetails);
  }

  const response = await httpClient({
    url,
    data: requestData,
    method: 'POST',
  });

  handleSubmitCustomerResponse(response);
}

async function handleFastlaneFlow(url) {
  const guestButton = document.querySelector('#guest-customer button');
  guestButton.disabled = true;
  try {
    const shopperEmail = document.querySelector('#email-guest').value;
    await fastlaneAuthenticate(shopperEmail);
    await submitCustomer(url, shopperEmail);
  } catch (err) {
    if (err.responseJSON?.redirectUrl) {
      window.location.href = err.responseJSON.redirectUrl;
    }
  } finally {
    guestButton.disabled = false;
  }
}

function handlePaymentAction() {
  let shouldResend = true;
  $(document).ajaxSend(async (event, xhr, settings) => {
    const isCustomerEmailUrl =
      settings.url === $('#guest-customer').attr('action');
    if (isCustomerEmailUrl && store.fastlane.component) {
      xhr.abort();
      await handleFastlaneFlow(settings.url);
    }

    const isPlaceOrderUrl = settings.url === $('.place-order').data('action');
    if (isPlaceOrderUrl && shouldResend) {
      xhr.abort();
      shouldResend = false;
      await overridePlaceOrderRequest(settings.url);
    }
  });
}

function registerUpdateCheckoutView() {
  $('body').on('checkout:updateCheckoutView', async (event, data) => {
    const { shipping } = data.order;
    if (
      shipping.length &&
      shipping[0].shippingAddress?.countryCode.value !==
        paymentMethodsResponse?.countryCode
    ) {
      paymentMethodsResponse = await getPaymentMethods();
    }
    const storedCustomerEmail = sessionStorage.getItem('customerEmail');
    if (storedCustomerEmail !== data?.order?.orderEmail) {
      sessionStorage.setItem('customerEmail', data?.order?.orderEmail);
    }
    $('body').trigger('checkout:renderPaymentMethod', {
      email: data?.order?.orderEmail,
    });
    billing.methods.updatePaymentInformation(data.order, data.options);
  });
}

function registerEmailChangeHandler() {
  $('input[id="email"]').on('change', (e) => {
    const emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    if (emailPattern.test(e.target.value)) {
      const emailValue = e.target.value?.trim();
      const storedCustomerEmail = sessionStorage.getItem('customerEmail');
      if (storedCustomerEmail !== emailValue) {
        sessionStorage.setItem('customerEmail', emailValue);
        $('body').trigger('checkout:renderPaymentMethod', {
          email: emailValue,
        });
      }
    }
  });
}

function registerFirstPaymentMethod() {
  $('body').on('checkout:selectFirstPaymentMethod', () => {
    const firstPaymentMethod = document.querySelector(
      'input[type=radio][name=brandCode]',
    );
    if (firstPaymentMethod) {
      firstPaymentMethod.checked = true;
      helpers.displaySelectedMethod(firstPaymentMethod.value);
    }
  });
}

function init() {
  $(document).ready(async () => {
    try {
      paymentMethodsResponse = await getPaymentMethods();
      const { showFastlane } = paymentMethodsResponse;
      if (showFastlane) {
        await initFastlane();
        const guestEmailInput = document.querySelector('#email-guest');
        if (guestEmailInput) {
          await mountFastlaneWatermark(guestEmailInput);
        }
      }
      const storedCustomerEmail = sessionStorage.getItem('customerEmail');
      $('body').trigger('checkout:renderPaymentMethod', {
        email: storedCustomerEmail,
      });
      helpers.createShowConfirmationForm(
        window.ShowConfirmationPaymentFromComponent,
      );
    } catch (err) {
      document.getElementById('watermark-container')?.remove();
    }
  });
}

module.exports = {
  submitPayment,
  handlePaymentAction,
  registerUpdateCheckoutView,
  registerEmailChangeHandler,
  registerRenderPaymentMethodListener,
  registerFirstPaymentMethod,
  init,
};
