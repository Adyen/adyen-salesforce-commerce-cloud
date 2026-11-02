/* eslint-disable */

const path = require('path');

module.exports = function (api) {
    const environment = api.env();
    const isCartridgeBuild = environment === 'cartridge';

    if (isCartridgeBuild) {
        return {
            comments: true,
            compact: false,
            minified: false,
            retainLines: false,

            overrides: [
                {
                    test: /src[\\/]cartridges[\\/]/,

                    exclude: [
                        /cartridge[\\/]client[\\/]/,
                        /cartridge[\\/]static[\\/]/,
                    ],

                    assumptions: {
                        setComputedProperties: true
                    },

                    plugins: [
                        "@babel/plugin-transform-block-scoping",

                        path.resolve(
                            __dirname,
                            'babel-plugins',
                            'transform-adyen-sfcc-compatibility.js'
                        ),

                        [
                            '@babel/plugin-transform-object-rest-spread',
                            {
                                loose: true,
                                useBuiltIns: true
                            }
                        ],
                        [
                            '@babel/plugin-transform-spread',
                            {
                                loose: true
                            }
                        ],
                        '@babel/plugin-transform-computed-properties',
                    ]
                }
            ],

            ignore: [
                '**/*.test.js',
                '**/*.test.js.snap',
                'src/cartridges/adyen_controllers_changes/**',
                'src/cartridges/bm_adyen/cartridge/static/**',
                'src/cartridges/app_adyen_SFRA/cartridge/config/store.js'
            ]
        };
    }

    /*
     * Preserve Adyen's original Babel configuration for Jest
     * and other non-cartridge Babel consumers.
     */
    return {
        presets: [
            [
                '@babel/preset-env'
            ]
        ],

        plugins: [
            [
                '@babel/plugin-transform-runtime',
                {
                    helpers: false
                }
            ],
            '@babel/plugin-proposal-optional-chaining',
            [
                '@babel/plugin-proposal-decorators',
                {
                    legacy: true
                }
            ],
            '@babel/plugin-proposal-class-properties'
        ],

        exclude: [
            'node_modules/**',
            'src/cartridges/adyen_controllers_changes/**',
            'src/cartridges/bm_adyen/cartridge/static/**'
        ]

        /*
         * Do not copy the original test ignore patterns here.
         *
         * Jest needs Babel to process the test files. Globally ignoring
         * `*.test.js` can cause Jest parsing failures.
         */
    };
};