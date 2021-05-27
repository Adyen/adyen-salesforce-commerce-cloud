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
 * Script removing all previous added payment instruments from the provided basket
 */

function removePaymentInstruments(basket) {
  // verify that we have a basket
  if (!basket) {
    return { error: true };
  }

  // get all payment instruments
  const paymentInstruments = basket.getPaymentInstruments();
  const iter = paymentInstruments.iterator();

  // remove them
  while (iter.hasNext()) {
    basket.removePaymentInstrument(iter.next());
  }

  return { error: false };
}

module.exports = {
  removePaymentInstruments,
};
