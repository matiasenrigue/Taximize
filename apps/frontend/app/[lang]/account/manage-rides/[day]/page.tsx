"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import BackButton from "../../../../../components/BackButton/BackButton";
import api from "../../../../../lib/axios";

interface Ride {
    id: string;
    from: string;
    to: string;
    duration: string;
    fare: string;
}


export default function ManageRidesDay() {
    const params = useParams();
    const day = params.day as string;
    const [rides, setRides] = useState<Ride[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get(`/rides/by-day`, { params: { day } })
            .then(res => setRides(res.data.data))
            .finally(() => setLoading(false));
    }, [day]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account/manage-rides" pageName="Manage Rides" />
                </div>
                <h2 className={styles.title}>{day.charAt(0).toUpperCase() + day.slice(1)}</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div>
                        {rides.map((ride) => (
                            <div key={ride.id}>
                                <div onClick={() => setExpanded(expanded === ride.id ? null : ride.id)}>
                                    <span>To {ride.to}</span>
                                    <span>{expanded === ride.id ? "▼" : "▶"}</span>
                                </div>
                                {expanded === ride.id && (
                                    <div>
                                        <div><strong>From:</strong> {ride.from}</div>
                                        <div><strong>To:</strong> {ride.to}</div>
                                        <div><strong>Duration:</strong> {ride.duration}</div>
                                        <div><strong>Fare:</strong> {ride.fare}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

    );
}