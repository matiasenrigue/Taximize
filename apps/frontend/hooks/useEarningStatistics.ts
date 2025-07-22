import { useState, useCallback } from 'react';
import  api  from "../lib/axios";

/**
 * if view is weekly, the breakdown is an array of objects with the following properties:
 * - label: string; // day of week (Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday)
 * - date: string; // yyyy-mm-dd
 * - value: number; // earnings
 * if view is monthly, the breakdown is an array of objects with the following properties:
 * - label: string; // month number (1-31) 
 * - date: string; // yyyy-mm
 * - value: number; // earnings
 * @returns 
 */
interface StatisticsData {
    totalEarnings: number;
    view: ViewType;
    startDate: string;
    endDate: string;
    breakdown: Array<{
        label: string; // day of week or month number
        date: string; // yyyy-mm-dd
        value: number; // earnings
    }>;
}

type ViewType = 'weekly' | 'monthly';
interface FetchParams {
    view: ViewType;
    startDate?: string;
    endDate?: string;
}


export const useEarningStatistics = () => {
    const [earningsStatistics, setEarningsStatistics] = useState<StatisticsData | null>(null);
    const [isEarningsLoading, setIsEarningsLoading] = useState<boolean>(false);
    const [earningsError, setEarningsError] = useState<any>(null);

    const fetchEarningsStatistics = useCallback(async (params: FetchParams) => {
        setIsEarningsLoading(true);
        setEarningsError(null);
        try {
            // e.g. /statistics/earnings?view=weekly&startDate=2025-01-01&endDate=2025-01-31
            const response = await api.get('/stats/earnings', {
                params: {
                    view: params.view,
                    startDate: params.startDate,
                    endDate: params.endDate,
                }
            });
            setEarningsStatistics(response.data.data); 
        } catch (err) {
            setEarningsError(err);
            console.error("Failed to fetch statistics:", err);
        } finally {
            setIsEarningsLoading(false);
        }
    }, []); 

    return { earningsStatistics, isEarningsLoading, earningsError, fetchEarningsStatistics };
};
