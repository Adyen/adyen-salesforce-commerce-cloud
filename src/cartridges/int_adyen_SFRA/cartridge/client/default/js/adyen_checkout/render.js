const { displaySelectedMethod } = require("./displaySelectedMethod");

const MASKED_CC_PREFIX = "************"; // TODO: Move this to a constants file

function renderPaymentMethod({
  paymentMethod,
  storePaymentMethod,
  checkoutConfiguration,
  components,
  imagePath,
  setSelectedMethod,
  description = null,
}) {
  const checkout = new AdyenCheckout(checkoutConfiguration);
  const paymentMethodsUI = document.querySelector("#paymentMethodsList");
  const li = document.createElement("li");
  const paymentMethodID = getPaymentMethodId();
  const logo = storePaymentMethod ? paymentMethod.brand : paymentMethod.type;
  const fullImagePath = `${imagePath}${logo}.png`;
  const labelSuffix = getLabelSuffix();
  const label = `${paymentMethod.name}${labelSuffix}`;
  const liContents = getListContent();
  const container = document.createElement("div");

  li.innerHTML = liContents;
  li.classList.add("paymentMethod");

  renderComponent(storePaymentMethod);

  container.classList.add("additionalFields");
  container.setAttribute("id", `component_${paymentMethodID}`);
  container.setAttribute("style", "display:none");

  li.append(container);

  paymentMethodsUI.append(li);
  const input = document.querySelector(`#rb_${paymentMethodID}`);

  input.onchange = ({ target: { value } }) => {
    setSelectedMethod(value);
    displaySelectedMethod(value);
  };

  function renderComponent(storePaymentMethod) {
    storePaymentMethod ? createCardComponent() : createComponent();
  }

  function createCardComponent() {
    const node = checkout.create("card", paymentMethod).mount(container);
    components[paymentMethodID] = node;
  }

  function createComponent() {
    const fallback = getFallback();

    fallback ? createFallback(fallback) : renderPaymentMethod();
  }

  function getFallback() {
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

    const fallback = { ach, ratepay };
    return fallback[paymentMethod];
  }

  function createFallback(fallback) {
    const template = document.createElement("template");
    template.innerHTML = fallback;
    container.append(template.content);
  }

  function renderPaymentMethod() {
    setTimeout(function () {
      try {
        configurePaymentMethod();
      } catch (e) {
        // TODO: Implement proper error handling
      }
    }, 0);
  }

  function configurePaymentMethod() {
    paymentMethod.type === "paypal" && configurePaypal();
    const node = checkout.create(paymentMethod.type).mount(container);
    components[paymentMethodID] = node;
  }

  function configurePaypal() {
    //TODO: replace temporary continue button with onClick function once available by checkout
    const continueBtn = document.createElement("button");
    continueBtn.innerText = "continue";
    continueBtn.setAttribute("id", "continueBtn");
    continueBtn.setAttribute("style", "display:none");
    continueBtn.onclick = function () {
      $("#dwfrm_billing").trigger("submit");
    };
    li.append(continueBtn);
  }

  function getPaymentMethodId() {
    return storePaymentMethod
      ? `storedCard${paymentMethod.id}`
      : paymentMethod.type;
  }

  function getLabelSuffix() {
    return storePaymentMethod
      ? ` ${MASKED_CC_PREFIX}${paymentMethod.lastFour}`
      : "";
  }

  function getListContent() {
    const content = `
      <input name="brandCode" type="radio" value="${paymentMethodID}" id="rb_${paymentMethodID}">
      <img class="paymentMethod_img" src="${fullImagePath}" ></img>
      <label id="lb_${paymentMethodID}" for="rb_${paymentMethodID}">${label}</label>
    `;

    return description ? content + `<p>${description}</p>` : content;
  }
}

module.exports = { renderPaymentMethod };
