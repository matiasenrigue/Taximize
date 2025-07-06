"use client"

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {TimeInput} from "../../../components/TimeInput/TimeInput";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";
import {DEFAULT_SHIFT_DURATION} from "../../../constants/constants";

export default function StartShift() {
    const router = useRouter();
    const {isLoaded, isShift, startShift} = useShift();
    const [duration, setDuration] = useState<number>(DEFAULT_SHIFT_DURATION);
    const t = useTranslations("start-shift");

    // if on shift, reroute to /map
    useEffect(() => {
        if (!isLoaded || !isShift)
            return;
        router.push("/map");
    }, [isLoaded, isShift]);

    return (
        <div className={styles.page}>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <TimeInput
                    defaultValue={DEFAULT_SHIFT_DURATION}
                    invalid={duration === 0}
                    onChange={setDuration}/>
                <Button
                    disabled={duration === 0}
                    onClick={() => startShift(duration)}>
                    {t("startShift")}
                </Button>
            </FlexGroup>
        </div>
    );
};