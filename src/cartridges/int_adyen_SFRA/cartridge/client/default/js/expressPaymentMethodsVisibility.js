async function handleExpressPaymentsVisibility() {
  const { expressMethodsOrder } = window;
  if (expressMethodsOrder) {
    const sortOrder = expressMethodsOrder.split(',');
    const container = document.getElementById('express-container');
    let toSort = container.children;
    toSort = Array.prototype.slice.call(toSort, 0);
    toSort.sort(
      (a, b) =>
        sortOrder.indexOf(a.dataset.method) -
        sortOrder.indexOf(b.dataset.method),
    );
    container.innerHTML = '';
    for (let i = 0; i < toSort.length; i += 1) {
      container.appendChild(toSort[i]);
    }
  }
}

handleExpressPaymentsVisibility();
