'use strict';
var server = require('server');
server.extend(module.superModule);

function getEncryptedData(){
    var paymentForm = server.forms.getForm('billing');
    return paymentForm.creditCardFields.adyenEncryptedData.value;
}

server.append('SubmitPayment', function(req, res, next) {
    var viewData = res.getViewData();
    viewData.adyenEncryptedData =  getEncryptedData();
    //Not saving card until Recurring is implemented
    viewData.saveCard = false;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports()
