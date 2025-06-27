"use client";

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";
import moment from "moment";
import {formatDuration} from "../../utility/formatDuration";
import {BREAK_MODAL_TIMEOUT, DEFAULT_BREAK_DURATION} from "../../constants/constants";

interface ShiftContextType {
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

    const [isShift, setIsShift] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(0);
    const [startTime, setStartTime] = useState<number|null>(null);
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(null);
    const [totalBreakDuration, setTotalBreakDuration] = useState<number>(0);
    const [isOvertime, setIsOvertime] = useState<boolean>(false);

    const startShift = useCallback((duration: number) => {
        setDuration(duration);
        setStartTime(moment.now());
        setLastBreakTime(moment.now());
        setIsShift(true);
    }, []);

    const endShift = useCallback(() => {
        setIsShift(false);
    }, []);

    const pauseShift = useCallback(() => {
        setLastBreakTime(moment.now());
        setIsPaused(true);
    }, []);

    const continueShift = useCallback(() => {
        const breakDuration = moment.now() - lastBreakTime;
        setTotalBreakDuration(prev => prev + breakDuration);
        setLastBreakTime(moment.now());
        setIsPaused(false);
    }, [lastBreakTime]);

    // returns the remaining shift duration, formatted "h:mm"
    const getRemainingTime = useCallback(() => {
        const passedTime = moment.now() - startTime - totalBreakDuration;
        const remainingTime = Math.max(0, duration - passedTime);
        return formatDuration(remainingTime);
    }, [duration, startTime, totalBreakDuration]);

    const getRemainingBreakDuration = useCallback((): number => {
        const passedTime = moment.now() - lastBreakTime;
        return Math.max(0, DEFAULT_BREAK_DURATION - passedTime)
    }, [lastBreakTime]);

    const skipBreak = useCallback(() => {
        setLastBreakTime(moment.now());
    }, []);

    const checkBreakTime = useCallback(() => {
        if (!isShift || isPaused)
            return false;
        const time = moment.now() - lastBreakTime;
        return (time >= BREAK_MODAL_TIMEOUT);
    }, [lastBreakTime, isShift, isPaused]);

    const checkIsShiftOver = useCallback((): boolean => {
        if (!isShift || isPaused)
            return false;
        const passedTime = moment.now() - startTime - totalBreakDuration;
        return passedTime >= duration;
    }, [startTime, duration, isShift, isPaused]);

    const startOvertime = useCallback(() => {
        setIsOvertime(true);
    }, []);


    return (
        <ShiftContext.Provider value={{
            duration,
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