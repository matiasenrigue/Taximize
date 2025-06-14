"use client"

import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useState} from "react";
import moment from "moment";

interface ShiftContextType {
    address: string;
    duration: number;
    isOnRide: boolean;
    startShift: (duration: number) => void;
    endShift: () => void;
    pauseShift: () => void;
    unpauseShift: () => void;
    navigateToAddress: (address: string) => void;
    startRide: () => void;
    endRide: () => void;
    getRemainingTime: () => string;
    checkBreakTime: () => boolean;
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isShift, setIsShift] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState<number|null>(() => moment.now());
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(() => moment.now());
    const [address, setAddress] = useState("");
    const [isOnRide, setIsOnRide] = useState(false);

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

    const startRide = useCallback(() => {
        setIsOnRide(true);
    }, []);

    const endRide = useCallback(() => {
        setIsOnRide(false);
    }, []);

    const navigateToAddress = useCallback((address: string) => {
        setAddress(address);
    }, []);

    const getRemainingTime = useCallback(() => {
        const passedTime = moment.now() - startTime;
        const remainingTime = duration - passedTime;
        return moment.utc(Math.max(0, remainingTime)).format('h:mm');
    }, [duration, startTime]);

    const checkBreakTime = useCallback(() => {
        if (!isShift || isPaused)
            return false;
        const time = moment.now() - lastBreakTime;
        console.log(time, breakModalTime);
        return (time >= breakModalTime);
    }, [lastBreakTime, isShift, isPaused, breakModalTime]);

    return (
        <ShiftContext.Provider value={{
            address,
            duration,
            isOnRide,
            startShift,
            endShift,
            pauseShift,
            unpauseShift,
            navigateToAddress,
            startRide,
            endRide,
            getRemainingTime,
            checkBreakTime,
        }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShiftContext = () => {
    const context = useContext(ShiftContext);
    if (!context)
        throw new Error("useShiftContext can only be used within <ShiftContextProvider>!");
    return context;
};