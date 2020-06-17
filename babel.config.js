module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["@babel/preset-env", { targets: "> 0.25%, not dead" }]],
    plugins: ["@babel/plugin-transform-regenerator"],
  };
};
