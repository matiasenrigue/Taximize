'use client';

import styles from "./Map.module.css";
import {AdvancedMarker, Map as GoogleMap, useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import {useCallback, useEffect, useRef, useState} from "react";
import {useRide} from "../../../../contexts/RideContext/RideContext";
import {MAP_CENTER, MAP_ID} from "../../../../constants/constants";
import {NoRouteFoundModal} from "../../../../components/NoRouteFoundModal";
import {ModalHandle} from "../../../../components/Modal/Modal";
import {UnknownLocationModal} from "../../../../components/UnknownLocationModal";
import {RouteErrorModal} from "../../../../components/RouteErrorModal";

export const Map = (props) => {
    const {className} = props;
    const origin = MAP_CENTER;
    const {destination} = useRide();

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
        if (!directionsService || !directionsRenderer || !destination)
            return;
        directionsService
            .route({
                origin,
                destination: (!!destination.placeId
                    ? {placeId: destination.placeId}
                    : {query: destination.name}),
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: false
            }, (result, status) => {
                switch (status) {
                    case "OK":
                        directionsRenderer.setMap(map);
                        directionsRenderer.setDirections(result);
                        return;
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
                        console.warn(`Error finding route: ${status}`);
                }
            });
        return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, origin, destination, map, openNoRouteModal,
        openUnknownLocationModal, openRouteErrorModal]);

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
                {/*{origin && <AdvancedMarker position={origin}>*/}
                {/*    <div className={styles.user_marker}/>*/}
                {/*</AdvancedMarker>}*/}
                {/*{destination && <AdvancedMarker position={destination}>*/}
                {/*    <div className={styles.user_marker}/>*/}
                {/*</AdvancedMarker>}*/}
            </GoogleMap>
        </>
    );
};