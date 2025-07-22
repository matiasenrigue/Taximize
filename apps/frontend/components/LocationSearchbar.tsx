import {Searchbar, SearchbarHandle, SearchbarProps} from "./Searchbar/Searchbar";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import {useLocale} from "next-intl";
import {SearchResult, SearchResults} from "./Searchbar/SearchResults";
import debounce from "lodash.debounce";
import {useRide} from "../contexts/RideContext/RideContext";
import {MAP_CENTER} from "../constants/constants";

export const LocationSearchbar = (props: SearchbarProps) => {
    const searchbarRef = useRef<SearchbarHandle>(null!);
    const placesLibrary = useMapsLibrary('places') as typeof google.maps.places;
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService>();
    const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
    const [, setIsInvalidAddress] = useState<boolean>(false);

    const locale = useLocale();
    const map = useMap();
    const {updateDestination} = useRide();

    // initialize places service
    useEffect(() => {
        if (!placesLibrary || !map)
            return;
        setPlacesService(new placesLibrary.PlacesService(map));
    }, [placesLibrary, map]);

    const textSearch = useCallback((query: string): Promise<google.maps.places.PlaceResult[]> => {
        return new Promise((resolve, reject) => {
            if (query === "")
                return reject("Empty query");
            if (!placesService)
                return reject("PlacesService has not be initialized");
            const request = {
                query,
                language: locale,
                openNow: false,
                // bias search results towards NYC Manhattan
                location: MAP_CENTER,
                radius: 500
            };
            placesService.textSearch(request, (results, status) => {
                if (status === "OK")
                    resolve(results ?? []);
                else
                    reject(status);
            });
        });
    }, [locale, placesService]);

    // search address to show places with a similar address
    const searchAddress = useCallback((query: string) => {
        textSearch(query)
            .then((result) => {
                const validResults = result
                    .filter(place => (place.name && place.place_id && place.geometry))
                    .slice(0, 5);
                setSearchResults(validResults);
            })
            .catch(() => {
                setSearchResults([])
            });
    }, [textSearch]);

    // debounce search to reduce Google API calls
    const debounceSearchAddress = useMemo(() => debounce(searchAddress, 300), [searchAddress]);

    const selectPlace = (place: google.maps.places.PlaceResult) => {
        const {place_id, name, geometry} = place;
        if (!geometry || !place_id || !name)
            return;
        const lat = geometry?.location?.lat() ?? 0;
        const lng = geometry?.location?.lng() ?? 0;
        setSearchResults([]);
        searchbarRef.current.setValue(name ?? "");
        updateDestination({name, placeId: place_id, lat, lng});
    };

    const confirmInput = (query: string) => {
        textSearch(query)
            .then((result) => {
                const validResults = result
                    .filter(place => (place.name && place.place_id && place.geometry));
                if (!validResults)
                    return;
                selectPlace(validResults[0]);
            })
            .catch(() => {
                setSearchResults([]);
                updateDestination(null);
                setIsInvalidAddress(true);
            });
    }

    return (
        <>
            <Searchbar
                ref={searchbarRef}
                {...props}
                onClear={() => {
                    updateDestination(null);
                    setSearchResults([]);
                }}
                onChange={(e) => {
                    updateDestination(null);
                    debounceSearchAddress(e.target.value);
                }}
                onConfirm={(name) => confirmInput(name)}/>
            <SearchResults>
                {searchResults.map((result, i) => (
                    <SearchResult
                        key={i}
                        value={result.name!}
                        onClick={() => {
                            selectPlace(result);
                        }}/>
                ))}
            </SearchResults>
        </>
    );
};