import { Selector } from 'testcafe';

fixture `My first fixtures`
    .page `https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=en_US`
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_USERNAME,
    });

test('Hello world', async t => {

})
