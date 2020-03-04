const sum = require('../../../../cartridge/client/default/js/adyenCheckout');
window.jQuery = window.$ = require('jquery');

describe('example', () => {
    it('adds 1 + 2 to equal 3', () => {
        global.window.Configuration = () => {};
        expect(sum(1, 2)).toBe(3);
    });

    it()
});

