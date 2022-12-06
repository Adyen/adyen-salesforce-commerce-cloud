"use strict";

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Script use to handle authentications for different Adyen (in) calls
 */

var StringUtils = require('dw/util/StringUtils');

/**
 *
 * @function Checks the Basic Authentication header agains the give user and password combination
 * @param baHeader The Basic Authentication header
 * @param baUser The Basic Authentication user
 * @param baPassword The basic Authentication password
 */
function checkGivenCredentials(baHeader, baUser, baPassword) {
  var basicPrefix = 'Basic';
  if (baHeader && baHeader.indexOf(basicPrefix) === 0) {
    // Authorization: Basic base64credentials
    var base64Credentials = baHeader.substring(basicPrefix.length).trim();
    var credentials = StringUtils.decodeBase64(base64Credentials);
    // credentials = username:password
    var values = credentials.split(':', 2);
    return values[0] === baUser && values[1] === baPassword;
  }
  return false;
}
module.exports = {
  checkGivenCredentials: checkGivenCredentials
};