"use client"

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {ModalHandle} from "../../../components/Modal/Modal";
import {useEffect, useRef} from "react";
import {useTranslations} from "next-intl";
import {RideEvaluationModal} from "./components/RideEvaluationModal";
import {RideSummaryModal} from "./components/RideSummaryModal";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {Map} from "./components/Map";
import {UserLocationContextProvider} from "../../../contexts/UserLocationContext/UserLocationContext";
import {APIProvider} from "@vis.gl/react-google-maps";
import {LocationSearchbar} from "./components/LocationSearchbar";
import {useRouter} from "next/navigation";
import {TaxiMeter} from "../../../components/TaxiMeter/TaxiMeter";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useRide} from "../../../contexts/RideContext/RideContext";
import {MenuOption, OptionsMenu} from "../../../components/OptionsMenu/OptionsMenu";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapPage() {
    const router = useRouter();
    const startModalRef = useRef<ModalHandle>(null!);
    const endModalRef = useRef<ModalHandle>(null!);
    const {isShift, pauseShift, endShift} = useShift();
    const {isOnRide, destination} = useRide();
    const t = useTranslations('map');

    // if not on shift, reroute to /start-shift
    useEffect(() => {
        if (isShift) return;
        router.push("/start-shift");
    }, [isShift]);

    return (
        <UserLocationContextProvider>
            <APIProvider apiKey={API_KEY}>
                <RideEvaluationModal
                    ref={startModalRef}/>
                <RideSummaryModal
                    ref={endModalRef}/>

                <div className={styles.page}>
                    <Map className={styles.map}/>

                    <div className={styles.search_container}>
                        <LocationSearchbar/>
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
                                : (destination && <Button
                                    elevated={true}
                                    onClick={() => startModalRef.current?.open()}>
                                    {t("startRide")}
                                </Button>)}
                            <OptionsMenu>
                                <MenuOption onClick={pauseShift}>
                                    Take a Break
                                </MenuOption>
                                <MenuOption onClick={endShift}>
                                    End Shift
                                </MenuOption>
                            </OptionsMenu>
                        </FlexGroup>
                    </div>
                </div>
            </APIProvider>
        </UserLocationContextProvider>
    );
}

