"use strict";

/* eslint-disable global-require */
var processInclude = require('base/util');
$(document).ready(function () {
  processInclude(require('base/product/detail'));
  processInclude(require('./product/expressPayments'));
});