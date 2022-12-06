module.exports = {
  "env": {
    "es6": true,
    "browser": true,
    "node": true,
    "jest": true,
  },
  "extends": [
    "prettier",
    "airbnb-base",
  ],
  "globals": {
    "$": "readonly",
    "Resources": "readonly",
    "order": "readonly",
    "request": "readonly",
    "response": "readonly",
    "session": "readonly",
    "dw": "readonly",
    "empty": "readonly",
    "Feature": "readonly",
    "Scenario": "readonly",
    "AdyenCheckout": "readonly",
    "storeDetails": "writable",
    "showStoreDetails": "readonly",
    "checkout": "readonly",
    "orderNo": "readonly",
    "pspReference": "readonly",
    "donationAmounts": "readonly",
    "adyenGivingBackgroundUrl": "readonly",
    "charityDescription": "readonly",
    "adyenGivingLogoUrl": "readonly",
    "charityName": "readonly",
    "charityWebsite": "readonly",
    "customer": "readonly",
    "actor": "readonly",
    "locate": "readonly",
    "describe": "readonly",
    "it": "readonly",
    "copyCardData": "readonly",
    "PIPELET_NEXT": "readonly",
    "PIPELET_ERROR": "readonly",
    "Urls": "readonly",
    "SitePreferences": "readonly",
    "document": "readonly",
    "window": "readonly",
    "location": "readonly",
  },
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "modules": true,
    },
  },
  "plugins": [
    "prettier",
  ],
  "ignorePatterns": [
    "*.ds"
  ],
  "rules": {
    "prettier/prettier": "error",
    "no-var": "error",
    "prefer-const": "warn",
    "complexity": [
      "error",
      {
        "max": 5,
      },
    ],
    "eqeqeq": "error",
    "curly": "error",
    "import/no-unresolved": [
      2,
      {
        "ignore": [
          "^dw",
          "^base",
          "^\\*",
          "^mockData"
        ],
      },
    ],
    "import/extensions": ["error", { "js": "never" }],
    "import/no-extraneous-dependencies": "off",
    "operator-linebreak": "off",
    "object-curly-newline": ["error", {
      "ImportDeclaration": { multiline: true, "minProperties": 4 }
    }],
    "implicit-arrow-linebreak": "off",
    "no-param-reassign": ["error", { "props": false }]
  },
};
