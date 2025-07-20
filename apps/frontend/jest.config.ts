import type { Config } from 'jest';

const config: Config = {
    verbose: true,
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    moduleNameMapper: {
        // support aliases (@/ imports)
        '^@/(.*)$': '<rootDir>/$1',
        // mock CSS modules
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        // mock global CSS styles
        '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
        // mock image imports
        '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
        // mock packages
        '^next/font/google$': '<rootDir>/__mocks__/next/font/google.js',
        '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js',
        '^next-intl$': '<rootDir>/__mocks__/next-intl',
    },
};

export default config;