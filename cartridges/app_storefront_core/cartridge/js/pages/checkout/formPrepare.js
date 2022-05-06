'use strict';

var _ = require('lodash');

var $form, $continue, $requiredInputs, validator;

var hasEmptyRequired = function () {
    // filter out only the visible fields
    var requiredValues = $requiredInputs.filter(':visible').map(function () {
        return $(this).val();
    });
    return _(requiredValues).includes('');
};

var validateForm = function () {
    // only validate form when all required fields are filled to avoid
    // throwing errors on empty form
    if (!validator) {
        return;
    }
    if (!hasEmptyRequired()) {
        if (validator.form()) {
            $continue.removeAttr('disabled');
        }
    } else {
        $continue.attr('disabled', 'disabled');
    }
};

var validateEl = function () {
    if ($(this).val() === '') {
        $continue.attr('disabled', 'disabled');
    } else {
        // enable continue button on last required field that is valid
        // only validate single field
        if (validator.element(this) && !hasEmptyRequired()) {
            $continue.removeAttr('disabled');
        } else {
            $continue.attr('disabled', 'disabled');
        }
    }
};

var init = function (opts) {
    if (!opts.formSelector || !opts.continueSelector) {
        throw new Error('Missing form and continue action selectors.');
    }
    $form = $(opts.formSelector);
    $continue = $(opts.continueSelector);
    validator = $form.validate();
    $requiredInputs = $('.required', $form).find(':input');
    validateForm();
    // start listening
    $requiredInputs.on('change', validateEl);
    $requiredInputs.filter('input').on('keyup', _.debounce(validateEl, 200));
};

exports.init = init;
exports.validateForm = validateForm;
exports.validateEl = validateEl;
