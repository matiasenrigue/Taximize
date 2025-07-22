import {useEffect, useState} from "react";

export type ColorScheme = "light" | "dark";

export const useColorScheme = () => {
    const [colorScheme, setColorScheme] = useState<ColorScheme>("light");

    useEffect(() => {
        if (!window.matchMedia)
            return;

        // initial color scheme
        const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
        setColorScheme(mediaQueryList.matches ? 'dark' : 'light');

        // change color scheme
        const handleChange = (e: MediaQueryListEventMap["change"]) => {
            setColorScheme(e.matches ? 'dark' : 'light')
        }
        mediaQueryList.addEventListener('change', handleChange);
        return () => mediaQueryList.removeEventListener('change', handleChange);
    }, []);

    return colorScheme;
};