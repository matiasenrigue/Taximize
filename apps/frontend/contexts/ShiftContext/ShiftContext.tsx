"use client";

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";
import moment from "moment";
import {formatDuration} from "../../utility/formatDuration";

interface ShiftContextType {
    isShift: boolean;
    startShift: (duration: number) => void;
    endShift: () => void;
    pauseShift: () => void;
    unpauseShift: () => void;
    getRemainingTime: () => string;
    checkBreakTime: () => boolean;
    checkIsShiftOver: () => boolean;
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isShift, setIsShift] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState<number|null>(null);
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(null);

    const breakModalTime = 3 * 60 * 60 * 1000;

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

    const unpauseShift = useCallback(() => {
        setLastBreakTime(moment.now());
        setIsPaused(false);
    }, []);

    // returns the remaining shift duration, formatted "h:mm"
    const getRemainingTime = useCallback(() => {
        const passedTime = moment.now() - startTime;
        const remainingTime = Math.max(0, duration - passedTime);
        return formatDuration(remainingTime);
    }, [duration, startTime]);

    const checkBreakTime = useCallback(() => {
        if (!isShift || isPaused)
            return false;
        const time = moment.now() - lastBreakTime;
        return (time >= breakModalTime);
    }, [lastBreakTime, isShift, isPaused, breakModalTime]);

    const checkIsShiftOver = useCallback((): boolean => {
        if (!isShift || isPaused)
            return false;
        const passedTime = moment.now() - startTime;
        return passedTime >= duration;
    }, [startTime, duration, isShift, isPaused]);


    return (
        <ShiftContext.Provider value={{
            duration,
            isShift,
            startShift,
            endShift,
            pauseShift,
            unpauseShift,
            getRemainingTime,
            checkBreakTime,
            checkIsShiftOver,
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