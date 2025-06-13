import {GoogleMap, useJsApiLoader} from "@react-google-maps/api";
import {useCallback, useState} from "react";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MAP_CENTER = {
    lat: 40.7831,
    lng: -73.9712,
};

export const MapComponent = (props) => {
    const {className} = props;

    const { isLoaded } = useJsApiLoader({
        id: 'c9b36effb9d05364dfd42e3c',
        mapIds: ['c9b36effb9d05364dfd42e3c'],
        googleMapsApiKey: API_KEY,
    });
    const [map, setMap] = useState(null);

    const onLoad = useCallback((map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback((map) => {
        setMap(null);
    }, []);

    if (!isLoaded)
        return null;
    return (
        <GoogleMap
            mapContainerClassName={className}
            center={MAP_CENTER}
            zoom={12}
            options={{
                mapId: "c9b36effb9d05364dfd42e3c",
                disableDefaultUI: true,
            }}
            onLoad={onLoad}
            onUnmount={onUnmount}>
        </GoogleMap>
    );
};