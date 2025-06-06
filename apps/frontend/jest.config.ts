import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    moduleNameMapper: {
        // mock CSS modules
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        // mock global CSS styles
        '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
        // mock image imports
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
        // mock next/font/google
        '^next/font/google$': '<rootDir>/__mocks__/nextFontGoogleMock.js',
        // support aliases (@/ imports)
        '^@/(.*)$': '<rootDir>/$1',
    },
};

export default config;