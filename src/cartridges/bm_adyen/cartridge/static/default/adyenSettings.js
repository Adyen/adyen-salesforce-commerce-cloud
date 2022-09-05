document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#settingsForm');
  const submitButton = document.querySelector('#settingsFormSubmitButton');
  const cancelButton = document.querySelector('#settingsFormCancelButton');
  const formButtons = Array.from(document.getElementsByClassName('formButton'));
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
    const { name } = event.target;
    let { value } = event.target;

    // get checked boolean value for checkboxes
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
