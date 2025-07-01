"use client";

import styles from "./TaxiMeter.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faClock, faEuroSign} from "@fortawesome/free-solid-svg-icons";
import {useEffect, useState} from "react";
import {useRide} from "../../contexts/RideContext/RideContext";

export const TaxiMeter = () => {
    const {getRideTime, getRideFare} = useRide();
    const [rideTime, setRideTime] = useState(() => getRideTime());
    const [rideFare, setRideFare] = useState(() => getRideFare());

    useEffect(() => {
        setRideTime(getRideTime());
        setRideFare(getRideFare())
        const delay = 1000 * 10;
        const intervalId = setInterval(() => {
            setRideTime(getRideTime());
            setRideFare(getRideFare());
        }, delay);

        return () => clearInterval(intervalId);
    }, [getRideTime, getRideFare]);

    return (
        <div className={styles.container}>
            <div className={styles.group}>
                <FontAwesomeIcon
                    className={styles.icon}
                    icon={faClock}/>
                <span>{rideTime}</span>
            </div>
            <div className={styles.group}>
                <FontAwesomeIcon
                    className={styles.icon}
                    icon={faEuroSign}/>
                <span>{rideFare}</span>
            </div>
        </div>
    );
};