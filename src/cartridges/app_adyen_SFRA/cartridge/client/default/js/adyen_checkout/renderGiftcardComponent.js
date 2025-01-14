const store = require('../../../../store');
const constants = require('../constants');
const { initializeCheckout } = require('./renderGenericComponent');

function getGiftCardElements() {
  const giftCardSelect = document.querySelector('#giftCardSelect');
  const giftCardUl = document.querySelector('#giftCardUl');
  const giftCardContainer = document.querySelector('#giftCardContainer');
  const giftCardAddButton = document.querySelector('#giftCardAddButton');
  const giftCardCancelContainer = document.querySelector(
    '#giftCardsCancelContainer',
  );
  const giftCardCancelButton = document.querySelector('#giftCardCancelButton');
  const giftCardSelectContainer = document.querySelector(
    '#giftCardSelectContainer',
  );
  const giftCardSelectWrapper = document.querySelector(
    '#giftCardSelectWrapper',
  );
  const giftCardsList = document.querySelector('#giftCardsList');
  const giftCardsInfoMessageContainer = document.querySelector(
    '#giftCardsInfoMessage',
  );
  const cancelMainPaymentGiftCard = document.querySelector(
    '#cancelGiftCardButton',
  );
  const giftCardInformation = document.querySelector('#giftCardInformation');

  return {
    giftCardSelect,
    giftCardUl,
    giftCardContainer,
    giftCardAddButton,
    giftCardSelectContainer,
    giftCardsList,
    giftCardsInfoMessageContainer,
    giftCardSelectWrapper,
    giftCardCancelContainer,
    giftCardCancelButton,
    cancelMainPaymentGiftCard,
    giftCardInformation,
  };
}

function showGiftCardCancelButton(show) {
  const { giftCardCancelContainer } = getGiftCardElements();
  if (show) {
    giftCardCancelContainer.classList.remove('invisible');
  } else {
    giftCardCancelContainer.classList.add('invisible');
  }
}

function removeGiftCards() {
  $.ajax({
    type: 'POST',
    url: window.cancelPartialPaymentOrderUrl,
    data: {
      csrf_token: $('#adyen-token').val(),
    },
    async: false,
    success(res) {
      const adyenPartialPaymentsOrder = document.querySelector(
        '#adyenPartialPaymentsOrder',
      );

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

      store.checkout.options.amount = res.amount;
      store.partialPaymentsOrderObj = null;
      store.addedGiftCards = null;
      store.adyenOrderDataCreated = false;

      giftCardsInfoMessageContainer.innerHTML = '';
      giftCardsInfoMessageContainer.classList.remove(
        'gift-cards-info-message-container',
      );
      const submitButton = document.querySelector(
        'button[value="submit-payment"]',
      );
      if (submitButton) {
        document.querySelector('button[value="submit-payment"]').disabled =
          false;
      }

      if (res.resultCode === constants.RECEIVED) {
        document.querySelector('#cancelGiftCardContainer')?.parentNode.remove();
        store.componentsObj?.giftcard?.node.unmount('component_giftcard');
      }
      initializeCheckout();
    },
  });
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
    newListItem.setAttribute('data-brand', giftCard.brand);
    newListItem.setAttribute('data-name', giftCard.name);
    newListItem.setAttribute('data-type', giftCard.type);

    const span = document.createElement('span');
    span.textContent = giftCard.name;
    const img = document.createElement('img');
    img.src = `${imagePath}${giftCard.brand}.png`;
    img.width = 40;
    img.height = 26;

    newListItem.appendChild(span);
    newListItem.appendChild(img);

    giftCardUl.appendChild(newListItem);
  });
}

