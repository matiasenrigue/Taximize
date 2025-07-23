"use client";

import React, {
    createContext,
    Dispatch,
    PropsWithChildren, SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";
import moment from "moment";
import {formatDuration} from "../../lib/formatDuration/formatDuration";
import {BREAK_MODAL_TIMEOUT, DEFAULT_BREAK_DURATION, DEFAULT_SHIFT_DURATION} from "../../constants/constants";
import {ModalHandle} from "../../components/Modal/Modal";
import {BreakModal} from "../../components/modals/BreakModalHandler/BreakModal";
import api from "../../lib/axios";
import {usePathname, useRouter} from "next/navigation";

interface ShiftContextType {
    duration: number;
    isLoaded: boolean;
    isShift: boolean;
    isPaused: boolean;
    isOvertime: boolean;
    startShift: (duration: number) => void;
    endShift: () => void;
    pauseShift: (duration?: number) => void;
    continueShift: () => void;
    getRemainingTime: () => string;
    checkBreakTime: () => boolean;
    checkIsShiftOver: () => boolean;
    skipBreak: () => void;
    startOvertime: () => void;
    getRemainingBreakDuration: () => number;
    totalDuration: number;
    totalEarnings: number;
    loadRide: boolean;
    showBreakWarnings: boolean;
    setShowBreakWarnings: Dispatch<SetStateAction<boolean>>
}

const ShiftContext = createContext<ShiftContextType|null>(null);

export const ShiftContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const breakModalRef = useRef<ModalHandle>(null!);
    const router = useRouter();
    const pathname = usePathname();

    const [isShift, setIsShift] = useState<boolean>(false);
    const [loadRide, setLoadRide] = useState<boolean>(false);

    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(DEFAULT_SHIFT_DURATION);
    const [startTime, setStartTime] = useState<number|null>(null);

    const [showBreakWarnings, setShowBreakWarnings] = useState<boolean>(true);
    const [lastBreakTime, setLastBreakTime] = useState<number|null>(null);
    const [breakDuration, setBreakDuration] = useState<number>(DEFAULT_BREAK_DURATION);
    const [totalBreakDuration, setTotalBreakDuration] = useState<number>(0);
    const [isOvertime, setIsOvertime] = useState<boolean>(false);

    // shift statistics
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [totalEarnings, setTotalEarnings] = useState<number>(0);


    // initialize shift
    useEffect(() => {
        api.get("/shifts/current").then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed loading current shift.", error);
                return;
            }

            const {
                isOnShift,
                shiftStart,
                isPaused,
                pauseStart,
                lastPauseEnd,
                duration,
                pauseDuration,
                isOnRide,
                rideStartLatitude,
                rideStartLongitude,
                rideDestinationAddress
            } = data;

            setIsLoaded(true);

            if (!isOnShift)
                return;

            setIsShift(isOnShift);
            setLoadRide(isOnRide);
            setDuration(duration);
            setBreakDuration(pauseDuration);
            setStartTime(shiftStart);
            setIsPaused(isPaused);
            setLastBreakTime(isPaused ? pauseStart : (lastPauseEnd ?? shiftStart));
            router.push("/map");
        }).catch((error) => {
            console.warn(error);
        });
    }, []);

    const startShift = useCallback((duration: number = DEFAULT_SHIFT_DURATION): void => {
        if (isShift || duration <= 0)
            return;

        const timestamp = moment.now();

        api.post("/shifts/start-shift", {
            duration,
            timestamp
        }).then((response) => {
            const {
                success,
                error
            } = response.data;

            if (!success) {
                console.warn("Failed starting shift.", error);
                return;
            }

            setDuration(duration);
            setStartTime(timestamp);
            setLastBreakTime(timestamp);
            setIsShift(true);
            router.push('/map');
        }).catch((error) => {
            console.warn(error);
        });
    }, [isShift]);

    const endShift = useCallback(() => {
        if (!isShift)
            return;

        const timestamp = moment.now();
        api.post("/shifts/end-shift", {
            timestamp
        }).then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed ending shift.", error);
                return;
            }

            const {
                totalDuration,
                passengerTime,
                pauseTime,
                idleTime,
                numBreaks,
                averageBreak,
                totalEarnings
            } = data;

            setIsShift(false);
            setTotalDuration(totalDuration);
            setTotalEarnings(totalEarnings);
            router.push('/end-shift');
        }).catch((error) => {
            console.warn(error);
        });
    }, [isShift]);

    const pauseShift = useCallback((duration: number = DEFAULT_BREAK_DURATION) => {
        if (!isShift || isPaused)
            return;

        const timestamp = moment.now();
        api.post("/shifts/pause-shift", {
            timestamp,
            pauseDuration: duration
        }).then((response) => {
            const {
                success,
                error
            } = response.data;

            if (!success) {
                console.warn("Failed pausing shift.", error);
                return;
            }

            setLastBreakTime(timestamp);
            setBreakDuration(duration);
            setIsPaused(true);
            if (!breakModalRef || typeof breakModalRef === "function")
                return;
            breakModalRef.current.open();
        }).catch((error) => {
            console.warn(error);
        });
    }, [isShift, isPaused]);

    const continueShift = useCallback(() => {
        if (!isShift || !isPaused)
            return;

        const timestamp = moment.now();

        api.post("/shifts/continue-shift", {
            timestamp
        }).then((response) => {
            const {
                success,
                error
            } = response.data;

            if (!success) {
                console.warn("Failed continuing shift.", error);
                return;
            }

            const breakDuration = timestamp - (lastBreakTime ?? 0);
            setTotalBreakDuration(prev => prev + breakDuration);
            setLastBreakTime(timestamp);
            setIsPaused(false);
        }).catch((error) => {
            console.warn(error);
        });
    }, [isShift, isPaused, lastBreakTime]);

    // skips the current break
    const skipBreak = useCallback(() => {
        if (!isShift)
            return;

        const timestamp = moment.now();

        api.post("/shifts/skip-pause", {
            timestamp
        }).then((response) => {
            const {
                success,
                error
            } = response.data;

            if (!success) {
                console.warn("Failed continuing shift.", error);
                return;
            }

            setLastBreakTime(moment.now());
        }).catch((error) => {
            console.warn(error);
        });
    }, [isShift]);

    // returns the remaining shift duration, formatted "h:mm"
    const getRemainingTime = useCallback((): string => {
        if (!startTime)
            return formatDuration(0);
        const passedTime = moment.now() - startTime - totalBreakDuration;
        const remainingTime = Math.max(0, duration - passedTime);
        return formatDuration(remainingTime);
    }, [duration, startTime, totalBreakDuration]);

    // returns the remaining break duration in milliseconds
    const getRemainingBreakDuration = useCallback((): number => {
        if (!lastBreakTime)
            return 0;
        const passedTime = moment.now() - lastBreakTime;
        return Math.max(0, breakDuration - passedTime)
    }, [lastBreakTime, breakDuration]);

    // returns true, if it is time for a break
    const checkBreakTime = useCallback((): boolean => {
        if (!showBreakWarnings || !isLoaded || !isShift || isPaused || !lastBreakTime)
            return false;
        const time = moment.now() - lastBreakTime;
        return (time >= BREAK_MODAL_TIMEOUT);
    }, [isLoaded, lastBreakTime, isShift, isPaused, showBreakWarnings]);

    // returns true, if the shift time is over
    const checkIsShiftOver = useCallback((): boolean => {
        if (!isLoaded || !isShift || isPaused || !startTime)
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
            totalDuration,
            totalEarnings,
            loadRide,
            showBreakWarnings,
            setShowBreakWarnings
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