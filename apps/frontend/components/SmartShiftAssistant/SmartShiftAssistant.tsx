"use client"

import { useEffect, useState } from 'react';
import styles from './SmartShiftAssistant.module.css';

type DemandLevel = 'good' | 'okay' | 'bad';

interface DemandStatus {
  level: DemandLevel;
  message: string;
  nextGoodTime?: Date;
}

const getNYCTime = (): Date => {
  const now = new Date();
  const nycTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  return nycTime;
};

const getDemandStatus = (): DemandStatus => {
  const nycTime = getNYCTime();
  const hour = nycTime.getHours();
  const day = nycTime.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekday = day >= 1 && day <= 5;
  const isWeekend = !isWeekday;

  // Good times: Weekday rush hours (7-10 AM, 5-8 PM) + Friday/Saturday nights (8 PM-2 AM)
  if (isWeekday) {
    if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
      return {
        level: 'good',
        message: 'High demand - Great time to start!'
      };
    }
  }
  
  // Friday night (day 5) or Saturday night (day 6)
  if ((day === 5 || day === 6) && (hour >= 20 || hour < 2)) {
    return {
      level: 'good',
      message: 'High demand - Great time to start!'
    };
  }

  // Okay times: Mid-day weekdays (10 AM-3 PM) + Weekend afternoons (12-5 PM)
  if (isWeekday && hour >= 10 && hour < 15) {
    return {
      level: 'okay',
      message: 'Moderate demand - Decent time to drive'
    };
  }
  
  if (isWeekend && hour >= 12 && hour < 17) {
    return {
      level: 'okay',
      message: 'Moderate demand - Decent time to drive'
    };
  }

  // Bad times: everything else
  const nextGoodTime = calculateNextGoodTime(nycTime);
  return {
    level: 'bad',
    message: 'Low demand - Consider waiting',
    nextGoodTime
  };
};

const calculateNextGoodTime = (currentTime: Date): Date => {
  const nextTime = new Date(currentTime);
  
  // Check up to 48 hours ahead
  for (let hoursAhead = 1; hoursAhead <= 48; hoursAhead++) {
    nextTime.setTime(currentTime.getTime() + (hoursAhead * 60 * 60 * 1000));
    const hour = nextTime.getHours();
    const day = nextTime.getDay();
    const isWeekday = day >= 1 && day <= 5;
    
    // Check if this time would be "good"
    if (isWeekday && ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20))) {
      nextTime.setMinutes(0);
      nextTime.setSeconds(0);
      return nextTime;
    }
    
    if ((day === 5 || day === 6) && hour >= 20) {
      nextTime.setMinutes(0);
      nextTime.setSeconds(0);
      return nextTime;
    }
  }
  
  return nextTime;
};

const formatTimeUntil = (targetTime: Date): string => {
  const now = getNYCTime();
  const diff = targetTime.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const SmartShiftAssistant = () => {
  const [status, setStatus] = useState<DemandStatus>(getDemandStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getDemandStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const indicatorClass = `${styles.indicator} ${styles[status.level]}`;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🚕 Smart Shift Assistant</h3>
      <div className={styles.content}>
        <div className={indicatorClass} aria-label={`Demand level: ${status.level}`} />
        <div className={styles.messageContainer}>
          <p className={styles.message}>{status.message}</p>
          {status.nextGoodTime && (
            <p className={styles.nextTime}>
              Better in {formatTimeUntil(status.nextGoodTime)} 
              <span className={styles.timeDetail}>
                ({status.nextGoodTime.getHours() === 7 ? 'Morning' : 'Evening'} rush hour)
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};