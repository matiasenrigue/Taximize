"use client"

import React from "react";
import { MenuItem } from "../../../components/MenuItem/MenuItem";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCog, faSliders, faChartBar, faCar } from "@fortawesome/free-solid-svg-icons";
import BackButton from "../../../components/BackButton/BackButton";

export default function Account() {
    const t = useTranslations('account');
    const menuItems = [
        { label: 'account', href: '/account/profile', icon: <FontAwesomeIcon icon={faUser} /> },
        { label: 'shiftSettings', href: '/account/shift-settings', icon: <FontAwesomeIcon icon={faCog} /> },
        { label: 'preferences', href: '/account/preferences', icon: <FontAwesomeIcon icon={faSliders} /> },
        { label: 'statistics', href: '/account/statistics', icon: <FontAwesomeIcon icon={faChartBar} /> },
        { label: 'manageRides', href: '/account/manage-rides', icon: <FontAwesomeIcon icon={faCar} /> },
    ];

    return (
         <div className={styles.page}>
            <div>
                <BackButton href="/account" pageName="Account" />
            </div>
            <div className={styles.profile}>
                <div className={styles.menu}>
                    {menuItems.map((item) => (
                        <MenuItem key={item.href} href={item.href} icon={item.icon}>
                            {t(item.label)}
                        </MenuItem>
                    ))}
                </div>
            </div>
        </div>
    );
}
