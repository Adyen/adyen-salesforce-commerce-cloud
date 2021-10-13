fixture`USD`
    .page(process.env.STOREFRONT_USD)
    .httpAuth({
        username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
        password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test('Affirm Success', async t => {

});

test('Affirm Fail', async t => {

});
