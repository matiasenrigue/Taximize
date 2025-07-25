"use client"

import React, {ChangeEvent, useTransition} from "react";
import styles from "./page.module.css";
import {useLocale, useTranslations} from "next-intl";
import { Select } from "../../../../../components/Select/Select";
import { Option } from "../../../../../components/Select/Option";
import { Switch } from "../../../../../components/Switch/Switch";
import { useRouter, usePathname } from "../../../../../i18n/navigation";
import { useTheme } from "next-themes";
import BackButton from "../../../../../components/BackButton/BackButton";
import {useShift} from "../../../../../contexts/ShiftContext/ShiftContext";
import {useParams} from "next/navigation";
import api from "../../../../../lib/axios";

export default function Preferences() {
    const t = useTranslations('preferences');
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const [,startTransition] = useTransition();
    const locale = useLocale();

    const {showBreakWarnings, setShowBreakWarnings} = useShift();

    const handleLanguageChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newLocale = e.target.value;
        startTransition(() => {
            router.replace(
                // @ts-expect-error -- TypeScript will validate that only known `params`
                // are used in combination with a given `pathname`. Since the two will
                // always match for the current route, we can skip runtime checks.
                {pathname, params},
                {locale: newLocale}
            );
        });
        api.put('/users/preferences', { language: newLocale })
            .catch(console.warn);
    };

    const handleThemeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setTheme(value as string);
        api.put('/users/preferences', { theme: value })
            .catch(console.error);
    };

    const handleBreakWarningsChange = (e: ChangeEvent<HTMLInputElement>) => {
        setShowBreakWarnings(e.target.checked);
        api.put('/users/preferences', { breakWarnings: e.target.checked })
            .catch(console.error);
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account" pageName="Account" />
                </div>
                <h2 className={styles.title}>{t('preferences')}</h2>
                <div className={styles.preferenceList}>
                    <div className={styles.label}>
                        <label>{t('colorScheme')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            onChange={handleThemeChange}
                            defaultValue={theme}>
                            <Option value="light">{t('light')}</Option>
                            <Option value="dark">{t('dark')}</Option>
                            <Option value="system">{t('system')}</Option>
                        </Select>
                    </div>
                    
                    <div className={styles.label}>
                        <label>{t('language')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            onChange={handleLanguageChange}
                            defaultValue={locale}>
                            <Option value="en">English</Option>
                            <Option value="de">Deutsch</Option>
                        </Select>
                    </div>
                    <div className={styles.label}>
                        <label htmlFor={"switch-breakWarnings"}>
                            {t('breakWarnings')}
                        </label>
                    </div>
                    <div className={styles.switch}>
                        <Switch
                            id={"switch-breakWarnings"}
                            checked={showBreakWarnings}
                            onChange={handleBreakWarningsChange}/>
                    </div>
                </div>
            </div>
        </div>
    );
}