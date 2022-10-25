"use strict";

var ajax = require('../../ajax');
var formPrepare = require('./formPrepare');
var giftcard = require('../../giftcard');
var util = require('../../util');
var adyenCheckout = require('../../adyen-checkout');

/**
 * @function
 * @description Fills the Credit Card form with the passed data-parameter
 * and clears the former cvn input
 * @param {Object} data The Credit Card data (holder, type, masked number, expiration month/year)
 */
function setCCFields(data) {
  var $creditCard = $('[data-method="CREDIT_CARD"]');
  $creditCard.find('input[name$="creditCard_owner"]').val(data.holder).trigger('change');
  $creditCard.find('select[name$="_type"]').val(data.type).trigger('change');
  $creditCard.find('input[name*="_creditCard_number"]').val(data.maskedNumber).trigger('change');
  $creditCard.find('[name$="_month"]').val(data.expirationMonth).trigger('change');
  $creditCard.find('[name$="_year"]').val(data.expirationYear).trigger('change');
  $creditCard.find('input[name$="_cvn"]').val('').trigger('change');
  $creditCard.find('[name$="creditCard_selectedCardID"]').val(data.selectedCardID).trigger('change');
}

/**
 * @function
 * @description Updates the credit card form with the attributes of a given card
 * @param {String} cardID the credit card ID of a given card
 */
function populateCreditCardForm(cardID) {
  // load card details
  var url = util.appendParamToURL(Urls.billingSelectCC, 'creditCardUUID', cardID);
  ajax.getJson({
    url: url,
    callback: function callback(data) {
      if (!data) {
        window.alert(Resources.CC_LOAD_ERROR);
        return false;
      }
      setCCFields(data);
    }
  });
}
$('input[name="brandCode"]').on('change', function () {
  $('#dwfrm_adyPaydata_issuer').val('');
  $('.checkoutComponent').hide();
  $("#component_".concat($(this).val())).show();
});

/**
 * @function
 * @description Changes the payment method form depending on the passed paymentMethodID
 * @param {String} paymentMethodID the ID of the payment method, to which the payment
 * method form should be changed to
 */
function updatePaymentMethod(paymentMethodID) {
  var $paymentMethods = $('.payment-method');
  $paymentMethods.removeClass('payment-method-expanded');
  var $selectedPaymentMethod = $paymentMethods.filter("[data-method=\"".concat(paymentMethodID, "\"]"));
  if ($selectedPaymentMethod.length === 0) {
    $selectedPaymentMethod = $('[data-method="Custom"]');
  }
  $selectedPaymentMethod.addClass('payment-method-expanded');

  // ensure checkbox of payment method is checked
  $('input[name$="_selectedPaymentMethodID"]').removeAttr('checked');
  $("input[value=".concat(paymentMethodID, "]")).prop('checked', 'checked');
  formPrepare.validateForm();
}

/**
 * @function
 * @description Changes the payment type or issuerId of the selected payment method
 * @param {String, Boolean} value of payment type or issuerId and a test value to see
 * which one it is, to which the payment type or issuerId should be changed to
 */
function updatePaymentType(selectedPayType, issuerType) {
  if (issuerType) {
    $('#dwfrm_adyPaydata_issuer').val(selectedPayType);
  } else {
    $('input[name="brandCode"]').removeAttr('checked');
    $("input[value=".concat(selectedPayType, "]")).prop('checked', 'checked');
  }

  // if the payment type has hidden fields reveal it
  $("#component_".concat(selectedPayType)).show();
  formPrepare.validateForm();
}

/**
 * @function
 * @description loads billing address, Gift Certificates, Coupon and Payment methods
 */
