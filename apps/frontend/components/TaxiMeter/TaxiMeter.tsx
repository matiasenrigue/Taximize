"use client";

import styles from "./TaxiMeter.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faClock, faEuroSign} from "@fortawesome/free-solid-svg-icons";
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
                <span>{formatDuration(duration)}</span>
            </div>
            <div className={styles.group}>
                <FontAwesomeIcon
                    className={styles.icon}
                    icon={faEuroSign}/>
                <span>{(fare / 100).toFixed(2)}</span>
            </div>
        </div>
    );
};