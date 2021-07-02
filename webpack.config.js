const path = require('path');

const dev = process.argv[process.argv.indexOf('--mode') + 1] === 'development';

module.exports = {
    devtool: dev ? 'inline-cheap-source-map' : false,
    entry: './src/Quark2d.ts',

    output: {
        filename: 'Quark2d.js',
        path: path  .resolve(__dirname, 'build'),
        library: 'quark2d',
        libraryTarget: 'commonjs-module'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            !dev ? {
                test: /\.tsx?$/,
                enforce: 'pre',
                exclude: /node_modules/,
                use: 'webpack-strip-block',
            } : {},
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
};