"use client";

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {ModalHandle} from "../../../components/Modal/Modal";
import React, {useEffect, useRef} from "react";
import {useTranslations} from "next-intl";
import {RideEvaluationModal} from "../../../components/modals/RideEvaluationModal";
import {RideSummaryModal} from "../../../components/modals/RideSummaryModal";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {Map} from "../../../components/Map/Map";
import {
    UserLocationContextProvider,
    useUserLocationContext
} from "../../../contexts/UserLocationContext/UserLocationContext";
import {APIProvider} from "@vis.gl/react-google-maps";
import {LocationSearchbar} from "../../../components/LocationSearchbar";
import {TaxiMeter} from "../../../components/TaxiMeter/TaxiMeter";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useRide} from "../../../contexts/RideContext/RideContext";
import {MenuOption, OptionsMenu} from "../../../components/OptionsMenu/OptionsMenu";
import {useRouter} from "next/navigation";
import {StartBreakModal} from "../../../components/modals/BreakModalHandler/StartBreakModal";
import {LocationUnavailable} from "./LocationUnavailable";
import {LocationLoading} from "./LocationLoading";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPage() {
    const startModalRef = useRef<ModalHandle>(null!);
    const endModalRef = useRef<ModalHandle>(null!);
    const startBreakModalRef = useRef<ModalHandle>(null!);

    const {pauseShift, endShift} = useShift();
    const {isOnRide, destination, isRouteAvailable} = useRide();
    const t = useTranslations('map');

    const {location, isAvailable, setIsWatching} = useUserLocationContext();
    useEffect(() => setIsWatching(true), []);

    function openPauseModal() {
        if (!startBreakModalRef || typeof startBreakModalRef === "function")
            return;
        startBreakModalRef.current.open();
    }

    if (!isAvailable)
        return <LocationUnavailable/>;
    if (!location)
        return <LocationLoading/>;

    return (
        <APIProvider apiKey={API_KEY}>
            <RideEvaluationModal
                ref={startModalRef}/>
            <RideSummaryModal
                ref={endModalRef}/>
            <StartBreakModal
                ref={startBreakModalRef}/>

            <div className={styles.page}>
                <Map className={styles.map}/>

                <div className={styles.search_container}>
                    <LocationSearchbar
                        placeholder={t("locationSearchPlaceholder")}/>
                </div>

                <div className={styles.button_container}>
                    {isOnRide && <TaxiMeter/>}
                    <FlexGroup
                        direction={"row"}
                        align={"center"}
                        justify={"end"}>
                        {isOnRide
                            ? <FlexGroup
                                direction={"column"}
                                align={"start"}>
                                <Button
                                    elevated={true}
                                    onClick={() => endModalRef.current?.open()}>
                                    {t("endRide")}
                                </Button>
                            </FlexGroup>
                            : (destination && isRouteAvailable && <Button
                                elevated={true}
                                onClick={() => startModalRef.current?.open()}>
                                {t("startRide")}
                            </Button>)}
                        {!isOnRide && <OptionsMenu>
                            <MenuOption onClick={openPauseModal}>
                                {t("pauseShift")}
                            </MenuOption>
                            <MenuOption onClick={endShift}>
                                {t("endShift")}
                            </MenuOption>
                        </OptionsMenu>}
                    </FlexGroup>
                </div>
            </div>
        </APIProvider>
    );
}

