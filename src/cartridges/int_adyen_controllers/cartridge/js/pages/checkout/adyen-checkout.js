require("./bundle");
require("./adyen-giving");

let maskedCardNumber;
const MASKED_CC_PREFIX = "************";
let selectedMethod;
const componentsObj = {};
let checkoutConfiguration;
let paymentMethodsResponse;
let checkout;
let formErrorsExist;
/**
 * @function
 * @description Initializes Adyen Secured Fields  Billing events
 */
function initializeBillingEvents() {
  $("#billing-submit").on("click", function () {
    const isAdyenPOS =
      document.querySelector(".payment-method-options :checked").value ===
      "AdyenPOS";
    if (isAdyenPOS) {
      document.querySelector(
        "#dwfrm_adyPaydata_terminalId"
      ).value = document.querySelector("#terminalList").value;
      return true;
    }
    const adyenPaymentMethod = document.querySelector(
      "#adyenPaymentMethodName"
    );
    const paymentMethodLabel = document.querySelector(`#lb_${selectedMethod}`)
      .innerHTML;
    adyenPaymentMethod.value = paymentMethodLabel;

    validateComponents();

    return showValidation();
  });

  if (window.getPaymentMethodsResponse) {
    paymentMethodsResponse = window.getPaymentMethodsResponse;
    checkoutConfiguration = window.Configuration;
    checkoutConfiguration.onChange = function (state /*, component */) {
      const type = state.data.paymentMethod.type;
      componentsObj[type] = state;
    };
    checkoutConfiguration.showPayButton = false;
    checkoutConfiguration.paymentMethodsConfiguration = {
      card: {
        enableStoreDetails: showStoreDetails,
        onBrand: function (brandObject) {
          $("#cardType").val(brandObject.brand);
        },
        onFieldValid: function (data) {
          if (data.endDigits) {
            maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
            $("#cardNumber").val(maskedCardNumber);
          }
        },
        onChange: function (state, component) {
          storeDetails = state.data.storePaymentMethod;
          // Todo: fix onChange issues so we can get rid of componentName
          let componentName = component._node.id.replace("component_", "");
          componentName = componentName.replace("storedPaymentMethods", "");
          if (componentName === selectedMethod) {
            $("#browserInfo").val(JSON.stringify(state.data.browserInfo));
            componentsObj[selectedMethod] = state;
          }
        },
      },
      boletobancario: {
        personalDetailsRequired: true, // turn personalDetails section on/off
        billingAddressRequired: false, // turn billingAddress section on/off
        showEmailAddress: false, // allow shopper to specify their email address
      },
      paypal: {
        intent: "capture",
        merchantId: window.paypalMerchantID,
        onClick: (data, actions) => {
          $("#dwfrm_billing").trigger("submit");
          if (formErrorsExist) {
            return actions.reject();
          }
        },
        onSubmit: (state, component) => {
          assignPaymentMethodValue();
          makePaypalPayment(state.data, component);
          document.querySelector("#adyenStateData").value = JSON.stringify(
            state.data
          );
        },
        onCancel: (data, component) => {
          component.setStatus("ready");
          makePaypalPayment({ cancelPaypal: true }, component);
        },
        onError: (error, component) => {
          component && component.setStatus("ready");
        },
        onAdditionalDetails: (state /*, component */) => {
          document.querySelector("#paypalStateData").value = JSON.stringify(
            state.data
          );
          $("#dwfrm_billing").trigger("submit");
        },
      },
    };
    if (window.installments) {
      try {
        const installments = JSON.parse(window.installments);
        checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
      } catch (e) {
        // TODO: implement proper error handling
      }
    }
    renderGenericComponent();
  }
}

/**
 * @function
 * @description Initializes Adyen Checkout My Account events
 */
function initializeAccountEvents() {
  checkoutConfiguration = window.Configuration;
  checkout = new AdyenCheckout(checkoutConfiguration);
  const newCard = document.getElementById("newCard");
  let adyenStateData;
  let isValid = false;
  const node = checkout
    .create("card", {
      hasHolderName: true,
      holderNameRequired: true,
      onChange: function (state) {
        adyenStateData = state.data;
        isValid = state.isValid;
      },
    })
    .mount(newCard);

  $("#applyBtn").on("click", function () {
    if (!isValid) {
      //TODOBAS showvalidation
      node.showValidation();
      return false;
    }
    document.querySelector("#adyenStateData").value = JSON.stringify(
      adyenStateData
    );
  });
}

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
  adyenPaymentMethod.value = document.querySelector(
    `#lb_${selectedMethod}`
  ).innerHTML;
}

