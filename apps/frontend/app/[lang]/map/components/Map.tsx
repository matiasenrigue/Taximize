'use client';

import styles from "./Map.module.css";
import {AdvancedMarker, Map as GoogleMap, useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import { useEffect, useState} from "react";
import {useRide} from "../../../../contexts/RideContext/RideContext";

const MAP_ID = "f1310920ec56c7b65c64dec9";
const MAP_CENTER = {lat: 40.7831, lng: -73.9712};
const TEST_TARGET = {lat: 40.7431, lng: -73.8712};

export const Map = (props) => {
    const {className} = props;
    const origin = MAP_CENTER;
    const {destination} = useRide();

    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

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
                destination: {placeId: destination.placeId},
                travelMode: google.maps.TravelMode.DRIVING,
                provideRouteAlternatives: false
            })
            .then(response => {
                directionsRenderer.setMap(map);
                directionsRenderer.setDirections(response);
            })
            .catch((reason) => {
                console.warn(reason);
            });
        return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, origin, destination, map]);

    return (
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
    );
};