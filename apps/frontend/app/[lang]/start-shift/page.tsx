"use client"

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {TimeInput} from "../../../components/TimeInput/TimeInput";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";

export default function StartShift() {
    const router = useRouter();
    const {startShift} = useShift();
    const [durationInMilliseconds, setDurationInMilliseconds] = useState<number>(0);
    const t = useTranslations("start-shift");

    return (
        <div className={styles.page}>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <TimeInput
                    onChange={setDurationInMilliseconds}/>
                <Button
                    onClick={() => {
                        startShift(durationInMilliseconds)
                        router.push('/map');
                    }}>
                    {t("startShift")}
                </Button>
            </FlexGroup>
        </div>
    );
};