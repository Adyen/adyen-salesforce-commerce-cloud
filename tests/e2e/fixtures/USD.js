fixture`USD`
    .page(`https://${process.env.SFCC_HOSTNAME}/s/RefArch/home?lang=${regionEnum.US}`)
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
