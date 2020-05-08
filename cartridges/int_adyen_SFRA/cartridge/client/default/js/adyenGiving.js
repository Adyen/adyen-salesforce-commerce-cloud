var adyenGivingNode = document.getElementById("donate-container");

function handleOnDonate(state, component) {
    if(!state.isValid) {
        return;
    }
    var selectedAmount = state.data.amount;
    var donationData = {
        amountValue: selectedAmount.value,
        amountCurrency: selectedAmount.currency,
        orderNo: orderNo,
        pspReference: pspReference
    };

    $.ajax({
        url: 'Adyen-Donate',
        type: 'post',
        data: donationData,
        success: function () {
            component.setStatus("success");
        }
    });
}

function handleOnCancel(state, component) {
    $("#adyenGiving").slideUp();
    donation.unmount();
}

var amounts;
try {
    amounts = JSON.parse(donationAmounts);
} catch (e) {
    amounts = [];
}

var donationConfig = {
    amounts: amounts,
    backgroundUrl: adyenGivingBackgroundUrl,
    description: charityDescription,
    logoUrl: adyenGivingLogoUrl,
    name: charityName,
    url: charityWebsite,
    showCancelButton: true,
    onDonate: handleOnDonate,
    onCancel: handleOnCancel
};

var checkout = new AdyenCheckout(window.Configuration);
var donation = checkout.create("donation", donationConfig).mount(adyenGivingNode);
