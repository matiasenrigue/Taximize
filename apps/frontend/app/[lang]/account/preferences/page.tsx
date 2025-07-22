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

export default function Preferences() {
    const t = useTranslations('preferences');
    const locale = useLocale();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

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
                <h2 className={styles.title}>Preferences</h2>
                <div className={styles.preferenceList}>
                    <div className={styles.label}>
                        <label>{t('colorScheme')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            onChange={(value) => setTheme(value as string)}>
                            <Option value="light">{t('light')}</Option>
                            <Option value="dark">{t('dark')}</Option>
                            <Option value="system">{t('system')}</Option>
                        </Select>
                    </div>
                    
                    <div className={styles.label}>
                    <label>Language</label>
                    </div>
                    <div className={styles.select}>
                        <Select onChange={handleLanguageChange}>
                            <Option value="en">English</Option>
                            <Option value="de">Deutsch</Option>
                        </Select>
                    </div>
                    <div className={styles.label}>
                        <label>{t('geolocation')}</label>
                    </div>
                    <div className={styles.switch}>
                        <Switch />
                    </div>
                    <div className={styles.label}>
                        <label>{t('breakWarnings')}</label>
                    </div>
                    <div className={styles.switch}>
                        <Switch />
                    </div>
                </div>
            </div>
        </div>
    );
}