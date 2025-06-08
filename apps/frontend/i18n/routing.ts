import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'de'], // supported locales
    defaultLocale: 'en' // fallback locale
});