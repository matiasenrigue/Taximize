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
import {SmartShiftAssistant, getNYCTime} from "../../../../components/SmartShiftAssistant/SmartShiftAssistant";

export default function StartShift() {
    const router = useRouter();
    const {isLoaded, isShift, startShift} = useShift();
    const [duration, setDuration] = useState<number>(DEFAULT_SHIFT_DURATION);
    const [nycTime, setNycTime] = useState<string>("");
    const t = useTranslations("start-shift");
    const isValid = duration > 0;

    // Update NYC time
    useEffect(() => {
        const updateTime = () => {
            const nycDate = getNYCTime();
            const nycTimeString = nycDate.toLocaleString("en-US", {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            setNycTime(nycTimeString);
        };
        
        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        
        return () => clearInterval(interval);
    }, []);

    // if on shift, reroute to /map
    useEffect(() => {
        if (!isLoaded || !isShift)
            return;
        router.push("/map");
    }, [isLoaded, isShift, router]);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <Heading>{t("title")}</Heading>
                {nycTime && <div className={styles.nycTime}>{nycTime}</div>}
            </div>
            
            <div className={styles.mainContent}>
                <div className={styles.shiftForm}>
                    <FlexGroup
                        direction={"column"}
                        align={"center"}>
                        <div className={styles.durationSection}>
                            <Label className={styles.durationLabel}>
                                How long will your shift be today?
                            </Label>
                            <div className={styles.timeInputWrapper}>
                                <TimeInput
                                    defaultValue={DEFAULT_SHIFT_DURATION}
                                    invalid={!isValid}
                                    onChange={setDuration}/>
                            </div>
                            {!isValid && <ErrorMessage>
                                {t("invalidDuration")}
                            </ErrorMessage>}
                        </div>
                        <Button
                            className={styles.startButton}
                            disabled={!isValid}
                            onClick={() => startShift(duration)}>
                            {t("startShift")}
                        </Button>
                    </FlexGroup>
                </div>
                
                <div className={styles.smartAssistantWrapper}>
                    <SmartShiftAssistant />
                </div>
            </div>
        </div>
    );
};