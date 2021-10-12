import { Selector } from 'testcafe';

fixture `My first fixtures`
    .page `https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=en_US`
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

test('Hello world', async t => {
  await t.click('.affirm btn btn-primary');
  const header = Selector('div')
      .classNames(['hero', 'main-callout'])
      .child('h1');
  await t.expect(header.value).toEqual('Summer Style');

})
