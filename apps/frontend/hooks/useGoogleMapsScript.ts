import {useCallback, useEffect, useState} from "react";

type GoogleMapsScriptStatus = "idle" | "loading" | "ready" | "error";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const useGoogleMapsScript = () => {
    const [status, setStatus] = useState<GoogleMapsScriptStatus>("idle");

    const initScript = useCallback((callback: string) => {
        const script = document.createElement("script");
        const libraries = ["places"].join(",") ?? "";

        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=${libraries}&callback=${callback}`;
        script.async = true;
        script.defer = true;

        (window as any)[callback] = () => setStatus("ready");
        script.onerror = () => setStatus("error");
        setStatus("loading");
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        // server-side
        if (typeof window === "undefined")
            return;

        // Google Maps API already loaded
        if ((window as any).google?.maps) {
            setStatus("ready");
            return;
        }

        // script already exists
        const existingScript = document.getElementById("google-maps-script");
        if (existingScript) {
            existingScript.addEventListener("load", () => setStatus("ready"));
            existingScript.addEventListener("error", () => setStatus("error"));
            setStatus("loading");
            return;
        }

        // script does not exist and will be created
        const callback = "initGoogleMaps";
        initScript(callback);
        return () => delete (window as any)[callback];
    }, [initScript]);

    return {isLoaded: status === "ready", status};
};