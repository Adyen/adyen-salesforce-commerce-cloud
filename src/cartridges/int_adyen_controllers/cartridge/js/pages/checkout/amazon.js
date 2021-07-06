if(window.amazonCheckoutSessionId) {
    const amazonPayNode = document.getElementById('amazon-container');

    function handleAmazonResponse(response, component) {
        if (response.fullResponse?.action) {
            component.handleAction(response.fullResponse.action);
        } else if (response.resultCode === 'Authorised') {
            document.querySelector('#result').value = JSON.stringify({
                pspReference: response.fullResponse.pspReference,
                resultCode: response.fullResponse.resultCode,
                paymentMethod: response.fullResponse.additionalData.paymentMethod,
            });
            $('#dwfrm_billing').trigger('submit');
            // document.querySelector('#showConfirmationForm').submit();
        } else if (response.error) {
            document.querySelector('#result').value = JSON.stringify({
                error: true,
            });
            $('#dwfrm_billing').trigger('submit');
            // document.querySelector('#showConfirmationForm').submit();
        }
    }

    function paymentFromComponent(data, component) {
        $.ajax({
            url: window.paymentFromComponentURL,
            type: 'post',
            contentType: 'application/; charset=utf-8',
            data: JSON.stringify(data),
            success(response) {
                if (response.orderNo) {
                    document.querySelector('#merchantReference').value = response.orderNo;
                }
                handleAmazonResponse(response, component);
            },
        });
    }

    const amazonConfig = {
        showOrderButton: false,
        returnUrl: window.returnURL,
        configuration: {
            merchantId: window.amazonMerchantID,
            storeId: window.amazonStoreID,
            publicKeyId: window.amazonPublicKeyID,
        },
        amazonCheckoutSessionId: window.amazonCheckoutSessionId,
        onSubmit: (state, component) => {
            document.querySelector('#adyenStateData').value = JSON.stringify(
                state.data,
            );
            paymentFromComponent(state.data, component);
        },
    };

    const checkout = new AdyenCheckout(window.Configuration);
    const amazonPayComponent = checkout
        .create('amazonpay', amazonConfig)
        .mount(amazonPayNode);

    $('#dwfrm_billing').submit(function apiRequest(e) {
        e.preventDefault();

        const form = $(this);
        const url = form.attr('action');

        $.ajax({
            type: 'POST',
            url,
            data: form.serialize(),
            async: false,
            success(data) {
                store.formErrorsExist = 'fieldErrors' in data;
            },
        });
    });
    // $('#action-modal').modal({backdrop: 'static', keyboard: false});
    amazonPayComponent.submit();
}
