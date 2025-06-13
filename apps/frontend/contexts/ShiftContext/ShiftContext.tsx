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
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isShift, setIsShift] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState<number|null>(() => moment.now());
    const [address, setAddress] = useState("");
    const [isOnRide, setIsOnRide] = useState(false);

    const startShift = useCallback((duration: number) => {
        setDuration(duration);
        setStartTime(moment.now());
        setIsShift(true);
    }, []);

    const endShift = useCallback(() => {
        setIsShift(false);
    }, []);

    const pauseShift = useCallback(() => {
        setIsPaused(true);
    }, []);

    const unpauseShift = useCallback(() => {
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