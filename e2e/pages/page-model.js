import { Selector, t } from 'testcafe';

class PageTitle {
  constructor() {
    Selector('div')
        .child('.hero.main-callout')
        .child('h1');
  }
}

class Page {
  constructor() {
    this.consentButton = Selector('.affirm');
    this.title = new PageTitle();
  }

  async acceptCookieConsent() {
    await t.click(consentButton);
  }
}

export default new Page();
