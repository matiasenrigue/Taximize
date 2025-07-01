"use client"

import React from "react";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { Select, Option } from "../../../../components/Select/Select";
import { Switch } from "../../../../components/Switch/Switch";
import { useRouter, usePathname } from "next/navigation";

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
                                <Select>
                                    <Option value="off">{t("off")}</Option>
                                    <Option value="on">{t("on")}</Option>
                                </Select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}