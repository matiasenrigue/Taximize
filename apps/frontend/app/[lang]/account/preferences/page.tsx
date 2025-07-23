"use client"

import React from "react";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { Select, Option } from "../../../../components/Select/Select";
import { Switch } from "../../../../components/Switch/Switch";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useTheme } from "next-themes";  
import BackButton from "../../../../components/BackButton/BackButton";
import {useShift} from "../../../../contexts/ShiftContext/ShiftContext";

export default function Preferences() {
    const t = useTranslations('preferences');
    const locale = useLocale();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const {showBreakWarnings, setShowBreakWarnings} = useShift();

    const handleLanguageChange = (language: string) => {
        const newPath = pathname.replace(`/${locale}`, `/${language}`);
        router.push(newPath);
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account" pageName="Account" />
                </div>
                <h2 className={styles.title}>{t('preferences')}</h2>
                <div className={styles.preferenceList}>
                    <div className={styles.label}>
                        <label htmlFor={"select-colorScheme"}>{t('colorScheme')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            id={"select-colorScheme"}
                            onChange={(value) => setTheme(value as string)}>
                            <Option
                                value="light"
                                selected={theme === "light"}>{t('light')}</Option>
                            <Option
                                value="dark"
                                selected={theme === "dark"}>{t('dark')}</Option>
                            <Option
                                value="system"
                                selected={theme === "system"}>{t('system')}</Option>
                        </Select>
                    </div>
                    
                    <div className={styles.label}>
                    <label htmlFor={"select-language"}>{t('language')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            id={"select-language"}
                            onChange={handleLanguageChange}>
                            <Option
                                value="en"
                                selected={locale === "en"}>English</Option>
                            <Option
                                value="de"
                                selected={locale === "de"}>Deutsch</Option>
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
                            onChange={(e) => setShowBreakWarnings(e.target.checked)}/>
                    </div>
                </div>
            </div>
        </div>
    );
}