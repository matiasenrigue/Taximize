"use client";

import React, {createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import moment from "moment";
import {formatDuration} from "../../lib/formatDuration/formatDuration";
import {BREAK_MODAL_TIMEOUT, DEFAULT_BREAK_DURATION} from "../../constants/constants";
import {ModalHandle} from "../../components/Modal/Modal";
import {BreakModal} from "../../components/modals/BreakModalHandler/BreakModal";
import api from "../../lib/axios";
import {useRouter} from "next/navigation";

interface ShiftContextType {
    isLoaded: boolean;
    isShift: boolean;
    isPaused: boolean;
    isOvertime: boolean;
    startShift: (duration: number) => void;
    endShift: () => void;
    pauseShift: () => void;
    continueShift: () => void;
    getRemainingTime: () => string;
    checkBreakTime: () => boolean;
    checkIsShiftOver: () => boolean;
    skipBreak: () => void;
    startOvertime: () => void;
    getRemainingBreakDuration: () => number;
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const breakModalRef = useRef<ModalHandle>(null!);
    const router = useRouter();

    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isShift, setIsShift] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number|null>(null);
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(null);
    const [totalBreakDuration, setTotalBreakDuration] = useState<number>(0);
    const [isOvertime, setIsOvertime] = useState<boolean>(false);

    // initialize shift
    useEffect(() => {
        api.get("/shifts/current")
            .then((response) => {
                console.log(response);
                const {
                    isOnShift,
                    shiftStart,
                    isPaused,
                    pauseStart,
                    lastPauseEnd,
                    isOnRide,
                    rideStartLatitude,
                    rideStartLongitude,
                    rideDestinationAddress
                } = response.data.data;

                setIsLoaded(true);

                if (!isOnShift)
                    return;

                setIsShift(isOnShift);
                setDuration(60 * 60 * 60 * 1000);
                setStartTime(shiftStart);
                setIsPaused(isPaused);
                setLastBreakTime(isPaused ? pauseStart : (lastPauseEnd ?? shiftStart));
            })
            .catch((error) => console.warn(error));
    }, []);

    const startShift = useCallback((duration: number) => {
        if (duration === 0)
            return;
        setDuration(duration);
        setStartTime(moment.now());
        setLastBreakTime(moment.now());
        setIsShift(true);

        api.post("/shifts/start-shift", {})
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
        router.push('/map');
    }, []);

    const endShift = useCallback(() => {
        setIsShift(false);
        api.post("/shifts/end-shift", {})
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
    }, []);

    const pauseShift = useCallback(() => {
        setLastBreakTime(moment.now());
        setIsPaused(true);
        if (!breakModalRef || typeof breakModalRef === "function")
            return;
        breakModalRef.current.open();
        api.post("/shifts/pause-shift", {})
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
    }, []);

    const continueShift = useCallback(() => {
        const breakDuration = moment.now() - lastBreakTime;
        setTotalBreakDuration(prev => prev + breakDuration);
        setLastBreakTime(moment.now());
        setIsPaused(false);
        api.post("/shifts/continue-shift", {})
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
    }, [lastBreakTime]);

    // returns the remaining shift duration, formatted "h:mm"
    const getRemainingTime = useCallback((): string => {
        const passedTime = moment.now() - startTime - totalBreakDuration;
        const remainingTime = Math.max(0, duration - passedTime);
        return formatDuration(remainingTime);
    }, [duration, startTime, totalBreakDuration]);

    // returns the remaining break duration in milliseconds
    const getRemainingBreakDuration = useCallback((): number => {
        const passedTime = moment.now() - lastBreakTime;
        return Math.max(0, DEFAULT_BREAK_DURATION - passedTime)
    }, [lastBreakTime]);

    // skips the current break
    const skipBreak = useCallback(() => {
        setLastBreakTime(moment.now());
    }, []);

    // returns true, if it is time for a break
    const checkBreakTime = useCallback((): boolean => {

        if (!isLoaded || !isShift || isPaused)
            return false;
        const time = moment.now() - lastBreakTime;
        return (time >= BREAK_MODAL_TIMEOUT);
    }, [isLoaded, lastBreakTime, isShift, isPaused]);

    // returns true, if the shift time is over
    const checkIsShiftOver = useCallback((): boolean => {
        if (!isLoaded || !isShift || isPaused)
            return false;
        const passedTime = moment.now() - startTime - totalBreakDuration;
        return passedTime >= duration;
    }, [isLoaded, startTime, duration, isShift, isPaused]);

    // starts overtime
    const startOvertime = useCallback((): void => {
        setIsOvertime(true);
    }, []);


    return (
        <ShiftContext.Provider value={{
            duration,
            isLoaded,
            isShift,
            isPaused,
            isOvertime,
            startShift,
            endShift,
            pauseShift,
            continueShift,
            getRemainingTime,
            checkBreakTime,
            checkIsShiftOver,
            skipBreak,
            startOvertime,
            getRemainingBreakDuration,
        }}>
            <BreakModal ref={breakModalRef}/>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (!context)
        throw new Error("useShiftContext can only be used within ShiftContextProvider!");
    return context;
};