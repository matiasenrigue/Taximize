"use client"

import {useShift} from "../../contexts/ShiftContext/ShiftContext";
import styles from "./ShiftTimer.module.css";
import {useEffect, useState} from "react";

export const ShiftTimer = () => {
    const {isShift, getRemainingTime} = useShift();
    const [remainingTime, setRemainingTime] = useState(() => getRemainingTime());

    useEffect(() => {
        setRemainingTime(getRemainingTime());
        const delay = 1000 * 10;
        const intervalId = setInterval(() => {
            setRemainingTime(getRemainingTime());
        }, delay);

        return () => clearInterval(intervalId);
    }, [getRemainingTime]);

    if (!isShift)
        return null;

    /* suppressHydrationWarning is used to hide the warning that occurs because the Date() used within getRemainingTime
     * will be different on the server-side (pre-rendered) and client-side
     * see: https://nextjs.org/docs/messages/react-hydration-error
     */
    return (
        <span
            className={styles.timer}
            suppressHydrationWarning>
            {remainingTime}
        </span>
    );
};
