import {Searchbar, SearchbarHandle, SearchbarProps} from "../../../../components/Searchbar/Searchbar";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useMap, useMapsLibrary} from "@vis.gl/react-google-maps";
import {useLocale} from "next-intl";
import {SearchResult, SearchResults} from "../../../../components/Searchbar/SearchResults";
import {useShiftContext} from "../../../../contexts/ShiftContext/ShiftContext";
import debounce from "lodash.debounce";

const NYC_CENTER = {lat: 40.7831, lng: -73.9712};

export const LocationSearchbar = (props: SearchbarProps) => {
    const searchbarRef = useRef<SearchbarHandle>(null!);
    const placesLibrary = useMapsLibrary('places');
    const [searchResults, setSearchResults] = useState([]);
    const [placesService, setPlacesService] = useState<google.maps.places.PlacesService>();

    const locale = useLocale();
    const map = useMap();
    const {updateDestination} = useShiftContext();

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
            location: NYC_CENTER,
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
                }}/>
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