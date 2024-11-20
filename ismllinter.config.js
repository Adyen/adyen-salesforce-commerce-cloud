// Please check all available configurations and rules
// at https://www.npmjs.com/package/isml-linter.

const config = {
  rules: {
    // Line by line rules;
    // 'enforce-isprint'  : {}, // Known issue, will be fixed on v6.0.0;
    'enforce-require': {},
    'no-br': {},
    'no-git-conflict': {},
    'no-import-package': {},
    'no-inline-style': {},
    'no-isscript': {},
    'no-space-only-lines': {},
    'no-tabs': {},
    'no-trailing-spaces': {},
    'max-lines': {},

    // Tree rules;
    indent: {},
    'no-redundant-context': {},
    'leading-iscontent': {},
    'max-depth': {},
    'no-embedded-isml': {},
    'no-hardcode': {},
    'no-require-in-loop': {},
    'one-element-per-line': {},
    'leading-iscache': {},
    'no-deprecated-attrs': {},
    'contextual-attrs': {},
    'custom-tags': {},
    'eslint-to-isscript': {},
    'no-iselse-slash': {},
    'empty-eof': {},
    'align-isset': {},
    'disallow-tags': {
      values: ['isscript', 'br', 'style', 'iframe'],
    },
    'enforce-security': {},
    'strict-void-elements': {},

    // Other
    'lowercase-filename': {},
  },
};

module.exports = config;
