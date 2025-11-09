import path from "path";
import url from "url";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";

const currentFilePath = url.fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

export default {
    mode: "development",
    
    context: path.resolve(currentDirectoryPath, "src"),

    entry: {
        "service-worker": path.resolve(currentDirectoryPath, "src/service-worker.ts"),
        newtab: path.resolve(currentDirectoryPath, "src/pages/newtab.js"),
        options: path.resolve(currentDirectoryPath, "src/pages/options.js"),
    },

    output: {
        path: path.resolve(currentDirectoryPath, "out/webpack"),
    },

    devtool: "source-map",

    plugins: [
        new MonacoWebpackPlugin(),
    ],

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        extensionAlias: {
            ".js": [".js", ".ts"],
            ".jsx": [".jsx", ".tsx"],
        },
        preferRelative: true,
        alias: {
            app: path.resolve(currentDirectoryPath, "src"),
        },
    },

    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                include: path.resolve(currentDirectoryPath, "src"),
                use: ["source-map-loader"],
            },
            {
                test: /\.(ts|tsx|js|jsx)$/,
                include: path.resolve(currentDirectoryPath, "src"),
                use: ["ts-loader"],
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.ttf$/,
                use: ["file-loader"],
            },
            {
                test: /\.hbs$/,
                include: path.resolve(currentDirectoryPath, "src"),
                loader: "handlebars-loader",
                options: {
                    precompileOptions: {
                        knownHelpersOnly: false,
                    },
                    helperDirs: [
                        path.resolve(currentDirectoryPath, "src/lib/handlebars-helpers"),
                    ],
                }
            },
        ],
    },
};