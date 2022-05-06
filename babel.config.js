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
    only: ["./src/cartridges/bm_adyen", "./src/cartridges/int_adyen_controllers", "./src/cartridges/int_adyen_overlay", "./src/cartridges/int_adyen_SFRA"],
  };
};
