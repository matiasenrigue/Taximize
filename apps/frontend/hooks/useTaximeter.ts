import {useCallback, useEffect, useRef, useState} from "react";
import {
    BASE_FARE,
    FARE_DISTANCE_RATE,
    FARE_DISTANCE_THRESHOLD, FARE_SPEED_THRESHOLD, FARE_TIME_RATE,
    FARE_TIME_THRESHOLD,
} from "../constants/constants";
import {LatLng} from "../constants/types";
import moment from "moment";
import {calculateDistance} from "../lib/calculateDistance/calculateDistance";

interface TaximeterType {
    fare: number;
    distance: number;
    start: (startLocation?: LatLng, startTime?: number, initialFare?: number, initialDistance?: number) => void;
    stop: () => void;
}

export const useTaximeter = (location: LatLng | null): TaximeterType => {
    const [fare, setFare] = useState<number>(0);
    const [distance, setDistance] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    const lastLocationRef = useRef<LatLng|null>(location);
    const lastTimeRef = useRef<number>(0);

    const fareTimeRef = useRef<number>(0);
    const fareDistanceRef = useRef<number>(0);

    const start = useCallback((startLocation?: LatLng, startTime?: number, initialFare?: number, initialDistance?: number) => {
        if (isRunning)
            return;
        setFare(initialFare ?? BASE_FARE);
        setDistance(initialDistance ?? 0);
        lastLocationRef.current = startLocation ?? location;
        lastTimeRef.current = startTime ?? moment.now();
        fareTimeRef.current = 0;
        fareDistanceRef.current = 0;
        setIsRunning(true);
    }, [isRunning, location]);

    const stop = useCallback(() => {
        if (!isRunning)
            return;
        setIsRunning(false);
        if (!location)
            return;
        const distance = calculateDistance(lastLocationRef.current!, location);
        setDistance(prev => prev + distance);
    }, [isRunning, location]);

    const updateFare = useCallback(() => {
        if (!lastLocationRef.current || !location) {
            if (location)
                lastLocationRef.current = location;
            console.warn("Location is not available. Fare calculation may be incorrect.")
            return;
        }

        // calculate time & distance since last update
        const distance = calculateDistance(lastLocationRef.current!, location);
        const elapsedTime = moment.now() - lastTimeRef.current;
        const speed = distance / elapsedTime;

        // update distance or time, depending on the speed
        if (speed > FARE_SPEED_THRESHOLD)
            fareDistanceRef.current += distance;
        else
            fareTimeRef.current += elapsedTime;

        let fareIncrease = 0;
        let distanceIncrease = 0;

        // increase fare based on distance
        while (fareDistanceRef.current >= FARE_DISTANCE_THRESHOLD) {
            fareIncrease += FARE_DISTANCE_RATE;
            distanceIncrease += FARE_DISTANCE_THRESHOLD;
            fareDistanceRef.current -= FARE_DISTANCE_THRESHOLD;
        }

        // increase fare based on time
        while (fareTimeRef.current >= FARE_TIME_THRESHOLD) {
            fareIncrease += FARE_TIME_RATE;
            fareTimeRef.current -= FARE_TIME_THRESHOLD;
        }

        setDistance(prev => prev + distanceIncrease);
        setFare(prev => prev + fareIncrease);
        lastLocationRef.current = location;
        lastTimeRef.current = moment.now();
    }, [location]);

    useEffect(() => {
        if (!isRunning)
            return;
        updateFare();
    }, [isRunning, updateFare]);

    return {
        fare,
        distance,
        start,
        stop
    };
};