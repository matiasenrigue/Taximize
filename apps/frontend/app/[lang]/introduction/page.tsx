"use client";

import React from "react";
import styles from "./page.module.css";
import { useState } from "react";
import { Button } from "apps/frontend/components/Button/Button";
import  SubWindow from "apps/frontend/components/SubWindow/SubWindow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faStar, faClipboardList } from "@fortawesome/free-solid-svg-icons";

export default function Introduction() {
    const [isHotSpotWindowOpen, setHotSpotWindowOpen] = useState(false);
    const [isRideScoringWindowOpen, setRideScoringWindowOpen] = useState(false);
    const [isDashboardWindowOpen, setDashboardWindowOpen] = useState(false);
    return (
        <div>
             <div className={styles.page}>
             <div className={styles.container}>
                <h2 className={styles.title}>Taxi Assistant</h2>
                <p className={styles.subtitle}>
                    The app helps taxi drivers in maximising revenue and minimising downtime
                </p>


                <div className={styles.featuresContainer}>
                    {/* Find hotspots */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faLocationDot} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>Find Hotspots</h3>
                                <p className={styles.cardDescription}>Find high-probability pickup zones</p>
                            </div>
                        </div>
                        <Button onClick={() => setHotSpotWindowOpen(true)}>How It Works</Button>
                    </section>
                    {/* Find hotspots subwindow */}
                    <SubWindow
                        isOpen={isHotSpotWindowOpen}
                        onClose={() => setHotSpotWindowOpen(false)}
                        title="Find hotspots"
                        summary="A live heatmap shows you 'where the money is' right now."
                        imageUrl="/images/hotspots.png" 
                        imageAlt="Map showing taxi hotspots"
                        description="Using historical and live data, the system predicts demand at street-level granularity for the next 15–60 minutes, so drivers can position themselves proactively instead of reacting to dips."
                    />
                    {/* ride scoring */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faStar} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>Ride Scoring</h3>
                                <p className={styles.cardDescription}>Get a score for each ride</p>
                            </div>
                        </div>
                        <Button onClick={() => setRideScoringWindowOpen(true)}>How It Works</Button>
                    </section>
                    {/* ride scoring subwindow */}
                    <SubWindow
                        isOpen={isRideScoringWindowOpen}
                        onClose={() => setRideScoringWindowOpen(false)}
                        title="Ride Scoring"
                        summary="Ride-Value Scoring helps drivers make informed decisions about which rides to accept."
                        imageUrl="/images/scoring.png" 
                        imageAlt="Window showing ride scoring"
                        description="The system assigns a score to each ride based on factors like distance, time, and demand, helping drivers prioritize high-value rides. This feature is designed to maximize earnings and minimize downtime."
                    />
                    {/* dashboard */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faClipboardList} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>Dashboard</h3>
                                <p className={styles.cardDescription}>View your earnings and ride history</p>
                            </div>
                        </div>
                        <Button onClick={() => setDashboardWindowOpen(true)}>How It Works</Button>
                        {/* ride scoring subwindow */}
                        <SubWindow
                            isOpen={isDashboardWindowOpen}
                            onClose={() => setDashboardWindowOpen(false)}
                            title="Dashboard"
                            summary="View your earnings and ride history"
                            imageUrl="/images/dashboard.png" 
                            imageAlt="Window showing dashboard"
                            description="The dashboard provides a comprehensive overview of your earnings and ride history, allowing you to track your performance over time. It includes features like daily earnings, ride counts, and detailed ride logs."
                        />
                    </section>
                </div>
                </div>
            </div>
        </div>
    );
}