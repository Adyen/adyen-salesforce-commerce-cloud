/* eslint-disable */
/* globals cat, cd, cp, echo, exec, exit, find, ls, mkdir, rm, target, test */

"use strict";

require("shelljs/make");
const path = require("path");
const webpack = require("sgmf-scripts").webpack;
const jsFiles = require("sgmf-scripts").createJsPath();
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

module.exports = [
  {
    mode: "development",
    name: "js",
    entry: jsFiles,
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
