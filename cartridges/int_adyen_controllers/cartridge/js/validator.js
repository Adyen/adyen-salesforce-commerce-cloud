"use strict";

// const naPhone = /^\(?([2-9][0-8][0-9])\)?[\-\. ]?([2-9][0-9]{2})[\-\. ]?([0-9]{4})(\s*x[0-9]+)?$/
var regex = {
  phone: {},
  postal: {},
  notCC: /^(?!(([0-9 -]){13,19})).*$/
};
// global form validator settings
var settings = {
  errorClass: 'error',
  errorElement: 'span',
  onkeyup: false,
  onfocusout: function onfocusout(element) {
    if (!this.checkable(element)) {
      this.element(element);
    }
  }
};
/**
 * @function
 * @description Validates a given phone number against the countries phone regex
 * @param {String} value The phone number which will be validated
 * @param {String} el The input field
 */
var validatePhone = function validatePhone(value, el) {
  var country = $(el).closest('form').find('.country');
  if (country.length === 0 || country.val().length === 0 || !regex.phone[country.val().toLowerCase()]) {
    return true;
  }
  var rgx = regex.phone[country.val().toLowerCase()];
  var isOptional = this.optional(el);
  var isValid = rgx.test($.trim(value));
  return isOptional || isValid;
};

/**
 * @function
 * @description Validates that a credit card owner is not a Credit card number
 * @param {String} value The owner field which will be validated
 * @param {String} el The input field
 */
var validateOwner = function validateOwner(value) {
  var isValid = regex.notCC.test($.trim(value));
  return isValid;
};

/**
 * Add phone validation method to jQuery validation plugin.
 * Text fields must have 'phone' css class to be validated as phone
 */
$.validator.addMethod('phone', validatePhone, Resources.INVALID_PHONE);

/**
 * Add CCOwner validation method to jQuery validation plugin.
 * Text fields must have 'owner' css class to be validated as not a credit card
 */
$.validator.addMethod('owner', validateOwner, Resources.INVALID_OWNER);

/**
 * Add gift cert amount validation method to jQuery validation plugin.
 * Text fields must have 'gift-cert-amont' css class to be validated
 */
$.validator.addMethod('gift-cert-amount', function (value, el) {
  var isOptional = this.optional(el);
  var isValid = !isNaN(value) && parseFloat(value) >= 5 && parseFloat(value) <= 5000;
  return isOptional || isValid;
}, Resources.GIFT_CERT_AMOUNT_INVALID);

/**
 * Add positive number validation method to jQuery validation plugin.
 * Text fields must have 'positivenumber' css class to be validated as positivenumber
 */
$.validator.addMethod('positivenumber', function (value) {
  if ($.trim(value).length === 0) {
    return true;
  }
  return !isNaN(value) && Number(value) >= 0;
}, ''); // '' should be replaced with error message if needed

$.extend($.validator.messages, {
  required: Resources.VALIDATE_REQUIRED,
  remote: Resources.VALIDATE_REMOTE,
  email: Resources.VALIDATE_EMAIL,
  url: Resources.VALIDATE_URL,
  date: Resources.VALIDATE_DATE,
  dateISO: Resources.VALIDATE_DATEISO,
  number: Resources.VALIDATE_NUMBER,
  digits: Resources.VALIDATE_DIGITS,
  creditcard: Resources.VALIDATE_CREDITCARD,
  equalTo: Resources.VALIDATE_EQUALTO,
  maxlength: $.validator.format(Resources.VALIDATE_MAXLENGTH),
  minlength: $.validator.format(Resources.VALIDATE_MINLENGTH),
  rangelength: $.validator.format(Resources.VALIDATE_RANGELENGTH),
  range: $.validator.format(Resources.VALIDATE_RANGE),
  max: $.validator.format(Resources.VALIDATE_MAX),
  min: $.validator.format(Resources.VALIDATE_MIN)
});
var validator = {
  regex: regex,
  settings: settings,
  init: function init() {
    var self = this;
    $('form:not(.suppress)').each(function () {
      $(this).validate(self.settings);
    });
  },
  initForm: function initForm(f) {
    $(f).validate(this.settings);
  }
};
module.exports = validator;