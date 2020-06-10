// eslint-disable-next-line no-unused-vars
let storeDetails;
let maskedCardNumber;
const MASKED_CC_PREFIX = "************";
let selectedMethod;
const componentsObj = {};
const checkoutConfiguration = window.Configuration;
let formErrorsExist;

$("#dwfrm_billing").submit(function (e) {
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
});

checkoutConfiguration.onChange = function (state) {
  const type = state.data.paymentMethod.type;
  componentsObj[type] = state;
};
checkoutConfiguration.showPayButton = false;
checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: showStoreDetails,
    onBrand: function (brandObject) {
      document.querySelector("#cardType").value = brandObject.brand;
    },
    onFieldValid: function (data) {
      if (data.endDigits) {
        maskedCardNumber = MASKED_CC_PREFIX + data.endDigits;
        document.querySelector("#cardNumber").value = maskedCardNumber;
      }
    },
    onChange: function (state, component) {
      storeDetails = state.data.storePaymentMethod;
      // Todo: fix onChange issues so we can get rid of componentName
      let componentName = component._node.id.replace("component_", "");
      componentName = componentName.replace("storedPaymentMethods", "");
      if (componentName === selectedMethod) {
        componentsObj[selectedMethod] = state;
      }
    },
  },
  boletobancario: {
    personalDetailsRequired: true, // turn personalDetails section on/off
    billingAddressRequired: false, // turn billingAddress section on/off
    showEmailAddress: false, // allow shopper to specify their email address

    // Optionally prefill some fields, here all fields are filled:
    data: {
      socialSecurityNumber: "56861752509",
      firstName: document.getElementById("shippingFirstNamedefault").value,
      lastName: document.getElementById("shippingLastNamedefault").value,
    },
  },
  paypal: {
    intent: "capture",
    merchantId: window.paypalMerchantID,
    onSubmit: (state, component) => {
      assignPaymentMethodValue();
      document.querySelector("#adyenStateData").value = JSON.stringify(
        componentsObj[selectedMethod].data
      );
      paymentFromComponent(state.data, component);
    },
    onCancel: (data, component) => {
      component.setStatus("ready");
      paymentFromComponent({ cancelTransaction: true }, component);
    },
    onError: (error, component) => {
      if (component) {
        component.setStatus("ready");
      }
    },
    onAdditionalDetails: (state) => {
      document.querySelector("#additionalDetailsHidden").value = JSON.stringify(
        state.data
      );
      document.querySelector("#showConfirmationForm").submit();
    },
    onClick: (data, actions) => {
      $("#dwfrm_billing").trigger("submit");
      if (formErrorsExist) {
        return actions.reject();
      }
    },
  },
};
if (window.installments) {
  try {
    const installments = JSON.parse(window.installments);
    checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {
    // TODO: Implement proper error handling
  }
}

function displaySelectedMethod(type) {
  selectedMethod = type;
  resetPaymentMethod();
  if (type !== "paypal") {
    document.querySelector('button[value="submit-payment"]').disabled = false;
  } else {
    document.querySelector('button[value="submit-payment"]').disabled = true;
  }
  document
    .querySelector(`#component_${type}`)
    .setAttribute("style", "display:block");
}

function unmountComponents() {
  const promises = [];
  Object.entries(componentsObj).map(function ([key, val]) {
    promises.push(resolveUnmount(key, val));
    delete componentsObj[key];
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

async function renderGenericComponent() {
  if (Object.keys(componentsObj).length !== 0) {
    await unmountComponents();
  }
  getPaymentMethods(function (data) {
    let paymentMethod;
    let i;
    checkoutConfiguration.paymentMethodsResponse = data.AdyenPaymentMethods;
    if (data.amount) {
      checkoutConfiguration.amount = data.amount;
    }
    if (data.countryCode) {
      checkoutConfiguration.countryCode = data.countryCode;
    }
    document.querySelector("#paymentMethodsList").innerHTML = "";

    if (data.AdyenPaymentMethods.storedPaymentMethods) {
      for (
        i = 0;
        i < checkout.paymentMethodsResponse.storedPaymentMethods.length;
        i++
      ) {
        paymentMethod = checkout.paymentMethodsResponse.storedPaymentMethods[i];
        if (paymentMethod.supportedShopperInteractions.includes("Ecommerce")) {
          renderPaymentMethod(paymentMethod, true, data.ImagePath);
        }
      }
    }

    for (i = 0; i < data.AdyenPaymentMethods.paymentMethods.length; i++) {
      paymentMethod = data.AdyenPaymentMethods.paymentMethods[i];
      renderPaymentMethod(
        paymentMethod,
        false,
        data.ImagePath,
        data.AdyenDescriptions[i].description
      );
    }
    const firstPaymentMethod = document.querySelector(
      "input[type=radio][name=brandCode]"
    );
    firstPaymentMethod.checked = true;
    displaySelectedMethod(firstPaymentMethod.value);
  });
}

function renderPaymentMethod(
  paymentMethod,
  storedPaymentMethodBool,
  path,
  description = null
) {
  const checkout = new AdyenCheckout(checkoutConfiguration);
  const paymentMethodsUI = document.querySelector("#paymentMethodsList");

  const li = document.createElement("li");
  const paymentMethodID = storedPaymentMethodBool
    ? `storedCard${paymentMethod.id}`
    : paymentMethod.type;
  const imagePath = storedPaymentMethodBool
    ? `${path}${paymentMethod.brand}.png`
    : `${path}${paymentMethod.type}.png`;
  const label = storedPaymentMethodBool
    ? `${paymentMethod.name} ${MASKED_CC_PREFIX}${paymentMethod.lastFour}`
    : `${paymentMethod.name}`;
  let liContents = `
                              <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
                              <img class="paymentMethod_img" src="${imagePath}" ></img>
                              <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}">${label}</label>
                             `;
  if (description) {
    liContents += `<p>${description}</p>`;
  }
  const container = document.createElement("div");
  li.innerHTML = liContents;
  li.classList.add("paymentMethod");

  if (storedPaymentMethodBool) {
    const node = checkout.create("card", paymentMethod).mount(container);
    componentsObj[paymentMethodID] = node;
  } else {
    const fallback = getFallback(paymentMethod.type);
    if (fallback) {
      const template = document.createElement("template");
      template.innerHTML = fallback;
      container.append(template.content);
    } else {
      setTimeout(function () {
        try {
          const node = checkout.create(paymentMethod.type).mount(container);
          componentsObj[paymentMethodID] = node;
        } catch (e) {
          // TODO: Implement proper error handling
        }
      }, 0);
    }
  }
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

// TODO: Check usage / Remove
// eslint-disable-next-line no-unused-vars
function addPosTerminals(terminals) {
  //create dropdown and populate connected terminals
  const dd_terminals = $("<select>").attr("id", "terminalList");
  for (let i = 0; i < terminals.length; i++) {
    $("<option/>", {
      value: terminals[i],
      html: terminals[i],
    }).appendTo(dd_terminals);
  }
  $("#AdyenPosTerminals").append(dd_terminals);
}

function resetPaymentMethod() {
  $("#requiredBrandCode").hide();
  $("#selectedIssuer").val("");
  $("#adyenIssuerName").val("");
  $("#dateOfBirth").val("");
  $("#telephoneNumber").val("");
  $("#gender").val("");
  $("#bankAccountOwnerName").val("");
  $("#bankAccountNumber").val("");
  $("#bankLocationId").val("");
  $(".additionalFields").hide();
}

function getPaymentMethods(paymentMethods) {
  $.ajax({
    url: "Adyen-GetPaymentMethods",
    type: "get",
    success: function (data) {
      paymentMethods(data);
    },
  });
}

function paymentFromComponent(data, component) {
  $.ajax({
    url: "Adyen-PaymentFromComponent",
    type: "post",
    data: { data: JSON.stringify(data) },
    success: function (data) {
      if (data.fullResponse) {
        component.handleAction(data.fullResponse.action);
      }
    },
  }).fail(function (/* xhr, textStatus */) {
    // TODO: implement proper error handling
  });
}

//Submit the payment
$('button[value="submit-payment"]').on("click", function () {
  assignPaymentMethodValue();
  validateComponents();
  return showValidation();
});

function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
  adyenPaymentMethod.value = document.querySelector(
    `#lb_${selectedMethod}`
  ).innerHTML;
}

function showValidation() {
  let input;
  if (componentsObj[selectedMethod] && !componentsObj[selectedMethod].isValid) {
    componentsObj[selectedMethod].showValidation();
    return false;
  } else if (selectedMethod === "ach") {
    let inputs = document.querySelectorAll("#component_ach > input");
    inputs = Object.values(inputs).filter(function (input) {
      return !(input.value && input.value.length > 0);
    });
    for (input of inputs) {
      input.classList.add("adyen-checkout__input--error");
    }
    if (inputs.length > 0) {
      return false;
    }
    return true;
  } else if (selectedMethod === "ratepay") {
    input = document.querySelector("#dateOfBirthInput");
    if (!(input.value && input.value.length > 0)) {
      input.classList.add("adyen-checkout__input--error");
      return false;
    }
    return true;
  }
  return true;
}

function validateCustomInputField(input) {
  if (input.value === "") {
    input.classList.add("adyen-checkout__input--error");
  } else if (input.value.length > 0) {
    input.classList.remove("adyen-checkout__input--error");
  }
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

module.exports = {
  methods: {
    renderGenericComponent: renderGenericComponent,
  },
};
