"use client"

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";
import moment from "moment";

interface Location {
    placeId: string;
    name: string;
}

interface ShiftContextType {
    destination: Location | null;
    duration: number;
    isShift: boolean;
    isOnRide: boolean;
    startShift: (duration: number) => void;
    endShift: () => void;
    pauseShift: () => void;
    unpauseShift: () => void;
    updateDestination: (location: Location | null) => void;
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
    const [destination, setDestination] = useState<Location|null>(null);
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
        setDestination(null);
    }, []);

    const updateDestination = useCallback((location: Location) => {
        setDestination(location);
    }, []);

    // returns the remaining shift time, formatted "h:mm"
    const getRemainingTime = useCallback(() => {
        const passedTime = moment.now() - startTime;
        const remainingTime = Math.max(0, duration - passedTime);
        const remainingTimeObj = moment.duration(remainingTime);
        const hours = Math.floor(remainingTimeObj.asHours()).toString();
        const minutes = remainingTimeObj.minutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }, [duration, startTime]);

    const checkBreakTime = useCallback(() => {
        if (!isShift || isPaused)
            return false;
        const time = moment.now() - lastBreakTime;
        return (time >= breakModalTime);
    }, [lastBreakTime, isShift, isPaused, breakModalTime]);

    return (
        <ShiftContext.Provider value={{
            destination,
            duration,
            isShift,
            isOnRide,
            startShift,
            endShift,
            pauseShift,
            unpauseShift,
            updateDestination,
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