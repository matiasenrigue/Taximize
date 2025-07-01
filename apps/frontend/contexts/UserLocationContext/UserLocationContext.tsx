import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";

interface Location {
    lat: number;
    lng: number;
}

interface UserLocationContextType {
    location: Location | null;
}

const UserLocationContext = createContext<UserLocationContextType|null>(null);

export const UserLocationContextProvider = (props: PropsWithChildren) => {
    const {children} = props;

    const [location, setLocation] = useState<Location|null>(null);
    const [isEnabled, setIsEnabled] = useState<boolean>(true);

    useEffect(() => {
        if (!navigator.geolocation) {
            setIsEnabled(false);
            return;
        }

        const watchId = navigator.geolocation.watchPosition((position) => {
            const {latitude: lat, longitude: lng} = position.coords;
            setLocation({lat, lng});
            setIsEnabled(true);
        }, (error) => {
            if (error.code === 1) // PERMISSION_DENIED
                setIsEnabled(false);
            else
                console.warn("Error:", error);
        }, {});

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <UserLocationContext.Provider value={{
            location
        }}>
            {isEnabled
                ? children
                : <LocationWarning/>
            }
        </UserLocationContext.Provider>
    )
};

export const LocationWarning = () => {
    return (
        <div>
            <h4>Enable your Location</h4>
            <p>
                The app requires access to your location to recommend routes and calculate fares.
            </p>
        </div>
    );
};

export const useUserLocationContext = () => {
    const context = useContext(UserLocationContext);
    if (!context)
        throw new Error("useUserLocationContext can only be used within UserLocationContextProvider!");
    return context;
};