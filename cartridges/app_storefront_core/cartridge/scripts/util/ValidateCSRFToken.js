'use strict';

var CSRFProtection = require('dw/web/CSRFProtection');

function execute() {

    if (!CSRFProtection.validateRequest()) {
        return PIPELET_ERROR;
    }

   return PIPELET_NEXT;
}
