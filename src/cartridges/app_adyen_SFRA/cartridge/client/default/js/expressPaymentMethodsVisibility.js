const { checkIfExpressMethodsAreReady } = require('./commons');

function handleExpressPaymentsVisibility() {
  const { expressMethodsOrder } = window;
  if (expressMethodsOrder) {
    const sortOrder = expressMethodsOrder.split(',');
    const container = document.getElementById('express-container');
    const toSort = Array.prototype.slice.call(container.children, 0);
    toSort.sort(
      (a, b) =>
        sortOrder.indexOf(a.dataset.method) -
        sortOrder.indexOf(b.dataset.method),
    );
    container.innerHTML = '';
    [...toSort].map((node) => container.appendChild(node));
  }
}

handleExpressPaymentsVisibility();
checkIfExpressMethodsAreReady();
