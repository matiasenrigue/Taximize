"use client"

import {BreakModal} from "./BreakModal";
import {BreakReminderModal} from "./BreakReminderModal";
import {useCallback, useEffect, useRef} from "react";
import {useShiftContext} from "../../contexts/ShiftContext/ShiftContext";
import {ModalHandle} from "../Modal/Modal";

export const BreakModalHandler = () => {
    const {checkBreakTime} = useShiftContext();
    const breakReminderModalRef = useRef<ModalHandle>(null!);
    const breakModalRef = useRef<ModalHandle>(null!);

    const triggerBreakReminderModal = useCallback(() => {
        if (!breakReminderModalRef.current)
            return;
        if (checkBreakTime())
            breakReminderModalRef.current.open();
    }, [checkBreakTime, breakReminderModalRef.current]);

    useEffect(() => {
        const delay = 1000 * 10;
        triggerBreakReminderModal();
        const intervalId = setInterval(triggerBreakReminderModal, delay);
        return () => clearInterval(intervalId);
    }, [triggerBreakReminderModal]);

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