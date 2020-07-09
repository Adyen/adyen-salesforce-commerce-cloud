import store from "../../../../store";
import { displaySelectedMethod } from "./index";

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

export function renderPaymentMethod(
  paymentMethod,
  storedPaymentMethodBool,
  path,
  description = null
) {
  let node;
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
    ? `${paymentMethod.name} ${store.MASKED_CC_PREFIX}${paymentMethod.lastFour}`
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
    node = store.checkout.create("card", paymentMethod);
    if (!store.componentsObj[paymentMethodID]) {
      store.componentsObj[paymentMethodID] = {};
    }
    store.componentsObj[paymentMethodID].node = node;
  } else {
    const fallback = getFallback(paymentMethod.type);
    if (fallback) {
      const template = document.createElement("template");
      template.innerHTML = fallback;
      container.append(template.content);
    } else {
      try {
        node = store.checkout.create(paymentMethod.type);
        if (!store.componentsObj[paymentMethodID]) {
          store.componentsObj[paymentMethodID] = {};
        }
        store.componentsObj[paymentMethodID].node = node;
      } catch (e) {} // eslint-disable-line no-empty
    }
  }
  container.classList.add("additionalFields");
  container.setAttribute("id", `component_${paymentMethodID}`);
  container.setAttribute("style", "display:none");

  li.append(container);
  paymentMethodsUI.append(li);

  node && node.mount(container);

  const input = document.querySelector(`#rb_${paymentMethodID}`);
  input.onchange = (event) => {
    displaySelectedMethod(event.target.value);
  };

  if (store.componentsObj[paymentMethodID] && !container.childNodes[0]) {
    store.componentsObj[paymentMethodID].isValid = true;
  }
}
