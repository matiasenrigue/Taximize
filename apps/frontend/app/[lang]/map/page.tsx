"use client"

import styles from "./page.module.css";
import {Searchbar} from "../../../components/Searchbar/Searchbar";
import {Button} from "../../../components/Button/Button";
import {ModalHandle} from "../../../components/Modal/Modal";
import {useRef} from "react";
import {useTranslations} from "next-intl";
import {RideEvaluationModal} from "./components/RideEvaluationModal";
import {RideSummaryModal} from "./components/RideSummaryModal";
import {useShiftContext} from "../../../contexts/ShiftContext/ShiftContext";
import {MapComponent} from "./components/MapComponent";

export default function MapPage() {
    const startModalRef = useRef<ModalHandle>(null!);
    const endModalRef = useRef<ModalHandle>(null!);
    const {isOnRide, address, navigateToAddress} = useShiftContext();
    const t = useTranslations('map');

    return (
        <>
            <RideEvaluationModal
                ref={startModalRef}/>
            <RideSummaryModal
                ref={endModalRef}/>

            <div className={styles.page}>
                <MapComponent className={styles.map}/>

                <div className={styles.search_container}>
                    <Searchbar
                        onConfirm={navigateToAddress}/>
                </div>

                <div className={styles.button_container}>
                    {isOnRide
                        ? <Button
                            elevated={true}
                            onClick={() => endModalRef.current?.open()}>
                            {t("endRide")}
                        </Button>
                        : address && <Button
                            elevated={true}
                            onClick={() => startModalRef.current?.open()}>
                            {t("startRide")}
                        </Button>}
                </div>
            </div>
        </>
    );
}

