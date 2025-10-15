import globals from "globals";
import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    js.configs.recommended,
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"],
    {
        rules: {
            ...reactHooks.configs.recommended.rules,
            indent: ["error", 4],
            semi: ["error", "always"],
            "prefer-const": "error",
            "no-unused-vars": "warn",
            "linebreak-style": ["error", "windows"],
            "quotes": ["error", "double", {"allowTemplateLiterals": true}],
            "sort-imports": [
                "error",
                {
                    "ignoreCase": true,
                    "memberSyntaxSortOrder": ["none", "all", "single", "multiple"],
                },
            ],
            "react/prop-types": "off",
        },
        plugins: {
            "react": react,
            "react-hooks": reactHooks,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            }
        },
        settings: {
            react: {
                version: "detect",
            }
        },
    }
];