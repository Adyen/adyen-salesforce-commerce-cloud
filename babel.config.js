/* eslint-disable */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["@babel/preset-env"]],
    plugins: [
      ["@babel/plugin-transform-runtime", { helpers: false }],
      "@babel/plugin-proposal-optional-chaining",
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      "@babel/plugin-proposal-class-properties",
    ],
    exclude: ["node_modules/**", "src/cartridges/adyen_controllers_changes/**", "src/cartridges/bm_adyen/cartridge/static/**"],
    "ignore": [
      "**/*.test.js",
      "**/*.test.js.snap",
    ]
  };
};
