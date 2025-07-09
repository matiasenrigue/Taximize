// translations will not work
module.exports = {
    useTranslations: () => (key => key),
    NextIntlProvider: ({ children }) => children,
    NextIntlClientProvider: ({ children }) => children,
};