"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var store = require('../../../../store');
var constants = require('../constants');
var _require = require('./renderGenericComponent'),
  INIT_CHECKOUT_EVENT = _require.INIT_CHECKOUT_EVENT;
function getGiftCardElements() {
  var giftCardSelect = document.querySelector('#giftCardSelect');
  var giftCardUl = document.querySelector('#giftCardUl');
  var giftCardContainer = document.querySelector('#giftCardContainer');
  var giftCardAddButton = document.querySelector('#giftCardAddButton');
  var giftCardCancelContainer = document.querySelector('#giftCardsCancelContainer');
  var giftCardCancelButton = document.querySelector('#giftCardCancelButton');
  var giftCardSelectContainer = document.querySelector('#giftCardSelectContainer');
  var giftCardSelectWrapper = document.querySelector('#giftCardSelectWrapper');
  var giftCardsList = document.querySelector('#giftCardsList');
  var giftCardsInfoMessageContainer = document.querySelector('#giftCardsInfoMessage');
  var cancelMainPaymentGiftCard = document.querySelector('#cancelGiftCardButton');
  var giftCardInformation = document.querySelector('#giftCardInformation');
  return {
    giftCardSelect: giftCardSelect,
    giftCardUl: giftCardUl,
    giftCardContainer: giftCardContainer,
    giftCardAddButton: giftCardAddButton,
    giftCardSelectContainer: giftCardSelectContainer,
    giftCardsList: giftCardsList,
    giftCardsInfoMessageContainer: giftCardsInfoMessageContainer,
    giftCardSelectWrapper: giftCardSelectWrapper,
    giftCardCancelContainer: giftCardCancelContainer,
    giftCardCancelButton: giftCardCancelButton,
    cancelMainPaymentGiftCard: cancelMainPaymentGiftCard,
    giftCardInformation: giftCardInformation
  };
}
function showGiftCardCancelButton(show) {
  var _getGiftCardElements = getGiftCardElements(),
    giftCardCancelContainer = _getGiftCardElements.giftCardCancelContainer;
  if (show) {
    giftCardCancelContainer.classList.remove('invisible');
  } else {
    giftCardCancelContainer.classList.add('invisible');
  }
}
function removeGiftCards() {
  var _store$addedGiftCards;
  (_store$addedGiftCards = store.addedGiftCards) === null || _store$addedGiftCards === void 0 ? void 0 : _store$addedGiftCards.forEach(function (card) {
    $.ajax({
      type: 'POST',
      url: window.cancelPartialPaymentOrderUrl,
      data: JSON.stringify(card),
      contentType: 'application/json; charset=utf-8',
      async: false,
      success: function success(res) {
        var adyenPartialPaymentsOrder = document.querySelector('#adyenPartialPaymentsOrder');
        var _getGiftCardElements2 = getGiftCardElements(),
          giftCardsList = _getGiftCardElements2.giftCardsList,
          giftCardAddButton = _getGiftCardElements2.giftCardAddButton,
          giftCardSelect = _getGiftCardElements2.giftCardSelect,
          giftCardUl = _getGiftCardElements2.giftCardUl,
          giftCardsInfoMessageContainer = _getGiftCardElements2.giftCardsInfoMessageContainer,
          giftCardSelectContainer = _getGiftCardElements2.giftCardSelectContainer,
          cancelMainPaymentGiftCard = _getGiftCardElements2.cancelMainPaymentGiftCard,
          giftCardInformation = _getGiftCardElements2.giftCardInformation;
        adyenPartialPaymentsOrder.value = null;
        giftCardsList.innerHTML = '';
        giftCardAddButton.style.display = 'block';
        giftCardSelect.value = null;
        giftCardSelectContainer.classList.add('invisible');
        giftCardSelect.classList.remove('invisible');
        giftCardUl.innerHTML = '';
        cancelMainPaymentGiftCard.classList.add('invisible');
        showGiftCardCancelButton(false);
        giftCardInformation === null || giftCardInformation === void 0 ? void 0 : giftCardInformation.remove();
        store.checkout.options.amount = res.amount;
        store.partialPaymentsOrderObj = null;
        store.addedGiftCards = null;
        giftCardsInfoMessageContainer.innerHTML = '';
        giftCardsInfoMessageContainer.classList.remove('gift-cards-info-message-container');
        document.querySelector('button[value="submit-payment"]').disabled = false;
        if (res.resultCode === constants.RECEIVED) {
          var _document$querySelect, _store$componentsObj, _store$componentsObj$;
          (_document$querySelect = document.querySelector('#cancelGiftCardContainer')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.parentNode.remove();
          (_store$componentsObj = store.componentsObj) === null || _store$componentsObj === void 0 ? void 0 : (_store$componentsObj$ = _store$componentsObj.giftcard) === null || _store$componentsObj$ === void 0 ? void 0 : _store$componentsObj$.node.unmount('component_giftcard');
        }
        var event = new Event(INIT_CHECKOUT_EVENT);
        document.dispatchEvent(event);
      }
    });
  });
}
function giftCardBrands() {
  var paymentMethodsResponse = store.checkout.paymentMethodsResponse;
  return paymentMethodsResponse.paymentMethods.filter(function (pm) {
    return pm.type === constants.GIFTCARD;
  });
}
function renderGiftCardSelectForm() {
  var _getGiftCardElements3 = getGiftCardElements(),
    giftCardUl = _getGiftCardElements3.giftCardUl,
    giftCardSelect = _getGiftCardElements3.giftCardSelect;
  if (giftCardUl !== null && giftCardUl !== void 0 && giftCardUl.innerHTML) {
    giftCardSelect.classList.remove('invisible');
    return;
  }
  var imagePath = store.checkoutConfiguration.session.imagePath;
  giftCardBrands().forEach(function (giftCard) {
    var newListItem = document.createElement('li');
    newListItem.setAttribute('data-brand', giftCard.brand);
    newListItem.setAttribute('data-name', giftCard.name);
    newListItem.setAttribute('data-type', giftCard.type);
    var span = document.createElement('span');
    span.textContent = giftCard.name;
    var img = document.createElement('img');
    img.src = "".concat(imagePath).concat(giftCard.brand, ".png");
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
  var _getGiftCardElements4 = getGiftCardElements(),
    giftCardUl = _getGiftCardElements4.giftCardUl,
    giftCardSelect = _getGiftCardElements4.giftCardSelect,
    giftCardContainer = _getGiftCardElements4.giftCardContainer,
    giftCardSelectWrapper = _getGiftCardElements4.giftCardSelectWrapper;
  if (giftCardUl) {
    giftCardUl.addEventListener('click', function (event) {
      var _store$componentsObj2;
      giftCardUl.classList.toggle('invisible');
      var selectedGiftCard = {
        name: event.target.dataset.name,
        brand: event.target.dataset.brand,
        type: event.target.dataset.type
      };
      if ((_store$componentsObj2 = store.componentsObj) !== null && _store$componentsObj2 !== void 0 && _store$componentsObj2.giftcard) {
        store.componentsObj.giftcard.node.unmount('component_giftcard');
      }
      if (!store.partialPaymentsOrderObj) {
        store.partialPaymentsOrderObj = {};
      }
      var newOption = document.createElement('option');
      newOption.textContent = selectedGiftCard.name;
      newOption.value = selectedGiftCard.brand;
      newOption.style.visibility = 'hidden';
      giftCardSelect.appendChild(newOption);
      giftCardSelect.value = selectedGiftCard.brand;
      giftCardContainer.innerHTML = '';
      var giftCardNode = store.checkout.create(constants.GIFTCARD, _objectSpread(_objectSpread({}, store.checkoutConfiguration.giftcard), {}, {
        brand: selectedGiftCard.brand,
        name: selectedGiftCard.name
      })).mount(giftCardContainer);
      store.componentsObj.giftcard = {
        node: giftCardNode
      };
    });
  }
  if (giftCardSelect) {
    giftCardSelectWrapper.addEventListener('mousedown', function () {
      giftCardUl.classList.toggle('invisible');
    });
  }
  store.giftCardComponentListenersAdded = true;
}
function showGiftCardWarningMessage() {
  var alertContainer = document.createElement('div');
  alertContainer.setAttribute('id', 'giftCardWarningMessage');
  alertContainer.classList.add('alert', 'alert-warning', 'error-message', 'gift-card-warning-msg');
  alertContainer.setAttribute('role', 'alert');
  var alertContainerP = document.createElement('p');
  alertContainerP.classList.add('error-message-text');
  alertContainerP.textContent = window.giftCardWarningMessage;
  alertContainer.appendChild(alertContainerP);
  var orderTotalSummaryEl = document.querySelector('.card-body.order-total-summary');
  orderTotalSummaryEl === null || orderTotalSummaryEl === void 0 ? void 0 : orderTotalSummaryEl.appendChild(alertContainer);
}
function attachGiftCardAddButtonListener() {
  var _getGiftCardElements5 = getGiftCardElements(),
    giftCardAddButton = _getGiftCardElements5.giftCardAddButton,
    giftCardSelectContainer = _getGiftCardElements5.giftCardSelectContainer,
    giftCardSelectWrapper = _getGiftCardElements5.giftCardSelectWrapper,
    giftCardSelect = _getGiftCardElements5.giftCardSelect;
  if (giftCardAddButton) {
    giftCardAddButton.addEventListener('click', function () {
      renderGiftCardSelectForm();
      attachGiftCardFormListeners();
      var giftCardWarningMessageEl = document.querySelector('#giftCardWarningMessage');
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
  var _getGiftCardElements6 = getGiftCardElements(),
    giftCardCancelButton = _getGiftCardElements6.giftCardCancelButton;
  giftCardCancelButton === null || giftCardCancelButton === void 0 ? void 0 : giftCardCancelButton.addEventListener('click', function () {
    removeGiftCards();
  });
}
function removeGiftCardFormListeners() {
  var _getGiftCardElements7 = getGiftCardElements(),
    giftCardUl = _getGiftCardElements7.giftCardUl,
    giftCardSelect = _getGiftCardElements7.giftCardSelect;
  giftCardUl.replaceWith(giftCardUl.cloneNode(true));
  giftCardSelect.replaceWith(giftCardSelect.cloneNode(true));
  store.giftCardComponentListenersAdded = false;
}
function clearGiftCardsContainer() {
  var _getGiftCardElements8 = getGiftCardElements(),
    giftCardsList = _getGiftCardElements8.giftCardsList;
  giftCardsList.innerHTML = '';
}
function renderAddedGiftCard(card) {
  var giftCardData = card.giftCard;
  var imagePath = store.checkoutConfiguration.session.imagePath;
  var _getGiftCardElements9 = getGiftCardElements(),
    giftCardsList = _getGiftCardElements9.giftCardsList,
    giftCardAddButton = _getGiftCardElements9.giftCardAddButton;
  var giftCardDiv = document.createElement('div');
  giftCardDiv.classList.add('gift-card');
  var brandContainer = document.createElement('div');
  brandContainer.classList.add('brand-container');
  var giftCardImg = document.createElement('img');
  var giftCardImgSrc = "".concat(imagePath).concat(giftCardData.brand, ".png");
  giftCardImg.setAttribute('src', giftCardImgSrc);
  giftCardImg.classList.add('gift-card-logo');
  var giftCardNameP = document.createElement('p');
  giftCardNameP.textContent = giftCardData.name;
  brandContainer.appendChild(giftCardImg);
  brandContainer.appendChild(giftCardNameP);
  var giftCardAction = document.createElement('div');
  giftCardAction.classList.add('gift-card-action');
  var brandAndRemoveActionWrapper = document.createElement('div');
  brandAndRemoveActionWrapper.classList.add('wrapper');
  brandAndRemoveActionWrapper.appendChild(brandContainer);
  brandAndRemoveActionWrapper.appendChild(giftCardAction);
  var giftCardAmountDiv = document.createElement('div');
  giftCardAmountDiv.classList.add('wrapper');
  var amountLabel = document.createElement('p');
  amountLabel.textContent = window.deductedBalanceGiftCardResource;
  var amountValue = document.createElement('strong');
  amountValue.textContent = card.discountedAmount ? "-".concat(card.discountedAmount) : '';
  giftCardAmountDiv.appendChild(amountLabel);
  giftCardAmountDiv.appendChild(amountValue);
  giftCardDiv.appendChild(brandAndRemoveActionWrapper);
  giftCardDiv.appendChild(giftCardAmountDiv);
  giftCardsList.appendChild(giftCardDiv);
  giftCardAddButton.style.display = 'block';
  removeGiftCardFormListeners();
}
function createElementsToShowRemainingGiftCardAmount() {
  var renderedRemainingAmountEndSpan = document.getElementById('remainingAmountEndSpan');
  var renderedDiscountedAmountEndSpan = document.getElementById('discountedAmountEndSpan');
  if (renderedRemainingAmountEndSpan && renderedDiscountedAmountEndSpan) {
    renderedRemainingAmountEndSpan.innerText = store.partialPaymentsOrderObj.remainingAmountFormatted;
    renderedDiscountedAmountEndSpan.innerText = store.partialPaymentsOrderObj.totalDiscountedAmount;
    return;
  }
  var mainContainer = document.createElement('div');
  var remainingAmountContainer = document.createElement('div');
  var remainingAmountStart = document.createElement('div');
  var remainingAmountEnd = document.createElement('div');
  var discountedAmountContainer = document.createElement('div');
  var discountedAmountStart = document.createElement('div');
  var discountedAmountEnd = document.createElement('div');
  var remainingAmountStartP = document.createElement('p');
  var remainingAmountEndP = document.createElement('p');
  var discountedAmountStartP = document.createElement('p');
  var discountedAmountEndP = document.createElement('p');
  var remainingAmountStartSpan = document.createElement('span');
  var discountedAmountStartSpan = document.createElement('span');
  var remainingAmountEndSpan = document.createElement('span');
  remainingAmountEndSpan.id = 'remainingAmountEndSpan';
  var discountedAmountEndSpan = document.createElement('span');
  discountedAmountEndSpan.id = 'discountedAmountEndSpan';
  remainingAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  remainingAmountStart.classList.add('col-6', 'start-lines');
  remainingAmountEnd.classList.add('col-6', 'end-lines');
  remainingAmountStartP.classList.add('order-receipt-label');
  discountedAmountContainer.classList.add('row', 'grand-total', 'leading-lines');
  discountedAmountStart.classList.add('col-6', 'start-lines');
  discountedAmountEnd.classList.add('col-6', 'end-lines');
  discountedAmountStartP.classList.add('order-receipt-label');
  remainingAmountEndP.classList.add('text-right');
  discountedAmountEndP.classList.add('text-right');
  discountedAmountContainer.id = 'discountedAmountContainer';
  remainingAmountContainer.id = 'remainingAmountContainer';
  remainingAmountStartSpan.innerText = window.remainingAmountGiftCardResource;
  discountedAmountStartSpan.innerText = window.discountedAmountGiftCardResource;
  remainingAmountEndSpan.innerText = store.partialPaymentsOrderObj.remainingAmountFormatted;
  discountedAmountEndSpan.innerText = store.partialPaymentsOrderObj.totalDiscountedAmount;
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
  var pricingContainer = document.querySelector('.card-body.order-total-summary');
  mainContainer.id = 'giftCardInformation';
  mainContainer.appendChild(discountedAmountContainer);
  mainContainer.appendChild(remainingAmountContainer);
  pricingContainer.appendChild(mainContainer);
}
function showGiftCardInfoMessage() {
  var messageText = store.partialPaymentsOrderObj.message;
  var _getGiftCardElements10 = getGiftCardElements(),
    giftCardsInfoMessageContainer = _getGiftCardElements10.giftCardsInfoMessageContainer;
  giftCardsInfoMessageContainer.innerHTML = '';
  giftCardsInfoMessageContainer.classList.remove('gift-cards-info-message-container');
  if (!messageText) return;
  var giftCardsInfoMessage = document.createElement('div');
  giftCardsInfoMessage.classList.add('adyen-checkout__alert-message', 'adyen-checkout__alert-message--warning');
  giftCardsInfoMessage.setAttribute('role', 'alert');
  var infoMessage = document.createElement('span');
  infoMessage.textContent = messageText;
  giftCardsInfoMessage.appendChild(infoMessage);
  giftCardsInfoMessageContainer.appendChild(giftCardsInfoMessage);
  giftCardsInfoMessageContainer.classList.add('gift-cards-info-message-container');
}
module.exports = {
  removeGiftCards: removeGiftCards,
  renderAddedGiftCard: renderAddedGiftCard,
  attachGiftCardAddButtonListener: attachGiftCardAddButtonListener,
  getGiftCardElements: getGiftCardElements,
  showGiftCardWarningMessage: showGiftCardWarningMessage,
  createElementsToShowRemainingGiftCardAmount: createElementsToShowRemainingGiftCardAmount,
  renderGiftCardSelectForm: renderGiftCardSelectForm,
  showGiftCardInfoMessage: showGiftCardInfoMessage,
  giftCardBrands: giftCardBrands,
  clearGiftCardsContainer: clearGiftCardsContainer,
  attachGiftCardCancelListener: attachGiftCardCancelListener,
  showGiftCardCancelButton: showGiftCardCancelButton
};