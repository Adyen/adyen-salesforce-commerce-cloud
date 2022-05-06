'use strict';
/**
 * This view provides rendering methods for login templates.
 * @module views/LoginView
 */

var View = require('./View');
/**
 * Helper class for rendering login functionality.
 * @class module:views/LoginView~LoginView
 * @extends module:views/View
 * @lends module:views/LoginView~LoginView.prototype
*/
var LoginView = View.extend({
    // does not work, hence workaround via init()
    //ContinueURL : dw.web.URLUtils.https('Login-LoginForm'),
    template: 'account/login/accountlogin',

    /**
     * View for login functionality.
     *
     * @constructs module:views/LoginView~LoginView
     * @param {Object} params The parameters to pass to the template.
     */
    init: function (params) {
        this._super(params);
        this.ContinueURL = dw.web.URLUtils.https('Login-LoginForm');

        if (request.httpParameterMap.scope) {
            this.ContinueURL = this.ContinueURL.append('scope', request.httpParameterMap.scope.value);

            switch (request.httpParameterMap.scope.value) {
                case 'wishlist' :
                    this.template = 'account/wishlist/wishlistlanding';
                    break;
                case 'giftregistry' :
                    this.template = 'account/giftregistry/giftregistrylanding';
                    break;
                case 'checkout' :
                    this.template = 'checkout/checkoutlogin';
                    break;
                default:
            }
        }
    }

});

module.exports = LoginView;
