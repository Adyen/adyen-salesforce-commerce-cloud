"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var store = require('../../../../store');
var constants = require('../constants');
var _require = require('./renderGenericComponent'),
  initializeCheckout = _require.initializeCheckout;
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
  $.ajax({
    type: 'POST',
    url: window.cancelPartialPaymentOrderUrl,
    data: {
      csrf_token: $('#adyen-token').val()
    },
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
      store.adyenOrderDataCreated = false;
      giftCardsInfoMessageContainer.innerHTML = '';
      giftCardsInfoMessageContainer.classList.remove('gift-cards-info-message-container');
      var submitButton = document.querySelector('button[value="submit-payment"]');
      if (submitButton) {
        document.querySelector('button[value="submit-payment"]').disabled = false;
      }
      if (res.resultCode === constants.RECEIVED) {
        var _document$querySelect, _store$componentsObj, _store$componentsObj$;
        (_document$querySelect = document.querySelector('#cancelGiftCardContainer')) === null || _document$querySelect === void 0 ? void 0 : _document$querySelect.parentNode.remove();
        (_store$componentsObj = store.componentsObj) === null || _store$componentsObj === void 0 ? void 0 : (_store$componentsObj$ = _store$componentsObj.giftcard) === null || _store$componentsObj$ === void 0 ? void 0 : _store$componentsObj$.node.unmount('component_giftcard');
      }
      initializeCheckout();
    }
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
  var imagePath = store.checkoutConfiguration.paymentMethodsResponse.imagePath;
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
      var giftCardAmount = store.partialPaymentsOrderObj.remainingAmount ? store.partialPaymentsOrderObj.remainingAmount : store.checkout.options.amount;
      giftCardContainer.innerHTML = '';
      var giftCardNode = store.checkout.create(constants.GIFTCARD, _objectSpread(_objectSpread({}, store.checkoutConfiguration.giftcard), {}, {
        brand: selectedGiftCard.brand,
        name: selectedGiftCard.name,
        amount: giftCardAmount
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
  var imagePath = store.checkoutConfiguration.paymentMethodsResponse.imagePath;
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