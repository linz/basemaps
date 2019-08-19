module.exports = {
    entry: { index: './build/index.js' },
    target: 'node',
    devtool: 'none',
    mode: 'development',
    externals: {
        'aws-sdk': 'aws-sdk',
    },
    output: {
        libraryTarget: 'umd',
    },
};
