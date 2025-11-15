import * as TsJest from "ts-jest";

const config: TsJest.JestConfigWithTsJest = {
    ...TsJest.createDefaultEsmPreset({
        diagnostics: {
            ignoreCodes: [
                // TS151001: If you have issues related to imports, you should consider setting `esModuleInterop`
                //           to `true` in your TypeScript configuration file (usually `tsconfig.json`).
                // Justification: we do not want to use esModuleInterop.
                "TS151001",
            ],
        },
    }),
    testEnvironment: "jsdom",
    moduleNameMapper: {
        "^app/(.*)\\.js$": "<rootDir>/src/$1.ts",
        "^app/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: [
        "jest-expect-message",
    ],
};

export default config;