function unmountComponents() {
  const promises = Object.entries(componentsObj).map(function ([key, val]) {
    delete componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}

function resolveUnmount(key, val) {
  try {
    return Promise.resolve(val.unmount(`component_${key}`));
  } catch (e) {
    // try/catch block for val.unmount
    return Promise.resolve(false);
  }
}

function displaySelectedMethod(type) {
  selectedMethod = type;
  resetPaymentMethod();
  if (type !== "paypal") {
    document.querySelector("#billing-submit").disabled = false;
  } else {
    document.querySelector("#billing-submit").disabled = true;
  }
  document
    .querySelector(`#component_${type}`)
    .setAttribute("style", "display:block");
}

function resetPaymentMethod() {
  $(".additionalFields").hide();
}

function showValidation() {
  if (componentsObj[selectedMethod] && !componentsObj[selectedMethod].isValid) {
    componentsObj[selectedMethod].showValidation();
    return false;
  } else if (selectedMethod === "ach") {
    let inputs = document.querySelectorAll("#component_ach > input");
    inputs = Object.values(inputs).filter(function (input) {
      return !(input.value && input.value.length > 0);
    });
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].classList.add("adyen-checkout__input--error");
    }
    if (inputs.length) {
      return false;
    }
  } else if (selectedMethod === "ratepay") {
    const input = document.querySelector("#dateOfBirthInput");
    if (!(input.value && input.value.length > 0)) {
      input.classList.add("adyen-checkout__input--error");
      return false;
    }
  }
  return true;
}

function validateComponents() {
  if (document.querySelector("#component_ach")) {
    const inputs = document.querySelectorAll("#component_ach > input");
    for (const input of inputs) {
      input.onchange = function () {
        validateCustomInputField(this);
      };
    }
  }
  if (document.querySelector("#dateOfBirthInput")) {
    document.querySelector("#dateOfBirthInput").onchange = function () {
      validateCustomInputField(this);
    };
  }

  let stateData;
  if (componentsObj[selectedMethod] && componentsObj[selectedMethod].data) {
    stateData = componentsObj[selectedMethod].data;
  } else {
    stateData = { paymentMethod: { type: selectedMethod } };
  }

  if (selectedMethod === "ach") {
    const bankAccount = {
      ownerName: document.querySelector("#bankAccountOwnerNameValue").value,
      bankAccountNumber: document.querySelector("#bankAccountNumberValue")
        .value,
      bankLocationId: document.querySelector("#bankLocationIdValue").value,
    };
    stateData.paymentMethod = {
      ...stateData.paymentMethod,
      bankAccount: bankAccount,
    };
  } else if (selectedMethod === "ratepay") {
    if (
      document.querySelector("#genderInput").value &&
      document.querySelector("#dateOfBirthInput").value
    ) {
      stateData.paymentMethod.gender = document.querySelector(
        "#genderInput"
      ).value;
      stateData.paymentMethod.dateOfBirth = document.querySelector(
        "#dateOfBirthInput"
      ).value;
    }
  }
  document.querySelector("#adyenStateData").value = JSON.stringify(stateData);
}

function validateCustomInputField(input) {
  if (input.value === "") {
    input.classList.add("adyen-checkout__input--error");
  } else if (input.value.length > 0) {
    input.classList.remove("adyen-checkout__input--error");
  }
}

function getFallback(paymentMethod) {
  const ach = `<div id="component_ach">
                    <span class="adyen-checkout__label">Bank Account Owner Name</span>
                    <input type="text" id="bankAccountOwnerNameValue" class="adyen-checkout__input">
                    <span class="adyen-checkout__label">Bank Account Number</span>
                    <input type="text" id="bankAccountNumberValue" class="adyen-checkout__input" maxlength="17" >
                    <span class="adyen-checkout__label">Routing Number</span>
                    <input type="text" id="bankLocationIdValue" class="adyen-checkout__input" maxlength="9" >
                 </div>`;

  const ratepay = `<span class="adyen-checkout__label">Gender</span>
                    <select id="genderInput" class="adyen-checkout__input">
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                    </select>
                    <span class="adyen-checkout__label">Date of birth</span>
                    <input id="dateOfBirthInput" class="adyen-checkout__input" type="date"/>`;

  const fallback = { ach: ach, ratepay: ratepay };
  return fallback[paymentMethod];
}

function isMethodTypeBlocked(methodType) {
  const blockedMethods = [
    "bcmc_mobile_QR",
    "applepay",
    "cup",
    "wechatpay",
    "wechatpay_pos",
    "wechatpaySdk",
    "wechatpayQr",
  ];
  return blockedMethods.includes(methodType);
}

