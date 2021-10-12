import { Selector } from 'testcafe';

fixture `My first fixtures`
    .page `https://zzft-010.sandbox.us01.dx.commercecloud.salesforce.com/s/RefArch/home?lang=en_US`
    .httpAuth({
      username: process.env.SANDBOX_HTTP_AUTH_USERNAME,
      password: process.env.SANDBOX_HTTP_AUTH_PASSWORD,
    });

test('Summer Style', async t => {
  await t.click('.affirm.btn.btn-primary');
  const header = Selector('div')
      .child('.hero.main-callout')
      .child('h1');
  await t.expect(header.textContent).eql('Summer Style');
})
