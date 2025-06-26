"use client"

import {ShiftEndModal} from "./ShiftEndModal";
import {useCallback, useEffect, useRef} from "react";
import {ModalHandle} from "../Modal/Modal";
import {useShiftContext} from "../../contexts/ShiftContext/ShiftContext";


export const ShiftEndModalHandler = () => {
    const {checkIsShiftOver} = useShiftContext();
    const shiftEndModalRef = useRef<ModalHandle>(null!);

    const triggerShiftEndModal = useCallback(() => {
        if (!shiftEndModalRef.current)
            return;
        if (checkIsShiftOver())
            shiftEndModalRef.current.open();
    }, [checkIsShiftOver, shiftEndModalRef.current]);

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