exports.init = function () {
  var $checkoutForm = $('.checkout-billing');
  var $addGiftCert = $('#add-giftcert');
  var $giftCertCode = $('input[name$="_giftCertCode"]');
  var $addCoupon = $('#add-coupon');
  var $couponCode = $('input[name$="_couponCode"]');
  var $selectPaymentMethod = $('.payment-method-options');
  var selectedPaymentMethod = $selectPaymentMethod.find(':checked').val();
  var $payType = $('[name="brandCode"]');
  var $issuer = $('.issuer');
  var selectedPayType = $payType.find(':checked').val();
  formPrepare.init({
    formSelector: 'form[id$="billing"]',
    continueSelector: '[name$="billing_save"]'
  });

  // default payment method to 'CREDIT_CARD'
  updatePaymentMethod(selectedPaymentMethod || 'CREDIT_CARD');
  $selectPaymentMethod.on('click', 'input[type="radio"]', function () {
    updatePaymentMethod($(this).val());
    if ($(this).val() === 'Adyen' && $payType.length > 0) {
      // set payment type of Adyen to the first one
      updatePaymentType(selectedPayType || $payType[0].value, false);
    } else {
      $payType.removeAttr('checked');
    }
  });
  $issuer.on('change', function () {
    updatePaymentType($(this).val(), true);
  });
  $payType.on('change', function () {
    $('#selectedIssuer').val('');
    $issuer.hide();
    $('.checkoutComponent').hide();
    $("#component_".concat($(this).val())).show();
    if ($(this).siblings('.issuer').length > 0) {
      $('#selectedIssuer').val($(this).siblings('.issuer').val());
      $(this).siblings('.issuer').show();
    }
  });

  // select credit card from list
  $('#creditCardList').on('change', function () {
    var cardUUID = $(this).val();
    if (!cardUUID) {
      return;
    }
    populateCreditCardForm(cardUUID);

    // remove server side error
    $('.required.error').removeClass('error');
    $('.error-message').remove();
  });
  $('#check-giftcert').on('click', function (e) {
    e.preventDefault();
    var $balance = $('.balance');
    if ($giftCertCode.length === 0 || $giftCertCode.val().length === 0) {
      var error = $balance.find('span.error');
      if (error.length === 0) {
        error = $('<span>').addClass('error').appendTo($balance);
      }
      error.html(Resources.GIFT_CERT_MISSING);
      return;
    }
    giftcard.checkBalance($giftCertCode.val(), function (data) {
      if (!data || !data.giftCertificate) {
        $balance.html(Resources.GIFT_CERT_INVALID).removeClass('success').addClass('error');
        return;
      }
      $balance.html("".concat(Resources.GIFT_CERT_BALANCE, " ").concat(data.giftCertificate.balance)).removeClass('error').addClass('success');
    });
  });
  $addGiftCert.on('click', function (e) {
    e.preventDefault();
    var code = $giftCertCode.val();
    var $error = $checkoutForm.find('.giftcert-error');
    if (code.length === 0) {
      $error.html(Resources.GIFT_CERT_MISSING);
      return;
    }
    var url = util.appendParamsToUrl(Urls.redeemGiftCert, {
      giftCertCode: code,
      format: 'ajax'
    });
    $.getJSON(url, function (data) {
      var fail = false;
      var msg = '';
      if (!data) {
        msg = Resources.BAD_RESPONSE;
        fail = true;
      } else if (!data.success) {
        msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
        fail = true;
      }
      if (fail) {
        $error.html(msg);
      } else {
        window.location.assign(Urls.billing);
      }
    });
  });
  $addCoupon.on('click', function (e) {
    e.preventDefault();
    var $error = $checkoutForm.find('.coupon-error');
    var code = $couponCode.val();
    if (code.length === 0) {
      $error.html(Resources.COUPON_CODE_MISSING);
      return;
    }
    var url = util.appendParamsToUrl(Urls.addCoupon, {
      couponCode: code,
      format: 'ajax'
    });
    $.getJSON(url, function (data) {
      var fail = false;
      var msg = '';
      if (!data) {
        msg = Resources.BAD_RESPONSE;
        fail = true;
      } else if (!data.success) {
        msg = data.message.split('<').join('&lt;').split('>').join('&gt;');
        fail = true;
      }
      if (fail) {
        $error.html(msg);
        return;
      }

      // basket check for displaying the payment section, if the adjusted total of
      // the basket is 0 after applying the coupon this will force a page refresh to
      // display the coupon message based on a parameter message
      if (data.success && data.baskettotal === 0) {
        window.location.assign(Urls.billing);
      }
    });
  });

  // trigger events on enter
  $couponCode.on('keydown', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $addCoupon.click();
    }
  });
  $giftCertCode.on('keydown', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $addGiftCert.click();
    }
  });
  if (SitePreferences.ADYEN_SF_ENABLED && !window.amazonCheckoutSessionId) {
    adyenCheckout.initBilling();
  }
};