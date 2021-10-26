import { regionsEnum } from "../data/enums";

fixture`USD`
    .page(`https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=${regionsEnum.US}`)
    .httpAuth({
        username: 'storefront',
        password: 'fGMxsfjLwb3XtZ2gqKyZ3m4h7J',
    });

test('PayPal Success', async t => {

});

test('PayPal Fail', async t => {

});

test('Affirm Success', async t => {

});

test('Affirm Fail', async t => {

});
