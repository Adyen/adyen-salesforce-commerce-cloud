'use strict';

/**
 * @module app
 */

/**
 * Returns the model for the given name. The model is expected under the models directory.
 */
exports.getModel = function (modelName) {
    return require('./models/' + modelName + 'Model');
};

/**
 * Returns a view for the given name. The view is expected under the views directory.
 * If no view exists with this name or if no view name is specified, a default view is returned instead.
 *
 * @param  {string} viewName   The name of the view
 * @param  {object} parameters The parameters to pass to the view
 * @return {object/View}       The view object instance
 *
 * @example
 * // use an anonymous view
 * require('~/app').getView().render('path/to/template');
 *
 * // or use a named view
 * var product = dw.catalog.ProductMgr.getProduct('123456');
 * require('~/app').getView('Product', {
 *     product : product,
 *     showRecommendations : false
 * }).render('path/to/template');
 */
exports.getView = function (viewName, parameters) {
    var View;
    try {

        if (typeof viewName === 'string') {
            View = require('./views/' + viewName + 'View');
        } else {
            // use first argument as parameters if not a string
            // to allow for anonymous views
            parameters = viewName;
            View = require('./views/View');
        }
    } catch (e) {
        View = require('./views/View');
    }
    return new View(parameters || {});
};

/**
 * Use this method to get a new instance for a given form reference or form object.
 *
 * @param formReference {dw.web.FormElement|String} Salesforce form id (/forms/$name$.xml) or Salesforce form object.
 * @returns {module:models/FormModel~FormModel}
 * @example
 * // simple form preparation
 * var form = require('~/app').getForm('registration');
 * form.clear();
 *
 * // handling the form submit
 * var form = require('~/app').getForm('registration');
 * form.handleAction({
 *     'register' : function(formGroup, action){
 *         // handle the action here
 *     },
 *     'error'    : function(){
 *         // handle form errors here
 *     }
 * });
 */
exports.getForm = function (formReference) {
    var formInstance, FormModel;

    FormModel = require('~/cartridge/scripts/models/FormModel');
    formInstance = null;
    if (typeof formReference === 'string') {
        formInstance = require('~/cartridge/scripts/object').resolve(session.forms, formReference);
    } else if (typeof formReference === 'object') {
        formInstance = formReference;
    }

    return new FormModel(formInstance);
};

/**
 * Returns the controller with the given name.
 */
exports.getController = function (controllerName) {
    return require('~/cartridge/controllers/' + controllerName);
};
