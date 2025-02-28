/* eslint-disable */
/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */

"use strict";

const cwd = process.cwd();
const shell = require("shelljs");
const path = require("path");
const webpack = require("sgmf-scripts").webpack;
const cartridge_name = require("./package.json").name;

const bootstrapPackages = {
  Alert: "exports-loader?Alert!bootstrap/js/src/alert",
  // Button: 'exports-loader?Button!bootstrap/js/src/button',
  Carousel: "exports-loader?Carousel!bootstrap/js/src/carousel",
  Collapse: "exports-loader?Collapse!bootstrap/js/src/collapse",
  // Dropdown: 'exports-loader?Dropdown!bootstrap/js/src/dropdown',
  Modal: "exports-loader?Modal!bootstrap/js/src/modal",
  // Popover: 'exports-loader?Popover!bootstrap/js/src/popover',
  Scrollspy: "exports-loader?Scrollspy!bootstrap/js/src/scrollspy",
  Tab: "exports-loader?Tab!bootstrap/js/src/tab",
  // Tooltip: 'exports-loader?Tooltip!bootstrap/js/src/tooltip',
  Util: "exports-loader?Util!bootstrap/js/src/util",
};

const createJsPath = () => {
  const jsFiles = shell.ls(path.join(cwd, `./cartridges/${cartridge_name}/cartridge/client/**/js/**/*.js`));

  const result = {};
  jsFiles.forEach((filePath) => {
    let location = path.relative(path.join(cwd, `./cartridges/${cartridge_name}/cartridge/client`), filePath);
    location = location.substr(0, location.length - 3);
    result[location] = filePath;
  });
  return result;
}

module.exports = [
  {
    mode: "development",
    name: "js",
    entry: createJsPath(),
    output: {
      path: path.resolve(`./cartridges/${cartridge_name}/cartridge/static`),
      filename: "[name].js",
    },
    module: {
      rules: [
        {
          test: /bootstrap(.)*\.js$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/env"],
              plugins: ["@babel/plugin-proposal-object-rest-spread"],
              cacheDirectory: true,
            },
          },
        },
      ],
    },
    plugins: [new webpack.ProvidePlugin(bootstrapPackages)],
  },
];
