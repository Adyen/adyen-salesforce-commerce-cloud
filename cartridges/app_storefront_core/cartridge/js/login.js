'use strict';

var dialog = require('./dialog'),
    page = require('./page'),
    validator = require('./validator');

var login = {
    /**
     * @private
     * @function
     * @description init events for the loginPage
     */
    init: function () {
        //o-auth binding for which icon is clicked
        $('.oAuthIcon').bind('click', function () {
            $('#OAuthProvider').val(this.id);
        });
    

        //toggle the value of the rememberme checkbox
        $('#dwfrm_login_rememberme').bind('change', function () {
            if ($('#dwfrm_login_rememberme').attr('checked')) {
                $('#rememberme').val('true');
            } else {
                $('#rememberme').val('false');
            }
        });
        
        $('#password-reset').on('click', function (e) {
            e.preventDefault();
            dialog.open({
                url: $(e.target).attr('href'),
                options: {
                    open: function () {
                        validator.init();
                        var $requestPasswordForm = $('[name$="_requestpassword"]');
                        var $submit = $requestPasswordForm.find('[name$="_requestpassword_send"]');
                        $($submit).on('click', function (e) {
                            if (!$requestPasswordForm.valid()) {
                                return;
                            }
                            e.preventDefault();
                            var data = $requestPasswordForm.serialize();
                            // add form action to data
                            data += '&' + $submit.attr('name') + '=';
                            // make sure the server knows this is an ajax request
                            if (data.indexOf('ajax') === -1) {
                                data += '&format=ajax';
                            }
                            $.ajax({
                                type: 'POST',
                                url: $requestPasswordForm.attr('action'),
                                data: data,
                                success: function (response) {
                                    if (typeof response === 'object' &&
                                            !response.success &&
                                            response.error === Resources.CSRF_TOKEN_MISMATCH) {
                                        page.redirect(Urls.csrffailed);
                                    } else if (typeof response === 'string') {
                                        dialog.$container.html(response);
                                    }
                                },
                                failure: function () {
                                    dialog.$container.html('<h1>' + Resources.SERVER_ERROR + '</h1>');
                                }
                            });
                        });
                    }
                }
            });
        });
    }
}

module.exports = login;
