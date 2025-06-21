import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";

interface Location {
    latitude: number;
    longitude: number;
}

interface UserLocationContextType {
    location: Location | null;
}

const UserLocationContext = createContext<UserLocationContextType|null>(null);

export const UserLocationContextProvider = (props: PropsWithChildren) => {
    const {children} = props;
    const [location, setLocation] = useState<Location|null>(null);

    useEffect(() => {
        if (!navigator.geolocation)
            return;

        const watchId = navigator.geolocation.watchPosition((position) => {
            const {latitude, longitude} = position.coords;
            setLocation({latitude, longitude});
        }, (error) => {
            console.warn("Error:", error);
        }, {});

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return (
        <UserLocationContext.Provider value={{location}}>
            {children}
        </UserLocationContext.Provider>
    )
};

export const useUserLocationContext = () => {
    const context = useContext(UserLocationContext);
    if (!context)
        throw new Error("useUserLocationContext can only be used within <UserLocationContextProvider>!");
    return context;
};