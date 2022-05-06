'use strict';

/*
* Model to manage customer and login information. Creates a CustomerModel class that with helper methods
* to get and create customers, create and edit accounts, and set or verify login information.
* @module models/CustomerModel
*/

var AbstractModel = require('./AbstractModel');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');
var Form = require('~/cartridge/scripts/models/FormModel');
var Email = require('~/cartridge/scripts/models/EmailModel');

/**
 * Customer helper providing enhanced content functionality
 * @class module:models/CustomerModel~CustomerModel
 *
 * @param {dw.customer.Customer} parameter - The customer object to enhance/wrap.
 */
var CustomerModel = AbstractModel.extend({

    /**
     * Checks the validity of a password reset token.
     * @transactional
     * @alias module:models/CustomerModel~CustomerModel/resetPasswordByToken
     */
    resetPasswordByToken: function (token, password) {
        var customerInstance;
        var resetCustomerPasswordWithTokenResult;

        customerInstance = this;

        resetCustomerPasswordWithTokenResult = Transaction.wrap(function () {
            return customerInstance.object.profile.credentials.setPasswordWithToken(token, password);
        });

        if (resetCustomerPasswordWithTokenResult.error) {
            return false;
        }

        return true;
    },

    /**
     * Checks the validity of a password reset token.
     * @transactional
     * @alias module:models/CustomerModel~CustomerModel/generatePasswordResetToken
     */
    generatePasswordResetToken: function () {
        var token;
        var customerInstance;
        customerInstance = this;

        token = Transaction.wrap(function () {
            return customerInstance.object.profile.credentials.createResetPasswordToken();
        });

        return token;
    }
});

/**
 * Gets the current customer or passes in a customer instance.
 *
 * @alias module:models/CustomerModel~CustomerModel/get
 * @param {dw.customer.Customer} parameter - The customer object to enhance or wrap. If NULL the current customer is
 * retrieved from the session.
 * @returns {module:models/CustomerModel~CustomerModel}
 */
CustomerModel.get = function (parameter) {
    var obj = null;
    if (typeof parameter === 'undefined') {
        obj = customer;
    } else if (typeof parameter === 'object') {
        obj = parameter;
    }
    return new CustomerModel(obj);
};

/**
 * Authenticates the current session using the supplied Login and Password. If a different customer is currently
 * authenticated in the session, then this customer is "logged out" and her/his privacy and form data are deleted.
 *
 * @alias module:models/CustomerModel~CustomerModel/login
 * @param {String} username - Login name.
 * @param {String} password - Password.
 * @param {Boolean} rememberMe - Optional Boolean value indicating whether the customer wants to be remembered on the current
 * computer. If a value of <code>true</code> is supplied a cookie identifying the customer is stored upon successful login. If a value
 * of <code>false</code> or a null value is supplied, then no cookie is stored and any existing cookie is removed.
 * @returns {boolean}
 */
CustomerModel.login = function (username, password, rememberMe) {
    var TempCustomer;
    var authenticatedCustomer;

    TempCustomer = CustomerMgr.getCustomerByLogin(username);

    // @TODO customer locked currently not handled
    if (typeof (TempCustomer) !== 'undefined' && TempCustomer !== null && TempCustomer.profile !== null && TempCustomer.profile.credentials.locked) {
        return false;
    }

    authenticatedCustomer = Transaction.wrap(function () {
        return CustomerMgr.loginCustomer(username, password, rememberMe);
    });

    if (authenticatedCustomer === null) {
        if (typeof (TempCustomer) !== 'undefined' && TempCustomer !== null && TempCustomer.profile !== null && TempCustomer.profile.credentials.locked) {
            Email.get('mail/lockoutemail', TempCustomer.profile.email).setSubject((dw.web.Resource.msg('resource.youraccount', 'email', null))).send({
                TempCustomer: TempCustomer
            });
        }

        return false;
    }
    // @FIXME Rather return a customer instance
    return true;
};

/**
 * Logs out the customer currently logged into the storefront.
 * @alias module:models/CustomerModel~CustomerModel/logout
 */
CustomerModel.logout = function () {
    var rememberMe = Form.get('profile.login.rememberme').value();
    CustomerMgr.logoutCustomer(rememberMe);
};

/**
 * Looks up a customer by its login.
 * @alias module:models/CustomerModel~CustomerModel/getCustomerbyLogin
 * @param {String} login - Login used to retrieve customer.
 */
CustomerModel.retrieveCustomerByLogin = function (login) {
    var customerByLogin = CustomerMgr.getCustomerByLogin(login);

    if (customerByLogin === null) {
        return null;
    }

    return this.get(customerByLogin);
};

/**
 * Creates a customer.
 * @alias module:models/CustomerModel~CustomerModel/createNewCustomer
 * @param {String} login - Login for the customer.
 * A valid login name is between 1 and 256 characters in length, not counting leading or trailing whitespace,
 * and may contain only the following characters:
 *
 * - alphanumeric (Unicode letters or decimal digits)
 * - space
 * - period
 * - dash
 * - underscore
 * - @
 * @param {String} password - Plain customer password, which is encrypted before it is stored at the profile..
 */
