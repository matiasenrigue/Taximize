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
interface WorktimeStatistics {
    totalWorktime: number;
    view: ViewType;
    startDate: string;
    endDate: string;
    breakdown: Array<{
        label: string; // day of week or month number
        withPassengerTime : number; // worktime with passenger
        emptyTime: number; // worktime without passenger
    }>;
}

type ViewType = 'weekly' | 'monthly';
interface FetchParams {
    view: ViewType;
    startDate?: string;
    endDate?: string;
}

export const useWorktimeStatistics = () => {
    const [worktimeStatistics, setWorktimeStatistics] = useState<WorktimeStatistics | null>(null);
    const [isWorktimeLoading, setIsWorktimeLoading] = useState<boolean>(false);
    const [worktimeError, setWorktimeError] = useState<any>(null);

    const fetchWorktimeStatistics = useCallback(async (params: FetchParams) => {
        setIsWorktimeLoading(true);
        setWorktimeError(null);
        try {
            // e.g. /statistics/worktime?view=weekly&startDate=2025-01-01&endDate=2025-01-31
            const response = await api.get('/auth/statistics/worktime', {
                params: {
                    view: params.view,
                    startDate: params.startDate,
                    endDate: params.endDate,
                }
            });
            setWorktimeStatistics(response.data.data); 
        } catch (err) {
            setWorktimeError(err);
            console.error("Failed to fetch worktime statistics:", err);
        } finally {
            setIsWorktimeLoading(false);
        }
    }, []); 

    return { worktimeStatistics, isWorktimeLoading, worktimeError, fetchWorktimeStatistics };
}