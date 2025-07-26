import axios from 'axios';

const DATA_API_URL = process.env.DATA_API_URL || 'http://localhost:5050';

interface HotspotPrediction {
  pickup_zone: string;
  location_id: number;
  predicted_trip_count: number;
}

interface ScoringRequest {
  pickup_zone: string;
  dropoff_zone: string;
  pickup_datetime: string; // Format: "MM/DD/YYYY HH:MM:SS AM/PM"
}

interface ScoringResponse {
  predicted_score: number;
  final_score: number;
}


/**
 * Axios Code from: 
 * https://gist.github.com/JaysonChiang/fa704307bacffe0f17d51acf6b1292fc
 * https://geshan.com.np/blog/2023/11/axios-typescript/
*/


/**
 * Get hotspot predictions for a specific time
 * @param time - ISO 8601 UTC format: "YYYY-MM-DDTHH:MM:SSZ" (optional, defaults to current time)
 * @returns Array of hotspot predictions sorted by predicted trip count
 */
export async function getHotspotPredictions(time?: string): Promise<HotspotPrediction[]> {
  try {
    const params = time ? { time } : {};
    const response = await axios.get<HotspotPrediction[]>(`${DATA_API_URL}/hotspots`, { params });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Failed to get hotspot predictions: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Score a trip using XGBoost model
 * @param request - Trip details including pickup/dropoff zones and datetime
 * @returns Scoring results including score, weighted score, and percentile
 */
export async function scoreTripXGB(request: ScoringRequest): Promise<ScoringResponse> {
  try {
    const response = await axios.post<ScoringResponse>(`${DATA_API_URL}/score_xgb`, request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Failed to score trip with XGB: ${errorMessage}`);
    }
    throw error;
  }
}


/**
 * Format datetime to the required format for scoring API
 * @param date - JavaScript Date object
 * @returns Formatted string: "MM/DD/YYYY HH:MM:SS AM/PM" in NYC timezone
 */
export function formatDateTimeForScoring(date: Date): string {

  // Convert to NYC timezone
  const nycDate = new Date(date.toLocaleString("en-US", { timeZone: "America/New_York" }));
  
  const month = String(nycDate.getMonth() + 1).padStart(2, '0');
  const day = String(nycDate.getDate()).padStart(2, '0');
  const year = nycDate.getFullYear();
  
  let hours = nycDate.getHours();
  const minutes = String(nycDate.getMinutes()).padStart(2, '0');
  const seconds = String(nycDate.getSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');
  
  return `${month}/${day}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
}
