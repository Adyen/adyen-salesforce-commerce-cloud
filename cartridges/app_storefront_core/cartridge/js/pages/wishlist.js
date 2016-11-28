'use strict';

var addProductToCart = require('./product/addToCart'),
    page = require('../page'),
    login = require('../login'),
    util = require('../util');

exports.init = function () {
    addProductToCart();
    $('#editAddress').on('change', function () {
        page.redirect(util.appendParamToURL(Urls.wishlistAddress, 'AddressID', $(this).val()));
    });

    //add js logic to remove the , from the qty feild to pass regex expression on client side
    $('.option-quantity-desired input').on('focusout', function () {
        $(this).val($(this).val().replace(',', ''));
    });

    login.init();

};
