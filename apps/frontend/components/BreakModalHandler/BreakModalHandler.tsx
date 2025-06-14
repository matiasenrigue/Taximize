"use client"

import {BreakModal} from "./BreakModal";
import {BreakReminderModal} from "./BreakReminderModal";
import {useEffect, useRef} from "react";
import {useShiftContext} from "../../contexts/ShiftContext/ShiftContext";
import {ModalHandle} from "../Modal/Modal";

export const BreakModalHandler = () => {
    const {checkBreakTime} = useShiftContext();
    const breakReminderModalRef = useRef<ModalHandle>(null!);
    const breakModalRef = useRef<ModalHandle>(null!);

    useEffect(() => {
        const delay = 1000 * 10;
        const intervalId = setInterval(() => {
            console.log("check break time");
            if (checkBreakTime())
                breakReminderModalRef.current.open();
        }, delay);
        return () => clearInterval(intervalId);
    }, [checkBreakTime]);

    return (
        <>
            <BreakReminderModal
                ref={breakReminderModalRef}
                breakModalRef={breakModalRef}/>
            <BreakModal
                ref={breakModalRef}/>
        </>
    )
};