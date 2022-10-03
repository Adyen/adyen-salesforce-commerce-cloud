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
  const apiKeyVal = document.getElementById('apiKey');
  const changedSettings = [];
  testConnectionButton.disabled = true;

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

  function hideAlertsOnTest() {
    document.getElementById('settingsFormSubmitButton').click();
    document.getElementById('saveChangesAlert').hide();
    document.getElementById('notSavedChangesAlert').hide();
    document.getElementById('testConnectionButton').disabled = true;
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

  testConnectionButton.addEventListener('click', hideAlertsOnTest);

  form.addEventListener('input', enableformButtons);

  submitButton.addEventListener('click', showAlertsOnSave);

  window.addEventListener('load', checkBrowserSupport);

  // add event listener to maintain form updates
  form.addEventListener('change', (event) => {
    const { name } = event.target;
    let { value } = event.target; // get checked boolean value for checkboxes

    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } // convert radio button strings to boolean if values are 'true' or 'false'

    if (event.target.type === 'radio') {
      if (event.target.value === 'true') {
        value = event.target.value;
      }

      if (event.target.value === 'false') {
        value = event.target.value;
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
      merchAccount.classList.add('is-valid');
      merchAccount.classList.remove('is-invalid');
      apiKeyVal.classList.add('is-valid');
      apiKeyVal.classList.remove('is-invalid');
    } else {
      merchAccount.classList.add('is-invalid');
      merchAccount.classList.remove('is-valid');
      apiKeyVal.classList.add('is-invalid');
      apiKeyVal.classList.remove('is-valid');
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

  togglePassword.addEventListener('click', async () => {
    const type =
      password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  });

  toggleApi.addEventListener('click', async () => {
    const type =
      apiKeyVal.getAttribute('type') === 'password' ? 'text' : 'password';
    apiKeyVal.setAttribute('type', type);
    this.classList.toggle('bi-eye');
  });

  function openDialogCharityBackgroundUrl() {
    document.getElementById('charityBackgroundUrl').click();
  }

  function openDialogAdyenGivingLogoUrl() {
    document.getElementById('adyenGivingLogoUrl').click();
  }

  document
    .getElementById('fileDropBoxCharitybackground')
    .addEventListener('click', openDialogCharityBackgroundUrl);
  document
    .getElementById('fileDropBoxGivingLogo')
    .addEventListener('click', openDialogAdyenGivingLogoUrl);

  document.getElementById('flexSwitchCheckChecked').onchange = () => {
    document.getElementById('charityName').disabled = !this.checked;
    document.getElementById('charityMerchantAccount').disabled = !this.checked;
    document.getElementById('donationAmounts').disabled = !this.checked;
    document.getElementById('charityDescription').disabled = !this.checked;
    document.getElementById('charityWebsite').disabled = !this.checked;
    document.getElementById('charityBackgroundUrl').disabled = !this.checked;
    document.getElementById('adyenGivingLogoUrl').disabled = !this.checked;
  };
});
