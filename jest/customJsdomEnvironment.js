const JsdomEnvironment = require('jest-environment-jsdom').TestEnvironment;

class CustomJsdomEnvironment extends JsdomEnvironment {
  async setup() {
    await super.setup();
    this.global.HTMLFormElement.prototype.submit = () => {};
  }
}

module.exports = CustomJsdomEnvironment;
