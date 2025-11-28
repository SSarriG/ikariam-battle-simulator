const path = require('path');

module.exports = {
    mode: 'development',
    entry: './public/scripts/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig.build.json'
                    }
                },
                exclude: /node_modules/,
            },
        ],
    },
    devtool: 'source-map',
};
