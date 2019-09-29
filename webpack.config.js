module.exports = {
    entry: { index: './build/index.js' },
    target: 'node',
    devtool: 'none',
    mode: 'development',
    externals: {
        'aws-sdk': 'aws-sdk',
        'pino-pretty': 'pino-pretty',
        sharp: 'sharp',
    },
    output: {
        libraryTarget: 'umd',
    },
};
