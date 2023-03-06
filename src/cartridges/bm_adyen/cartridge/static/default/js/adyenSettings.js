const expressPaymentMethods = [
  {
    id: 'applepay',
    name: 'ApplePayExpress_Enabled',
    text: 'Apple Pay',
    icon: window.applePayIcon,
    checked: window.isApplePayEnabled,
  },
  {
    id: 'amazonpay',
    name: 'AmazonPayExpress_Enabled',
    text: 'Amazon Pay',
    icon: window.amazonPayIcon,
    checked: window.isAmazonPayEnabled,
  },
];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#settingsForm');
  const submitButton = document.querySelector('#settingsFormSubmitButton');
  const cancelButton = document.querySelector('#settingsFormCancelButton');
  const formButtons = Array.from(document.getElementsByClassName('formButton'));
  const testConnectionButton = document.querySelector('#testConnectionButton');
  const togglePassword = document.querySelector('#togglePassword');
  const toggleApi = document.querySelector('#toggleApi');
  const formBody = document.querySelector('#formBody');
  const password = document.querySelector('#notificationsPassword');
  const merchAccount = document.getElementById('merchantAccount');
  const classicPageButton = document.querySelector('#classicButton');
  const apiKeyVal = document.getElementById('apiKey');
  const changedSettings = [];
  const isValid = 'is-valid';
  const isInvalid = 'is-invalid';
  const adyenGivingBackground = document.querySelector(
    '#fileDropBoxCharitybackground',
  );
  const adyenGivingLogo = document.querySelector('#fileDropBoxGivingLogo');
  const params = 'resizable=yes,width=1000,height=500,left=100,top=100';

  const draggableList = document.getElementById('draggable-list');

  const listItems = [];
  let dragStartIndex;

  function settingChanged(key, value) {
    const settingIndex = changedSettings.findIndex(
      (setting) => setting.key === key,
    );

    if (settingIndex >= 0) {
      changedSettings[settingIndex] = {
        key,
        value,
      };
    } else {
      changedSettings.push({
        key,
        value,
      });
    }
  }

  function swapItems(fromIndex, toIndex) {
    const itemOne = listItems[fromIndex].querySelector('.draggable');
    const itemTwo = listItems[toIndex].querySelector('.draggable');

    listItems[fromIndex].appendChild(itemTwo);
    listItems[toIndex].appendChild(itemOne);

    formButtons.forEach((button) => {
      button.classList.remove('disabled');
      button.classList.add('enabled');
    });

    const expressPaymentsOrder = [];
    const liItemsP = draggableList.querySelectorAll('p.item');
    liItemsP.forEach((p) => {
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
    const draggables = document.querySelectorAll('.draggable');
    const dragListItems = document.querySelectorAll('.draggable-list li');

    draggables.forEach((draggable) => {
      draggable.addEventListener('dragstart', dragStart);
    });

    dragListItems.forEach((item) => {
      item.addEventListener('dragover', dragOver);
      item.addEventListener('drop', dragDrop);
      item.addEventListener('dragenter', dragEnter);
      item.addEventListener('dragleave', dragLeave);
    });
  }

  function createExpressPaymentsComponent() {
    const { expressMethodsOrder } = window;
    if (expressMethodsOrder) {
      const sortOrder = expressMethodsOrder.split(',');
      expressPaymentMethods.sort(
        (a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id),
      );
    }
    expressPaymentMethods.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.setAttribute('data-index', index.toString());

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
          <div class="switch-button">
              <div class="form-check form-switch">
                 <input class="form-check-input" 
                        type="checkbox" 
                        name="${item.name}" 
                        id="${item.id}"
                        ${item.checked ? 'checked' : 'unchecked'}
                 >
              </div>
           </div>
        </div>
      `;

      listItems.push(listItem);

      draggableList.appendChild(listItem);
    });

    addExpressEventListeners();
  }

  // redirect to classic page
  function getLink() {
    window.open(window.classicConfigPageUrl);
  }

  function enableformButtons() {
    formButtons.forEach((button) => {
      button.classList.remove('disabled');
      button.classList.add('enabled');
      form.removeEventListener('input', enableformButtons);
    });
  }

  function disableFormButtons() {
    formButtons.forEach((button) => {
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
    const type =
      password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  }

  function showApiKey() {
    const type =
      apiKeyVal.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyVal.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  }

  // open Adyen Giving Background upload page
  function uploadAdyenGivingBackground() {
    const openedWindow = window.open(
      window.adyenGivingBackgroundUrl,
      'backgroundPopUp',
      params,
    );
    const loop = setInterval(() => {
      if (openedWindow.closed) {
        window.location.reload();
        clearInterval(loop);
      }
    }, 1000);
  }

  // open Adyen Giving Logo upload page
  function uploadAdyenGivingLogo() {
    const openedWindowLogo = window.open(
      window.adyenGivingLogoUrl,
      'logoPopUp',
      params,
    );
    const loop = setInterval(() => {
      if (openedWindowLogo.closed) {
        window.location.reload();
        clearInterval(loop);
      }
    }, 1000);
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

  toggleApi.addEventListener('click', showApiKey);

  adyenGivingBackground.addEventListener('click', uploadAdyenGivingBackground);

  adyenGivingLogo.addEventListener('click', uploadAdyenGivingLogo);

  window.addEventListener('load', printBackgroundImageName);

  window.addEventListener('load', printLogoImageName);

  adyenGivingBackground.addEventListener('click', saveAndHideAlerts);

  adyenGivingLogo.addEventListener('click', saveAndHideAlerts);

  // add event listener to maintain form updates
  form.addEventListener('change', (event) => {
    const { name } = event.target;
    let { value } = event.target; // get checked boolean value for checkboxes

    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    }

    // convert radio button strings to boolean if values are 'true' or 'false'
    if (event.target.type === 'radio') {
      if (event.target.value === 'true') {
        value = true;
      }

      if (event.target.value === 'false') {
        value = false;
      }
    }

    settingChanged(name, value);
  });

  // add event listener to test connection based on current form contents
  testConnectionButton.addEventListener('click', async () => {
    const response = await fetch('AdyenSettings-TestConnection', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
      body: JSON.stringify({
        xApiKey: document.getElementById('apiKey').value,
        merchantAccount: document.getElementById('merchantAccount').value,
      }),
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
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
      body: JSON.stringify({
        settings: changedSettings,
      }),
    });
    const data = await response.json();

    if (data.success) {
      const alertBar = document.getElementById('saveChangesAlert');
      alertBar.classList.add('show');
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

  createExpressPaymentsComponent();
});
