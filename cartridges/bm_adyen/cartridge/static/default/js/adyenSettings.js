const expressPaymentMethods = [{
  id: 'applepay',
  text: 'Apple Pay Express',
  icon: window.applePayIcon,
  toggles: [{
    name: 'ApplePayExpress_Enabled',
    text: 'Cart / mini cart',
    checked: window.isApplePayEnabled
  }, {
    name: 'ApplePayExpress_Pdp_Enabled',
    text: 'Product details page',
    checked: window.isApplePayExpressOnPdpEnabled
  }]
}, {
  id: 'googlepay',
  text: 'Google Pay Express',
  icon: window.googlePayIcon,
  toggles: [{
    name: 'GooglePayExpress_Enabled',
    text: 'Cart / mini cart',
    checked: window.isGooglePayEnabled
  }, {
    name: 'GooglePayExpress_Pdp_Enabled',
    text: 'Product details page',
    checked: window.isGooglePayExpressOnPdpEnabled
  }]
}, {
  id: 'amazonpay',
  text: 'Amazon Pay Express',
  icon: window.amazonPayIcon,
  toggles: [{
    name: 'AmazonPayExpress_Enabled',
    text: 'Cart / mini cart',
    checked: window.isAmazonPayEnabled
  }]
}, {
  id: 'paypal',
  text: 'PayPal Express',
  icon: window.paypalIcon,
  toggles: [{
    name: 'PayPalExpress_Enabled',
    text: 'Cart / mini cart',
    checked: window.isPayPalExpressEnabled
  }, {
    name: 'PayPalExpress_ReviewPage_Enabled',
    text: 'Order review page',
    checked: window.isPayPalExpressReviewPageEnabled
  }]
}];
document.addEventListener('DOMContentLoaded', async () => {
  await fetch('AdyenSettings-GetStores', {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    method: 'GET'
  });
});
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#settingsForm');
  const troubleshootingForm = document.querySelector('#troubleshootingForm');
  const cardSettingsForm = document.getElementById('adyen_installments_div');
  const submitButton = document.querySelector('#settingsFormSubmitButton');
  const cancelButton = document.querySelector('#settingsFormCancelButton');
  const formButtons = Array.from(document.getElementsByClassName('formButton'));
  const testConnectionButton = document.querySelector('#testConnectionButton');
  const addRuleButton = document.getElementById('addRuleButton');
  const togglePassword = document.querySelector('#togglePassword');
  const toggleHmacKey = document.querySelector('#toggleHmacKey');
  const toggleApi = document.querySelector('#toggleApi');
  const formBody = document.querySelector('#formBody');
  const password = document.querySelector('#notificationsPassword');
  const hmacKey = document.querySelector('#hmacKey');
  const merchAccount = document.getElementById('merchantAccount');
  const classicPageButton = document.querySelector('#classicButton');
  const debugLogCheckbox = document.getElementById('debugLogs');
  const infoLogCheckbox = document.getElementById('infoLogs');
  const errorLogCheckbox = document.getElementById('errorLogs');
  const fatalLogCheckbox = document.getElementById('fatalLogs');
  const testRadio = document.getElementById('testRadio');
  const productionRadio = document.getElementById('productionRadio');
  const livePrefix = document.getElementById('livePrefix');
  const troubleshootingCheckboxes = [debugLogCheckbox, infoLogCheckbox, errorLogCheckbox, fatalLogCheckbox];
  const downloadLogsButton = document.getElementById('downloadLogsButton');
  const apiKeyVal = document.getElementById('apiKey');
  const changedSettings = [];
  const isValid = 'is-valid';
  const isInvalid = 'is-invalid';
  const adyenGivingBackground = document.querySelector('#fileDropBoxCharitybackground');
  const adyenGivingLogo = document.querySelector('#fileDropBoxGivingLogo');
  const params = 'resizable=yes,width=1000,height=500,left=100,top=100';
  const draggableList = document.getElementById('draggable-list');
  const availableStores = document.getElementById('storeID').value;
  const terminalDropdown = document.getElementById('terminalDropdown');
  const activeSelectedStores = document.getElementById('selectedStoreID').value;
  let ruleCounter = 0;
  const installmentsResult = {};
  const listItems = [];
  let dragStartIndex;
  function renderStores() {
    if (availableStores) {
      const stores = JSON.parse(availableStores);
      stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.reference;
        option.textContent = `${store.reference} (${store.id})`;
        terminalDropdown.appendChild(option);
        if (activeSelectedStores.includes(store.reference)) {
          option.selected = true;
        }
      });
    }
  }
  function settingChanged(key, value) {
    const settingIndex = changedSettings.findIndex(setting => setting.key === key);
    if (settingIndex >= 0) {
      changedSettings[settingIndex] = {
        key,
        value
      };
    } else {
      changedSettings.push({
        key,
        value
      });
    }
  }
  function swapItems(fromIndex, toIndex) {
    const itemOne = listItems[fromIndex].querySelector('.draggable');
    const itemTwo = listItems[toIndex].querySelector('.draggable');
    listItems[fromIndex].appendChild(itemTwo);
    listItems[toIndex].appendChild(itemOne);
    formButtons.forEach(button => {
      button.classList.remove('disabled');
      button.classList.add('enabled');
    });
    const expressPaymentsOrder = [];
    const liItemsP = draggableList.querySelectorAll('p.item');
    liItemsP.forEach(p => {
      expressPaymentsOrder.push(p.dataset.id);
    });
    settingChanged('ExpressPayments_order', expressPaymentsOrder.join(','));
  }
  function dragStart() {
    dragStartIndex = +this.closest('li').getAttribute('data-index');
  }
  function dragDrop() {
    const dragEndIndex = +this.getAttribute('data-index');
    swapItems(dragStartIndex, dragEndIndex);
    this.classList.remove('over');
  }
  function dragEnter() {
    this.classList.add('over');
  }
  function dragLeave() {
    this.classList.remove('over');
  }
  function dragOver(e) {
    e.preventDefault();
  }
  function addExpressEventListeners() {
    // Targeting only cart/mini-cart list as PDP doesn't need a swapping logic for the moment
    const draggables = draggableList.querySelectorAll('.draggable');
    const dragListItems = draggableList.querySelectorAll('.draggable-list li');
    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', dragStart);
    });
    dragListItems.forEach(item => {
      item.addEventListener('dragover', dragOver);
      item.addEventListener('drop', dragDrop);
      item.addEventListener('dragenter', dragEnter);
      item.addEventListener('dragleave', dragLeave);
    });
  }
  function createExpressPaymentsComponent(paymentMethodsArray, draggableListContainer) {
    const {
      expressMethodsOrder
    } = window;
    if (expressMethodsOrder) {
      const sortOrder = expressMethodsOrder.split(',');
      paymentMethodsArray.sort((a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id));
    }
    paymentMethodsArray.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.setAttribute('data-index', index.toString());
      let togglesHtml = '';
      if (item.toggles?.length) {
        item.toggles.forEach(toggle => {
          togglesHtml += `
            <div class="additional-item-container">
              <p class="additional-item">${toggle.text}</p>
               <div class="additional-switch-button">
                  <div class="form-check form-switch">
                     <input class="form-check-input" 
                            type="checkbox" 
                            name="${toggle.name}" 
                            id="${toggle.name}"
                            ${toggle.checked ? 'checked' : 'unchecked'}
                     >
                  </div>
               </div>
            </div>
          `;
        });
      }
      listItem.innerHTML = `
        <div class="draggable" draggable="true">
          <div class="title">
            <img src="${window.dragIcon}" width="20" height="15" alt="" />
            <img class="logo" 
                src="${item.icon}" 
                width="40" 
                height="26" 
                alt="" 
            />
            <p class="item" data-id="${item.id}">${item.text}</p>
          </div>
          ${togglesHtml}
        </div>
      `;
      listItems.push(listItem);
      draggableListContainer.appendChild(listItem);
    });
    addExpressEventListeners();
  }

  // redirect to classic page
  function getLink() {
    window.open(window.classicConfigPageUrl);
  }
  function downloadFile(filePath) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filePath.substr(filePath.lastIndexOf('/') + 1);
    link.click();
  }
  function enableformButtons() {
    formButtons.forEach(button => {
      button.classList.remove('disabled');
      button.classList.add('enabled');
      form.removeEventListener('input', enableformButtons);
    });
  }
  function disableFormButtons() {
    formButtons.forEach(button => {
      button.classList.remove('enabled');
      button.classList.add('disabled');
      form.removeEventListener('input', enableformButtons);
    });
  }
  function saveAndHideAlerts() {
    document.getElementById('settingsFormSubmitButton').click();
    document.getElementById('saveChangesAlert').hide();
    document.getElementById('notSavedChangesAlert').hide();
  }
  function showAlertsOnSave() {
    document.getElementById('saveChangesAlert').show();
    document.getElementById('notSavedChangesAlert').show();
  }

  // if browser is safari it sets custom padding
  function checkBrowserSupport() {
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
      formBody.style.setProperty('padding-top', '3rem');
    }
  }
  function showPassword() {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  }
  function showApiKey() {
    const type = apiKeyVal.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyVal.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  }
  function showHmacKey() {
    const type = hmacKey.getAttribute('type') === 'password' ? 'text' : 'password';
    hmacKey.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  }

  // open Adyen Giving Background upload page
  function uploadAdyenGivingBackground() {
    const openedWindow = window.open(window.adyenGivingBackgroundUrl, 'backgroundPopUp', params);
    const loop = setInterval(() => {
      if (openedWindow.closed) {
        window.location.reload();
        clearInterval(loop);
      }
    }, 1000);
  }

  // open Adyen Giving Logo upload page
  function uploadAdyenGivingLogo() {
    const openedWindowLogo = window.open(window.adyenGivingLogoUrl, 'logoPopUp', params);
    const loop = setInterval(() => {
      if (openedWindowLogo.closed) {
        window.location.reload();
        clearInterval(loop);
      }
    }, 1000);
  }
  function removeRule(id) {
    const element = document.getElementById(`rule${id}`);
    if (element) {
      element.remove();
    }
    delete installmentsResult[id];
  }
  function createRuleElement(id, ruleData) {
    const el = document.createElement('div');
    el.id = `rule${id}`;
    el.classList.add('form-group');
    el.innerHTML = `
      <table class="table">
        <tr>
          <td>
            <label for="installmentsAmount${id}">Minimum Amount</label>
            <div>
              <input type="number" min="0" id="installmentsAmount${id}" value="${ruleData[0]}">
            </div>
          </td>
          <td>
            <label for="installmentsNumber${id}">Number of installments</label>
            <div>
              <input type="number" min="2" id="installmentsNumber${id}" value="${ruleData[1]}">
            </div>
          </td>
          <td>
            <label for="card-options${id}">Allowed credit card types</label>
            <div id="cards-dropdown-options">
              <select id="card-options${id}" multiple required>
                <option class="dropdown-option" value="amex" id="amexCard">Amex</option>
                <option class="dropdown-option" value="elo" id="eloCard">Elo</option>
                <option class="dropdown-option" value="hipercard" id="hipercardCard">Hipercard</option>
                <option class="dropdown-option" value="mc" id="mcCard">Master Card</option>
                <option class="dropdown-option" value="visa" id="visaCard">Visa</option>
                <option class="dropdown-option" value="jcb" id="jcbCard">Jcb</option>
              </select>
            </div>
          </td>
          <td>
            <button type="button" id="removeRuleButton">
              <img src="${window.binIcon}"/>
            </button>
          </td>
        </tr>
      </table>
    `;
    const removeButton = el.querySelector('#removeRuleButton');
    removeButton.setAttribute('data-rule-counter', id);
    removeButton.addEventListener('click', () => {
      const counter = parseInt(removeButton.getAttribute('data-rule-counter'), 10);
      removeRule(counter);
      enableformButtons();
      settingChanged('AdyenCreditCardInstallments', JSON.stringify(Object.values(installmentsResult)));
    });
    document.getElementById('adyen_installments_div').appendChild(el);
    const cardOptionsSelect = document.getElementById(`card-options${ruleCounter}`);
    ruleData[2].forEach(cardType => {
      const option = cardOptionsSelect.querySelector(`[value="${cardType}"]`);
      if (option) {
        option.selected = true;
      }
    });
  }
  function addRule() {
    ruleCounter += 1;
    const ruleData = [0, 2, []]; // default values for installments
    createRuleElement(ruleCounter, ruleData);
  }
  function getRuleValues(id) {
    const installment = [];
    const installmentAmount = document.getElementById(`installmentsAmount${id}`).value;
    const installmentNumber = document.getElementById(`installmentsNumber${id}`).value;
    const selectElement = document.getElementById(`card-options${id}`);
    const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
    installment.push(parseInt(installmentAmount, 10), parseInt(installmentNumber, 10), selectedOptions);
    installmentsResult[id] = installment;
  }
  function populateRules(savedData) {
    savedData.forEach(ruleData => {
      ruleCounter += 1;
      createRuleElement(ruleCounter, ruleData);
      installmentsResult[ruleCounter] = ruleData;
    });
  }
  if (window.installments.value) {
    const savedInstallments = JSON.parse(window.installments.value);
    populateRules(savedInstallments);
  }
  function getImageName(imageUrl) {
    const parts = imageUrl.split('/');
    const imageName = parts.pop();
    return imageName;
  }
  function createImageNameStyling(list, imageName) {
    document.getElementById(list).innerHTML = '';
    const unorderedList = document.getElementById(list);
    const nameOfImage = getImageName(imageName);
    if (nameOfImage?.length > 0) {
      const checkMarkImage = document.createElement('img');
      checkMarkImage.src = window.successImage;
      const text = document.createTextNode(nameOfImage);
      const listElement = document.createElement('li');
      listElement.appendChild(checkMarkImage);
      listElement.appendChild(document.createTextNode(' '));
      listElement.appendChild(text);
      unorderedList.appendChild(listElement);
    }
  }
  function printBackgroundImageName() {
    createImageNameStyling('backgroundList', window.backgroundValueField);
  }
  function printLogoImageName() {
    createImageNameStyling('logoList', window.logoValueField);
  }
  testConnectionButton.addEventListener('click', saveAndHideAlerts);
  classicPageButton.addEventListener('click', getLink);
  form.addEventListener('input', enableformButtons);
  submitButton.addEventListener('click', showAlertsOnSave);
  window.addEventListener('load', checkBrowserSupport);
  togglePassword.addEventListener('click', showPassword);
  toggleHmacKey.addEventListener('click', showHmacKey);
  toggleApi.addEventListener('click', showApiKey);
  adyenGivingBackground.addEventListener('click', uploadAdyenGivingBackground);
  adyenGivingLogo.addEventListener('click', uploadAdyenGivingLogo);
  window.addEventListener('load', printBackgroundImageName);
  window.addEventListener('load', printLogoImageName);
  addRuleButton.addEventListener('click', addRule);

  // form for installments
  cardSettingsForm.addEventListener('input', () => {
    getRuleValues(ruleCounter);
    const selectElement = document.getElementById(`card-options${ruleCounter}`);
    const selectedOptions = Array.from(selectElement.selectedOptions);
    if (selectedOptions.length) {
      settingChanged('AdyenCreditCardInstallments', JSON.stringify(Object.values(installmentsResult)));
    }
  });
  productionRadio.addEventListener('click', () => {
    livePrefix.disabled = false;
  });
  testRadio.addEventListener('click', () => {
    livePrefix.disabled = true;
  });
  adyenGivingBackground.addEventListener('click', saveAndHideAlerts);
  adyenGivingLogo.addEventListener('click', saveAndHideAlerts);
  troubleshootingForm.addEventListener('input', () => {
    downloadLogsButton.classList.add('disabled');
    troubleshootingCheckboxes.forEach(checkbox => {
      if (checkbox.checked) {
        downloadLogsButton.classList.remove('disabled');
        downloadLogsButton.classList.add('enabled');
      }
    });
  });
  downloadLogsButton.addEventListener('click', () => {
    (async () => {
      const htmlContent = await (await fetch(window.logCenterUrl)).text();
      const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
      const logLocations = Array.from(doc.body.getElementsByTagName('a')).map(log => log.href);
      const logsToDownload = [];
      troubleshootingCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
          // eslint-disable-next-line
          logsToDownload.push(logLocations.filter(name => name.includes(`custom-Adyen_${checkbox.value}`)));
        }
      });
      const selectedLogs = Array.prototype.concat.apply([], logsToDownload);
      selectedLogs.forEach(item => downloadFile(item));
      downloadLogsButton.classList.add('disabled');
      troubleshootingCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
      });
    })();
  });
  function parseRadioValue(rawValue) {
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    return rawValue;
  }
  function getMultipleSelectValues(selectedOptions) {
    return Array.from(selectedOptions).map(option => option.value).join(',');
  }
  function getValueFromInput(type, rawValue, checked, selectedOptions) {
    if (type === 'checkbox') {
      return checked;
    }
    if (type === 'select-multiple') {
      return getMultipleSelectValues(selectedOptions);
    }
    if (type === 'radio') {
      return parseRadioValue(rawValue);
    }
    return rawValue;
  }
  form.addEventListener('change', event => {
    const {
      name,
      type,
      value: rawValue,
      checked,
      selectedOptions
    } = event.target;
    const value = getValueFromInput(type, rawValue, checked, selectedOptions);
    settingChanged(name, value);
  });

  // add event listener to test connection based on current form contents
  testConnectionButton.addEventListener('click', async () => {
    const response = await fetch('AdyenSettings-TestConnection', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      method: 'POST',
      body: JSON.stringify({
        xApiKey: document.getElementById('apiKey').value,
        merchantAccount: document.getElementById('merchantAccount').value
      })
    });
    const data = await response.json();
    if (data.success) {
      merchAccount.classList.add(isValid);
      merchAccount.classList.remove(isInvalid);
      apiKeyVal.classList.add(isValid);
      apiKeyVal.classList.remove(isInvalid);
    } else {
      merchAccount.classList.add(isInvalid);
      merchAccount.classList.remove(isValid);
      apiKeyVal.classList.add(isInvalid);
      apiKeyVal.classList.remove(isValid);
    }
  });
  submitButton.addEventListener('click', async () => {
    // disable form buttons and reattach event listener for enabling it on form change
    disableFormButtons();
    form.addEventListener('input', enableformButtons);
    const response = await fetch('AdyenSettings-Save', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      method: 'POST',
      body: JSON.stringify({
        settings: changedSettings
      })
    });
    const data = await response.json();
    if (data.success) {
      const alertBar = document.getElementById('saveChangesAlert');
      alertBar.classList.add('show');
      addRuleButton.classList.remove('disabled');
      window.setTimeout(() => {
        alertBar.classList.remove('show');
      }, 2000);
    } else {
      const cancelAlertBar = document.getElementById('notSavedChangesAlert');
      cancelAlertBar.classList.add('show');
      window.setTimeout(() => {
        cancelAlertBar.classList.remove('show');
      }, 2000);
    }
  });
  cancelButton.addEventListener('click', async () => {
    window.location.reload();
  });
  renderStores();
  if (terminalDropdown) {
    // eslint-disable-next-line
    const choices = new Choices(terminalDropdown, {
      removeItemButton: true,
      searchEnabled: true
    });
    terminalDropdown.addEventListener('change', () => {
      enableformButtons();
    });
  }
  createExpressPaymentsComponent(expressPaymentMethods, draggableList);
});