import React, {useEffect} from "react";
import zones from "../../assets/taxi_zones.json";
import {Polygon} from "../Polygon/Polygon";
import {COLOR_PRIMARY} from "../../constants/constants";
import api from "../../lib/axios";

export const TaxiZones = () => {

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

            console.log(data);

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
                    fillOpacity={(zone.random / 100) * .8}
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