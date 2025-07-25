"use client";

import {useEffect, useTransition} from 'react';
import { useTheme } from 'next-themes';
import { useShift } from '../../contexts/ShiftContext/ShiftContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import api from '../../lib/axios';
import { useLocale } from 'next-intl';
import {usePathname, useRouter} from "../../i18n/navigation";
import {useParams} from "next/navigation";

export function PreferencesLoader() {
    const { setTheme } = useTheme();
    const { setShowBreakWarnings } = useShift();
    const { isAuthenticated } = useUserContext();
    const locale = useLocale();
    const [,startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();

    useEffect(() => {
        if (!isAuthenticated) return;

        api.get('/users/preferences')
            .then(response => {
                const {
                    success,
                    error,
                    data,
                } = response.data;

                if (!success) {
                    console.warn("Failed loading preferences", error);
                    return;
                }
                const {
                    theme,
                    breakWarnings,
                    language
                } = data;

                if (theme)
                    setTheme(theme);
                if (typeof breakWarnings === "boolean")
                    setShowBreakWarnings(breakWarnings);
                if (language && language !== locale)
                    startTransition(() => {
                        router.replace(
                            // @ts-expect-error -- TypeScript will validate that only known `params`
                            // are used in combination with a given `pathname`. Since the two will
                            // always match for the current route, we can skip runtime checks.
                            {pathname, params},
                            {locale: language}
                        );
                    });
            })
            .catch(error => {
                console.warn('Failed to load preferences:', error);
            });
    }, [isAuthenticated, setTheme, setShowBreakWarnings, router, pathname, locale]);

    return null;
}