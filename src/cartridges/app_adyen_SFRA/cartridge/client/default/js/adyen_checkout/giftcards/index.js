const store = require('../../../../../utils/store');
const constants = require('../../../../../utils/constants');
const { httpClient } = require('../../commons/httpClient');
const { fetchGiftCards } = require('../../commons');

function getGiftCardElements() {
  const elements = {
    giftCardSelect: '#giftCardSelect',
    giftCardUl: '#giftCardUl',
    giftCardContainer: '#giftCardContainer',
    giftCardAddButton: '#giftCardAddButton',
    giftCardCancelContainer: '#giftCardsCancelContainer',
    giftCardCancelButton: '#giftCardCancelButton',
    giftCardSelectContainer: '#giftCardSelectContainer',
    giftCardSelectWrapper: '#giftCardSelectWrapper',
    giftCardsList: '#giftCardsList',
    giftCardsInfoMessageContainer: '#giftCardsInfoMessage',
    cancelMainPaymentGiftCard: '#cancelGiftCardButton',
    giftCardInformation: '#giftCardInformation',
  };

  return Object.fromEntries(
    Object.entries(elements).map(([key, selector]) => [
      key,
      document.querySelector(selector),
    ]),
  );
}

function showGiftCardCancelButton(show) {
  const { giftCardCancelContainer } = getGiftCardElements();
  giftCardCancelContainer.classList.toggle('invisible', !show);
}

async function removeGiftCards() {
  const response = await httpClient({
    method: 'POST',
    url: window.cancelPartialPaymentOrderUrl,
    data: {
      csrf_token: $('#adyen-token').val(),
    },
  });

  const {
    giftCardsList,
    giftCardAddButton,
    giftCardSelect,
    giftCardUl,
    giftCardsInfoMessageContainer,
    giftCardSelectContainer,
    cancelMainPaymentGiftCard,
    giftCardInformation,
  } = getGiftCardElements();

  const adyenPartialPaymentsOrder = document.querySelector(
    '#adyenPartialPaymentsOrder',
  );
  const submitButton = document.querySelector('button[value="submit-payment"]');

  adyenPartialPaymentsOrder.value = null;
  giftCardsList.innerHTML = '';
  giftCardAddButton.style.display = 'block';
  giftCardSelect.value = null;
  giftCardSelectContainer.classList.add('invisible');
  giftCardSelect.classList.remove('invisible');
  giftCardUl.innerHTML = '';

  cancelMainPaymentGiftCard.classList.add('invisible');
  showGiftCardCancelButton(false);
  giftCardInformation?.remove();
  giftCardsInfoMessageContainer.innerHTML = '';
  giftCardsInfoMessageContainer.classList.remove(
    'gift-cards-info-message-container',
  );

  if (submitButton) {
    submitButton.disabled = false;
  }

  store.checkout.options.amount = response.amount;
  store.partialPaymentsOrderObj = null;
  store.addedGiftCards = null;
  store.adyenOrderDataCreated = false;

  if (response.resultCode === constants.RECEIVED) {
    document.querySelector('#cancelGiftCardContainer')?.parentNode.remove();
    store.componentsObj?.giftcard?.node.unmount('component_giftcard');
  }

  document.dispatchEvent(new Event('checkout:renderPaymentMethod'));
}

function giftCardBrands() {
  const { paymentMethodsResponse } = store.checkout;
  return paymentMethodsResponse.paymentMethods.filter(
    (pm) => pm.type === constants.GIFTCARD,
  );
}

function renderGiftCardSelectForm() {
  const { giftCardUl, giftCardSelect } = getGiftCardElements();
  if (giftCardUl?.innerHTML) {
    giftCardSelect.classList.remove('invisible');
    return;
  }

  const { imagePath } = store.checkoutConfiguration.paymentMethodsResponse;
  giftCardBrands().forEach((giftCard) => {
    const newListItem = document.createElement('li');
    newListItem.dataset.brand = giftCard.brand;
    newListItem.dataset.name = giftCard.name;
    newListItem.dataset.type = giftCard.type;

    const span = document.createElement('span');
    span.textContent = giftCard.name;

    const img = document.createElement('img');
    img.src = `${imagePath}${giftCard.brand}.png`;
    img.width = 40;
    img.height = 26;

    newListItem.append(span, img);
    giftCardUl.appendChild(newListItem);
  });

  giftCardSelect.classList.remove('invisible');
}

