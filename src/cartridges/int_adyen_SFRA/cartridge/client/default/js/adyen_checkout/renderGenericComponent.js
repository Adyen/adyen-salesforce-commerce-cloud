import store from "../../../../store";
import { renderPaymentMethod, displaySelectedMethod } from "./index";

function addPosTerminals(terminals) {
  const dd_terminals = document.createElement("select");
  dd_terminals.id = "terminalList";
  for (const t in terminals) {
    const option = document.createElement("option");
    option.value = terminals[t];
    option.text = terminals[t];
    dd_terminals.appendChild(option);
  }
  document.querySelector("#adyenPosTerminals").append(dd_terminals);
}

/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */
function getPaymentMethods(paymentMethods) {
  $.ajax({
    url: "Adyen-GetPaymentMethods",
    type: "get",
    success: function (data) {
      paymentMethods(data);
    },
  });
}

/**
 * To avoid re-rendering components twice, unmounts existing components from payment methods list
 */
function unmountComponents() {
  const promises = Object.entries(store.componentsObj).map(function ([
    key,
    val,
  ]) {
    delete store.componentsObj[key];
    return resolveUnmount(key, val);
  });
  return Promise.all(promises);
}

function resolveUnmount(key, val) {
  try {
    return Promise.resolve(val.node.unmount(`component_${key}`));
  } catch (e) {
    // try/catch block for val.unmount
    return Promise.resolve(false);
  }
}

/**
 * checks if payment method is blocked and returns a boolean accordingly
 */
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

/**
 * Calls getPaymenMethods and then renders the retrieved payment methods (including card component)
 */
export async function renderGenericComponent() {
  if (Object.keys(store.componentsObj).length !== 0) {
    await unmountComponents();
  }
  getPaymentMethods(function (data) {
    let paymentMethod;
    let i;
    store.checkoutConfiguration.paymentMethodsResponse =
      data.AdyenPaymentMethods;
    if (data.amount) {
      store.checkoutConfiguration.amount = data.amount;
    }
    if (data.countryCode) {
      store.checkoutConfiguration.countryCode = data.countryCode;
    }
    store.checkout = new AdyenCheckout(store.checkoutConfiguration);

    document.querySelector("#paymentMethodsList").innerHTML = "";

    if (data.AdyenPaymentMethods.storedPaymentMethods) {
      for (
        i = 0;
        i < store.checkout.paymentMethodsResponse.storedPaymentMethods.length;
        i++
      ) {
        paymentMethod =
          store.checkout.paymentMethodsResponse.storedPaymentMethods[i];
        if (paymentMethod.supportedShopperInteractions.includes("Ecommerce")) {
          renderPaymentMethod(paymentMethod, true, data.ImagePath);
        }
      }
    }

    data.AdyenPaymentMethods.paymentMethods.forEach((pm, i) => {
      !isMethodTypeBlocked(pm.type) &&
        renderPaymentMethod(
          pm,
          false,
          data.ImagePath,
          data.AdyenDescriptions[i].description
        );
    });

    if (
      data.AdyenConnectedTerminals &&
      data.AdyenConnectedTerminals.uniqueTerminalIds &&
      data.AdyenConnectedTerminals.uniqueTerminalIds.length > 0
    ) {
      const posTerminals = document.querySelector("#adyenPosTerminals");
      while (posTerminals.firstChild) {
        posTerminals.removeChild(posTerminals.firstChild);
      }
      addPosTerminals(data.AdyenConnectedTerminals.uniqueTerminalIds);
    }
    const firstPaymentMethod = document.querySelector(
      "input[type=radio][name=brandCode]"
    );
    firstPaymentMethod.checked = true;
    displaySelectedMethod(firstPaymentMethod.value);
  });
}
