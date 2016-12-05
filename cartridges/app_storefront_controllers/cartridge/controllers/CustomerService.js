'use strict';

/**
 * This controller handles customer service related pages, such as the contact us form.
 *
 * @module controllers/CustomerService
 */

/* API Includes */
var Status = require('dw/system/Status');

/* Script Modules */
var app = require('~/cartridge/scripts/app');
var guard = require('~/cartridge/scripts/guard');


/**
 * Renders the customer service overview page.
 */
function show() {
    app.getView('CustomerService').render('content/customerservice');
}

/**
 * Renders the left hand navigation.
 */
function leftNav() {
    app.getView('CustomerService').render('content/customerserviceleftnav');
}

/**
 * Provides a contact us form which sends an email to the configured customer service email address.
 */
function contactUs() {
    app.getForm('contactus').clear();
    app.getView('CustomerService').render('content/contactus');
}

/**
 * The form handler for the contactus form.
 */
function submit() {
    var contactUsForm = app.getForm('contactus');

    var contactUsResult = contactUsForm.handleAction({
        send: function (formgroup) {
            // Change the MailTo in order to send to the store's customer service email address. It defaults to the
            // user's email.
            var Email = app.getModel('Email');
            return Email.get('mail/contactus', formgroup.email.value)
                .setFrom(formgroup.email.value)
                .setSubject(formgroup.myquestion.value)
                .send({});
        },
        error: function () {
            // No special error handling if the form is invalid.
            return null;
        }
    });

    if (contactUsResult && (contactUsResult.getStatus() === Status.OK)) {
        app.getView('CustomerService', {
            ConfirmationMessage: 'edit'
        }).render('content/contactus');
    } else {
        app.getView('CustomerService').render('content/contactus');
    }
}

/*
 * Module exports
 */

/*
 * Web exposed methods
 */
/** @see module:controllers/CustomerService~show */
exports.Show = guard.ensure(['get'], show);
/** @see module:controllers/CustomerService~leftNav */
exports.LeftNav = guard.ensure(['get'], leftNav);
/** @see module:controllers/CustomerService~contactUs */
exports.ContactUs = guard.ensure(['get', 'https'], contactUs);
/** @see module:controllers/CustomerService~submit */
exports.Submit = guard.ensure(['post', 'https'], submit);
