'use strict';
var dialog = require('../dialog');

exports.init = function () {
    $('.store-details-link').on('click', function (e) {
        e.preventDefault();
        dialog.open({
            url: $(e.target).attr('href')
        });
    });
};
