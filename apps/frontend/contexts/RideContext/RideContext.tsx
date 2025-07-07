"use client";

import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";
import moment from "moment";
import api from "../../lib/axios";
import {useUserLocationContext} from "../UserLocationContext/UserLocationContext";
import {useTaximeter} from "../../hooks/useTaximeter";
import {useShift} from "../ShiftContext/ShiftContext";

interface Place {
    placeId: string | null;
    name: string;
    lat: number;
    lng: number;
}

interface RideContextType {
    isOnRide: boolean;
    destination: Place | null;
    updateDestination: (place: Place | null) => void;
    startRide: () => void;
    endRide: () => void;
    rating: number;
    fare: number;
    distance: number;
    duration: number;
    isRouteAvailable: boolean;
    setIsRouteAvailable: Dispatch<SetStateAction<boolean>>;
}

const RideContext = createContext<RideContextType|null>(null);

export const RideContextProvider = (props: PropsWithChildren) => {
    const {children} = props;
    const {location: userLocation} = useUserLocationContext();
    const {
        fare,
        distance,
        start: startTaximeter,
        stop: stopTaximeter
    } = useTaximeter(userLocation);

    const {loadRide} = useShift();

    const [isOnRide, setIsOnRide] = useState(false);
    const [destination, setDestination] = useState<Place|null>(null);
    const [rideStartTime, setRideStartTime] = useState<number|null>(null);
    const [isRouteAvailable, setIsRouteAvailable] = useState<boolean>(false);
    const [rating, setRating] = useState<number>(3);
    const [duration, setDuration] = useState<number>(0);

    // initialize shift
    useEffect(() => {
        if (!loadRide)
            return;
        api.get("/rides/current")
            .then((response) => {
                const {
                    current_destination_latitude,
                    current_destination_longitude,
                } = response.data.data;

                setDestination({
                    placeId: null,
                    name: "Unknown",
                    lat: current_destination_latitude,
                    lng: current_destination_longitude
                });
            })
            .catch((error) => console.warn(error));
    }, [loadRide]);

    // set a new destination to navigate to (may not be a ride)
    const updateDestination = useCallback((place: Place | null) => {
        setDestination(place);
        setIsRouteAvailable(false);
        if (!place || !userLocation)
            return;
        api.post("/rides/evaluate-ride", {
            "start_latitude": userLocation.lat,
            "start_longitude": userLocation.lng,
            "destination_latitude": place.lat,
            "destination_longitude": place.lng
        })
            .then((response) => {
                const {success, rating, error} = response.data;
                if (!success) {
                    console.warn(error);
                    return;
                }
                const clampedRating = Math.max(1, Math.min(5, rating));
                setRating(clampedRating);
            })
            .catch((error) => {
                console.warn(error)
            });
    }, [userLocation]);

    // start a ride to the current destination
    const startRide = useCallback(() => {
        if (isOnRide || !destination || !userLocation)
            return;
        setIsOnRide(true);
        setRideStartTime(moment.now());
        startTaximeter();
        api.post("/rides/start-ride", {
            "start_latitude": userLocation.lat,
            "start_longitude": userLocation.lng,
            "destination_latitude": destination.lat,
            "destination_longitude": destination.lng
        })
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
    }, [startTaximeter, destination, userLocation]);

    // end the current ride
    const endRide = useCallback(() => {
        setIsOnRide(false);
        setRideStartTime(null);
        setDestination(null);
        stopTaximeter();
        api.post("/rides/end-ride", {
            "fare_cents": fare,
            "actual_distance_km": distance * 1000,
        })
            .then((response) => console.log(response))
            .catch((error) => console.warn(error));
    }, [stopTaximeter, fare, distance]);

    const updateDuration = useCallback(() => {
        if (!rideStartTime)
            return;
        const duration = moment.now() - rideStartTime;
        setDuration(duration);
    }, [rideStartTime]);

    // update ride duration
    useEffect(() => {
        if (!isOnRide)
            return;
        updateDuration();
        const intervalId = setInterval(updateDuration, 1000 * 10);
        return () => clearInterval(intervalId);
    }, [isOnRide, updateDuration]);

    return (
        <RideContext.Provider value={{
            isOnRide,
            destination,
            updateDestination,
            startRide,
            endRide,
            rating,
            fare,
            distance,
            duration,
            isRouteAvailable,
            setIsRouteAvailable
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