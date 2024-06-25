const cfg = {
  ...require('@linzjs/style/.eslintrc.cjs'),
};

cfg.rules['no-console'] = ['error', { allow: ['warn', 'error'] }];

// Disable no floating promises in tests until https://github.com/nodejs/node/issues/51292 is solved
const testOverrides = cfg.overrides.find((ovr) => ovr.files.find((f) => f.includes('.test.ts')));
testOverrides.rules['@typescript-eslint/no-floating-promises'] = 'off';

// Allow console.log in tests and scripts
cfg.overrides.push({
  files: ['**/*.mjs', '**/__tests__/**/*.ts'],
  rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' },
});

// Disable required importing of react as typescript does this for us
cfg.overrides.push({
  files: '**/*.tsx',
  rules: { 'react/react-in-jsx-scope': 'off' },
});

// cfg.parserOptions.ecmaVersion = 2020;

module.exports = cfg;
