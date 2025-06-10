"use client"

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";

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
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isShift, setIsShift] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState<Date|null>(null);
    const [address, setAddress] = useState("");
    const [isOnRide, setIsOnRide] = useState(false);

    const startShift = useCallback((duration: number) => {
        setDuration(duration);
        setStartTime(new Date());
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

    return (
        <ShiftContext.Provider value={{
            address,
            duration,
            isOnRide,
            navigateToAddress,
            startShift,
            endShift,
            pauseShift,
            unpauseShift,
            startRide,
            endRide,
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