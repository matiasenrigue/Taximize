 "use client"

import React, { useRef } from "react";
import { MenuItem } from "../../../components/MenuItem/MenuItem";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";

export default function Account() {
    const menuItems = [
        { label: 'account', href: '/account/profile' },
        { label: 'shiftSettings', href: '/account/shift-settings' },
        { label: 'preferences', href: '/account/preferences' },
        { label: 'statistics', href: '/account/statistics' },
    ];
    const t = useTranslations('account');

    return (
         <div className={styles.page}>
            <div className={styles.profile}>
                <div className={styles.menu}>
                    {menuItems.map((item) => (
                        <MenuItem key={item.href} href={item.href}>
                            {t(item.label)}
                        </MenuItem>
                    ))}
                </div>
            </div>
        </div>
    );
}
