import path from 'path';
import url from 'url';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

const currentFilePath = url.fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

export default {
    mode: "development",

    output: {
        path: path.resolve(currentDirectoryPath, 'pages/dist'),
    },

    entry: {
        "service-worker": './pages/service-worker.js',
        newtab: './pages/newtab.js',
        options: './pages/options.js',
    },

    devtool: 'source-map',

    plugins: [
        new MonacoWebpackPlugin(),
    ],

    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ttf$/,
                use: ['file-loader'],
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
                options: {
                    precompileOptions: {
                        knownHelpersOnly: false,
                    },
                    helperDirs: [
                        path.resolve(currentDirectoryPath, 'lib/handlebars-helpers'),
                    ],
                }
            },
        ],
    },
};