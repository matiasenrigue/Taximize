import React, {useEffect, useState} from "react";
import zoneDataJson from "../../assets/taxi_zones.json";
import {Polygon} from "../Polygon/Polygon";
import {COLOR_PRIMARY} from "../../constants/constants";
import api from "../../lib/axios";

interface JsonZoneData {
    locationID: string;
    zone: string;
    borough: string;
    center_lat: number;
    center_lng: number;
    geometry: number[][][];
}

interface BackendZoneData {
    locationId: number;
    name: string;
    count: number;
}

const zoneData: JsonZoneData[] = zoneDataJson;

interface Zone extends BackendZoneData {
    geometry: number[][][]
}

export const TaxiZones = () => {
    const [zones, setZones] = useState<Zone[]>([]);

    useEffect(() => {
        api.get("/hotspots").then((response) => {
            const {
                success,
                message: error,
                data
            } = response.data;

            if (!success) {
                console.warn("Failed getting current ride.", error);
                return;
            }

            const zonesWithGeometry = (data.zones as BackendZoneData[]).map((zone) => {
                const _zone = zoneData.find((_zone) => _zone.locationID === zone.locationId.toString());
                return {
                    ...zone,
                    geometry: _zone?.geometry ?? [],
                    count: Math.max(0, Math.min(1, zone.count / 30))
                };
            })
            setZones(zonesWithGeometry);

        }).catch((error) => {
            console.warn(error);
        });
    }, [])

    return (
        <>
            {zones.map((zone, index) => (
                <Polygon
                    key={index}
                    strokeColor={COLOR_PRIMARY}
                    strokeOpacity={0}
                    strokeWeight={1}
                    fillColor={COLOR_PRIMARY}
                    fillOpacity={zone.count * .8}
                    paths={zone.geometry.map((path) => (
                        path.map((vertex) => ({
                            lat: vertex[1],
                            lng: vertex[0]
                        }))
                    ))}
                />
            ))}
        </>
    );
};