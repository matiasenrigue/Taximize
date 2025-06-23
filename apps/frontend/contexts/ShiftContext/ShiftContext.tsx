"use client"

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";
import moment from "moment";
import {formatDuration} from "../../utility/formatDuration";

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
    getRideTime: () => string | null;
    getRideFare: () => string | null;
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isShift, setIsShift] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState<number|null>(null);
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(null);
    const [destination, setDestination] = useState<Location|null>(null);
    const [isOnRide, setIsOnRide] = useState(false);
    const [rideStartTime, setRideStartTime] = useState<number|null>(null);

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
        setRideStartTime(moment.now());
    }, []);

    const endRide = useCallback(() => {
        setIsOnRide(false);
        setRideStartTime(null);
        setDestination(null);
    }, []);

    const updateDestination = useCallback((location: Location) => {
        setDestination(location);
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

    // returns the duration of the current ride, formatted "h:mm"
    const getRideTime = useCallback(() => {
        if (!isOnRide)
            return null;
        const passedTime = moment.now() - rideStartTime;
        return formatDuration(passedTime);
    }, [isOnRide, rideStartTime]);

    // returns the cost of the ride, formatted with 2 fraction digits
    // todo: implement proper algorithm
    const getRideFare = useCallback(() => {
        if (!isOnRide)
            return null;
        const passedTime = moment.now() - rideStartTime;
        const fare = passedTime * .0001;
        return fare.toFixed(2);
    }, [isOnRide, rideStartTime]);

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
            getRideTime,
            getRideFare,
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