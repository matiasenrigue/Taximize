"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import BackButton from "../../../../../components/BackButton/BackButton";
import api from "../../../../../lib/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";

interface Ride {
    id: string;
    startDate: string; // Format: YYYY-MM-DD HH:mm
    endDate: string; // Format: YYYY-MM-DD HH:mm
    from: string;
    to: string;
    duration: string;
    fare: string;
    predictedScore: number;
    distanceKm: number;
    farePerMinute: string;
}

interface Shift
{
    id: string;
    startDate: string; // Format: YYYY-MM-DD HH:mm
    endDate: string; // Format: YYYY-MM-DD HH:mm
    stats: {
        totalEarnings: number;
        totalDistance: number;
        numberOfRides: number;
        workTime: number;
        breakTime: number;
    };
    rides: Ride[];
}

function getTotalTimeString(workTime: number, breakTime: number) {
    const total = workTime + breakTime;
    return `${Math.floor(total / 60)}h ${total % 60}min`;
}

export default function ManageRidesDay() {
    const params = useParams();
    const day = params.day as string;
    const [loading, setLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [expanded, setExpanded] = useState<{ [shiftId: string]: string | null }>({});
    const t = useTranslations('manageRidesDay');

    useEffect(() => {
        setLoading(true);
        api.get(`/stats/rides-by-weekday`, { params: { day } })
            .then(res => setShifts(res.data.data))
            .finally(() => setLoading(false));
    }, [day]);

    // Simulating data for demonstration purposes
    // const loading = false; 
    // const shifts = [
    //     {
    //         id: "1",
    //         startDate: "2023-10-01 08:00",
    //         endDate: "2023-10-01 16:00",
    //         stats: {
    //             totalEarnings: 100,
    //             totalDistance: 50,
    //             numberOfRides: 5,
    //             workTime: 480,
    //             breakTime: 60
    //         },
    //         rides: [
    //             {
    //                 id: "ride1",
    //                 startDate: "2023-10-01 08:30",
    //                 endDate: "2023-10-01 09:00",
    //                 from: "Location A",
    //                 to: "Location B",
    //                 duration: "30 min",
    //                 fare: "$15.00",
    //                 predictedScore: 4.5,
    //                 distanceKm: 10,
    //                 farePerMinute: "$0.50"
    //             },
    //             {
    //                 id: "ride2",
    //                 startDate: "2023-10-01 10:00",
    //                 endDate: "2023-10-01 10:30",
    //                 from: "Location C",
    //                 to: "Location D",
    //                 duration: "30 min",
    //                 fare: "$20.00",
    //                 predictedScore: 4.8,
    //                 distanceKm: 15,
    //                 farePerMinute: "$0.67"
    //             }
    //         ]
    //     }
    // ]

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.backButtonContainer}>
                    <BackButton href="/account/rides-history" pageName="Rides History"/>
                </div>
                <h2 className={styles.title}>{day.charAt(0).toUpperCase() + day.slice(1)}</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <div>
                        {shifts.length === 0 ? (
                            <div className={styles.noShifts}>{t('noShifts')}</div>
                        ) : (
                            shifts.map((shift) => (
                                <React.Fragment key={shift.id}>
                                    <div className={styles.shiftContainer}>
                                        <div className={styles.ridesContainer}>
                                            <span className={styles.workTime}>{t('workTime')}: {getTotalTimeString(shift.stats.workTime, shift.stats.breakTime)}</span>
                                        </div>
                                        <h3 className={styles.ridesTitle}>{t('rides')}</h3>
                                        {shift.rides.length === 0 ? (
                                            <div className={styles.noRides}>{t('noRides')}</div>
                                        ) : (
                                            shift.rides.map((ride) => (
                                                <div key={ride.id} className={styles.rideItem}>
                                                    <div
                                                        onClick={() => setExpanded(prev => ({
                                                            ...prev,
                                                            [shift.id]: prev[shift.id] === ride.id ? null : ride.id
                                                        }))}
                                                        className={styles.rideHeader}
                                                    >
                                                        <span>Time {ride.startDate}</span>
                                                        <span>{expanded[shift.id] === ride.id ? <FontAwesomeIcon icon={faChevronDown} /> : <FontAwesomeIcon icon={faChevronRight} />}</span>
                                                    </div>
                                                    {expanded[shift.id] === ride.id && (
                                                        <div className={styles.rideDetails}>
                                                            <div><strong>{t('from')}:</strong> {ride.from}</div>
                                                            <div><strong>{t('to')}:</strong> {ride.to}</div>
                                                            <div><strong>{t('duration')}:</strong> {ride.duration}</div>
                                                            <div><strong>{t('fare')}:</strong> {ride.fare}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </React.Fragment>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}