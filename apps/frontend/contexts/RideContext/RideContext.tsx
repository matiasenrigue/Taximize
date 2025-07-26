"use client";

import {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useCallback,
    useContext,
    useEffect, useRef,
    useState
} from "react";
import moment from "moment";
import api from "../../lib/axios";
import {useUserLocationContext} from "../UserLocationContext/UserLocationContext";
import {useTaximeter} from "../../hooks/useTaximeter";
import {useShift} from "../ShiftContext/ShiftContext";
import {calculateDistance} from "../../lib/calculateDistance/calculateDistance";

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
    endRide: (fare: number) => void;
    rating: number;
    fare: number;
    distance: number;
    duration: number;
    isRouteAvailable: boolean;
    setIsRouteAvailable: Dispatch<SetStateAction<boolean>>;
    routeStatus: google.maps.DirectionsStatus;
    setRouteStatus: Dispatch<SetStateAction<google.maps.DirectionsStatus>>;
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
    const [rating, setRating] = useState<number>(3);
    const [duration, setDuration] = useState<number>(0);

    // routing
    const [isRouteAvailable, setIsRouteAvailable] = useState<boolean>(false);
    const [routeStatus, setRouteStatus] = useState<google.maps.DirectionsStatus>(null!);
    useEffect(() => {
        if (typeof google === "undefined" || !google?.maps?.DirectionsStatus)
            return;
        setRouteStatus(google.maps.DirectionsStatus.OK);
    }, []);

    // initialize shift
    useEffect(() => {
        if (!loadRide)
            return;
        api.get("/rides/current").then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed getting current ride.", error);
                return;
            }

            const {
                address,
                rideId,
                startLatitude,
                startLongitude,
                currentDestinationLatitude,
                currentDestinationLongitude,
                elapsedTimeMs
            } = data;

            // Calculate the actual start time based on elapsed time
            const startTime = moment.now() - elapsedTimeMs;
            const startLatLng = {lat: startLatitude, lng: startLongitude};

            setIsOnRide(true);
            setRideStartTime(startTime);
            setDestination({
                placeId: null,
                name: address ?? "Unknown",
                lat: currentDestinationLatitude,
                lng: currentDestinationLongitude
            });
            // Restore taximeter with existing fare and distance
            startTaximeter(startLatLng, startTime);
        }).catch((error) => {
            console.warn(error);
        });
    }, [loadRide, startTaximeter]);

    const evaluateRide = useCallback(() => {
        if (!destination || !userLocation)
            return;
        api.post("/rides/evaluate-ride", {
            "startLatitude": userLocation.lat,
            "startLongitude": userLocation.lng,
            "destinationLatitude": destination.lat,
            "destinationLongitude": destination.lng
        }).then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed evaluating ride.", error);
                return;
            }

            const clampedRating = Math.max(1, Math.min(5, data.rating));
            setRating(clampedRating ?? 3);
        }).catch((error) => {
            console.warn(error)
        });
    }, [destination, userLocation]);

    useEffect(evaluateRide, [evaluateRide]);

    // set a new destination to navigate to (may not be a ride)
    const updateDestination = useCallback((place: Place | null) => {
        setRouteStatus(google.maps.DirectionsStatus.OK);
        setDestination(place);
        setIsRouteAvailable(false);
    }, [userLocation]);

    // start a ride to the current destination
    const startRide = useCallback(() => {
        if (isOnRide || !destination || !userLocation)
            return;

        const timestamp = moment.now();

        api.post("/rides/start-ride", {
            timestamp,
            address: destination.name,
            predictedScore: .5,
            "startLatitude": userLocation.lat,
            "startLongitude": userLocation.lng,
            "destinationLatitude": destination.lat,
            "destinationLongitude": destination.lng
        }).then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed starting ride.", error);
                return;
            }

            const {
                rideId,
                startTime,
                predicted_score
            } = data;

            setIsOnRide(true);
            setRideStartTime(timestamp);
            startTaximeter();
        }).catch((error) => {
            console.warn(error)
        });
    }, [startTaximeter, destination, userLocation, isOnRide, rating]);

    // end the current ride
    const endRide = useCallback((editedFare: number = fare) => {
        if (!isOnRide)
            return;

        const timestamp = moment.now();

        api.post("/rides/end-ride", {
            timestamp,
            fareCents: editedFare,
            actualDistanceKm: distance / 1000,
        }).then((response) => {
            const {
                success,
                error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed ending ride.", error);
                return;
            }

            const {
                rideId,
                total_time_ms,
                distance_km,
                earning_cents,
                earning_per_min
            } = data;

            setIsOnRide(false);
            setRideStartTime(null);
            setDestination(null);
            stopTaximeter();
        }).catch((error) => {
            console.warn(error)
        });
    }, [stopTaximeter, fare, distance, isOnRide]);

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
        const intervalId = setInterval(updateDuration, 1000);
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
            setIsRouteAvailable,
            routeStatus,
            setRouteStatus
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