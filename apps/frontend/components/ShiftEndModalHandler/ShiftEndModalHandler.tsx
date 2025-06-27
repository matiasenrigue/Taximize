"use client"

import {ShiftEndModal} from "./ShiftEndModal";
import {useCallback, useEffect, useRef} from "react";
import {ModalHandle} from "../Modal/Modal";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";
import {useRide} from "../../contexts/RideContext/RideContext";


export const ShiftEndModalHandler = () => {
    const {isOvertime, checkIsShiftOver} = useShift();
    const {isOnRide} = useRide();
    const shiftEndModalRef = useRef<ModalHandle>(null!);

    const triggerShiftEndModal = useCallback(() => {
        if (!shiftEndModalRef.current || isOnRide)
            return;
        if (checkIsShiftOver())
            shiftEndModalRef.current.open();
    }, [isOnRide, checkIsShiftOver, shiftEndModalRef.current]);

    useEffect(() => {
        if (isOvertime)
            return;
        triggerShiftEndModal();
        const delay = 1000 * 10;
        const intervalId = setInterval(triggerShiftEndModal, delay);
        return () => clearInterval(intervalId);
    }, [isOvertime, triggerShiftEndModal]);

    return (
        <>
            <ShiftEndModal
                ref={shiftEndModalRef}/>
        </>
    );
};