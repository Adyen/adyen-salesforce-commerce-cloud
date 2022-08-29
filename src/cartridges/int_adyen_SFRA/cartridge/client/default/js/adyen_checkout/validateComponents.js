const store = require('../../../../store');

module.exports.validateComponents = function validateComponents() {
  const customMethods = {};

  if (store.selectedMethod in customMethods) {
    customMethods[store.selectedMethod]();
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(
    store.stateData,
  );
  if (store.splitPaymentsOrderObj) {
    document.querySelector('#adyenSplitPaymentsOrder').value = JSON.stringify(
      store.splitPaymentsOrderObj,
    );
  }
};