function attachGiftCardFormListeners() {
  if (store.giftCardComponentListenersAdded) return;

  const {
    giftCardUl,
    giftCardSelect,
    giftCardContainer,
    giftCardSelectWrapper,
  } = getGiftCardElements();

  if (giftCardUl) {
    giftCardUl.addEventListener('click', (event) => {
      if (!event.target.dataset.name) return;

      const selectedGiftCard = {
        name: event.target.dataset.name,
        brand: event.target.dataset.brand,
        type: event.target.dataset.type,
      };

      if (store.componentsObj?.giftcard) {
        store.componentsObj.giftcard.node.unmount('component_giftcard');
      }

      if (!store.partialPaymentsOrderObj) {
        store.partialPaymentsOrderObj = {};
      }

      const newOption = document.createElement('option');
      newOption.textContent = selectedGiftCard.name;
      newOption.value = selectedGiftCard.brand;
      newOption.style.visibility = 'hidden';
      giftCardSelect.appendChild(newOption);
      giftCardSelect.value = selectedGiftCard.brand;

      const giftCardAmount = store.partialPaymentsOrderObj.remainingAmount
        ? store.partialPaymentsOrderObj.remainingAmount
        : store.checkout.options.amount;

      giftCardContainer.innerHTML = '';
      const giftCardNode = window.AdyenWeb.createComponent(
        constants.GIFTCARD,
        store.checkout,
        {
          ...store.paymentMethodsConfiguration[constants.GIFTCARD],
          brand: selectedGiftCard.brand,
          name: selectedGiftCard.name,
          amount: giftCardAmount,
        },
      ).mount(giftCardContainer);
      store.componentsObj.giftcard = { node: giftCardNode };

      giftCardUl.classList.toggle('invisible');
    });
  }

  if (giftCardSelect) {
    giftCardSelectWrapper.addEventListener('mousedown', () => {
      giftCardUl.classList.toggle('invisible');
    });
  }

  store.giftCardComponentListenersAdded = true;
}

function showGiftCardWarningMessage() {
  const orderTotalSummaryEl = document.querySelector(
    '.card-body.order-total-summary',
  );

  if (!orderTotalSummaryEl) return;

  const alertContainer = document.createElement('div');
  alertContainer.id = 'giftCardWarningMessage';
  alertContainer.classList.add(
    'alert',
    'alert-warning',
    'error-message',
    'gift-card-warning-msg',
  );
  alertContainer.role = 'alert';

  const alertContainerP = document.createElement('p');
  alertContainerP.classList.add('error-message-text');
  alertContainerP.textContent = window.giftCardWarningMessage;

  alertContainer.append(alertContainerP);
  orderTotalSummaryEl.appendChild(alertContainer);
}

function attachGiftCardAddButtonListener() {
  const {
    giftCardAddButton,
    giftCardSelectContainer,
    giftCardSelectWrapper,
    giftCardSelect,
  } = getGiftCardElements();

  if (!giftCardAddButton) return;

  giftCardAddButton.addEventListener('click', () => {
    renderGiftCardSelectForm();
    attachGiftCardFormListeners();
    const giftCardWarningMessage = document.querySelector(
      '#giftCardWarningMessage',
    );
    if (giftCardWarningMessage) {
      document.querySelector('#giftCardWarningMessage').style.display = 'none';
    }
    giftCardSelect.value = 'null';
    giftCardAddButton.style.display = 'none';
    giftCardSelectContainer.classList.remove('invisible');
    giftCardSelectWrapper.classList.remove('invisible');
  });
}

function attachGiftCardCancelListener() {
  const { giftCardCancelButton } = getGiftCardElements();
  giftCardCancelButton?.addEventListener('click', async () => {
    await removeGiftCards();
  });
}

function removeGiftCardFormListeners() {
  const { giftCardUl, giftCardSelect } = getGiftCardElements();

  giftCardUl.replaceWith(giftCardUl.cloneNode(true));
  giftCardSelect.replaceWith(giftCardSelect.cloneNode(true));

  store.giftCardComponentListenersAdded = false;
}

