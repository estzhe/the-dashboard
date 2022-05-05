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
        background: './pages/background.js',
        newtab: './pages/newtab.js',
        options: './pages/options.js',
    },

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
        ],
    },
};