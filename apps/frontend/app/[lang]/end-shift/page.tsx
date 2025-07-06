"use client";

import styles from "./page.module.css";
import {Button} from "../../../components/Button/Button";
import {FlexGroup} from "../../../components/FlexGroup/FlexGroup";
import {useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

export default function EndShift() {
    const t = useTranslations("end-shift");
    const router = useRouter();

    return (
        <div className={styles.page}>
            <FlexGroup
                direction={"column"}
                align={"start"}>
                <p>todo: shift summary</p>
                <Button
                    onClick={() => router.push("/start-shift")}>
                    {t("confirmButton")}
                </Button>
            </FlexGroup>
        </div>
    );
}