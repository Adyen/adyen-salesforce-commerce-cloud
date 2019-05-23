'use strict';

var processInclude = require('base/util');
var adyen3d = require('./threeds2/adyen3ds2');

$(document).ready(function () { // eslint-disable-line
    console.log('testAdyen3d');
    processInclude(require('./threeds2/adyen3ds2'));
});

