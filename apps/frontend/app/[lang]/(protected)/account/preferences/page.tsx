"use client"

import React, {useTransition} from "react";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { Select, Option } from "../../../../../components/Select/Select";
import { Switch } from "../../../../../components/Switch/Switch";
import { useRouter, usePathname } from "../../../../../i18n/navigation";
import { useTheme } from "next-themes";
import BackButton from "../../../../../components/BackButton/BackButton";
import {useShift} from "../../../../../contexts/ShiftContext/ShiftContext";
import {useParams} from "next/navigation";

export default function Preferences() {
    const t = useTranslations('preferences');
    const { setTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const [,startTransition] = useTransition();

    const {showBreakWarnings, setShowBreakWarnings} = useShift();

    const handleLanguageChange = (newLocale: string) => {
        startTransition(() => {
            router.replace(
                // @ts-expect-error -- TypeScript will validate that only known `params`
                // are used in combination with a given `pathname`. Since the two will
                // always match for the current route, we can skip runtime checks.
                {pathname, params},
                {locale: newLocale}
            )
        });
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
                            onChange={(value) => setTheme(value as string)}>
                            <Option
                                value="light">{t('light')}</Option>
                            <Option
                                value="dark">{t('dark')}</Option>
                            <Option
                                value="system">{t('system')}</Option>
                        </Select>
                    </div>
                    
                    <div className={styles.label}>
                    <label>{t('language')}</label>
                    </div>
                    <div className={styles.select}>
                        <Select
                            onChange={handleLanguageChange}>
                            <Option
                                value="en">English</Option>
                            <Option
                                value="de">Deutsch</Option>
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