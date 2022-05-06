'use strict';

/**
 * Model for form functionality.
 *
 * @module models/FormModel
 */

var AbstractModel = require('./AbstractModel');

/**
 * Form helper providing enhanced Form functionality
 * Each form action should define a form action callback.
 *
 * @callback module:models/Form~ActionCallback
 * @param {dw.web.Form|dw.web.FormGroup} formGroup The current form (group) instance
 * @param {dw.web.FormAction} action The triggered form action
 * @class module:models/FormModel~FormModel
 * @extends module:models/AbstractModel
 */
var FormModel = AbstractModel.extend(
    /** @lends module:models/FormModel~FormModel.prototype */
    {
        /**
         * Gets a new instance of FormModel.
         *
         * @param {dw.web.Form|dw.web.FormGroup} groupName - The form (group) instance to get from session.forms.
         * @alias module:models/FormModel~FormModel/get
         * @return {module:models/FormModel~FormModel} A new instance of a FormModel wrapping the passed form.
         */
        get: function (groupName) {
            if (this.object) {
                return FormModel.get(require('~/cartridge/scripts/object').resolve(this.object,groupName));
            }
            return new FormModel();
        },

        /**
         * Handles the submitted form action or calls the error handler in case the form is not valid. If the form does
         * not validate, the TriggeredAction is set to null.
         *
         * @alias module:models/FormModel~FormModel/handleAction
         * @param {Object<string|module:models/FormModel~ActionCallback>} formHandler Callbacks for each possible form action.
         * returns null if no explicit error handler is defined.
         * @example
         * require('~/models/FormModel').get('login').handleAction({
         *     "login" : function(formgroup, action){
         *         // handle login button
         *     },
         *     "register" : function(formgroup, action){
         *         // handle registration button
         *     }
         * });
         */
        handleAction: function (formHandler) {
            // Checks whether an action is defined and if the form is invalid.
            var action = request.triggeredFormAction;
            if (!action || !action.formId) {
                // Checks whether there is an explicit error handler defined.
                if ('error' in formHandler) {
                    return formHandler.error.apply(formHandler, [this.object, action]);
                }
                // Logs a warning and returns null if no explicit error handler is defined.
                else {
                    dw.system.Logger.warn('Action handler called without action ' + this.object.formId);
                    return null;
                }
            } else {
                if (formHandler[action.formId]) {
                    return formHandler[action.formId].apply(formHandler, [this.object, action]);
                } else {
                    dw.system.Logger.error('Action handler for action "{0}"" not defined.', action.formId);
                    // Throws an error as this is an implementation bug.
                    throw new Error('Form handler undefined');
                }
            }
        },

        /**
         * Updates the form with the corresponding property values from the given object.
         *
         * @alias module:models/FormModel~FormModel/copyFrom
         * @param {Object }updateObject - The system object to take property values from.
         * @param {Boolean} clear - Optional. If true, clear the form before updating it.
         * @returns {module:models/FormModel~FormModel} Returns the updated form.
         */
        copyFrom: function (updateObject, clear) {
            if (clear) {
                this.object.clear();
            }

            // Updates the form.
            this.object.copyFrom(updateObject);

            return this;
        },

        /**
         * Updates an object with property values from the form.
         *
         * @transactional
         * @alias module:models/FormModel~FormModel/copyTo
         * @param {Object} updateObject - A Salesforce Commerce Cloud system or custom object to update with form data.
         * @returns {Boolean} true if the passed object is successfully updated using for the
         * passed group properties specified in the form definition bindings. false if an error is thrown
         */
        copyTo: function (updateObject) {

            try {
                var group = this.object;
                dw.system.Transaction.wrap(function () {
                    group.copyTo(updateObject);
                });
                return true;
            }
            catch (err) {
                var Logger = require('dw/system/Logger');
                Logger.error(err);
                return false;
            }

        },

        /**
         * Clears the wrapped form instance.
         * @alias module:models/FormModel~FormModel/clear
         */
        clear: function () {
            this.object.clearFormElement();
        },

        /**
         * Invalidates the wrapped form instance.
         *
         * @alias module:models/FormModel~FormModel/invalidate
         * @param {String} Optional. If not specified, the error text is configured in the form definition.
         * The "value-error" message is used for FormField instances and "form-error" is used for FormGroup instances.
         * If an error string is passed, it is used in the error message.
         */
        invalidate: function (error) {
            if (error) {
                this.object.invalidateFormElement(error);
            } else {
                this.object.invalidateFormElement();
            }
        },

        /**
         * Gets a value from a wrapped form element.
         * @alias module:models/FormModel~FormModel/value
         */
        value: function () {
            return this.object.value;
        },

        /**
         * Returns the value of a subelement.
         * @alias module:models/FormModel~FormModel/getValue
         */
        getValue: function (groupName) {
            return this.get(groupName).value();
        },

        /**
         * Sets the value of a subelement.
         * @alias module:models/FormModel~FormModel/setValue
         */
        setValue: function (groupName, value) {
            var obj = this.get(groupName).object;
            if (obj) {
                obj.value = value;
            }
        },

        /**
         * Gets the bound object of a wrapped form element. Objects are bound to form elements in the form definition.
         * @alias module:models/FormModel~FormModel/getBinding
         */
        getBinding: function () {
            var dwForm = this.object;
            return dwForm.object;
        }

    });

/**
 * Gets a new instance for a given form reference or form object.
 *
 * @alias module:models/FormModel~FormModel/get
 * @param formReference {dw.web.FormElement|String} Salesforce form id (/forms/$name$.xml) or Salesforce form object.
 * @returns {module:models/FormModel~FormModel} A new instance of FormModel that wraps the passed form.
 */
FormModel.get = function (formReference) {
    var formInstance = null;
    if (typeof formReference === 'string') {
        formInstance = require('~/cartridge/scripts/object').resolve(session.forms, formReference);
    } else if (typeof formReference === 'object') {
        formInstance = formReference;
    }

    return new FormModel(formInstance);
};

/** The Form class */
module.exports = FormModel;