function clearGiftCardsContainer() {
  const { giftCardsList } = getGiftCardElements();
  giftCardsList.innerHTML = '';
}

function renderAddedGiftCard(card) {
  const giftCardData = card.giftCard;
  const { imagePath } = store.checkoutConfiguration.paymentMethodsResponse;

  const { giftCardsList, giftCardAddButton } = getGiftCardElements();

  const giftCardDiv = document.createElement('div');
  giftCardDiv.classList.add('gift-card');

  const brandContainer = document.createElement('div');
  brandContainer.classList.add('brand-container');

  const giftCardImg = document.createElement('img');
  const giftCardImgSrc = `${imagePath}${giftCardData.brand}.png`;
  giftCardImg.setAttribute('src', giftCardImgSrc);
  giftCardImg.classList.add('gift-card-logo');

  const giftCardNameP = document.createElement('p');
  giftCardNameP.textContent = giftCardData.name;

  brandContainer.appendChild(giftCardImg);
  brandContainer.appendChild(giftCardNameP);

  const giftCardAction = document.createElement('div');
  giftCardAction.classList.add('gift-card-action');

  const brandAndRemoveActionWrapper = document.createElement('div');
  brandAndRemoveActionWrapper.classList.add('wrapper');
  brandAndRemoveActionWrapper.appendChild(brandContainer);
  brandAndRemoveActionWrapper.appendChild(giftCardAction);

  const giftCardAmountDiv = document.createElement('div');
  giftCardAmountDiv.classList.add('wrapper');
  const amountLabel = document.createElement('p');
  amountLabel.textContent = window.deductedBalanceGiftCardResource;
  const amountValue = document.createElement('strong');
  amountValue.textContent = card.discountedAmount
    ? `-${card.discountedAmount}`
    : '';
  giftCardAmountDiv.appendChild(amountLabel);
  giftCardAmountDiv.appendChild(amountValue);

  giftCardDiv.appendChild(brandAndRemoveActionWrapper);
  giftCardDiv.appendChild(giftCardAmountDiv);

  giftCardsList.appendChild(giftCardDiv);

  giftCardAddButton.style.display = 'block';

  removeGiftCardFormListeners();
}

function createElementsToShowRemainingGiftCardAmount() {
  const renderedRemainingAmountEndSpan = document.getElementById(
    'remainingAmountEndSpan',
  );
  const renderedDiscountedAmountEndSpan = document.getElementById(
    'discountedAmountEndSpan',
  );

  if (renderedRemainingAmountEndSpan && renderedDiscountedAmountEndSpan) {
    renderedRemainingAmountEndSpan.innerText =
      store.partialPaymentsOrderObj.remainingAmountFormatted;
    renderedDiscountedAmountEndSpan.innerText =
      store.partialPaymentsOrderObj.totalDiscountedAmount;
    return;
  }

  const pricingContainer = document.querySelector(
    '.card-body.order-total-summary',
  );

  const mainContainer = document.createElement('div');
  mainContainer.id = 'giftCardInformation';

  const createContainer = (id, startText, endText) => {
    const container = document.createElement('div');
    container.id = id;
    container.classList.add('row', 'grand-total', 'leading-lines');

    const startDiv = document.createElement('div');
    startDiv.classList.add('col-6', 'start-lines');
    const startP = document.createElement('p');
    startP.classList.add('order-receipt-label');
    const startSpan = document.createElement('span');
    startSpan.innerText = startText;
    startP.appendChild(startSpan);
    startDiv.appendChild(startP);

    const endDiv = document.createElement('div');
    endDiv.classList.add('col-6', 'end-lines');
    const endP = document.createElement('p');
    endP.classList.add('text-right');
    const endSpan = document.createElement('span');
    endSpan.innerText = endText;
    if (id === 'remainingAmountContainer') {
      endSpan.id = 'remainingAmountEndSpan';
    } else if (id === 'discountedAmountContainer') {
      endSpan.id = 'discountedAmountEndSpan';
    }
    endP.appendChild(endSpan);
    endDiv.appendChild(endP);

    container.appendChild(startDiv);
    container.appendChild(endDiv);

    return container;
  };

  const remainingAmountContainer = createContainer(
    'remainingAmountContainer',
    window.remainingAmountGiftCardResource,
    store.partialPaymentsOrderObj.remainingAmountFormatted,
  );

  const discountedAmountContainer = createContainer(
    'discountedAmountContainer',
    window.discountedAmountGiftCardResource,
    store.partialPaymentsOrderObj.totalDiscountedAmount,
  );

  mainContainer.appendChild(discountedAmountContainer);
  mainContainer.appendChild(remainingAmountContainer);
  pricingContainer.appendChild(mainContainer);
}

