const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const dev = process.env.NODE_ENV === 'development';

module.exports = {
    devtool: dev ? 'inline-cheap-source-map' : false,
    entry: './src/Quark2d.js',

    output: {
        filename: 'Quark2d.js',
        path: path.resolve(__dirname, 'build'),
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: 'index.html',
        }),
    ],
};
