var adyenGivingNode = document.getElementById("donate-container");

function handleOnDonate(state, component) {
    if(state.isValid){
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
}

function handleOnCancel(state, component) {
    $("#adyenGiving").slideUp();
    donation.unmount();
}

var donationConfig = {
    amounts: JSON.parse(donationAmounts),
    backgroundUrl: "https://images.wallpaperscraft.com/image/palm_trees_trees_jungle_128374_3636x2364.jpg",  //TODOBAS background URL ?
    description: charityDescription,
    logoUrl: "https://hammerfest.co/wp-content/uploads/2015/12/WWF-logo-1-900x982.png", //TODOBAS logo URL ?
    name: charityName,
    url: charityWebsite,
    showCancelButton: true,
    onDonate: handleOnDonate,
    onCancel: handleOnCancel
};

var checkout = new AdyenCheckout(window.Configuration);
var donation = checkout.create("donation", donationConfig).mount(adyenGivingNode);
