'use strict';

const { transformSync } = require('@babel/core');
const transformAdyenSfccCompatibility = require(
    '../transform-adyen-sfcc-compatibility'
);

/**
 * Runs only the custom plugin against the supplied source.
 *
 * No Babel config is loaded. This isolates the plugin tests from:
 *
 * - @babel/preset-env
 * - the Jest Babel configuration
 * - the cartridge build configuration
 * - other Babel plugins
 *
 * @param {string} source JavaScript source to transform
 * @returns {string} Generated JavaScript
 */
function transform(source) {
    return transformSync(source, {
        babelrc: false,
        configFile: false,
        comments: true,
        compact: false,
        minified: false,
        plugins: [
            transformAdyenSfccCompatibility
        ]
    }).code;
}

/**
 * Evaluates transformed CommonJS code.
 *
 * Only use this with self-contained test input. The transformed code
 * must not require SFCC modules such as dw/order/PaymentMgr.
 *
 * @param {string} source JavaScript source to transform and execute
 * @returns {*} Value assigned to module.exports
 */
function transformAndExecute(source) {
    const transformed = transform(source);

    const testModule = {
        exports: {}
    };

    const execute = new Function(
        'module',
        'exports',
        transformed
    );

    execute(testModule, testModule.exports);

    return testModule.exports;
}

