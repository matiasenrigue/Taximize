"use client"

import {ShiftEndModal} from "./ShiftEndModal";
import {useCallback, useEffect, useRef} from "react";
import {ModalHandle} from "../Modal/Modal";
import {useShift} from "../../contexts/ShiftContext/ShiftContext";
import {useRide} from "../../contexts/RideContext/RideContext";


export const ShiftEndModalHandler = () => {
    const {checkIsShiftOver} = useShift();
    const {isOnRide} = useRide();
    const shiftEndModalRef = useRef<ModalHandle>(null!);

    const triggerShiftEndModal = useCallback(() => {
        if (!shiftEndModalRef.current || isOnRide)
            return;
        if (checkIsShiftOver())
            shiftEndModalRef.current.open();
    }, [isOnRide, checkIsShiftOver, shiftEndModalRef.current]);

    useEffect(() => {
        const delay = 1000 * 10;
        triggerShiftEndModal();
        const intervalId = setInterval(triggerShiftEndModal, delay);
        return () => clearInterval(intervalId);
    }, [triggerShiftEndModal]);

    return (
        <>
            <ShiftEndModal
                ref={shiftEndModalRef}/>
        </>
    );
};