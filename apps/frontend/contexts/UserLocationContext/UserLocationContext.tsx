"use client";

import React, {
    createContext,
    Dispatch,
    PropsWithChildren,
    SetStateAction,
    useContext,
    useEffect,
    useState
} from "react";
import {LatLng} from "../../constants/types";

interface UserLocationContextType {
    location: LatLng | null;
    isWatching: boolean;
    isAvailable: boolean;
    setIsWatching: Dispatch<SetStateAction<boolean>>
}

const UserLocationContext = createContext<UserLocationContextType|null>(null);

export const UserLocationContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [location, setLocation] = useState<LatLng|null>(null);
    const [isWatching, setIsWatching] = useState<boolean>(false);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);

    useEffect(() => {
        // browser does not support geolocation
        if (!navigator.geolocation) {
            setIsAvailable(false);
            return;
        }

        if (!isWatching)
            return;

        const watchId = navigator.geolocation.watchPosition((position) => {
            const {latitude: lat, longitude: lng} = position.coords;
            setLocation({lat, lng});
            setIsAvailable(true);
        }, (error) => {
            if (error.code === 1) // PERMISSION_DENIED
                setIsAvailable(false);
            else
                console.warn("Error:", error);
        }, {});

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isWatching]);

    return (
        <UserLocationContext.Provider value={{
            location,
            isWatching,
            isAvailable,
            setIsWatching,
        }}>
            {children}
        </UserLocationContext.Provider>
    )
};

export const useUserLocationContext = () => {
    const context = useContext(UserLocationContext);
    if (!context)
        throw new Error("useUserLocationContext can only be used within UserLocationContextProvider!");

    return context;
};