"use client";

import styles from "./TaxiMeter.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faClock, faDollarSign} from "@fortawesome/free-solid-svg-icons";
import {useRide} from "../../contexts/RideContext/RideContext";
import {formatDuration} from "../../lib/formatDuration/formatDuration";

export const TaxiMeter = () => {
    const {fare, duration} = useRide();

    return (
        <div className={styles.container}>
            <div className={styles.group}>
                <FontAwesomeIcon
                    className={styles.icon}
                    icon={faClock}/>
                <span>{formatDuration(duration, {
                    hours: false,
                    minutes: true,
                    seconds: true
                })}</span>
            </div>
            <div className={styles.group}>
                <FontAwesomeIcon
                    className={styles.icon}
                    icon={faDollarSign}/>
                <span>{(fare / 100).toFixed(2)}</span>
            </div>
        </div>
    );
};