"use strict";

function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
var _require = require('./commons'),
  checkIfExpressMethodsAreReady = _require.checkIfExpressMethodsAreReady;
function handleExpressPaymentsVisibility() {
  var _window = window,
    expressMethodsOrder = _window.expressMethodsOrder;
  if (expressMethodsOrder) {
    var sortOrder = expressMethodsOrder.split(',');
    var container = document.getElementById('express-container');
    var toSort = Array.prototype.slice.call(container.children, 0);
    toSort.sort(function (a, b) {
      return sortOrder.indexOf(a.dataset.method) - sortOrder.indexOf(b.dataset.method);
    });
    container.innerHTML = '';
    _toConsumableArray(toSort).map(function (node) {
      return container.appendChild(node);
    });
  }
}
handleExpressPaymentsVisibility();
checkIfExpressMethodsAreReady();