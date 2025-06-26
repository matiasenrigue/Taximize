"use client";

import {createContext, PropsWithChildren, useCallback, useContext, useState} from "react";
import moment from "moment";
import {formatDuration} from "../../utility/formatDuration";

interface Location {
    placeId: string;
    name: string;
}

interface RideContextType {
    isOnRide: boolean;
    destination: Location | null;
    updateDestination: (location: Location | null) => void;
    startRide: () => void;
    endRide: () => void;
    getRideTime: () => string | null;
    getRideFare: () => string | null;
}

const RideContext = createContext<RideContextType|null>(null);

export const RideContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [isOnRide, setIsOnRide] = useState(false);
    const [destination, setDestination] = useState<Location|null>(null);
    const [rideStartTime, setRideStartTime] = useState<number|null>(null);

    // set a new destination to navigate to (may not be a ride)
    const updateDestination = useCallback((location: Location) => {
        setDestination(location);
    }, []);

    // start a ride to the current destination
    const startRide = useCallback(() => {
        setIsOnRide(true);
        setRideStartTime(moment.now());
    }, []);

    // end the current ride
    const endRide = useCallback(() => {
        setIsOnRide(false);
        setRideStartTime(null);
        setDestination(null);
    }, []);

    // return the duration of the current ride, formatted "h:mm"
    const getRideTime = useCallback(() => {
        if (!isOnRide)
            return null;
        const passedTime = moment.now() - rideStartTime;
        return formatDuration(passedTime);
    }, [isOnRide, rideStartTime]);

    // return the cost of the ride, formatted with 2 fraction digits
    // todo: implement proper algorithm
    const getRideFare = useCallback(() => {
        if (!isOnRide)
            return null;
        const passedTime = moment.now() - rideStartTime;
        const fare = passedTime * .0001;
        return fare.toFixed(2);
    }, [isOnRide, rideStartTime]);

    return (
        <RideContext.Provider value={{
            isOnRide,
            destination,
            updateDestination,
            startRide,
            endRide,
            getRideTime,
            getRideFare
        }}>
            {children}
        </RideContext.Provider>
    );
};

export const useRide = () => {
    const context = useContext(RideContext);
    if (!context)
        throw new Error("useRide can only be used within RideContextProvider!");
    return context;
};