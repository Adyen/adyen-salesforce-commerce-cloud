const helpers = require('./helpers');
const { onBrand, onFieldValid } = require('../commons');
const { renderPaymentMethod } = require('./renderPaymentMethod');
const store = require('../../../../store');

function getCardConfig() {
  return {
    enableStoreDetails: window.showStoreDetails,
    onChange(state) {
      store.isValid = state.isValid;
      const method = state.data.paymentMethod.storedPaymentMethodId
        ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
        : store.selectedMethod;
      store.updateSelectedPayment(method, 'isValid', store.isValid);
      store.updateSelectedPayment(method, 'stateData', state.data);
    },
    onFieldValid,
    onBrand,
  };
}

function getPaypalConfig() {
  store.paypalTerminatedEarly = false;
  return {
    showPayButton: true,
    environment: window.Configuration.environment,
    onSubmit: (state, component) => {
      helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        store.selectedPayment.stateData,
      );

      helpers.paymentFromComponent(state.data, component);
    },
    onCancel: (data, component) => {
      store.paypalTerminatedEarly = false;
      helpers.paymentFromComponent(
        {
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
          orderToken: document.querySelector('#orderToken').value,
        },
        component,
      );
    },
    onError: (error, component) => {
      store.paypalTerminatedEarly = false;
      if (component) {
        component.setStatus('ready');
      }
      document.querySelector('#showConfirmationForm').submit();
    },
    onAdditionalDetails: (state) => {
      store.paypalTerminatedEarly = false;
      document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
        state.data,
      );
      document.querySelector('#showConfirmationForm').submit();
    },
    onClick: (data, actions) => {
      if (store.paypalTerminatedEarly) {
        helpers.paymentFromComponent({
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
        });
        store.paypalTerminatedEarly = false;
        return actions.resolve();
      }
      store.paypalTerminatedEarly = true;
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        return actions.reject();
      }
      return null;
    },
  };
}

function getGooglePayConfig() {
  return {
    environment: window.Configuration.environment,
    onSubmit: () => {
      helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
    },
    configuration: {
      gatewayMerchantId: window.merchantAccount,
    },
    showPayButton: true,
    buttonColor: 'white',
  };
}

