 "use client"

import React, { useRef } from "react";
import { MenuItem } from "../../../components/MenuItem/MenuItem";
import styles from "./page.module.css";
import { useTranslations } from "next-intl";
import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import { FlexGroup } from "../../../components/FlexGroup/FlexGroup";
import { Select, Option } from "../../../components/Select/Select";
import { Switch } from "../../../components/Switch/Switch";


export default function Preferences() {
    const modalRef = useRef(null);
    const t = useTranslations('preferences');

    return (
        <div className={styles.page}>
            <div className={styles.profile}>

            </div>
        </div>
    );
}