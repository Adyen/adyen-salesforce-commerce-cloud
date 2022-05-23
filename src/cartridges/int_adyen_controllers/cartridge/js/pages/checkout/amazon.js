if(window.amazonCheckoutSessionId) {
    window.sessionsResponse = null;
    const amazonPayNode = document.getElementById('amazonContainerSG');

    function handleAuthorised(response) {
        document.querySelector('#result').value = JSON.stringify({
            pspReference: response.fullResponse.pspReference,
            resultCode: response.fullResponse.resultCode,
            paymentMethod: response.fullResponse.paymentMethod ? response.fullResponse.paymentMethod : response.fullResponse.additionalData.paymentMethod,
        });
        document.querySelector('#paymentFromComponentStateData').value = JSON.stringify(
            response,
        );
        document.querySelector('#showConfirmationForm').submit();
    }

    function handleError() {
        document.querySelector('#result').value = JSON.stringify({
            error: true,
        });
        document.querySelector('#paymentFromComponentStateData').value = JSON.stringify({error: true});
        document.querySelector('#showConfirmationForm').submit();
    }

    function handleAmazonResponse(response, component) {
        if (response.fullResponse && response.fullResponse.action) {
            component.handleAction(response.fullResponse.action);
        } else if (response.resultCode === window.resultCodeAuthorised) {
            handleAuthorised(response);
        } else {
            // first try the amazon decline flow
            component.handleDeclineFlow();
            // if this does not trigger a redirect, try the regular handleError flow
            handleError();
        }
    }

    function paymentFromComponent(data, component) {
        $.ajax({
            url: window.paymentFromComponentURL,
            type: 'post',
            contentType: 'application/; charset=utf-8',
            data: JSON.stringify(data),
            success(response) {
                if (response.result && response.result.orderNo && response.result.orderToken) {
                    document.querySelector('#orderToken').value = response.result.orderToken;
                    document.querySelector('#merchantReference').value = response.result.orderNo;
                }
                handleAmazonResponse(response.result, component);
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
        onAdditionalDetails: (state) => {
            state.data.paymentMethod = 'amazonpay';
            $.ajax({
                type: 'post',
                url: window.paymentsDetailsURL,
                data: JSON.stringify({
                  data: state.data,
                  orderToken: document.querySelector('#orderToken').value,
                }),
                contentType: 'application/; charset=utf-8',
                success(data) {
                    if (data.response.isSuccessful) {
                        handleAuthorised(data.response);
                    } else if (!data.response.isFinal && typeof data.response.action === 'object') {
                        checkout.createFromAction(data.action).mount('#amazonContainerSG');
                    } else {
                        handleError();
                    }
                },
            });
        },
    };

    async function mountAmazonPayComponent() {
        const checkout = await AdyenCheckout(window.Configuration);
        const amazonPayComponent = checkout
            .create('amazonpay', amazonConfig)
            .mount(amazonPayNode);
        amazonPayComponent.submit();
    }

    mountAmazonPayComponent();
}