async function renderGenericComponent() {
  if (Object.keys(componentsObj).length) {
    await unmountComponents();
  }
  let paymentMethod;
  let i;
  checkoutConfiguration.paymentMethodsResponse =
    paymentMethodsResponse.adyenPaymentMethods;
  checkout = new AdyenCheckout(checkoutConfiguration);
  const paymentMethods = paymentMethodsResponse.adyenPaymentMethods;
  if (paymentMethodsResponse.amount) {
    checkoutConfiguration.amount = paymentMethodsResponse.amount;
  }
  if (paymentMethodsResponse.countryCode) {
    checkoutConfiguration.countryCode = paymentMethodsResponse.countryCode;
  }
  document.querySelector("#paymentMethodsList").innerHTML = "";

  if (paymentMethods.storedPaymentMethods) {
    for (
      i = 0;
      i < checkout.paymentMethodsResponse.storedPaymentMethods.length;
      i++
    ) {
      paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
      if (paymentMethod.supportedShopperInteractions.includes("Ecommerce")) {
        renderPaymentMethod(
          paymentMethod,
          true,
          paymentMethodsResponse.ImagePath
        );
      }
    }
  }

  paymentMethods.paymentMethods.forEach((pm) => {
    !isMethodTypeBlocked(pm.type) &&
      renderPaymentMethod(pm, false, paymentMethodsResponse.ImagePath);
  });

  const firstPaymentMethod = document.querySelector(
    "input[type=radio][name=brandCode]"
  );
  firstPaymentMethod.checked = true;
  displaySelectedMethod(firstPaymentMethod.value);
}

function renderPaymentMethod(paymentMethod, storedPaymentMethodBool, path) {
  const paymentMethodsUI = document.querySelector("#paymentMethodsList");
  const li = document.createElement("li");
  const paymentMethodID = storedPaymentMethodBool
    ? `storedCard${paymentMethod.id}`
    : paymentMethod.type;
  const isSchemeNotStored =
    paymentMethod.type === "scheme" && !storedPaymentMethodBool;
  const paymentMethodImage = storedPaymentMethodBool
    ? `${path}${paymentMethod.brand}.png`
    : `${path}${paymentMethod.type}.png`;
  const cardImage = `${path}card.png`;
  const imagePath = isSchemeNotStored ? cardImage : paymentMethodImage;
  const label = storedPaymentMethodBool
    ? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}`
    : `${paymentMethod.name}`;
  const liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}" style="float: none; width: 100%; display: inline; text-align: inherit">${label}</label>
                             `;
  const container = document.createElement("div");

  li.innerHTML = liContents;
  li.classList.add("paymentMethod");

  renderCheckoutComponent(
    storedPaymentMethodBool,
    checkout,
    paymentMethod,
    container,
    paymentMethodID
  );

  container.classList.add("additionalFields");
  container.setAttribute("id", `component_${paymentMethodID}`);
  container.setAttribute("style", "display:none");

  li.append(container);

  paymentMethodsUI.append(li);
  const input = document.querySelector(`#rb_${paymentMethodID}`);

  input.onchange = (event) => {
    displaySelectedMethod(event.target.value);
  };
}

function renderCheckoutComponent(
  storedPaymentMethodBool,
  checkout,
  paymentMethod,
  container,
  paymentMethodID
) {
  if (storedPaymentMethodBool) {
    createCheckoutComponent(
      checkout,
      paymentMethod,
      container,
      paymentMethodID
    );
    return;
  }
  const fallback = getFallback(paymentMethod.type);
  if (fallback) {
    const template = document.createElement("template");
    template.innerHTML = fallback;
    container.append(template.content);
    return;
  }
  createCheckoutComponent(checkout, paymentMethod, container, paymentMethodID);
}

function createCheckoutComponent(
  checkout,
  paymentMethod,
  container,
  paymentMethodID
) {
  setTimeout(function () {
    try {
      const node = checkout
        .create(paymentMethod.type, paymentMethod)
        .mount(container);
      componentsObj[paymentMethodID] = node;
    } catch (e) {
      // TODO: implement proper error handling
    }
  }, 0);
}

function makePaypalPayment(data, component) {
  $.ajax({
    url: "Adyen-PaymentFromComponent",
    type: "post",
    data: JSON.stringify(data),
    contentType: "application/; charset=utf-8",
    success: function (data) {
      if (data.result && data.result.fullResponse) {
        component.handleAction(data.result.fullResponse.action);
      }
    },
  }).fail(function (/* xhr, textStatus */) {
    // TODO: implement proper error handling
  });
}

$("#dwfrm_billing").submit(function (e) {
  if (
    selectedMethod === "paypal" &&
    !document.querySelector("#paypalStateData").value
  ) {
    e.preventDefault();
    const form = $(this);
    const url = form.attr("action");

    $.ajax({
      type: "POST",
      url: url,
      data: form.serialize(),
      async: false,
      success: function (data) {
        formErrorsExist = "fieldErrors" in data;
      },
    });
  }
});

/**
 * @function
 * @description Initializes Adyen CSE billing events
 */

exports.initBilling = function () {
  initializeBillingEvents();
};

exports.initAccount = function () {
  initializeAccountEvents();
};

exports.renderGenericComponent = function () {
  renderGenericComponent();
};
