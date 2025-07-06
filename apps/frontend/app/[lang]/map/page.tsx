"use client";

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {ModalHandle} from "../../../components/Modal/Modal";
import {useEffect, useRef} from "react";
import {useTranslations} from "next-intl";
import {RideEvaluationModal} from "../../../components/modals/RideEvaluationModal";
import {RideSummaryModal} from "../../../components/modals/RideSummaryModal";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {Map} from "../../../components/Map/Map";
import {UserLocationContextProvider} from "../../../contexts/UserLocationContext/UserLocationContext";
import {APIProvider} from "@vis.gl/react-google-maps";
import {LocationSearchbar} from "../../../components/LocationSearchbar";
import {TaxiMeter} from "../../../components/TaxiMeter/TaxiMeter";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useRide} from "../../../contexts/RideContext/RideContext";
import {MenuOption, OptionsMenu} from "../../../components/OptionsMenu/OptionsMenu";
import {useRouter} from "next/navigation";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPage() {
    const startModalRef = useRef<ModalHandle>(null!);
    const endModalRef = useRef<ModalHandle>(null!);
    const {isLoaded, isShift, pauseShift, endShift} = useShift();
    const {isOnRide, destination, isRouteAvailable} = useRide();
    const t = useTranslations('map');
    const router = useRouter();

    // if not on shift, reroute to /start-shift
    useEffect(() => {
        if (!isLoaded || isShift)
            return;
        router.push("/start-shift");
    }, [isLoaded, isShift]);

    return (
        <APIProvider apiKey={API_KEY}>
            <RideEvaluationModal
                ref={startModalRef}/>
            <RideSummaryModal
                ref={endModalRef}/>

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
                        <OptionsMenu>
                            <MenuOption onClick={pauseShift}>
                                {t("pauseShift")}
                            </MenuOption>
                            <MenuOption onClick={endShift}>
                                {t("endShift")}
                            </MenuOption>
                        </OptionsMenu>
                    </FlexGroup>
                </div>
            </div>
        </APIProvider>
    );
}

