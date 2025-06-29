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
    const [searchResults, setSearchResults] = useState([]);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService>();

    const locale = useLocale();
    const map = useMap();
    const {updateDestination} = useRide();

    // initialize places service
    useEffect(() => {
        if (!placesLibrary || !map)
            return;
        setPlacesService(new placesLibrary.PlacesService(map));
    }, [placesLibrary, map]);

    const searchAddress = useCallback((query) => {
        if (!query)
            setSearchResults([]);
        if (!placesService || !query)
            return;
        const request = {
            query,
            language: locale,
            openNow: false,
            // bias search results towards NYC Manhattan
            location: MAP_CENTER,
            radius: 500.
        };
        placesService.textSearch(request, (results, status) => {
            if (status === placesLibrary.PlacesServiceStatus.OK)
                setSearchResults(results.slice(0, 5));
            else
                console.warn('Places search failed:', status);
        });
    }, [placesService, locale]);

    // debounce search to reduce Google API calls
    const debounceSearchAddress = useMemo(() => debounce(searchAddress, 300), [searchAddress]);

    const selectLocation = (location) => {
        const {place_id, name} = location;
        setSearchResults([]);
        searchbarRef.current.setValue(name);
        updateDestination({name, placeId: place_id});
    };

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
                onConfirm={(name) => selectLocation({name})}/>
            <SearchResults>
                {searchResults.map((result, i) => (
                    <SearchResult
                        key={i}
                        value={result.name}
                        onClick={() => {
                            selectLocation(result);
                        }}/>
                ))}
            </SearchResults>
        </>
    );
};