import '@testing-library/jest-dom';

// mock next-intl
// translations will not work
jest.mock('next-intl', () => ({
    useTranslations: () => (key => key),
    NextIntlProvider: ({ children }) => children
}));