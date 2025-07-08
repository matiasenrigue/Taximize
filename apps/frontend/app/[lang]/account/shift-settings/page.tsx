"use client"

import React from "react";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { TimeInput } from "../../../../components/TimeInput/TimeInput";

export default function shiftSettings() {
    const t = useTranslations('shiftSettings');
    const labelList = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ]

    const setDurationInMilliseconds = (duration: number) => {
        // Here you would typically save the duration to a state or context
        console.log(`Duration set to: ${duration} milliseconds`);
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h2 className={styles.title}>{t('shiftSettings')}</h2>
                <div className={styles.shiftSettingsList}>
                    {labelList.map((label, index) => (
                        <div key={index} className={styles.shiftSettingsItem}>
                            <div className={styles.label}>
                                <label>{t(label)}</label>
                            </div>
                            <div className={styles.select}>
                                <TimeInput
                                    onChange={setDurationInMilliseconds}/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}