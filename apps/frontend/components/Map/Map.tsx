'use client';

import styles from "./Map.module.css";
import {AdvancedMarker, Map as GoogleMap, useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import {useCallback, useEffect, useRef, useState} from "react";
import {useRide} from "../../contexts/RideContext/RideContext";
import {MAP_CENTER, MAP_ID} from "../../constants/constants";
import {NoRouteFoundModal} from "../modals/NoRouteFoundModal";
import {ModalHandle} from "../Modal/Modal";
import {UnknownLocationModal} from "../modals/UnknownLocationModal";
import {RouteErrorModal} from "../modals/RouteErrorModal";
import {useUserLocationContext} from "../../contexts/UserLocationContext/UserLocationContext";
import {GoogleMapsRouteStatus} from "../../constants/types";

export const Map = (props) => {
    const {className} = props;
    const {
        destination,
        setIsRouteAvailable,
        routeStatus,
        setRouteStatus,
    } = useRide();

    const previousRouteStatus = useRef<GoogleMapsRouteStatus>("OK");

    const {
        location: userLocation,
        setIsWatching,
    } = useUserLocationContext()
    useEffect(() => setIsWatching(true), []);

    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

    const noRouteModalRef = useRef<ModalHandle>(null!);
    const unknownLocationModalRef = useRef<ModalHandle>(null!);
    const routeErrorModalRef = useRef<ModalHandle>(null!);

    const openNoRouteModal = useCallback(() => {
        if (!noRouteModalRef || typeof noRouteModalRef === "function")
            return;
        noRouteModalRef.current.open();
    }, []);

    const openUnknownLocationModal = useCallback(() => {
        if (!unknownLocationModalRef || typeof unknownLocationModalRef === "function")
            return;
        unknownLocationModalRef.current.open();
    }, []);

    const openRouteErrorModal = useCallback(() => {
        if (!routeErrorModalRef || typeof routeErrorModalRef === "function")
            return;
        routeErrorModalRef.current.open();
    }, []);

    // initialize directions service and renderer
    useEffect(() => {
        if (!routesLibrary || !map)
            return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({map, suppressMarkers: true}));
        }, [routesLibrary, map]);

    // Use directions service
    useEffect(() => {
        if (!directionsService || !directionsRenderer || !userLocation || !destination)
            return;
        directionsService
            .route({
                origin: userLocation,
                destination: {lat: destination.lat, lng: destination.lng},
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: false
            }, (result, status: GoogleMapsRouteStatus) => {
                setRouteStatus(status);
                if (status !== "OK")
                    return;
                directionsRenderer.setMap(map);
                directionsRenderer.setDirections(result);
                setIsRouteAvailable(true);
            });
        return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, userLocation, destination, map]);

    useEffect(() => {
        // only show modal if there is an error and routeStatus was previously ok.
        if (previousRouteStatus.current !== "OK" || routeStatus == "OK")
            return;

        switch (routeStatus) {
            case "NOT_FOUND":
                // at least one of the locations specified in the request's origin, destination, or waypoints could not be geocoded.
                openUnknownLocationModal();
                return;
            case "ZERO_RESULTS":
                // no route could be found between the origin and destination.
                openNoRouteModal();
                return;
            case "MAX_ROUTE_LENGTH_EXCEEDED":
                // the requested route is too long and cannot be processed
            default:
                openRouteErrorModal();
                console.warn(`Error finding route: ${routeStatus}`);
        }
    }, [routeStatus, openUnknownLocationModal, openNoRouteModal, openRouteErrorModal])

    return (
        <>
            <NoRouteFoundModal
                ref={noRouteModalRef}/>
            <UnknownLocationModal
                ref={unknownLocationModalRef}/>
            <RouteErrorModal
                ref={routeErrorModalRef}/>
            <GoogleMap
                mapId={MAP_ID}
                className={className}
                defaultCenter={MAP_CENTER}
                defaultZoom={12}
                gestureHandling={'greedy'}
                clickableIcons={false}
                disableDefaultUI={true}>
                {userLocation && <AdvancedMarker position={userLocation}>
                    <div className={styles.user_marker}/>
                </AdvancedMarker>}
                {destination?.lat && destination?.lng && <AdvancedMarker position={destination}>
                    <div className={styles.destination_marker}/>
                </AdvancedMarker>}
            </GoogleMap>
        </>
    );
};