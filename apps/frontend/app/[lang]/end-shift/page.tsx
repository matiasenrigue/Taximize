"use client";

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {useShift} from "../../../contexts/ShiftContext/ShiftContext";
import {formatDuration} from "../../../lib/formatDuration/formatDuration";

export default function EndShift() {
    const t = useTranslations("end-shift");
    const router = useRouter();
    const {totalEarnings, totalDuration} = useShift();

    return (
        <div className={styles.page}>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <p>Total Earnings: ${(totalEarnings).toFixed(2)}</p>
                <p>Total Duration: {formatDuration(totalDuration)}</p>
                <Button
                    onClick={() => router.push("/start-shift")}>
                    {t("confirmButton")}
                </Button>
            </FlexGroup>
        </div>
    );
}