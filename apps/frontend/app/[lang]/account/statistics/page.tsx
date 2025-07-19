"use client";
import styles from "./page.module.css";
import { Select, Option } from "../../../../components/Select/Select";
import { useTranslations } from "next-intl";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    DefaultLegendContentProps,
} from 'recharts';
import React, {useState, useEffect} from 'react';
import { useEarningStatistics } from "../../../../hooks/useEarningStatistics";
import { useWorktimeStatistics } from "../../../../hooks/useWorktimeStatistics";
import BackButton from "../../../../components/BackButton/BackButton";

export default function StatisticsPage() {
    const t = useTranslations('statistics');
    const [worktimeView, setWorktimeView] = useState<'weekly' | 'monthly'>('weekly');
    const [earningsView, setEarningsView] = useState<'weekly' | 'monthly'>('weekly');
    
    const { earningsStatistics, isEarningsLoading, earningsError, fetchEarningsStatistics } = useEarningStatistics();
    const { worktimeStatistics, isWorktimeLoading, worktimeError, fetchWorktimeStatistics } = useWorktimeStatistics();

    // Calculate date range based on view type
    const getDateRange = (view: 'weekly' | 'monthly') => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        if (view === 'weekly') {
            // Get the start of the current week (Monday)
            const dayOfWeek = now.getDay();
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0, so we need 6 days back
            startDate = new Date(now);
            startDate.setDate(now.getDate() - daysToMonday);
            startDate.setHours(0, 0, 0, 0);
            
            // End of the week (Sunday)
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Get the start of the current month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            
            // End of the current month
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        return {
            startDate: startDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
            endDate: endDate.toISOString().split('T')[0]
        };
    };

    // Fetch earnings statistics when component mounts or view changes
    useEffect(() => {
        const { startDate, endDate } = getDateRange(earningsView);
        fetchEarningsStatistics({
            view: earningsView,
            startDate,
            endDate
        });
    }, [earningsView, fetchEarningsStatistics]);

    // Data for the "Average Worktime in Hours" chart
    useEffect(() => {
        const { startDate, endDate } = getDateRange(worktimeView);
        fetchWorktimeStatistics({
            view: worktimeView,
            startDate,
            endDate
        });
    }, [worktimeView, fetchWorktimeStatistics]);


    // Transform earnings statistics data for the chart
    const getEarningsData = () => {
        if (!earningsStatistics?.breakdown) {
            return [];
        }

        return earningsStatistics.breakdown.map(item => ({
            name: item.label,
            earnings: item.value
        }));
    };

    // Transform worktime statistics data for the chart
    const getWorktimeData = () => {
        if (!worktimeStatistics?.breakdown) {
            return [];
        }   

        return worktimeStatistics.breakdown.map(item => ({
            name: item.label,
            withPassenger: item.withPassengerTime, 
            empty: item.emptyTime 
        }));
    }

    const earningsData = getEarningsData();
    const worktimeData = getWorktimeData();

  return (
    <div className="styles.page">
        <div className={styles.container}>
            <div className={styles.backButtonContainer}>
                <BackButton href="/account" pageName="Account" />
            </div>
            <div className={styles.profileInfo}>
            <h2 className={styles.title}>{t('title')}</h2>
            <section className={styles.section}>
                <div className={styles.chartHeader}>
                    <h3>{t('worktimeTitle')}</h3>
                    <div className={styles.select}>
                        <Select onChange={(value) => setWorktimeView(value as 'weekly' | 'monthly')}>
                            <Option value="weekly" selected={worktimeView === 'weekly'}>{t('weekly')}</Option>
                            <Option value="monthly" selected={worktimeView === 'monthly'}>{t('monthly')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={styles.chartContainer}>
                    {isWorktimeLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <p>{t('loadingWorktime')}</p>
                        </div>
                    ) : worktimeError ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <p>{t('errorWorktime')}</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={worktimeData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <YAxis ticks={[0, 2, 4, 6, 8]} domain={[0, 8]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{fill: 'rgba(238, 238, 238, 0.5)'}}/>
                                <Legend content={CustomLegend} verticalAlign="top" align="left"
                                    wrapperStyle={{
                                        paddingBottom: '20px', 
                                        marginLeft: '10px'      
                                    }}/>
                                <Bar dataKey="withPassenger" stackId="a" fill="#f4a224" barSize={30} name={t('withPassenger')} />
                                <Bar dataKey="empty" stackId="a" fill="#e0e0e0" barSize={30} name={t('empty')} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>
           <section className={styles.section}>
                <div className={styles.chartHeader}>
                    <h3>{t('earningsTitle')}</h3>
                    <div className={styles.select}>
                        <Select onChange={(value) => setEarningsView(value as 'weekly' | 'monthly')}>
                            <Option value="weekly" selected={earningsView === 'weekly'}>{t('weekly')}</Option>
                            <Option value="monthly" selected={earningsView === 'monthly'}>{t('monthly')}</Option>
                        </Select>
                    </div>
                </div>
                <div className={styles.chartContainer}>
                    {isEarningsLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <p>{t('loadingEarnings')}</p>
                        </div>
                    ) : earningsError ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                            <p>{t('errorEarnings')}</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={earningsData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                                <YAxis 
                                    ticks={earningsData.length > 0 ? [0] : [0, 50, 100, 150, 200]}
                                    domain={earningsData.length > 0 ? [0, 'dataMax + 50'] : [0, 200]} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tick={{ fontSize: 12 }} 
                                />
                                <Tooltip cursor={{fill: 'rgba(238, 238, 238, 0.5)'}} formatter={(value: number) => `€${value.toFixed(2)}`}/>
                                <Bar dataKey="earnings" fill="var(--color-primary)" barSize={30} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>
            </div>
        </div>
    </div>
    
  );
}

// --- Custom Legend for Worktime Chart ---
const CustomLegend = (props: DefaultLegendContentProps) => {
    const { payload } = props;
    const legendStyle = {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
    };
    const itemStyle = {
        display: 'flex',
        alignItems: 'center',
        marginRight: '20px',
        fontSize: '14px',
        color: 'var(--color-on-surface)'
    };
    const colorBoxStyle = {
        width: '12px',
        height: '12px',
        marginRight: '8px',
    };

    if (!payload)
        return null;

    return (
        <div style={legendStyle}>
            {payload.map((entry, index: number) => (
                <div key={`item-${index}`} style={itemStyle}>
                    <div style={{...colorBoxStyle, backgroundColor: entry.color }} />
                    <span>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};