CustomerModel.createNewCustomer = function (login, password) {
    var newCustomer = CustomerMgr.createCustomer(login, password);

    if (newCustomer === null) {
        return null;
    }

    return this.get(newCustomer);
};

/**
 * Sets the customer's login.
 *
 * @alias module:models/CustomerModel~CustomerModel/setLogin
 * @param customer - The customer.
 * @param {String} login - Login for the customer.
 * A valid login name is between 1 and 256 characters in length, not counting leading or trailing whitespace,
 * and may contain only the following characters:
 *
 * - alphanumeric (Unicode letters or decimal digits)
 * - space
 * - period
 * - dash
 * - underscore
 * - @
 * @param {String} password - Plain customer password for the current customer, which is encrypted before it is stored at the profile.
 * @return <code>true</code> if the login or password was updated.
 */
CustomerModel.setLogin = function (customerToSet, login, password) {
    //@FIXME Put on customer scope vs. passing in customer
    if ((customerToSet === null) || (login === null) || (password === null) || (customerToSet.profile === null)) {
        return false;
    }
    var result = customerToSet.profile.credentials.setLogin(login, password);
    return result;
};

/**
 * Creates a new customer account.
 * @transactional
 * @alias module:models/CustomerModel~CustomerModel/createAccount
 * @param {String} email - The current customer email address to use for login.
 * @param {String} password - The password of the customer.
 * @param {dw.web.Form} form - The form instance to invalidate.
 * @return <code>true</code> if the account was created successfully.
 * @see module:models/CustomerModel~CustomerModel/createNewCustomer
 * @see module:models/CustomerModel~CustomerModel/setLogin
 */
CustomerModel.createAccount = function (email, password, form) {

    Transaction.begin();

    // Creates a new customer.
    var newCustomer, rememberMe;
    newCustomer = CustomerModel.createNewCustomer(email, password);
    if (newCustomer === null || newCustomer.object === null) {
        Transaction.rollback();
        form.invalidate();
        return false;
    }

    if (!Form.get('profile.customer').copyTo(newCustomer.object.profile)) {
        Transaction.rollback();
        form.invalidate();
        return false;
    }

    // Sets login and password for customer.
    if (!this.setLogin(newCustomer.object, email, password)) {
        Transaction.rollback();
        form.invalidate();
        return false;
    }

    Transaction.commit();

    Form.get('login').copyTo(newCustomer.object.profile.credentials);

    rememberMe = Form.get('profile.login.rememberme').value();

    // Logs the customer in.
    return Transaction.wrap(function () {
        return CustomerMgr.loginCustomer(email, password, rememberMe);
    });

};

/**
 * Checks if the user name exists and communicates the status back.
 *
 * @return <code>true</code> if the login matches the email for the customer
 * @alias module:models/CustomerModel~CustomerModel/checkUserName
 */
CustomerModel.checkUserName = function () {
    //@FIXME get email as parameter
    var profileForm;
    var customerByLogin;

    profileForm = session.forms.profile;

    if (customer.profile.credentials.login === profileForm.customer.email.value) {
        return true;
    }

    customerByLogin = CustomerMgr.getCustomerByLogin(profileForm.customer.email.value);

    if (customerByLogin === null) {
        return true;
    }

    return false;
};

/**
 * Checks validity of a password reset token.
 * @alias module:models/CustomerModel~CustomerModel/getByPasswordResetToken
 * @param token the token to validate
 * @return customer record assocated with the token or null if the token is expired or not associated with
 * a customer record.
 */
CustomerModel.getByPasswordResetToken = function (token) {
    var result;
    var customerByPasswordToken;

    if (empty(token)) {
        result = null;
    } else {
        customerByPasswordToken = CustomerMgr.getCustomerByToken(token);

        if (customerByPasswordToken === null) {
            result = null;
        } else {
            result = CustomerModel.get(customerByPasswordToken);
        }
    }
    return result;
};

/**
 * Updates a customer account with form data.
 * @transactional
 * @alias module:models/CustomerModel~CustomerModel/editAccount
 * @param email the current customer email address to use for login
 * @param password the password of the current customer
 * @param form the form to invalidate
 * @return <code>true</code> if transaction is successfully committed, <code>false</code> if
 * <ul><li>the customer password cannot be set
 * </li><li>the customer login cannot be set
 * </li><li>the new password cannot be saved to the customer profile.</li></ul>
 */
CustomerModel.editAccount = function (email, password, currentPassword, form) {

    Transaction.begin();

    var newPassword = password;
    var oldPassword = currentPassword;
    var setCustomerPassword = customer.profile.credentials.setPassword(newPassword, oldPassword, true);

    if (setCustomerPassword.error || !CustomerModel.setLogin(customer, email, password) || !Form.get('profile.customer').copyTo(customer.profile)) {
        Transaction.rollback();
        return false;
    }

    Transaction.commit();

    form.clear();

    return true;
};

/** The customer class */
module.exports = CustomerModel;
