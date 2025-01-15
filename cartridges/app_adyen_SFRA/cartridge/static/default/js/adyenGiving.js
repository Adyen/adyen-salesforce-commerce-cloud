/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./cartridges/app_adyen_SFRA/cartridge/client/default/js/adyenGiving.js":
/*!******************************************************************************!*\
  !*** ./cartridges/app_adyen_SFRA/cartridge/client/default/js/adyenGiving.js ***!
  \******************************************************************************/
/***/ (() => {

eval("\n\nvar adyenGivingNode = document.getElementById('donate-container');\nfunction handleOnDonate(state, component) {\n  if (!state.isValid) {\n    return;\n  }\n  var selectedAmount = state.data.amount;\n  var donationData = {\n    amountValue: selectedAmount.value,\n    amountCurrency: selectedAmount.currency,\n    orderNo: window.orderNo,\n    orderToken: window.orderToken,\n    csrf_token: $('#adyen-token').val()\n  };\n  $.ajax({\n    url: window.donateURL,\n    type: 'post',\n    data: donationData,\n    success: function success() {\n      component.setStatus('success');\n    }\n  });\n}\nfunction handleOnCancel(state, component) {\n  var adyenGiving = document.getElementById('adyenGiving');\n  adyenGiving.style.transition = 'all 3s ease-in-out';\n  adyenGiving.style.display = 'none';\n  component.unmount();\n}\nfunction getAmounts() {\n  try {\n    return JSON.parse(donationAmounts);\n  } catch (e) {\n    return [];\n  }\n}\nvar donationConfig = {\n  amounts: getAmounts(),\n  backgroundUrl: adyenGivingBackgroundUrl,\n  description: decodeURI(charityDescription),\n  logoUrl: adyenGivingLogoUrl,\n  name: decodeURI(charityName),\n  url: charityWebsite,\n  showCancelButton: true,\n  onDonate: handleOnDonate,\n  onCancel: handleOnCancel\n};\nAdyenCheckout(window.Configuration).then(function (checkout) {\n  checkout.create('donation', donationConfig).mount(adyenGivingNode);\n});\n\n//# sourceURL=webpack://app_adyen_SFRA/./cartridges/app_adyen_SFRA/cartridge/client/default/js/adyenGiving.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./cartridges/app_adyen_SFRA/cartridge/client/default/js/adyenGiving.js"]();
/******/ 	
/******/ })()
;