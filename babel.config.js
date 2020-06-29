module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["@babel/preset-env"]],
    plugins: ["@babel/plugin-proposal-optional-chaining"],
  };
};
