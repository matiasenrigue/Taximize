"use client"

import React, { useEffect, useState } from "react";
import { MenuItem } from "../../../../components/MenuItem/MenuItem";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import BackButton from "../../../../components/BackButton/BackButton";
import api from "../../../../lib/axios";

function formatDay(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export default function ManageRides() {
    const t = useTranslations('manageRides');
    const [days, setDays] = useState<{ day: string, hasRide: boolean }[]>([]);
    useEffect(() => {
        api.get('/api/rides/last-7-days').then(res => {
            setDays(res.data.data.filter((d: { hasRide: boolean }) => d.hasRide));
        });
    }, []);

    return (
         <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account" pageName="Account" />
                </div>
                <div className={styles.manageRides}>
                    <h2 className={styles.title}>Shifts</h2>
                    <div className={styles.menu}>
                        {days.map((item) => (
                            <MenuItem key={item.day} href={`/manageRides/${formatDay(item.day).toLowerCase()}`}>
                                {formatDay(item.day)}
                            </MenuItem>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
