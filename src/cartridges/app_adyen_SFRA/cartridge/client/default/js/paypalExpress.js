const { getPaymentMethods } = require('./commons');
const helpers = require('./adyen_checkout/helpers');

const PAYPAL = 'paypal';

function handlePaypalResponse(response, component) {
  if (response?.action) {
    component.handleAction(response.action);
  } else {
    component.handleError();
  }
}

function callPaymentFromComponent(data, component) {
  return $.ajax({
    url: window.makeExpressPaymentsCall,
    type: 'post',
    data: {
      data: JSON.stringify(data),
    },
    success(response) {
      handlePaypalResponse(response, component);
    },
  });
}

function saveShopperDetails(details) {
  return $.ajax({
    url: window.saveShopperData,
    type: 'post',
    data: {
      shopperDetails: JSON.stringify(details),
    },
  });
}

function makeExpressPaymentDetailsCall(data) {
  return $.ajax({
    type: 'POST',
    url: window.makeExpressPaymentDetailsCall,
    data: JSON.stringify({ data }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(response) {
      helpers.createShowConfirmationForm(window.showConfirmationAction);
      helpers.setOrderFormData(response);
    },
  });
}

async function mountPaypalComponent() {
  try {
    const data = await getPaymentMethods();
    const paymentMethodsResponse = data?.AdyenPaymentMethods;
    const applicationInfo = data?.applicationInfo;
    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
      analytics: {
        analyticsData: { applicationInfo },
      },
    });

    const paypalConfig = paymentMethodsResponse?.paymentMethods.find(
      (pm) => pm.type === PAYPAL,
    )?.configuration;
    if (!paypalConfig) return;

    const paypalButtonConfig = {
      showPayButton: true,
      configuration: paypalConfig,
      returnUrl: window.returnUrl,
      isExpress: true,
      onSubmit: (state, component) => {
        callPaymentFromComponent(state.data, component);
      },
      onShopperDetails: async (shopperDetails, rawData, actions) => {
        saveShopperDetails(shopperDetails);
        actions.resolve();
      },
      onAdditionalDetails: (state) => {
        makeExpressPaymentDetailsCall(state.data);
        document.querySelector('#additionalDetailsHidden').value =
          JSON.stringify(state.data);
        document.querySelector('#showConfirmationForm').submit();
      },
    };

    const paypalExpressButton = checkout.create(PAYPAL, paypalButtonConfig);
    paypalExpressButton.mount('#paypal-container');
  } catch (e) {
    //
  }
}

mountPaypalComponent();
