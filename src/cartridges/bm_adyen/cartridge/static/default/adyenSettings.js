document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#settingsForm');
  const submitButton = document.querySelector('#settingsFormSubmitButton');
  const cancelButton = document.querySelector('#settingsFormCancelButton');
  const formButtons = Array.from(document.getElementsByClassName('formButton'));
  const testConnectionButton = document.querySelector('#testConnectionButton');
  const changedSettings = [];

  function settingChanged(key, value) {
<<<<<<< HEAD
    const settingIndex = changedSettings.findIndex(
      (setting) => setting.key === key,
    );

    if (settingIndex >= 0) {
      changedSettings[settingIndex] = { key, value };
    } else {
      changedSettings.push({ key, value });
=======
    const settingIndex = changedSettings.findIndex(setting => {
      return setting.key === key;
    });

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
>>>>>>> bm_config_zenit
    }
  }

  function enableformButtons() {
<<<<<<< HEAD
    formButtons.forEach((button) => {
=======
    for (const button of formButtons) {
>>>>>>> bm_config_zenit
      button.classList.remove('disabled');
      button.classList.add('enabled');
      form.removeEventListener('input', enableformButtons);
    });
  }

<<<<<<< HEAD
  function disableFormButtons() {
    formButtons.forEach((button) => {
      button.classList.remove('enabled');
      button.classList.add('disabled');
      form.removeEventListener('input', enableformButtons);
    });
  }
=======
  function diableFormButtons() {
    for (const button of formButtons) {
      button.classList.remove('enabled');
      button.classList.add('disabled');
      form.removeEventListener('input', enableformButtons);
    }
  } // add event for save button availability on form change.

>>>>>>> bm_config_zenit

  form.addEventListener('input', enableformButtons); // add event listener to maintain form updates

<<<<<<< HEAD
  // add event listener to maintain form updates
  form.addEventListener('change', (event) => {
    const { target } = event;
    const { name } = target;

    // get checked boolean value for checkboxes and radio buttons
    const isCheckedType = ['checkbox', 'radio'].some(
      (type) => type === target.type,
    );

    const value = isCheckedType ? target.checked : target.value;
=======
  form.addEventListener('change', event => {
    const name = event.target.name;
    let value = event.target.value; // get checked boolean value for checkboxes

    if (event.target.type === 'checkbox') {
      value = event.target.checked;
    } //convert radio button strings to boolean if values are 'true' or 'false'


    if (event.target.type === 'radio') {
      if (event.target.value === 'true') {
        value = true;
      }

      if (event.target.value === 'false') {
        value = false;
      }
    }
>>>>>>> bm_config_zenit

    settingChanged(name, value);
  }); // add event to submit button to send form and present results

<<<<<<< HEAD
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
    console.log(data);
    // TODO: Feedback to user
  });

  // add event to submit button to send form and present results
=======
>>>>>>> bm_config_zenit
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
<<<<<<< HEAD
        settings: changedSettings,
      }),
    });
    const data = await response.json();
=======
        settings: changedSettings
      })
    });
    const data = await response.json();

>>>>>>> bm_config_zenit
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
        alertBar.classList.remove('show');
      }, 2000);
    }
  });
  cancelButton.addEventListener('click', async () => {
<<<<<<< HEAD
    window.location.reload();
  });
=======
    location.reload();
  }); // file upload butttons event listeners for adyen giving card
>>>>>>> bm_config_zenit

  function openDialogCharityBackgroundUrl() {
    document.getElementById('charityBackgroundUrl').click();
  }

  function openDialogAdyenGivingLogoUrl() {
    document.getElementById('adyenGivingLogoUrl').click();
  }

<<<<<<< HEAD
  document
    .getElementById('fileDropBoxCharitybackground')
    .addEventListener('click', openDialogCharityBackgroundUrl);

  document
    .getElementById('fileDropBoxGivingLogo')
    .addEventListener('click', openDialogAdyenGivingLogoUrl);

  document.getElementById('flexSwitchCheckChecked').onchange = () => {
=======
  document.getElementById('fileDropBoxCharitybackground').addEventListener('click', openDialogCharityBackgroundUrl);
  document.getElementById('fileDropBoxGivingLogo').addEventListener('click', openDialogAdyenGivingLogoUrl);

  document.getElementById('flexSwitchCheckChecked').onchange = function () {
>>>>>>> bm_config_zenit
    document.getElementById('charityName').disabled = !this.checked;
    document.getElementById('charityMerchantAccount').disabled = !this.checked;
    document.getElementById('donationAmounts').disabled = !this.checked;
    document.getElementById('charityDescription').disabled = !this.checked;
    document.getElementById('charityWebsite').disabled = !this.checked;
    document.getElementById('charityBackgroundUrl').disabled = !this.checked;
    document.getElementById('adyenGivingLogoUrl').disabled = !this.checked;
  };
});