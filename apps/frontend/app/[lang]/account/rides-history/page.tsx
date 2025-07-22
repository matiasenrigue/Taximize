"use client"

import React, { useEffect, useState } from "react";
import { MenuItem } from "../../../../components/MenuItem/MenuItem";
import styles from "./page.module.css";
import BackButton from "../../../../components/BackButton/BackButton";
import api from "../../../../lib/axios";
import { useTranslations } from "next-intl";

function formatDay(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function ManageRides() {
    const [days, setDays] = useState<{ day: string, hasRide: boolean }[]>([]);

    useEffect(() => {
        api.get('/stats/shifts-by-days').then(res => {
            setDays(res.data.data.filter((d: { hasRide: boolean }) => d.hasRide));
        });
    }, []);

    const t = useTranslations('rides-history');

    return (
         <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account" pageName="Account" />
                </div>
                <div className={styles.manageRides}>
                    <h2 className={styles.title}>{t('shifts')}</h2>
                    <div className={styles.menu}>
                        {days.map((item) => (
                            <MenuItem key={item.day} href={`/account/rides-history/${formatDay(item.day).toLowerCase()}`}>
                                {formatDay(item.day)}
                            </MenuItem>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
