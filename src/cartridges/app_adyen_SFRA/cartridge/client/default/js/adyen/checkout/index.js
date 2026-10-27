const store = require('../../../../../config/store');
const {
  setCheckoutConfiguration,
  updateCheckoutAmount,
  actionHandler,
} = require('./checkoutConfiguration');
const { renderCheckout } = require('./renderPaymentMethod');
const { showValidation, paymentFromComponent } = require('./helpers');
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
let lastRenderSignature = null;
let queuedRequest = null;

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

function getRenderSignature(response, email) {
  const { paymentMethods = [], storedPaymentMethods = [] } =
    response?.AdyenPaymentMethods || {};
  return JSON.stringify({
    paymentMethods: paymentMethods
      .map((pm) => `${pm.type}:${pm.brand || ''}`)
      .sort(),
    storedPaymentMethods: storedPaymentMethods.map((pm) => pm.id).sort(),
    countryCode: response?.countryCode,
    email: email || '',
  });
}

async function renderPaymentMethods({ email, amount }) {
  const { showFastlane, shopperEmail } = paymentMethodsResponse;
  const { fastlane } = store;

  if (fastlane.component && showFastlane && shopperEmail) {
    await renderFastlane(shopperEmail);
  }

  await setCheckoutConfiguration({
    email,
    paymentMethodsResponse,
    amount,
  });
  await renderCheckout(paymentMethodsResponse);
  await renderGiftCardsIfEnabled();
  if (window.activeTerminalApiStores) {
    addStores(window.activeTerminalApiStores);
  }
  $('body').trigger('checkout:selectFirstPaymentMethod');
  lastRenderSignature = getRenderSignature(paymentMethodsResponse, email);
}

function hasRenderedComponents() {
  return (
    !!store.checkout &&
    !!lastRenderSignature &&
    Object.keys(store.componentsObj || {}).length > 0
  );
}

function resolveEmail({ email, refetch }) {
  if (refetch && email === undefined) {
    return paymentMethodsResponse?.shopperEmail;
  }
  return email;
}

function canUpdateInPlace(forceRender, email) {
  return (
    !forceRender &&
    hasRenderedComponents() &&
    getRenderSignature(paymentMethodsResponse, email) === lastRenderSignature
  );
}

async function processRequest(request) {
  if (request.refetch) {
    paymentMethodsResponse = await getPaymentMethods();
  }
  const email = resolveEmail(request);
  // Rebuilding the checkout creates a new Card, which starts a new Click to
  // Pay session and sends the shopper another OTP.
  if (canUpdateInPlace(request.forceRender, email)) {
    await updateCheckoutAmount(paymentMethodsResponse.amount, email);
    return;
  }
  await renderPaymentMethods({ email, amount: request.amount });
}

function mergeRequests(queued, incoming) {
  // A queued full render keeps its email and amount when a refresh arrives.
  const base = queued.forceRender && !incoming.forceRender ? queued : incoming;
  return {
    ...base,
    refetch: queued.refetch || incoming.refetch,
    forceRender: queued.forceRender || incoming.forceRender,
  };
}

async function schedule(request) {
  if (window.arePaymentMethodsRendering) {
    queuedRequest = queuedRequest
      ? mergeRequests(queuedRequest, request)
      : request;
    return;
  }
  window.arePaymentMethodsRendering = true;
  try {
    await processRequest(request);
  } catch (error) {
    // A failed refresh must not block the requests queued behind it.
  } finally {
    window.arePaymentMethodsRendering = false;
  }
  if (queuedRequest) {
    const next = queuedRequest;
    queuedRequest = null;
    await schedule(next);
  }
}

function refreshPaymentMethods(email) {
  return schedule({ email, refetch: true, forceRender: false });
}

async function registerRenderPaymentMethodListener() {
  $('body').on('checkout:renderPaymentMethod', (e, response) =>
    schedule({
      email: response?.email,
      amount: response?.amount,
      refetch: false,
      forceRender: true,
    }),
  );
}

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector('#adyenPaymentMethodName');
  // if currently selected paymentMethod contains a brand it will be part of the label ID
  const paymentMethodlabelId = `#lb_${store.selectedMethod}`;
  if (adyenPaymentMethod) {
    adyenPaymentMethod.value = store.brand
      ? store.brand
      : document.querySelector(paymentMethodlabelId)?.innerHTML;
  }
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

  $(document).ajaxComplete(async (event, xhr, settings) => {
    const isSelectShippingMethod =
      settings.url &&
      settings.url.includes('CheckoutShippingServices-SelectShippingMethod');
    if (isSelectShippingMethod && xhr.status === 200) {
      await refreshPaymentMethods();
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
      refreshPaymentMethods(data?.order?.orderEmail);
    }
    billing.methods.updatePaymentInformation(data.order, data.options);
  });
}

function registerEmailChangeHandler() {
  const emailSFRA5 = document.getElementsByName(
    'dwfrm_billing_contactInfoFields_email',
  );
  if (emailSFRA5.length) {
    emailSFRA5[0].addEventListener('change', (e) => {
      const emailPattern = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
      if (emailPattern.test(e.target.value)) {
        $('body').trigger('checkout:renderPaymentMethod', {
          email: e.target.value?.trim(),
        });
      }
    });
  }
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
    paymentMethodsResponse = await getPaymentMethods();
    const { showFastlane } = paymentMethodsResponse;
    if (showFastlane) {
      await initFastlane();
      const guestEmailInput = document.querySelector('#email-guest');
      if (guestEmailInput) {
        await mountFastlaneWatermark(guestEmailInput);
      }
    }
    $('body').trigger('checkout:renderPaymentMethod', {
      email: paymentMethodsResponse.shopperEmail,
    });
    helpers.createShowConfirmationForm(
      window.ShowConfirmationPaymentFromComponent,
    );
  });
}

module.exports = {
  submitPayment,
  handlePaymentAction,
  registerUpdateCheckoutView,
  registerEmailChangeHandler,
  registerRenderPaymentMethodListener,
  registerFirstPaymentMethod,
  refreshPaymentMethods,
  getRenderSignature,
  init,
};
