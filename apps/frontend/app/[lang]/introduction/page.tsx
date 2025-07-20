"use client";

import React from "react";
import styles from "./page.module.css";
import { useState } from "react";
import { Button } from "apps/frontend/components/Button/Button";
import  SubWindow from "apps/frontend/components/SubWindow/SubWindow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faStar, faClipboardList } from "@fortawesome/free-solid-svg-icons";
import { useTranslations } from "next-intl";

export default function Introduction() {
    const [isHotSpotWindowOpen, setHotSpotWindowOpen] = useState(false);
    const [isRideScoringWindowOpen, setRideScoringWindowOpen] = useState(false);
    const [isDashboardWindowOpen, setDashboardWindowOpen] = useState(false);
    const t = useTranslations('introduction');
    return (
        <div>
             <div className={styles.page}>
             <div className={styles.container}>
                <h2 className={styles.title}>{t('title')}</h2>
                <p className={styles.subtitle}>
                    {t('subtitle')}
                </p>


                <div className={styles.featuresContainer}>
                    {/* Find hotspots */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faLocationDot} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>{t('findHotspots.title')}</h3>
                                <p className={styles.cardDescription}>{t('findHotspots.description')}</p>
                            </div>
                        </div>
                        <Button onClick={() => setHotSpotWindowOpen(true)}>{t('findHotspots.howItWorks')}</Button>
                    </section>
                    {/* Find hotspots subwindow */}
                    <SubWindow
                        isOpen={isHotSpotWindowOpen}
                        onClose={() => setHotSpotWindowOpen(false)}
                        title={t('findHotspots.subwindowTitle')}
                        summary={t('findHotspots.subwindowSummary')}
                        imageUrl="/images/hotspots.png" 
                        imageAlt="Map showing taxi hotspots"
                        description={t('findHotspots.subwindowDescription')}
                    />
                    {/* ride scoring */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faStar} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>{t('rideScoring.title')}</h3>
                                <p className={styles.cardDescription}>{t('rideScoring.description')}</p>
                            </div>
                        </div>
                        <Button onClick={() => setRideScoringWindowOpen(true)}>{t('rideScoring.howItWorks')}</Button>
                    </section>
                    {/* ride scoring subwindow */}
                    <SubWindow
                        isOpen={isRideScoringWindowOpen}
                        onClose={() => setRideScoringWindowOpen(false)}
                        title={t('rideScoring.subwindowTitle')}
                        summary={t('rideScoring.subwindowSummary')}
                        imageUrl="/images/scoring.png" 
                        imageAlt="Window showing ride scoring"
                        description={t('rideScoring.subwindowDescription')}
                    />
                    {/* dashboard */}
                    <section className={styles.section}>
                        <div className={styles.cardContent}>
                            <div className={styles.iconContainer}>
                                <FontAwesomeIcon icon={faClipboardList} className={styles.icon} />
                            </div>
                            <div className={styles.textContainer}>
                                <h3 className={styles.cardTitle}>{t('dashboard.title')}</h3>
                                <p className={styles.cardDescription}>{t('dashboard.description')}</p>
                            </div>
                        </div>
                        <Button onClick={() => setDashboardWindowOpen(true)}>{t('dashboard.howItWorks')}</Button>
                        {/* dashboard subwindow */}
                        <SubWindow
                            isOpen={isDashboardWindowOpen}
                            onClose={() => setDashboardWindowOpen(false)}
                            title={t('dashboard.subwindowTitle')}
                            summary={t('dashboard.subwindowSummary')}
                            imageUrl="/images/dashboard.png" 
                            imageAlt="Window showing dashboard"
                            description={t('dashboard.subwindowDescription')}
                        />
                    </section>
                </div>
                </div>
            </div>
        </div>
    );
}