function getGiftCardConfig() {
  let giftcardBalance;
  return {
    showPayButton: true,
    onBalanceCheck: (resolve, reject, data) => {
      console.log('inside onBalanceCheck');
      $.ajax({
        type: 'POST',
        url: 'Adyen-CheckBalance',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: (data) => {
          console.log('inside success');
          console.log(JSON.stringify(data));
          console.log(JSON.stringify(data.resultCode));
          giftcardBalance = data.balance;
          if(data.resultCode && data.resultCode === "Success") {
            resolve(data);

          } else if(data.resultCode && data.resultCode === "NotEnoughBalance"){
            resolve(data);
          }
          else {
          console.log('about to reject');
          console.log('data is ' + JSON.stringify(data));
            reject();
          }
        },
        fail: (e) => {
        console.log('onBalanceCheck inside fail ' + e.toString());
          reject();
        }
      });
    },
    onOrderRequest: (resolve, reject, data) => {
      // Make a POST /orders request
      // Create an order for the total transaction amount
      console.log('inside onOrderRequest');
      console.log('data is ' + JSON.stringify(data));
      const giftCardData = data.paymentMethod;
      $.ajax({
        type: 'POST',
        url: 'Adyen-SplitPayments',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        async: false,
        success: (data) => {
          console.log('inside success');
          console.log(JSON.stringify(data));
          console.log(JSON.stringify(data.resultCode));
          if(data.resultCode === "Success") {
            // make payments call including giftcard data and order data
            const partialPaymentRequest = {
              paymentMethod: giftCardData,
              // amount: data.remainingAmount,
              amount: giftcardBalance,
              splitPaymentsOrder: {pspReference: data.pspReference, orderData: data.orderData},
            }
            console.log('partialPaymentRequest ' + JSON.stringify(partialPaymentRequest));
            helpers.makePartialPayment(partialPaymentRequest);

//            giftCardNode.unmount(`component_giftcard`);
//            store.componentsObj["giftcard"].node.unmount(`component_giftcard`)
//            delete store.componentsObj["giftcard"];
            $('#giftcard-modal').modal('hide');
            document.querySelector("#giftCardLabel").style.display = "none";
//            document.querySelector("#component_giftcard").remove();
//            renderPaymentMethod({type: "giftcard"}, false, store.checkoutConfiguration.session.imagePath, null, true);
//            document.querySelector("#component_giftcard").style.display = "block";


            const remainingAmountContainer = document.createElement("div");
            const remainingAmountPar = document.createElement("p");
            const remainingAmountElement = document.createElement("div");
            const remainingAmountText = document.createElement("span");
            remainingAmountContainer.classList.add("col-4.line-item-total-price");
            remainingAmountPar.classList.add("line-item-pricing-info");
            remainingAmountElement.classList.add("price");
            remainingAmountText.classList.add("line-item-total-text.line-item-total-price-label");
            remainingAmountText.innerText = "Remaining Amount"; //todo: use localisation
            remainingAmountElement.innerHTML = store.splitPaymentsOrderObj.remainingAmount;
            remainingAmountContainer.appendChild(remainingAmountPar);
            remainingAmountPar.appendChild(remainingAmountText);
            remainingAmountContainer.appendChild(remainingAmountElement);
            const pricingContainer = document.querySelector(".row.align-items-start");
            pricingContainer.appendChild(remainingAmountContainer);

//                const totalPriceContainer = document.querySelector(".col-4.line-item-total-price");
//                let toWrap = totalPriceContainer.querySelector("div");
//                let wrapper = document.createElement('del');
//                toWrap.parentNode.appendChild(wrapper);
//                wrapper.appendChild(toWrap);
          }
        },
        fail: (e) => {
          console.log('inside fail');
          console.error(e.toString())
        }
      });
    },
    onOrderCancel: function(Order) {
      // Make a POST /orders/cancel request
    },
    onSubmit: function() {
//        store.componentsObj["giftcard"].node.unmount(`component_giftcard`)
//        delete store.componentsObj["giftcard"];
        $('#giftcard-modal').modal('hide');
        store.selectedMethod = "giftcard";
//        store.brand =
        document.querySelector('input[name="brandCode"]').checked = false;
        document.querySelector('button[value="submit-payment"]').click();
    },
  };
}

function handleOnChange(state) {
  let { type } = state.data.paymentMethod;
  if (store.selectedMethod === 'googlepay' && type === 'paywithgoogle') {
    type = 'googlepay';
  }
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

const actionHandler = async (action) => {
  const checkout = await AdyenCheckout(store.checkoutConfiguration);
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({ backdrop: 'static', keyboard: false });
};

function handleOnAdditionalDetails(state) {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify({
      data: state.data,
      orderToken: window.orderToken,
    }),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success(data) {
      if (!data.isFinal && typeof data.action === 'object') {
        actionHandler(data.action);
      } else {
        window.location.href = data.redirectUrl;
      }
    },
  });
}

function getAmazonpayConfig() {
  return {
    showPayButton: true,
    productType: 'PayAndShip',
    checkoutMode: 'ProcessOrder',
    locale: window.Configuration.locale,
    returnUrl: window.returnURL,
    onClick: (resolve, reject) => {
      $('#dwfrm_billing').trigger('submit');
      if (store.formErrorsExist) {
        reject();
      } else {
        helpers.assignPaymentMethodValue();
        resolve();
      }
    },
    onError: () => {},
  };
}

function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.onAdditionalDetails = handleOnAdditionalDetails;
  store.checkoutConfiguration.showPayButton = false;
  store.checkoutConfiguration.clientKey = window.adyenClientKey;

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    storedCard: getCardConfig(),
    boletobancario: {
      personalDetailsRequired: true, // turn personalDetails section on/off
      billingAddressRequired: false, // turn billingAddress section on/off
      showEmailAddress: false, // allow shopper to specify their email address
    },
    paywithgoogle: getGooglePayConfig(),
    googlepay: getGooglePayConfig(),
    paypal: getPaypalConfig(),
    amazonpay: getAmazonpayConfig(),
    giftcard: getGiftCardConfig(),
  };
}

module.exports = {
  getCardConfig,
  getPaypalConfig,
  getGooglePayConfig,
  getGiftCardConfig,
  setCheckoutConfiguration,
  actionHandler,
};
