const { getConnectedTerminals } = require('../../../commons');

function addPosTerminals(terminals) {
  const ddTerminals = document.createElement('select');
  ddTerminals.id = 'terminalList';
  Object.keys(terminals).forEach((t) => {
    const option = document.createElement('option');
    option.value = terminals[t];
    option.text = terminals[t];
    ddTerminals.appendChild(option);
  });
  document.querySelector('#adyenPosTerminals').append(ddTerminals);
}

function renderPosTerminals(adyenConnectedTerminals) {
  const removeChilds = () => {
    const posTerminals = document.querySelector('#adyenPosTerminals');
    while (posTerminals.firstChild) {
      posTerminals.removeChild(posTerminals.firstChild);
    }
  };
  if (adyenConnectedTerminals) {
    removeChilds();
    addPosTerminals(adyenConnectedTerminals);
  }
}

function addStores(stores) {
  const storeDropdown = document.createElement('select');
  storeDropdown.id = 'storeList';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.text = 'Select a store';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  storeDropdown.appendChild(placeholderOption);

  const storeArray = typeof stores === 'string' ? stores.split(',') : stores;

  storeArray.forEach((terminalStore) => {
    const option = document.createElement('option');
    option.value = terminalStore.trim();
    option.text = terminalStore.trim();
    storeDropdown.appendChild(option);
  });
  const storeDropdownContainer = document.querySelector('#adyenPosStores');
  if (storeDropdownContainer) {
    const existingDropdown = storeDropdownContainer.querySelector('#storeList');
    if (existingDropdown) {
      storeDropdownContainer.removeChild(existingDropdown);
    }
    storeDropdownContainer.append(storeDropdown);
  }
  storeDropdown.addEventListener('change', async () => {
    const terminalDropdownContainer =
      document.querySelector('#adyenPosTerminals');
    const existingTerminalDropdown =
      terminalDropdownContainer.querySelector('#terminalList');
    if (existingTerminalDropdown) {
      terminalDropdownContainer.removeChild(existingTerminalDropdown); // Clear old terminal list
    }
    const data = await getConnectedTerminals();
    const parsedResponse = JSON.parse(data.response);
    const { uniqueTerminalIds } = parsedResponse;
    if (uniqueTerminalIds) {
      renderPosTerminals(uniqueTerminalIds);
      document.querySelector('button[value="submit-payment"]').disabled = false;
    }
  });
}

module.exports = {
  addStores,
  renderPosTerminals,
};
