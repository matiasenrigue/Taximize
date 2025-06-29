"use client"

import {BreakModal} from "./BreakModal";
import {BreakReminderModal} from "./BreakReminderModal";
import {useCallback, useEffect, useRef} from "react";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";
import {ModalHandle} from "../Modal/Modal";
import {useRide} from "../../contexts/RideContext/RideContext";

export const BreakModalHandler = () => {
    const {checkBreakTime} = useShift();
    const {isOnRide} = useRide();
    const breakReminderModalRef = useRef<ModalHandle>(null!);

    const triggerBreakReminderModal = useCallback(() => {
        if (!breakReminderModalRef.current || isOnRide)
            return;
        if (checkBreakTime())
            breakReminderModalRef.current.open();
    }, [checkBreakTime, breakReminderModalRef.current, isOnRide]);

    useEffect(() => {
        const delay = 1000 * 10;
        triggerBreakReminderModal();
        const intervalId = setInterval(triggerBreakReminderModal, delay);
        return () => clearInterval(intervalId);
    }, [triggerBreakReminderModal]);

    return (
        <>
            <BreakReminderModal ref={breakReminderModalRef}/>
        </>
    )
};