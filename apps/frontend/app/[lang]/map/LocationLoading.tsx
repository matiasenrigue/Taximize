import React from "react";
import styles from "./page.module.css";
import {useTranslations} from "next-intl";
import {LoadingSpinner} from "../../../components/LoadingSpinner/LoadingSpinner";

export const LocationLoading = () => {
    const t = useTranslations("LocationLoading");

    return (
        <div className={styles.page}>
            <div className={styles.message}>
                <LoadingSpinner/>
                <h3 className={styles.message_heading}>
                    {t("title")}
                </h3>
                <p>
                    {t("text")}
                </p>
            </div>
        </div>
    );
};