function attachGiftCardFormListeners() {
  if (store.giftCardComponentListenersAdded) {
    return;
  }

  const {
    giftCardUl,
    giftCardSelect,
    giftCardContainer,
    giftCardSelectWrapper,
  } = getGiftCardElements();

  if (giftCardUl) {
    giftCardUl.addEventListener('click', (event) => {
      giftCardUl.classList.toggle('invisible');
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
      const giftCardNode = store.checkout
        .create(constants.GIFTCARD, {
          ...store.checkoutConfiguration.giftcard,
          brand: selectedGiftCard.brand,
          name: selectedGiftCard.name,
          amount: giftCardAmount,
        })
        .mount(giftCardContainer);
      store.componentsObj.giftcard = { node: giftCardNode };
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
  const alertContainer = document.createElement('div');
  alertContainer.setAttribute('id', 'giftCardWarningMessage');
  alertContainer.classList.add(
    'alert',
    'alert-warning',
    'error-message',
    'gift-card-warning-msg',
  );
  alertContainer.setAttribute('role', 'alert');

  const alertContainerP = document.createElement('p');
  alertContainerP.classList.add('error-message-text');
  alertContainerP.textContent = window.giftCardWarningMessage;

  alertContainer.appendChild(alertContainerP);

  const orderTotalSummaryEl = document.querySelector(
    '.card-body.order-total-summary',
  );
  orderTotalSummaryEl?.appendChild(alertContainer);
}

function attachGiftCardAddButtonListener() {
  const {
    giftCardAddButton,
    giftCardSelectContainer,
    giftCardSelectWrapper,
    giftCardSelect,
  } = getGiftCardElements();
  if (giftCardAddButton) {
    giftCardAddButton.addEventListener('click', () => {
      renderGiftCardSelectForm();
      attachGiftCardFormListeners();
      const giftCardWarningMessageEl = document.querySelector(
        '#giftCardWarningMessage',
      );
      if (giftCardWarningMessageEl) {
        giftCardWarningMessageEl.style.display = 'none';
      }
      giftCardSelect.value = 'null';
      giftCardAddButton.style.display = 'none';
      giftCardSelectContainer.classList.remove('invisible');
      giftCardSelectWrapper.classList.remove('invisible');
    });
  }
}

function attachGiftCardCancelListener() {
  const { giftCardCancelButton } = getGiftCardElements();
  giftCardCancelButton?.addEventListener('click', () => {
    removeGiftCards();
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

  const mainContainer = document.createElement('div');
  const remainingAmountContainer = document.createElement('div');
  const remainingAmountStart = document.createElement('div');
  const remainingAmountEnd = document.createElement('div');
  const discountedAmountContainer = document.createElement('div');
  const discountedAmountStart = document.createElement('div');
  const discountedAmountEnd = document.createElement('div');
  const remainingAmountStartP = document.createElement('p');
  const remainingAmountEndP = document.createElement('p');
  const discountedAmountStartP = document.createElement('p');
  const discountedAmountEndP = document.createElement('p');
  const remainingAmountStartSpan = document.createElement('span');
  const discountedAmountStartSpan = document.createElement('span');
  const remainingAmountEndSpan = document.createElement('span');
  remainingAmountEndSpan.id = 'remainingAmountEndSpan';
  const discountedAmountEndSpan = document.createElement('span');
  discountedAmountEndSpan.id = 'discountedAmountEndSpan';

  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  discountedAmountContainer.classList.add(
    'row',
    'grand-total',
    'leading-lines',
  );
  discountedAmountStart.classList.add('col-6', 'start-lines');
  discountedAmountEnd.classList.add('col-6', 'end-lines');
  discountedAmountStartP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
  discountedAmountEndP.classList.add('text-right');
  discountedAmountContainer.id = 'discountedAmountContainer';
  remainingAmountContainer.id = 'remainingAmountContainer';

  remainingAmountStartSpan.innerText = window.remainingAmountGiftCardResource;
  discountedAmountStartSpan.innerText = window.discountedAmountGiftCardResource;
  remainingAmountEndSpan.innerText =
    store.partialPaymentsOrderObj.remainingAmountFormatted;
  discountedAmountEndSpan.innerText =
    store.partialPaymentsOrderObj.totalDiscountedAmount;

  remainingAmountContainer.appendChild(remainingAmountStart);
  remainingAmountContainer.appendChild(remainingAmountEnd);
  remainingAmountStart.appendChild(remainingAmountStartP);

  discountedAmountContainer.appendChild(discountedAmountStart);
  discountedAmountContainer.appendChild(discountedAmountEnd);
  discountedAmountStart.appendChild(discountedAmountStartP);

  remainingAmountEnd.appendChild(remainingAmountEndP);
  remainingAmountStartP.appendChild(remainingAmountStartSpan);
  discountedAmountEnd.appendChild(discountedAmountEndP);
  discountedAmountStartP.appendChild(discountedAmountStartSpan);
  remainingAmountEndP.appendChild(remainingAmountEndSpan);
  discountedAmountEndP.appendChild(discountedAmountEndSpan);

  const pricingContainer = document.querySelector(
    '.card-body.order-total-summary',
  );
  mainContainer.id = 'giftCardInformation';
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
};