function showGiftCardInfoMessage() {
  const messageText = store.partialPaymentsOrderObj.message;
  const { giftCardsInfoMessageContainer } = getGiftCardElements();
  giftCardsInfoMessageContainer.innerHTML = '';
  giftCardsInfoMessageContainer.classList.remove(
    'gift-cards-info-message-container',
  );
  if (!messageText) return;
  const giftCardsInfoMessage = document.createElement('div');
  giftCardsInfoMessage.classList.add(
    'adyen-checkout__alert-message',
    'adyen-checkout__alert-message--warning',
  );
  giftCardsInfoMessage.setAttribute('role', 'alert');

  const infoMessage = document.createElement('span');
  infoMessage.textContent = messageText;
  giftCardsInfoMessage.appendChild(infoMessage);
  giftCardsInfoMessageContainer.appendChild(giftCardsInfoMessage);
  giftCardsInfoMessageContainer.classList.add(
    'gift-cards-info-message-container',
  );
}

function isCartModified(amount, orderAmount) {
  return (
    amount.currency !== orderAmount.currency ||
    amount.value !== orderAmount.value
  );
}

function renderGiftCardLogo(imagePath) {
  const headingImg = document.querySelector('#headingImg');
  if (headingImg) {
    headingImg.src = `${imagePath}genericgiftcard.png`;
  }
}

async function applyGiftCards() {
  const now = new Date().toISOString();
  const { amount } = store.checkoutConfiguration;
  const { orderAmount } = store.partialPaymentsOrderObj;

  const isPartialPaymentExpired = store.addedGiftCards.some(
    (cart) => now > cart.expiresAt,
  );
  const cartModified = isCartModified(amount, orderAmount);

  if (isPartialPaymentExpired) {
    await removeGiftCards();
  } else if (cartModified) {
    await removeGiftCards();
    showGiftCardWarningMessage();
  } else {
    clearGiftCardsContainer();
    store.addedGiftCards.forEach((card) => {
      renderAddedGiftCard(card);
    });
    if (store.addedGiftCards?.length) {
      showGiftCardInfoMessage();
    }
    store.checkout.options.amount =
      store.addedGiftCards[store.addedGiftCards.length - 1].remainingAmount;
    showGiftCardCancelButton(true);
    attachGiftCardCancelListener();
    createElementsToShowRemainingGiftCardAmount();
  }
}

async function renderGiftCards(paymentMethodsResponse) {
  const giftCardsData = await fetchGiftCards();
  const { totalDiscountedAmount, giftCards } = giftCardsData;
  if (giftCards?.length) {
    store.addedGiftCards = giftCards;
    const lastGiftCard = store.addedGiftCards[store.addedGiftCards.length - 1];
    store.partialPaymentsOrderObj = { ...lastGiftCard, totalDiscountedAmount };
  }

  renderGiftCardLogo(paymentMethodsResponse.imagePath);

  if (store.addedGiftCards?.length) {
    await applyGiftCards();
  }

  attachGiftCardAddButtonListener();
}

module.exports = {
  removeGiftCards,
  renderAddedGiftCard,
  attachGiftCardAddButtonListener,
  getGiftCardElements,
  showGiftCardWarningMessage,
  createElementsToShowRemainingGiftCardAmount,
  renderGiftCardSelectForm,
  showGiftCardInfoMessage,
  giftCardBrands,
  clearGiftCardsContainer,
  attachGiftCardCancelListener,
  showGiftCardCancelButton,
  applyGiftCards,
  renderGiftCardLogo,
  isCartModified,
  renderGiftCards,
};
