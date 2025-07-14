import React from "react";
import zones from "../../assets/taxi_zones.json";
import {Polygon} from "../Polygon/Polygon";
import {COLOR_PRIMARY} from "../../constants/constants";

export const TaxiZones = () => {
    return (
        <>
            {zones.map((zone, index) => (
                <Polygon
                    key={index}
                    strokeColor={COLOR_PRIMARY}
                    strokeOpacity={0}
                    strokeWeight={1}
                    fillColor={COLOR_PRIMARY}
                    fillOpacity={(zone.random / 100) * .8}
                    paths={zone.geometry.map((path, i) => (
                        path.map((vertex, j) => ({
                            lat: vertex[1],
                            lng: vertex[0]
                        }))
                    ))}
                />
            ))}
        </>
    );
};