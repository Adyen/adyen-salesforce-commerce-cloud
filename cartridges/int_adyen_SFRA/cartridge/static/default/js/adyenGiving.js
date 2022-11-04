/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./cartridges/int_adyen_SFRA/cartridge/client/default/js/adyenGiving.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./cartridges/int_adyen_SFRA/cartridge/client/default/js/adyenGiving.js":
/*!******************************************************************************!*\
  !*** ./cartridges/int_adyen_SFRA/cartridge/client/default/js/adyenGiving.js ***!
  \******************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar adyenGivingNode = document.getElementById('donate-container');\nfunction handleOnDonate(state, component) {\n  if (!state.isValid) {\n    return;\n  }\n  var selectedAmount = state.data.amount;\n  var donationData = {\n    amountValue: selectedAmount.value,\n    amountCurrency: selectedAmount.currency,\n    orderNo: orderNo,\n    pspReference: pspReference\n  };\n  $.ajax({\n    url: window.donateURL,\n    type: 'post',\n    data: donationData,\n    success: function success() {\n      component.setStatus('success');\n    }\n  });\n}\nfunction handleOnCancel(state, component) {\n  var adyenGiving = document.getElementById('adyenGiving');\n  adyenGiving.style.transition = 'all 3s ease-in-out';\n  adyenGiving.style.display = 'none';\n  component.unmount();\n}\nfunction getAmounts() {\n  try {\n    return JSON.parse(donationAmounts);\n  } catch (e) {\n    return [];\n  }\n}\nvar donationConfig = {\n  amounts: getAmounts(),\n  backgroundUrl: adyenGivingBackgroundUrl,\n  description: charityDescription,\n  logoUrl: adyenGivingLogoUrl,\n  name: charityName,\n  url: charityWebsite,\n  showCancelButton: true,\n  onDonate: handleOnDonate,\n  onCancel: handleOnCancel\n};\nAdyenCheckout(window.Configuration).then(function (checkout) {\n  checkout.create('donation', donationConfig).mount(adyenGivingNode);\n});\n\n//# sourceURL=webpack:///./cartridges/int_adyen_SFRA/cartridge/client/default/js/adyenGiving.js?");

/***/ })

/******/ });