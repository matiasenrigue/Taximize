"use client"

import styles from "./page.module.css";
import {Searchbar} from "../../../components/Searchbar/Searchbar";
import {Button} from "../../../components/Button/Button";
import {Select, Option} from "../../../components/Select/Select";
import {Switch} from "../../../components/Switch/Switch";
import {Modal, ModalHandle} from "../../../components/Modal/Modal";
import {useRef} from "react";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";

export default function Map() {
    const modalRef = useRef<ModalHandle>(null!);
    const t = useTranslations('map');

    return (
        <div className={styles.page}>
            <div className={styles.map}/>

            <div className={styles.search_container}>
                <Searchbar/>
            </div>

            <div className={styles.button_container}>
                <Button
                    elevated={true}
                    onClick={() => modalRef.current?.open()}>
                    {t("startRide")}
                </Button>
            </div>
        </div>
    );
}