describe('transform-adyen-sfcc-compatibility', () => {
    describe('member expressions', () => {
        test('transforms a single optional member expression', () => {
            const result = transform(`
                const address = customer?.address;
            `);

            expect(result).toContain(
                'customer && customer.address'
            );

            expect(result).not.toContain('?.');
        });

        test('transforms nested optional member expressions', () => {
            const result = transform(`
                const amount =
                    paymentInstrument
                        ?.paymentTransaction
                        ?.amount;
            `);

            expect(result).toContain(
                'paymentInstrument && ' +
                'paymentInstrument.paymentTransaction && ' +
                'paymentInstrument.paymentTransaction.amount'
            );

            expect(result).not.toContain('?.');
        });

        test('keeps normal member continuations inside the logical chain', () => {
            const result = transform(`
                const city = customer?.address.city;
            `);

            expect(result).toContain(
                'customer && customer.address.city'
            );

            expect(result).not.toContain(
                '(customer && customer.address).city'
            );

            expect(result).not.toContain('?.');
        });

        test('supports computed member access', () => {
            const result = transform(`
                const firstAddress =
                    customer?.addresses?.[0];
            `);

            expect(result).toContain(
                'customer && ' +
                'customer.addresses && ' +
                'customer.addresses[0]'
            );

            expect(result).not.toContain('?.');
        });

        test('supports computed access using a variable', () => {
            const result = transform(`
                const value = customer?.values?.[key];
            `);

            expect(result).toContain(
                'customer && ' +
                'customer.values && ' +
                'customer.values[key]'
            );

            expect(result).not.toContain('?.');
        });
    });

    describe('method and function calls', () => {
        test('transforms a method call after optional member access', () => {
            const result = transform(`
                const text =
                    callResult.object?.getText();
            `);

            expect(result).toContain(
                'callResult.object && ' +
                'callResult.object.getText()'
            );

            expect(result).not.toContain('?.');
        });

        test('keeps subsequent method calls inside the logical chain', () => {
            const result = transform(`
                const available =
                    currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable();
            `);

            expect(result).toContain(
                'currentBasket && ' +
                'currentBasket' +
                '.getTotalGrossPrice()' +
                '.isAvailable()'
            );

            expect(result).not.toContain(
                '(currentBasket && ' +
                'currentBasket.getTotalGrossPrice())' +
                '.isAvailable()'
            );

            expect(result).not.toContain('?.');
        });

        test('preserves method-call arguments', () => {
            const result = transform(`
                const value = service?.execute(
                    firstArgument,
                    secondArgument
                );
            `);

            expect(result).toContain(
                'service && service.execute('
            );

            expect(result).toContain('firstArgument');
            expect(result).toContain('secondArgument');
            expect(result).not.toContain('?.');
        });

        test('transforms the optional call operator', () => {
            const result = transform(`
                const result = callback?.();
            `);

            expect(result).toContain(
                'callback && callback()'
            );

            expect(result).not.toContain('?.');
        });

        test('transforms an optional method call', () => {
            const result = transform(`
                const result = service.execute?.();
            `);

            expect(result).toContain(
                'service.execute && service.execute()'
            );

            expect(result).not.toContain('?.');
        });
    });

    describe('runtime short-circuit behavior', () => {
        test('does not call a method when the receiver is null', () => {
            const check = transformAndExecute(`
                module.exports = function check(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable();
                };
            `);

            expect(check(null)).toBeFalsy();
        });

        test('does not call a method when the receiver is undefined', () => {
            const check = transformAndExecute(`
                module.exports = function check(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable();
                };
            `);

            expect(check(undefined)).toBeFalsy();
        });

        test('does not call the continuation when the receiver is false', () => {
            const check = transformAndExecute(`
                module.exports = function check(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable();
                };
            `);

            expect(check(false)).toBe(false);
        });

        test('calls the complete method chain when the receiver exists', () => {
            const check = transformAndExecute(`
                module.exports = function check(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable();
                };
            `);

            const basket = {
                getTotalGrossPrice() {
                    return {
                        isAvailable() {
                            return true;
                        }
                    };
                }
            };

            expect(check(basket)).toBe(true);
        });

        test('returns the nested final value when all members exist', () => {
            const getAmount = transformAndExecute(`
                module.exports = function getAmount(
                    paymentInstrument
                ) {
                    return paymentInstrument
                        ?.paymentTransaction
                        ?.amount;
                };
            `);

            const instrument = {
                paymentTransaction: {
                    amount: 99
                }
            };

            expect(getAmount(instrument)).toBe(99);
        });

        test('short-circuits when an intermediate member is missing', () => {
            const getAmount = transformAndExecute(`
                module.exports = function getAmount(
                    paymentInstrument
                ) {
                    return paymentInstrument
                        ?.paymentTransaction
                        ?.amount;
                };
            `);

            const instrument = {
                paymentTransaction: null
            };

            expect(getAmount(instrument)).toBeNull();
        });
    });

    describe('ternary expressions', () => {
        test('keeps the complete optional chain in the condition', () => {
            const result = transform(`
                const amount =
                    currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable()
                        ? getAmount()
                        : getFallback();
            `);

            expect(result).toContain(
                'currentBasket && ' +
                'currentBasket' +
                '.getTotalGrossPrice()' +
                '.isAvailable()'
            );

            expect(result).toContain(
                '? getAmount() : getFallback()'
            );

            expect(result).not.toContain(
                '(currentBasket && ' +
                'currentBasket.getTotalGrossPrice())' +
                '.isAvailable()'
            );
        });

        test('uses the fallback when the optional receiver is missing', () => {
            const getAmount = transformAndExecute(`
                module.exports = function getAmount(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable()
                        ? 'available'
                        : 'fallback';
                };
            `);

            expect(getAmount(null)).toBe('fallback');
        });

        test('uses the true branch when the chain returns true', () => {
            const getAmount = transformAndExecute(`
                module.exports = function getAmount(
                    currentBasket
                ) {
                    return currentBasket
                        ?.getTotalGrossPrice()
                        .isAvailable()
                        ? 'available'
                        : 'fallback';
                };
            `);

            const basket = {
                getTotalGrossPrice() {
                    return {
                        isAvailable() {
                            return true;
                        }
                    };
                }
            };

            expect(getAmount(basket)).toBe('available');
        });
    });

    describe('unrelated syntax', () => {
        test('does not change code without optional chaining', () => {
            const result = transform(`
                const amount =
                    paymentInstrument.paymentTransaction.amount;
            `);

            expect(result).toContain(
                'paymentInstrument.paymentTransaction.amount'
            );

            expect(result).not.toContain('&&');
        });

        test('does not transform const declarations', () => {
            const result = transform(`
                const amount = 100;
            `);

            expect(result).toContain('const amount = 100');
            expect(result).not.toContain('var amount');
        });

        test('does not transform arrow functions', () => {
            const result = transform(`
                const getValue = (item) => item.value;
            `);

            expect(result).toContain('=>');
        });
    });

    describe('Adyen banner comments', () => {
        test('removes the large Adyen file header', () => {
            const result = transform(`
                /**
                 * ###### ADYEN ######
                 * Adyen Salesforce Commerce Cloud
                 * Copyright (c) 2021 Adyen B.V.
                 * This file is available under the MIT LICENSE.
                 */

                const value = customer?.address;
            `);

            expect(result).not.toContain(
                'Adyen Salesforce Commerce Cloud'
            );

            expect(result).not.toContain(
                'Copyright (c) 2021 Adyen B.V.'
            );

            expect(result).not.toContain(
                'MIT LICENSE'
            );
        });

        test('preserves normal JSDoc comments', () => {
            const result = transform(`
                /**
                 * Returns the customer address.
                 *
                 * @param {Object} customer Customer object
                 * @returns {Object} Customer address
                 */
                function getAddress(customer) {
                    return customer?.address;
                }
            `);

            expect(result).toContain(
                'Returns the customer address.'
            );

            expect(result).toContain(
                '@param {Object} customer'
            );

            expect(result).toContain(
                '@returns {Object} Customer address'
            );
        });

        test('preserves ordinary inline comments', () => {
            const result = transform(`
                function getAddress(customer) {
                    // Return the address when available.
                    return customer?.address;
                }
            `);

            expect(result).toContain(
                'Return the address when available.'
            );
        });
    });

    describe('Object.hasOwn compatibility', () => {
        test('converts Object.hasOwn into a prototype call', () => {
            const result = transform(`
                function updateObject(customObject, key, value) {
                    if (Object.hasOwn(customObject, key)) {
                        customObject[key] = value;
                    }
                }
            `);

            expect(result).toContain(
                'Object.prototype.hasOwnProperty.call(customObject, key)'
            );

            expect(result).not.toContain(
                'Object.hasOwn('
            );
        });

        test('does not transform a locally shadowed Object identifier', () => {
            const result = transform(`
                function check(Object, customObject, key) {
                    return Object.hasOwn(customObject, key);
                }
            `);

            expect(result).toContain(
                'Object.hasOwn(customObject, key)'
            );

            expect(result).not.toContain(
                'Object.prototype.hasOwnProperty.call'
            );
        });

        test('rejects an invalid Object.hasOwn call', () => {
            expect(() => {
                transform(`
                    const result = Object.hasOwn(customObject);
                `);
            }).toThrow(
                /Object\.hasOwn\(\) must have exactly two arguments/
            );
        });
    });

});