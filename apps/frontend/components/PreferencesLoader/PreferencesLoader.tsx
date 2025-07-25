"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useShift } from '../../contexts/ShiftContext/ShiftContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import api from '../../lib/axios';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function PreferencesLoader() {
    const { setTheme } = useTheme();
    const { setShowBreakWarnings } = useShift();
    const { isAuthenticated } = useUserContext();
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    useEffect(() => {
        if (!isAuthenticated) return;

        api.get('/users/preferences')
            .then(response => {
                if (response.data.success) {
                    const prefs = response.data.data;
                    
                    if (prefs.theme) {
                        setTheme(prefs.theme);
                    }
                    
                    if (prefs.breakWarnings !== undefined) {
                        setShowBreakWarnings(prefs.breakWarnings);
                    }
                    
                    if (prefs.language && prefs.language !== locale) {
                        const newPath = pathname.replace(`/${locale}`, `/${prefs.language}`);
                        router.push(newPath);
                    }
                }
            })
            .catch(error => {
                console.error('Failed to load preferences:', error);
            });
    }, [isAuthenticated, setTheme, setShowBreakWarnings, router, pathname, locale]);

    return null;
}