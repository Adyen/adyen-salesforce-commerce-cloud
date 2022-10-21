document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#settingsForm');
  const submitButton = document.querySelector('#settingsFormSubmitButton');
  const cancelButton = document.querySelector('#settingsFormCancelButton');
  const formButtons = Array.from(document.getElementsByClassName('formButton'));
  const testConnectionButton = document.querySelector('#testConnectionButton');
  const changedSettings = [];

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

  // redirect to classic page
  function getLink() {
    window.open(window.classicConfigPageUrl);
  }

  function enableformButtons() {
    formButtons.forEach((button) => {
      button.classList.remove('disabled');
      button.classList.add('enabled');
      form.removeEventListener('input', enableformButtons);
    }
  }

  function diableFormButtons() {
    for (const button of formButtons) {
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

  form.addEventListener('input', enableformButtons); // add event listener to maintain form updates

  form.addEventListener('change', event => {
    const name = event.target.name;
    let value = event.target.value; // get checked boolean value for checkboxes

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
  }); // add event to submit button to send form and present results

    if (data.success) {
      merchAccount.classList.add("is-valid");
      merchAccount.classList.remove('is-invalid');
      apiKeyVal.classList.add("is-valid");
      apiKeyVal.classList.remove('is-invalid');
    } else {
      merchAccount.classList.add("is-invalid");
      merchAccount.classList.remove("is-valid");
      apiKeyVal.classList.add("is-invalid");
      apiKeyVal.classList.remove("is-valid");
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
    }
    else{
      const cancelAlertBar = document.getElementById('notSavedChangesAlert');
      cancelAlertBar.classList.add('show');
      window.setTimeout(() => {
        cancelAlertBar.classList.remove('show');
      }, 2000);
    }
  });

  cancelButton.addEventListener('click', async () => {
    location.reload();
  }); // file upload butttons event listeners for adyen giving card

  function openDialogCharityBackgroundUrl() {
    document.getElementById('charityBackgroundUrl').click();
  }

  function openDialogAdyenGivingLogoUrl() {
    document.getElementById('adyenGivingLogoUrl').click();
  }

  document.getElementById('fileDropBoxCharitybackground').addEventListener('click', openDialogCharityBackgroundUrl);
  document.getElementById('fileDropBoxGivingLogo').addEventListener('click', openDialogAdyenGivingLogoUrl);
