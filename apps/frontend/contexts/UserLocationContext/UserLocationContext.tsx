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
import {MAP_CENTER, FAKE_LOCATIONS} from "../../constants/constants";

interface UserLocationContextType {
    location: LatLng | null;
    isWatching: boolean;
    isAvailable: boolean;
    setIsWatching: Dispatch<SetStateAction<boolean>>
}

const UserLocationContext = createContext<UserLocationContextType|null>(null);

export const UserLocationContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [location, setLocation] = useState<LatLng|null>(MAP_CENTER);
    const [isWatching, setIsWatching] = useState<boolean>(false);
    const [isAvailable, setIsAvailable] = useState<boolean>(true);
    const [useRealGeolocation, setUseRealGeolocation] = useState<boolean>(false);
    const [fakeLocationId, setFakeLocationId] = useState<string>('manhattan');

    // Load preference from localStorage on mount and listen for changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUseReal = localStorage.getItem('useRealGeolocation');
            const storedFakeId = localStorage.getItem('fakeLocationId');
            setUseRealGeolocation(storedUseReal === 'true');
            setFakeLocationId(storedFakeId || 'manhattan');

            // Listen for storage changes
            const handleStorageChange = (e: StorageEvent) => {
                if (e.key === 'useRealGeolocation') {
                    setUseRealGeolocation(e.newValue === 'true');
                } else if (e.key === 'fakeLocationId' && e.newValue) {
                    setFakeLocationId(e.newValue);
                }
            };

            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    useEffect(() => {
        // If not using real geolocation, use the selected fake location
        if (!useRealGeolocation) {
            const selectedLocation = FAKE_LOCATIONS[fakeLocationId as keyof typeof FAKE_LOCATIONS] || MAP_CENTER;
            setLocation(selectedLocation);
            setIsAvailable(true);
            return;
        }

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
    }, [isWatching, useRealGeolocation, fakeLocationId]);

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