"use client"

import styles from "./page.module.css";
import {Button} from "../../../../components/Button/Button";
import {useShift} from "../../../../contexts/ShiftContext/ShiftContext";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {TimeInput} from "../../../../components/TimeInput/TimeInput";
import {FlexGroup} from "../../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";
import {DEFAULT_SHIFT_DURATION} from "../../../../constants/constants";
import {ErrorMessage} from "../../../../components/ErrorMessage/ErrorMessage";
import {Label} from "../../../../components/Label/Label";
import {Heading} from "../../../../components/Heading/Heading";
import {SmartShiftAssistant} from "../../../../components/SmartShiftAssistant/SmartShiftAssistant";

export default function StartShift() {
    const router = useRouter();
    const {isLoaded, isShift, startShift} = useShift();
    const [duration, setDuration] = useState<number>(DEFAULT_SHIFT_DURATION);
    const t = useTranslations("start-shift");
    const isValid = duration > 0;

    // if on shift, reroute to /map
    useEffect(() => {
        if (!isLoaded || !isShift)
            return;
        router.push("/map");
    }, [isLoaded, isShift, router]);

    return (
        <div className={styles.page}>
            <Heading>{t("title")}</Heading>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <div>
                    <Label>{t("duration")}</Label>
                    <TimeInput
                        defaultValue={DEFAULT_SHIFT_DURATION}
                        invalid={!isValid}
                        onChange={setDuration}/>
                    {!isValid && <ErrorMessage>
                        {t("invalidDuration")}
                    </ErrorMessage>}
                </div>
                <Button
                    disabled={!isValid}
                    onClick={() => startShift(duration)}>
                    {t("startShift")}
                </Button>
            </FlexGroup>
            <SmartShiftAssistant />
        </div>
    );
};