import React from "react";
import styles from "./page.module.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { faLocationArrow } from '@fortawesome/free-solid-svg-icons';
import {useTranslations} from "next-intl";

export const LocationUnavailable = () => {
    const t = useTranslations("LocationUnavailable");

    return (
        <div className={styles.page}>
            <div className={styles.message}>
                <FontAwesomeIcon
                    icon={faLocationArrow}
                    size={"2xl"}/>
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