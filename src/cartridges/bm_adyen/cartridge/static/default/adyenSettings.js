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
      changedSettings[settingIndex] = { key, value };
    } else {
      changedSettings.push({ key, value });
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

  // add event for save button availability on form change.
  form.addEventListener('input', enableformButtons);

  // add event listener to maintain form updates
  form.addEventListener('change', (event) => {
    const { target } = event;
    const { name } = target;

    // get checked boolean value for checkboxes and radio buttons
    const isCheckedType = ['checkbox', 'radio'].some(
      (type) => type === target.type,
    );

    const value = isCheckedType ? target.checked : target.value;

    settingChanged(name, value);
  });

  // add event listener to test connection based on current form contents
  testConnectionButton.addEventListener('click', async () => {
    const response = await fetch('AdyenSettings-TestConnection', {
      settings: changedSettings,
    });
    const data = await response.json();
    if (data.success) {
      const alertBar = document.getElementById('saveChangesAlert');
      alertBar.classList.add('show');
      window.setTimeout(() => {
        alertBar.classList.remove('show');
      }, 2000);
    }
  });

  // add event to submit button to send form and present results
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
        xApiKey: document.getElementById('apiKey').value,
        merchantAccount: document.getElementById('merchantAccount').value,
      }),
    });
    const data = await response.json();
    // TODO: Feedback to user
  });

  // add event to submit button to send form and present results
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
  });

  cancelButton.addEventListener('click', async () => {
    window.location.reload();
  });

  // file upload butttons event listeners for adyen giving card
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
