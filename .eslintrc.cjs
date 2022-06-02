const cfg = {
    ...require('@linzjs/style/.eslintrc.js'),
};

cfg.rules['no-console'] = ['error', { allow: ['warn', 'error'] }];
// Allow console.log in tests and scripts
cfg.overrides.push({ files: ['**/*.js', '**/__tests__/**/*.ts'], rules: { 'no-console': 'off' }, });

cfg.parserOptions.ecmaVersion = 2020;

module.exports = cfg;
